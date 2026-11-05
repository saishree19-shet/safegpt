-- Migration: 003_create_document_chunks.sql
-- Description: Create document_chunks table with pgvector(768) embedding column and HNSW index.
-- Preserves page numbers for PDF, stores NULL for DOCX when page boundaries cannot be reliably determined.
-- Includes cascading foreign key, duplicate index prevention, embedding model metadata tracking, and HNSW cosine index.
-- Target: PostgreSQL database safe_company_chatbot (with pgvector 0.8.7)

-- Step 1: Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NULL,                 -- 1-indexed for PDF; NULL for DOCX when boundaries unavailable
    chunk_index INTEGER NOT NULL,             -- 0-indexed sequential across document
    chunk_text TEXT NOT NULL,
    start_char INTEGER NOT NULL,              -- Offset relative to source page text
    end_char INTEGER NOT NULL,                -- Offset relative to source page text
    embedding vector(768) NOT NULL,           -- 768-dimensional float vector for nomic-embed-text
    embedding_model VARCHAR(100) NOT NULL DEFAULT 'nomic-embed-text', -- Version tracking to prevent silent mixing
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_document_chunk_index UNIQUE (document_id, chunk_index)
);

-- Step 3: B-Tree index on document_id for fast cascading deletes and document-level chunk lookups
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
    ON document_chunks (document_id);

-- Step 4: Composite index for sequential traversal and citation reconstruction
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_page_idx
    ON document_chunks (document_id, page_number, chunk_index);

-- Step 5: HNSW Cosine Distance Vector Index for high-recall semantic similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
    ON document_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

