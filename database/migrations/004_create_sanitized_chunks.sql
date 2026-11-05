-- Migration: 004_create_sanitized_chunks.sql
-- Description: Create sanitized_chunks table to store sanitized text representations separately.
-- Ensures original document extracted text and embeddings are never overwritten or mutated.
-- Records detection statistics (entity categories), detector/sanitizer versions, and timestamps.
-- Target: PostgreSQL database safe_company_chatbot

CREATE TABLE IF NOT EXISTS sanitized_chunks (
    id SERIAL PRIMARY KEY,
    chunk_id INTEGER NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    sanitized_text TEXT NOT NULL,
    entity_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
    detector_version VARCHAR(50) NOT NULL DEFAULT 'v1.0.0',
    sanitizer_version VARCHAR(50) NOT NULL DEFAULT 'v1.0.0',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_sanitized_chunk_id UNIQUE (chunk_id)
);

-- Index on document_id for rapid retrieval of all sanitized chunks for a document
CREATE INDEX IF NOT EXISTS idx_sanitized_chunks_document_id
    ON sanitized_chunks (document_id);

