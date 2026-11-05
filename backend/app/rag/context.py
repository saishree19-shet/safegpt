"""
Sanitized Context Builder and Source Attribution for CogniSec.

Enforces critical security constraints:
1. ONLY sanitized text enters the LLM context.
2. Raw extracted text or unvalidated chunks are strictly rejected.
3. Chunks must explicitly bear the `is_sanitized=True` verification marker.
4. Source citations are derived exclusively from verified database retrieval metadata,
   never parsed from or trusted by LLM generation tokens.
"""

from typing import Any, Sequence


class ContextPreparationError(Exception):
    """Raised when context preparation encounters invalid, unsanitized, or malformed chunks."""
    pass


def validate_and_extract_sanitized_chunks(
    chunks: Sequence[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Validate that every chunk in the sequence has been processed by the privacy sanitization
    pipeline and possesses valid sanitized text.

    Raises:
        ContextPreparationError: If any chunk lacks the is_sanitized flag or has invalid text.
    """
    if not isinstance(chunks, (list, tuple)):
        raise ContextPreparationError(f"Expected chunks to be a list/tuple, got {type(chunks).__name__}.")

    validated_chunks: list[dict[str, Any]] = []

    for idx, chunk in enumerate(chunks):
        if not isinstance(chunk, dict):
            raise ContextPreparationError(f"Chunk at index {idx} is not a valid dictionary.")

        # Strict security validation: chunk must be explicitly marked as sanitized
        if chunk.get("is_sanitized") is not True:
            raise ContextPreparationError(
                f"Security violation: Chunk at index {idx} has not been verified by the "
                "privacy sanitization engine (missing is_sanitized=True). Rejecting context."
            )

        sanitized_text = chunk.get("sanitized_text")
        if not isinstance(sanitized_text, str) or not sanitized_text.strip():
            raise ContextPreparationError(
                f"Chunk at index {idx} contains empty or invalid sanitized_text."
            )

        # Ensure required retrieval metadata exists
        required_keys = {"document_id", "filename", "chunk_id", "chunk_index"}
        missing = required_keys - set(chunk.keys())
        if missing:
            raise ContextPreparationError(
                f"Chunk at index {idx} is missing required citation metadata: {missing}."
            )

        validated_chunks.append(chunk)

    return validated_chunks


def build_llm_context(
    sanitized_chunks: Sequence[dict[str, Any]],
) -> tuple[str, list[dict[str, Any]]]:
    """
    Construct the sanitized context string and verified source citations for the LLM.

    Args:
        sanitized_chunks: Output from retrieve_and_sanitize_chunks().

    Returns:
        tuple (context_text, source_citations)
        - context_text: Formatted string containing ONLY sanitized text within boundary tags.
        - source_citations: List of verified citation metadata dictionaries.

    Raises:
        ContextPreparationError: If any chunk fails sanitization validation.
    """
    if not sanitized_chunks:
        return "", []

    valid_chunks = validate_and_extract_sanitized_chunks(sanitized_chunks)

    context_blocks: list[str] = []
    source_citations: list[dict[str, Any]] = []

    for idx, chunk in enumerate(valid_chunks, start=1):
        doc_id = chunk["document_id"]
        filename = chunk["filename"]
        chunk_id = chunk["chunk_id"]
        page_num = chunk.get("page_number")
        chunk_idx = chunk["chunk_index"]
        similarity = chunk.get("similarity_score", 0.0)
        sanitized_text = chunk["sanitized_text"].strip()

        source_id = f"source_{idx}"
        # Build clean XML-delimited document block using ONLY sanitized_text
        page_str = f" Page: {page_num}" if page_num is not None else ""
        block = (
            f"<document source_id=\"{source_id}\" id=\"{doc_id}\" filename=\"{filename}\"{page_str}>\n"
            f"{sanitized_text}\n"
            f"</document>"
        )
        context_blocks.append(block)

        # Verified citation record derived directly from retrieval results
        source_citations.append({
            "source_id": source_id,
            "document_id": doc_id,
            "filename": filename,
            "chunk_id": chunk_id,
            "page_number": page_num,
            "chunk_index": chunk_idx,
            "similarity_score": round(float(similarity), 4),
        })

    full_context_text = "\n\n".join(context_blocks)
    return full_context_text, source_citations

