"""
RAG (Retrieval-Augmented Generation) package for CogniSec.
"""

from app.rag.chunking import chunk_document_pages, chunk_text
from app.rag.embeddings import (
    DEFAULT_EMBEDDING_MODEL,
    EXPECTED_EMBEDDING_DIM,
    EmbeddingError,
    EmbeddingValidationError,
    OllamaConnectionError,
    OllamaEmbeddingClient,
    OllamaModelNotFoundError,
    generate_embeddings,
    get_embedding_client,
)
from app.rag.context import (
    ContextPreparationError,
    build_llm_context,
    validate_and_extract_sanitized_chunks,
)
from app.rag.llm import (
    LLMGenerationError,
    OllamaChatClient,
    get_chat_client,
)
from app.rag.pipeline import (
    ingest_document_chunks_and_embeddings,
    reprocess_document_chunks_and_embeddings,
)
from app.rag.prompts import (
    COGNISEC_SYSTEM_PROMPT,
    STRUCTURED_SYSTEM_PROMPT,
    format_structured_user_prompt,
    format_user_prompt,
)
from app.rag.retrieval import retrieve_and_sanitize_chunks, search_authorized_chunks
from app.rag.validator import (
    build_authorized_source_index,
    extract_claims_from_plain_text,
    parse_structured_llm_response,
    resolve_evidence_status,
    validate_answer,
    validate_claim_against_sources,
)

__all__ = [
    "chunk_text",
    "chunk_document_pages",
    "generate_embeddings",
    "get_embedding_client",
    "OllamaEmbeddingClient",
    "EmbeddingError",
    "OllamaConnectionError",
    "OllamaModelNotFoundError",
    "EmbeddingValidationError",
    "EXPECTED_EMBEDDING_DIM",
    "DEFAULT_EMBEDDING_MODEL",
    "ingest_document_chunks_and_embeddings",
    "reprocess_document_chunks_and_embeddings",
    "search_authorized_chunks",
    "retrieve_and_sanitize_chunks",
    "OllamaChatClient",
    "get_chat_client",
    "LLMGenerationError",
    "ContextPreparationError",
    "build_llm_context",
    "validate_and_extract_sanitized_chunks",
    "COGNISEC_SYSTEM_PROMPT",
    "STRUCTURED_SYSTEM_PROMPT",
    "format_user_prompt",
    "format_structured_user_prompt",
    # Step 5 – Citation validation
    "build_authorized_source_index",
    "parse_structured_llm_response",
    "extract_claims_from_plain_text",
    "validate_claim_against_sources",
    "resolve_evidence_status",
    "validate_answer",
]
