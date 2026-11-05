-- Migration: 002_create_document_text_pages.sql
-- Description: Create document_text_pages table for persistent extracted text storage.
-- Preserves page numbers for PDFs (page_number: 1, 2, ...) and stores NULL for DOCX files.
-- Includes foreign key with cascading deletion to ensure no orphaned text records exist when documents are deleted.
-- Target: PostgreSQL database safe_company_chatbot

-- Step 1: Create document_text_pages table
CREATE TABLE IF NOT EXISTS document_text_pages (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NULL,
    text_content TEXT NOT NULL,
    char_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Index on document_id for fast page lookups and cascade performance
CREATE INDEX IF NOT EXISTS idx_document_text_pages_document_id
    ON document_text_pages (document_id);

-- Step 3: Composite index on (document_id, page_number) for ordered page retrieval
CREATE INDEX IF NOT EXISTS idx_document_text_pages_doc_page
    ON document_text_pages (document_id, page_number);
