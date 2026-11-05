"""
Document Ingestion and Vector Storage Pipeline for CogniSec.

Coordinates:
  DocumentTextPage retrieval -> chunk_document_pages -> Embedding generation -> DocumentChunk persistence.

Implements atomic reprocessing: new chunks and embeddings are generated and validated
completely before any existing records are replaced, ensuring zero data loss if
embedding fails.
"""

import logging
from typing import Optional, Sequence

from sqlalchemy.orm import Session

from app.models import Document, DocumentChunk, DocumentTextPage
from app.rag.chunking import chunk_document_pages
from app.rag.embeddings import (
    DEFAULT_EMBEDDING_MODEL,
    EmbeddingError,
    OllamaEmbeddingClient,
    get_embedding_client,
)

logger = logging.getLogger(__name__)


def build_chunk_records(
    chunk_dicts: Sequence[dict],
    embeddings: Sequence[list[float]],
    model_name: str = DEFAULT_EMBEDDING_MODEL,
) -> list[DocumentChunk]:
    """
    Construct DocumentChunk ORM instances pairing structured chunks with validated embeddings.
    """
    if len(chunk_dicts) != len(embeddings):
        raise ValueError(
            f"Chunk count ({len(chunk_dicts)}) does not match embedding count ({len(embeddings)})."
        )

    records: list[DocumentChunk] = []
    for c, vec in zip(chunk_dicts, embeddings):
        records.append(
            DocumentChunk(
                document_id=c["document_id"],
                page_number=c.get("page_number"),
                chunk_index=c["chunk_index"],
                chunk_text=c["chunk_text"],
                start_char=c["start_char"],
                end_char=c["end_char"],
                embedding=vec,
                embedding_model=model_name,
            )
        )
    return records


def ingest_document_chunks_and_embeddings(
    document_id: int,
    db: Session,
    client: Optional[OllamaEmbeddingClient] = None,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> list[DocumentChunk]:
    """
    Generate and persist chunks and embeddings for a newly uploaded document.

    Steps:
      1. Fetch extracted DocumentTextPage records ordered by page number.
      2. Chunk pages into overlapping windows via chunk_document_pages().
      3. Generate dense 768-dim embeddings via Ollama nomic-embed-text.
      4. Validate vectors and persist DocumentChunk records.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise ValueError(f"Document with ID {document_id} not found.")

    pages = (
        db.query(DocumentTextPage)
        .filter(DocumentTextPage.document_id == document_id)
        .order_by(DocumentTextPage.page_number.asc().nullsfirst(), DocumentTextPage.id.asc())
        .all()
    )

    if not pages:
        logger.info("Document %d has no extracted pages; skipping chunking.", document_id)
        return []

    # Check if there is actual non-whitespace text across pages
    has_text = any(p.text_content and p.text_content.strip() for p in pages)
    if not has_text:
        logger.info("Document %d pages contain only empty or whitespace text.", document_id)
        return []

    # 1. Chunk document pages while preserving page boundaries and offsets
    chunk_dicts = chunk_document_pages(
        pages=pages,
        document_id=document_id,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    if not chunk_dicts:
        return []

    # 2. Extract chunk texts
    chunk_texts = [c["chunk_text"] for c in chunk_dicts]

    # 3. Generate embeddings
    embed_client = client or get_embedding_client()
    embeddings = embed_client.embed_document_chunks(chunk_texts)

    # 4. Construct ORM records
    chunk_records = build_chunk_records(
        chunk_dicts=chunk_dicts,
        embeddings=embeddings,
        model_name=embed_client.model,
    )

    # 5. Persist to session
    db.add_all(chunk_records)
    db.flush()

    logger.info(
        "Successfully stored %d chunks and embeddings for document %d using model '%s'.",
        len(chunk_records),
        document_id,
        embed_client.model,
    )
    return chunk_records


def reprocess_document_chunks_and_embeddings(
    document_id: int,
    db: Session,
    client: Optional[OllamaEmbeddingClient] = None,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> list[DocumentChunk]:
    """
    Atomically reprocess document chunks and embeddings.

    Security & Integrity Guarantee (Mandatory Rule):
      New chunks and embeddings are generated and validated completely in memory
      BEFORE any existing records are removed from the database.
      If embedding generation fails, times out, or validation fails:
      the function raises an exception and existing valid chunks remain untouched.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise ValueError(f"Document with ID {document_id} not found.")

    pages = (
        db.query(DocumentTextPage)
        .filter(DocumentTextPage.document_id == document_id)
        .order_by(DocumentTextPage.page_number.asc().nullsfirst(), DocumentTextPage.id.asc())
        .all()
    )

    if not pages:
        raise ValueError(f"Document {document_id} has no text pages to reprocess.")

    # 1. Prepare new chunks
    chunk_dicts = chunk_document_pages(
        pages=pages,
        document_id=document_id,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    if not chunk_dicts:
        raise ValueError(f"Document {document_id} produced no chunks during reprocessing.")

    chunk_texts = [c["chunk_text"] for c in chunk_dicts]

    # 2. Generate and validate embeddings FIRST (outside of database deletion)
    embed_client = client or get_embedding_client()
    embeddings = embed_client.embed_document_chunks(chunk_texts)

    # 3. Build candidate ORM instances
    new_chunk_records = build_chunk_records(
        chunk_dicts=chunk_dicts,
        embeddings=embeddings,
        model_name=embed_client.model,
    )

    # 4. Only once all embeddings are verified, replace existing records atomically
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete(
        synchronize_session="fetch"
    )
    db.add_all(new_chunk_records)
    db.flush()

    logger.info(
        "Successfully reprocessed and replaced %d chunks for document %d.",
        len(new_chunk_records),
        document_id,
    )
    return new_chunk_records

