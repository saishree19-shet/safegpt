"""
RAG API routes for CogniSec.

Provides permission-aware semantic search over document chunks.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.audit import (
    ANSWER_GENERATION_FAILURE,
    ANSWER_GENERATION_SUCCESS,
    CITATION_VALIDATION_FAILURE,
    INSUFFICIENT_EVIDENCE,
    RESOURCE_RAG,
    SEMANTIC_SEARCH,
    STATUS_FAILURE,
    STATUS_SUCCESS,
    STATUS_WARNING,
    log_event,
)
from app.database import get_db
from app.models import User
from app.privacy import SanitizationError
from app.rag.context import ContextPreparationError, build_llm_context
from app.rag.embeddings import (
    EmbeddingError,
    OllamaConnectionError,
    OllamaModelNotFoundError,
)
from app.rag.llm import LLMGenerationError, OllamaChatClient, get_chat_client
from app.rag.prompts import STRUCTURED_SYSTEM_PROMPT
from app.rag.retrieval import (
    MAX_TOP_K,
    RetrievalError,
    retrieve_and_sanitize_chunks,
    search_authorized_chunks,
)
from app.rag.validator import build_authorized_source_index, validate_answer
from app.routes.auth import get_current_user
from app.schemas import (
    AnswerRequest,
    AnswerResponse,
    SearchRequest,
    SearchResponse,
    SearchResultItem,
    SourceCitation,
    VerifiedClaim,
)

router = APIRouter(prefix="/rag", tags=["RAG"])


@router.post(
    "/search",
    response_model=SearchResponse,
    summary="Semantic search over authorized document chunks",
    description=(
        "Perform cosine-similarity search over document chunks. "
        "Only chunks from documents the authenticated user owns or "
        "has been explicitly granted read access to are returned."
    ),
)
def semantic_search(
    body: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SearchResponse:
    """
    POST /rag/search

    Accepts a natural-language query and returns the most semantically
    similar authorized document chunks.

    - **query**: Search question (1–1000 characters, non-blank).
    - **top_k**: Maximum number of results (1–20, default 5).
    - **similarity_threshold**: Optional minimum similarity score (0.0–1.0).
      Results below this threshold are excluded.

    Authorization is applied at the SQL level. Chunks from documents the
    caller does not own or has no active can_read grant for are NEVER returned.
    Raw embedding vectors are never exposed.
    """
    try:
        raw_results = search_authorized_chunks(
            query=body.query,
            current_user=current_user,
            db=db,
            top_k=body.top_k,
            similarity_threshold=body.similarity_threshold,
        )
    except (ValueError, EmbeddingError) as exc:
        log_event(
            db,
            event_type=SEMANTIC_SEARCH,
            event_status=STATUS_FAILURE,
            user_id=current_user.id,
            resource_type=RESOURCE_RAG,
            details={"error_category": "embedding_error", "top_k": body.top_k},
        )
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except OllamaConnectionError as exc:
        log_event(
            db,
            event_type=SEMANTIC_SEARCH,
            event_status=STATUS_FAILURE,
            user_id=current_user.id,
            resource_type=RESOURCE_RAG,
            details={"error_category": "connection_error", "top_k": body.top_k},
        )
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding service is unavailable. Please try again later.",
        ) from exc
    except OllamaModelNotFoundError as exc:
        log_event(
            db,
            event_type=SEMANTIC_SEARCH,
            event_status=STATUS_FAILURE,
            user_id=current_user.id,
            resource_type=RESOURCE_RAG,
            details={"error_category": "model_not_found", "top_k": body.top_k},
        )
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding model is not available on the local Ollama instance.",
        ) from exc
    except RetrievalError as exc:
        log_event(
            db,
            event_type=SEMANTIC_SEARCH,
            event_status=STATUS_FAILURE,
            user_id=current_user.id,
            resource_type=RESOURCE_RAG,
            details={"error_category": "retrieval_error", "top_k": body.top_k},
        )
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal retrieval error occurred.",
        ) from exc

    result_items = [SearchResultItem(**r) for r in raw_results]

    audit_rec = log_event(
        db,
        event_type=SEMANTIC_SEARCH,
        event_status=STATUS_SUCCESS,
        user_id=current_user.id,
        resource_type=RESOURCE_RAG,
        details={
            "result_count": len(result_items),
            "top_k": body.top_k,
            "similarity_threshold": body.similarity_threshold,
        },
    )
    if audit_rec is None:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security audit logging failed; search aborted.",
        )
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security audit logging failed; search aborted.",
        )

    return SearchResponse(
        query=body.query,
        results=result_items,
        total_results=len(result_items),
    )


@router.post(
    "/answer",
    response_model=AnswerResponse,
    summary="Generate natural-language answer using local Ollama LLM and sanitized context",
    description=(
        "Retrieve authorized document chunks, sanitize confidential entities, "
        "and generate an accurate, grounded answer using the local Ollama LLM. "
        "Guarantees that only sanitized text is provided to the model, and citations "
        "are strictly derived from verified retrieval results."
    ),
)
def generate_rag_answer(
    body: AnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnswerResponse:
    """
    POST /rag/answer

    Executes the secure RAG answer generation and citation validation workflow:
    1. Authenticate user via JWT.
    2. Retrieve authorized document chunks with SQL-level ACL.
    3. Sanitize detected sensitive information. Fail closed if sanitization fails.
    4. If no relevant authorized documents exist, return a clear message without calling LLM.
    5. Construct structured LLM context containing ONLY sanitized text.
    6. Generate structured JSON answer via local Ollama chat model.
    7. Validate each claim independently against authorized retrieved chunks.
    8. Reject fabricated or unverified source references.
    9. Return answer with verified source citations and per-claim evidence status.
    """
    client = get_chat_client()

    # 1. Retrieve and sanitize authorized chunks (SQL-level ACL + Sanitizer)
    try:
        sanitized_chunks = retrieve_and_sanitize_chunks(
            query=body.question,
            current_user=current_user,
            db=db,
            top_k=body.top_k,
            similarity_threshold=body.similarity_threshold,
        )
    except SanitizationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sanitization failure: Cannot generate answer without guaranteed privacy protection.",
        ) from exc
    except (ValueError, EmbeddingError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except OllamaConnectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding service is unavailable. Please try again later.",
        ) from exc
    except OllamaModelNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding model is not available on the local Ollama instance.",
        ) from exc
    except RetrievalError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal retrieval error occurred.",
        ) from exc

    # 2. If no accessible chunks found, return safe message immediately without calling Ollama
    if not sanitized_chunks:
        audit_rec = log_event(
            db,
            event_type=INSUFFICIENT_EVIDENCE,
            event_status=STATUS_SUCCESS,
            user_id=current_user.id,
            resource_type=RESOURCE_RAG,
            details={
                "used_context_chunks": 0,
                "reason": "insufficient_evidence",
                "model_name": client.model,
            },
        )
        if audit_rec is None:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Security audit logging failed; operation aborted.",
            )
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Security audit logging failed; operation aborted.",
            )

        return AnswerResponse(
            question=body.question,
            answer="The available documents do not contain sufficient information to answer this question.",
            sources=[],
            model=client.model,
            used_context_chunks=0,
        )

    # 3. Construct LLM context using ONLY sanitized text
    try:
        context_text, source_citations = build_llm_context(sanitized_chunks)
    except ContextPreparationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Context preparation error: {exc}",
        ) from exc

    # 4. Build authorized source index for claim validation
    try:
        authorized_source_index = build_authorized_source_index(sanitized_chunks)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Source index build failed: {exc}",
        ) from exc

    # 5. Generate structured answer through local Ollama chat model
    try:
        raw_llm_response = client.generate_answer(
            question=body.question,
            context_text=context_text,
            system_prompt=STRUCTURED_SYSTEM_PROMPT,
        )
    except OllamaConnectionError as exc:
        log_event(
            db,
            event_type=ANSWER_GENERATION_FAILURE,
            event_status=STATUS_FAILURE,
            user_id=current_user.id,
            resource_type=RESOURCE_RAG,
            details={"error_category": "connection_error", "model_name": client.model},
        )
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Local LLM service is unavailable. Ensure Ollama is running.",
        ) from exc
    except OllamaModelNotFoundError as exc:
        log_event(
            db,
            event_type=ANSWER_GENERATION_FAILURE,
            event_status=STATUS_FAILURE,
            user_id=current_user.id,
            resource_type=RESOURCE_RAG,
            details={"error_category": "model_not_found", "model_name": client.model},
        )
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Chat model '{client.model}' is not installed in local Ollama. Install it using 'ollama pull {client.model}'.",
        ) from exc
    except LLMGenerationError as exc:
        log_event(
            db,
            event_type=ANSWER_GENERATION_FAILURE,
            event_status=STATUS_FAILURE,
            user_id=current_user.id,
            resource_type=RESOURCE_RAG,
            details={"error_category": "llm_generation_error", "model_name": client.model},
        )
        try:
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Local LLM generation failed: {exc}",
        ) from exc

    # 6. Validate claims and verify citations against authorized source index
    final_answer, verified_claims_data, evidence_status = validate_answer(
        raw_llm_response=raw_llm_response,
        authorized_sources=authorized_source_index,
    )

    # 7. Build verified source citations from backend records only
    # Collect all backend-verified source_ids referenced by supported/partially-supported claims
    cited_source_ids: set[str] = set()
    for claim_data in verified_claims_data:
        for sid in claim_data.get("source_ids", []):
            cited_source_ids.add(sid)

    # Build deduplicated SourceCitation list from actual retrieval records
    # (never from model-generated IDs)
    citation_map: dict[str, SourceCitation] = {}
    for citation_dict in source_citations:
        sid = citation_dict.get("source_id", "")
        if sid and sid not in citation_map:
            citation_map[sid] = SourceCitation(**citation_dict)

    # Include citations for cited sources; fall back to all sources if no claims verified
    if cited_source_ids:
        final_sources = [citation_map[sid] for sid in cited_source_ids if sid in citation_map]
    else:
        final_sources = list(citation_map.values())

    verified_claim_objects = [
        VerifiedClaim(
            text=c["text"],
            status=c["status"],
            source_ids=c["source_ids"],
        )
        for c in verified_claims_data
    ]

    # Audit: CITATION_VALIDATION_FAILURE if any claim is unverified or unsupported
    has_validation_issue = any(
        c["status"] in ("unsupported", "unverified") for c in verified_claims_data
    )
    if has_validation_issue:
        log_event(
            db,
            event_type=CITATION_VALIDATION_FAILURE,
            event_status=STATUS_WARNING,
            user_id=current_user.id,
            resource_type=RESOURCE_RAG,
            details={
                "evidence_status": evidence_status,
                "used_context_chunks": len(source_citations),
                "reason": "unsupported_claims_detected",
                "model_name": client.model,
            },
        )

    # Audit: INSUFFICIENT_EVIDENCE if overall status is insufficient
    if evidence_status == "insufficient_evidence":
        log_event(
            db,
            event_type=INSUFFICIENT_EVIDENCE,
            event_status=STATUS_SUCCESS,
            user_id=current_user.id,
            resource_type=RESOURCE_RAG,
            details={
                "evidence_status": evidence_status,
                "used_context_chunks": len(source_citations),
                "model_name": client.model,
            },
        )

    # Audit: ANSWER_GENERATION_SUCCESS
    audit_rec = log_event(
        db,
        event_type=ANSWER_GENERATION_SUCCESS,
        event_status=STATUS_SUCCESS,
        user_id=current_user.id,
        resource_type=RESOURCE_RAG,
        details={
            "evidence_status": evidence_status,
            "used_context_chunks": len(source_citations),
            "model_name": client.model,
        },
    )
    if audit_rec is None:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security audit logging failed; operation aborted.",
        )
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Security audit logging failed; operation aborted.",
        )

    return AnswerResponse(
        question=body.question,
        answer=final_answer,
        evidence_status=evidence_status,
        claims=verified_claim_objects,
        sources=final_sources,
        model=client.model,
        used_context_chunks=len(source_citations),
    )

