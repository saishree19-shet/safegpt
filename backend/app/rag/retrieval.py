"""
Permission-Aware Semantic Retrieval for CogniSec.

Implements SQL-level document authorization combined with pgvector cosine
similarity search over document chunks.

Security guarantee: authorization is applied inside the database query.
Chunks from unauthorized documents are NEVER loaded into Python memory.
"""

import math
from typing import Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Document, DocumentChunk, DocumentPermission, User
from app.rag.embeddings import (
    EXPECTED_EMBEDDING_DIM,
    OllamaEmbeddingClient,
    EmbeddingValidationError,
    get_embedding_client,
)

from app.privacy import (
    SanitizationError,
    SanitizationResult,
    SanitizationSession,
    sanitize_text,
)

MAX_TOP_K: int = 20
DEFAULT_TOP_K: int = 5


class RetrievalError(Exception):
    """Base exception for semantic retrieval failures."""
    pass


def _validate_top_k(top_k: int) -> None:
    if not isinstance(top_k, int) or top_k < 1:
        raise ValueError(f"top_k must be a positive integer, got {top_k!r}.")
    if top_k > MAX_TOP_K:
        raise ValueError(f"top_k must not exceed {MAX_TOP_K}, got {top_k}.")


def _validate_query_vector(vector: list[float]) -> None:
    """Validate dimension and finiteness of the query embedding."""
    if len(vector) != EXPECTED_EMBEDDING_DIM:
        raise EmbeddingValidationError(
            f"Query embedding has unexpected dimension: "
            f"expected {EXPECTED_EMBEDDING_DIM}, got {len(vector)}."
        )
    for i, val in enumerate(vector):
        if not isinstance(val, (int, float)) or isinstance(val, bool) or not math.isfinite(val):
            raise EmbeddingValidationError(
                f"Query embedding contains non-finite value at index {i}: {val!r}."
            )


def _build_auth_filter(current_user: User):
    """
    Build the SQL authorization filter.

    A chunk is accessible when the user owns the parent document OR
    an active can_read=True permission exists for the user.
    """
    permitted_subquery = (
        select(DocumentPermission.document_id)
        .filter(
            DocumentPermission.user_id == current_user.id,
            DocumentPermission.can_read.is_(True),
        )
    )
    return or_(
        Document.owner_id == current_user.id,
        Document.id.in_(permitted_subquery),
    )


def search_authorized_chunks(
    query: str,
    current_user: User,
    db: Session,
    top_k: int = DEFAULT_TOP_K,
    similarity_threshold: Optional[float] = None,
    client: Optional[OllamaEmbeddingClient] = None,
) -> list[dict]:
    """
    Perform permission-aware semantic search over document chunks.

    Authorization is enforced at the SQL level. Chunks from documents the
    authenticated user does not own or has not been granted can_read=True
    access to are excluded before any results reach Python.

    Args:
        query:               Natural-language search query (non-empty string).
        current_user:        Authenticated User ORM instance.
        db:                  SQLAlchemy Session.
        top_k:               Maximum number of results (1–20, default 5).
        similarity_threshold:
                             Optional float in [0.0, 1.0]. Results with a
                             cosine similarity score below this threshold are
                             discarded.
        client:              Optional OllamaEmbeddingClient (injected for
                             testing; falls back to default client).

    Returns:
        List of result dicts ordered by descending similarity, each with:
            chunk_id, document_id, filename, page_number, chunk_index,
            chunk_text, similarity_score.

    Raises:
        ValueError:              Invalid top_k or similarity_threshold.
        EmbeddingValidationError: Empty query, bad query vector, etc.
        RetrievalError:          Database or Ollama errors surfaced safely.
    """
    # --- Input validation ---
    if not isinstance(query, str) or not query.strip():
        raise EmbeddingValidationError("Query must be a non-empty string.")

    # Defense-in-depth: Inactive user accounts cannot retrieve any document chunks
    if not getattr(current_user, "is_active", True):
        return []

    _validate_top_k(top_k)

    if similarity_threshold is not None:
        if not isinstance(similarity_threshold, (int, float)) or isinstance(similarity_threshold, bool):
            raise ValueError("similarity_threshold must be a float.")
        if not (0.0 <= similarity_threshold <= 1.0):
            raise ValueError("similarity_threshold must be between 0.0 and 1.0.")

    # --- Embed the query ---
    embedding_client = client or get_embedding_client()
    query_vector = embedding_client.embed_query(query.strip())
    _validate_query_vector(query_vector)

    # --- SQL-level authorization + cosine similarity ---
    dialect = db.bind.dialect.name if db.bind is not None else "unknown"

    if dialect == "sqlite":
        # SQLite does not support the <=> pgvector operator.
        # Apply auth_filter in SQL, then compute cosine similarity in Python
        # for unit tests that use an in-memory SQLite database.
        auth_filter = _build_auth_filter(current_user)
        rows = (
            db.query(DocumentChunk, Document.filename)
            .join(Document, DocumentChunk.document_id == Document.id)
            .filter(auth_filter)
            .all()
        )

        def _cosine_sim(a: list[float], b: list[float]) -> float:
            dot = sum(x * y for x, y in zip(a, b))
            norm_a = math.sqrt(sum(x * x for x in a))
            norm_b = math.sqrt(sum(y * y for y in b))
            if norm_a == 0 or norm_b == 0:
                return 0.0
            return dot / (norm_a * norm_b)

        scored: list[tuple[float, DocumentChunk, str]] = []
        for chunk, filename in rows:
            if chunk.embedding is None:
                continue
            vec = list(chunk.embedding) if not isinstance(chunk.embedding, list) else chunk.embedding
            score = round(max(0.0, _cosine_sim(query_vector, vec)), 4)
            scored.append((score, chunk, filename))

        scored.sort(key=lambda t: t[0], reverse=True)

        results = []
        for score, chunk, filename in scored[:top_k]:
            if similarity_threshold is not None and score < similarity_threshold:
                continue
            results.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "filename": filename,
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
                "chunk_text": chunk.chunk_text,
                "similarity_score": score,
            })
        return results

    # --- PostgreSQL path: use pgvector <=> operator ---
    auth_filter = _build_auth_filter(current_user)
    distance_expr = DocumentChunk.embedding.cosine_distance(query_vector)

    q = (
        db.query(
            DocumentChunk,
            Document.filename,
            distance_expr.label("distance"),
        )
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(auth_filter)
        .order_by(distance_expr.asc())
        .limit(top_k)
    )

    rows = q.all()

    results = []
    for chunk, filename, distance in rows:
        # Clamp to [0.0, 1.0]; cosine distance is in [0, 2] theoretically.
        similarity_score = round(max(0.0, min(1.0, 1.0 - float(distance))), 4)
        if similarity_threshold is not None and similarity_score < similarity_threshold:
            continue
        results.append({
            "chunk_id": chunk.id,
            "document_id": chunk.document_id,
            "filename": filename,
            "page_number": chunk.page_number,
            "chunk_index": chunk.chunk_index,
            "chunk_text": chunk.chunk_text,
            "similarity_score": similarity_score,
        })

    return results


def retrieve_and_sanitize_chunks(
    query: str,
    current_user: User,
    db: Session,
    top_k: int = DEFAULT_TOP_K,
    similarity_threshold: Optional[float] = None,
    client: Optional[OllamaEmbeddingClient] = None,
    sanitizer_session: Optional[SanitizationSession] = None,
) -> list[dict]:
    """
    Two-stage retrieval and privacy sanitization pipeline:
      Stage 1: Execute SQL permission-aware semantic search over document chunks.
      Stage 2: Detect and sanitize sensitive information in each retrieved chunk.

    CRITICAL SECURITY GUARANTEES:
      - Only authorized document chunks are retrieved at the database query level.
      - Fail-Closed: If sanitization fails for any chunk, raises SanitizationError.
        Raw unsanitized text is NEVER returned as AI-ready context.
      - Explicit Naming: 'sanitized_text' is distinct from 'original_text'.
      - Stable Placeholders: A shared SanitizationSession preserves placeholder consistency
        across all chunks in the query response.
    """
    raw_results = search_authorized_chunks(
        query=query,
        current_user=current_user,
        db=db,
        top_k=top_k,
        similarity_threshold=similarity_threshold,
        client=client,
    )

    if not raw_results:
        return []

    session = sanitizer_session or SanitizationSession()
    sanitized_results: list[dict] = []

    for item in raw_results:
        original = item["chunk_text"]
        # Fail closed: sanitize_text raises SanitizationError on failure
        san_res = sanitize_text(original, session=session)

        sanitized_results.append({
            "chunk_id": item["chunk_id"],
            "document_id": item["document_id"],
            "filename": item["filename"],
            "page_number": item["page_number"],
            "chunk_index": item["chunk_index"],
            "original_text": original,
            "sanitized_text": san_res.sanitized_text,
            "similarity_score": item["similarity_score"],
            "entity_counts": san_res.entity_counts,
            "detections": san_res.detections,
            "is_sanitized": True,
        })

    return sanitized_results

