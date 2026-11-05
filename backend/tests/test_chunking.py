"""
Unit tests for the RAG text chunking module.

Covers:
1. Normal text splitting.
2. Overlapping chunks.
3. Empty text.
4. Whitespace-only text.
5. Short text.
6. Long text.
7. Invalid chunk size.
8. Invalid overlap.
9. Multiple pages.
10. Correct document ID.
11. Correct page number.
12. Sequential chunk indexes.
13. Character offsets.
14. Page boundaries are respected.
"""

import pytest

from app.models import DocumentTextPage
from app.rag.chunking import chunk_document_pages, chunk_text


# Sample text fixtures
SAMPLE_SHORT_TEXT = "Quarterly strategic review for enterprise compliance."

SAMPLE_PARAGRAPH_TEXT = (
    "Antigravity Enterprise System Architecture Overview.\n\n"
    "The primary goal of the safe company chatbot is to provide internal knowledge "
    "retrieval without exposing confidential intellectual property to external AI endpoints. "
    "All document ingestion runs strictly within the private corporate boundary.\n\n"
    "Document pages are parsed from either PDF or Word files, after which text content "
    "is extracted into atomic pages. Each page retains its original sequential position "
    "and char count, guaranteeing full traceability for compliance auditing.\n\n"
    "The text chunking subsystem segments continuous prose into overlapping windows. "
    "Word boundaries are respected so that semantic meaning is not corrupted by mid-word truncation. "
    "Configurable overlap ensures that context spanning window boundaries remains recoverable "
    "by downstream similarity search and semantic retrieval engines."
)


# 1. Normal text splitting
def test_normal_text_splitting():
    """Verify standard text is split into multiple valid chunks without cutting words."""
    chunks = chunk_text(SAMPLE_PARAGRAPH_TEXT, chunk_size=300, chunk_overlap=60)

    assert len(chunks) > 1, "Expected text to be split into multiple chunks"

    for i, c in enumerate(chunks):
        assert "chunk_text" in c
        assert "start_char" in c
        assert "end_char" in c
        assert len(c["chunk_text"]) <= 300, f"Chunk {i} exceeded chunk_size 300"
        assert len(c["chunk_text"]) > 0, f"Chunk {i} is empty"

        # Verify that chunk text does not begin or end mid-word if separated by spaces
        # (check that chunk_text matches the slice in source text)
        assert SAMPLE_PARAGRAPH_TEXT[c["start_char"] : c["end_char"]] == c["chunk_text"]


# 2. Overlapping chunks
def test_overlapping_chunks():
    """Verify consecutive chunks have overlapping content."""
    chunk_size = 200
    chunk_overlap = 50
    chunks = chunk_text(SAMPLE_PARAGRAPH_TEXT, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    assert len(chunks) >= 3, "Need at least 3 chunks to verify overlap progression"

    for i in range(len(chunks) - 1):
        curr_chunk = chunks[i]
        next_chunk = chunks[i + 1]

        # In an overlapping scheme, next_chunk start must be strictly before curr_chunk end
        assert next_chunk["start_char"] < curr_chunk["end_char"], (
            f"Chunk {i+1} start ({next_chunk['start_char']}) must be < "
            f"Chunk {i} end ({curr_chunk['end_char']})"
        )

        # The overlap region in source text
        overlap_slice = SAMPLE_PARAGRAPH_TEXT[next_chunk["start_char"] : curr_chunk["end_char"]]
        assert len(overlap_slice) > 0, "Overlap slice must have non-zero length"

        # The overlap text must appear at the tail of curr_chunk and head of next_chunk
        assert curr_chunk["chunk_text"].endswith(overlap_slice)
        assert next_chunk["chunk_text"].startswith(overlap_slice)


# 3. Empty text
def test_empty_text():
    """Verify empty string and None inputs yield an empty chunk list."""
    assert chunk_text("") == []
    assert chunk_text(None) == []

    # Also test chunk_document_pages with empty pages
    assert chunk_document_pages([], document_id=1) == []
    assert chunk_document_pages(None, document_id=1) == []


# 4. Whitespace-only text
def test_whitespace_only_text():
    """Verify strings consisting only of whitespace characters yield no chunks."""
    assert chunk_text("   ") == []
    assert chunk_text("\n\t\r\n   \t  ") == []

    # And with chunk_document_pages containing whitespace-only page
    pages = [
        DocumentTextPage(
            document_id=10,
            page_number=1,
            text_content="    \n\t  \n  ",
            char_count=12,
        )
    ]
    assert chunk_document_pages(pages, document_id=10) == []


# 5. Short text
def test_short_text():
    """Verify text shorter than chunk_size produces a single chunk containing the full text."""
    chunks = chunk_text(SAMPLE_SHORT_TEXT, chunk_size=1000, chunk_overlap=200)

    assert len(chunks) == 1
    assert chunks[0]["chunk_text"] == SAMPLE_SHORT_TEXT
    assert chunks[0]["start_char"] == 0
    assert chunks[0]["end_char"] == len(SAMPLE_SHORT_TEXT)


# 6. Long text
def test_long_text():
    """Verify a very long document is cleanly chunked with forward progress guaranteed."""
    # Construct a long text of ~12,000 characters
    long_doc = "\n\n".join([SAMPLE_PARAGRAPH_TEXT] * 12)
    chunks = chunk_text(long_doc, chunk_size=1000, chunk_overlap=200)

    assert len(chunks) >= 12
    for i, c in enumerate(chunks):
        assert len(c["chunk_text"]) <= 1000
        assert long_doc[c["start_char"] : c["end_char"]] == c["chunk_text"]
        if i > 0:
            assert c["start_char"] > chunks[i - 1]["start_char"], "Must make forward progress"


# 7. Invalid chunk size
def test_invalid_chunk_size():
    """Verify ValueError is raised for non-positive or invalid chunk sizes."""
    with pytest.raises(ValueError, match="chunk_size must be a positive integer"):
        chunk_text("Sample valid text", chunk_size=0)

    with pytest.raises(ValueError, match="chunk_size must be a positive integer"):
        chunk_text("Sample valid text", chunk_size=-100)

    with pytest.raises(ValueError, match="chunk_size must be a positive integer"):
        chunk_text("Sample valid text", chunk_size="1000")  # type: ignore

    with pytest.raises(ValueError, match="chunk_size must be a positive integer"):
        chunk_text("Sample valid text", chunk_size=True)  # type: ignore


# 8. Invalid overlap
def test_invalid_overlap():
    """Verify ValueError is raised for negative overlap or overlap >= chunk_size."""
    with pytest.raises(ValueError, match="chunk_overlap cannot be negative"):
        chunk_text("Sample valid text", chunk_size=500, chunk_overlap=-1)

    with pytest.raises(ValueError, match="must be strictly less than chunk_size"):
        chunk_text("Sample valid text", chunk_size=500, chunk_overlap=500)

    with pytest.raises(ValueError, match="must be strictly less than chunk_size"):
        chunk_text("Sample valid text", chunk_size=500, chunk_overlap=700)

    with pytest.raises(ValueError, match="chunk_overlap must be a non-negative integer"):
        chunk_text("Sample valid text", chunk_size=500, chunk_overlap="50")  # type: ignore


# 9. Multiple pages
def test_multiple_pages():
    """Verify chunk_document_pages handles multiple pages from DocumentTextPage objects."""
    pages = [
        DocumentTextPage(
            document_id=77,
            page_number=1,
            text_content="Page 1 introduction. " + ("First page detailed sentence. " * 20),
            char_count=600,
        ),
        DocumentTextPage(
            document_id=77,
            page_number=2,
            text_content="Page 2 technical architecture. " + ("Second page system sentence. " * 20),
            char_count=600,
        ),
        DocumentTextPage(
            document_id=77,
            page_number=3,
            text_content="Page 3 security governance. " + ("Third page compliance sentence. " * 20),
            char_count=600,
        ),
    ]

    records = chunk_document_pages(pages, document_id=77, chunk_size=300, chunk_overlap=50)

    assert len(records) > 3, "Expected multiple chunks across 3 pages"

    # Verify every page is represented in the output
    pages_found = {r["page_number"] for r in records}
    assert pages_found == {1, 2, 3}


# 10. Correct document ID
def test_correct_document_id():
    """Verify every chunk record retains the exact document_id passed."""
    pages = [
        DocumentTextPage(
            document_id=12345,
            page_number=1,
            text_content="Some policy text for document 12345.",
            char_count=36,
        )
    ]

    records = chunk_document_pages(pages, document_id=12345)
    assert len(records) == 1
    assert records[0]["document_id"] == 12345


# 11. Correct page number
def test_correct_page_number():
    """Verify page numbers are preserved accurately for PDF (1-indexed) and DOCX (None)."""
    pdf_pages = [
        DocumentTextPage(
            document_id=10,
            page_number=1,
            text_content="Section 1 of PDF manual.",
            char_count=24,
        ),
        DocumentTextPage(
            document_id=10,
            page_number=2,
            text_content="Section 2 of PDF manual.",
            char_count=24,
        ),
    ]

    pdf_records = chunk_document_pages(pdf_pages, document_id=10)
    assert [r["page_number"] for r in pdf_records] == [1, 2]

    docx_pages = [
        DocumentTextPage(
            document_id=20,
            page_number=None,
            text_content="Full text of Word document without physical pages.",
            char_count=50,
        )
    ]

    docx_records = chunk_document_pages(docx_pages, document_id=20)
    assert len(docx_records) == 1
    assert docx_records[0]["page_number"] is None


# 12. Sequential chunk indexes
def test_sequential_chunk_indexes():
    """Verify chunk_index starts at 0 and increments strictly sequentially across the document."""
    pages = [
        DocumentTextPage(
            document_id=5,
            page_number=1,
            text_content="A long paragraph on page 1. " * 30,
            char_count=840,
        ),
        DocumentTextPage(
            document_id=5,
            page_number=2,
            text_content="A long paragraph on page 2. " * 30,
            char_count=840,
        ),
    ]

    records = chunk_document_pages(pages, document_id=5, chunk_size=300, chunk_overlap=50)

    assert len(records) >= 6
    indexes = [r["chunk_index"] for r in records]
    expected_indexes = list(range(len(records)))
    assert indexes == expected_indexes, f"Expected {expected_indexes}, got {indexes}"


# 13. Character offsets
def test_character_offsets():
    """Verify character offsets match the extracted chunk slice exactly."""
    text = SAMPLE_PARAGRAPH_TEXT
    chunks = chunk_text(text, chunk_size=250, chunk_overlap=50)

    for c in chunks:
        start = c["start_char"]
        end = c["end_char"]
        chunk_content = c["chunk_text"]

        assert start >= 0
        assert end <= len(text)
        assert start < end
        assert text[start:end] == chunk_content, (
            f"Offset mismatch: text[{start}:{end}] != {chunk_content!r}"
        )

    # Also test for chunk_document_pages
    pages = [
        DocumentTextPage(
            document_id=99,
            page_number=1,
            text_content=text,
            char_count=len(text),
        )
    ]
    doc_records = chunk_document_pages(pages, document_id=99, chunk_size=250, chunk_overlap=50)
    for r in doc_records:
        start = r["start_char"]
        end = r["end_char"]
        assert text[start:end] == r["chunk_text"]


# 14. Page boundaries are respected
def test_page_boundaries_are_respected():
    """Verify that chunks never blend text across distinct page boundaries."""
    page_1_secret = "PAGE_ONE_EXCLUSIVE_KEYWORD"
    page_2_secret = "PAGE_TWO_EXCLUSIVE_KEYWORD"

    pages = [
        DocumentTextPage(
            document_id=88,
            page_number=1,
            text_content=f"Confidential data start. {page_1_secret}. End of page one.",
            char_count=100,
        ),
        DocumentTextPage(
            document_id=88,
            page_number=2,
            text_content=f"Beginning of page two. {page_2_secret}. End of page two.",
            char_count=100,
        ),
    ]

    # Use a chunk size that could easily hold both pages if they were combined
    records = chunk_document_pages(pages, document_id=88, chunk_size=1000, chunk_overlap=200)

    # Must produce chunks for each page independently
    page_1_chunks = [r for r in records if r["page_number"] == 1]
    page_2_chunks = [r for r in records if r["page_number"] == 2]

    assert len(page_1_chunks) >= 1
    assert len(page_2_chunks) >= 1

    for c in page_1_chunks:
        assert page_1_secret in c["chunk_text"]
        assert page_2_secret not in c["chunk_text"], "Page 1 chunk leaked Page 2 text!"

    for c in page_2_chunks:
        assert page_2_secret in c["chunk_text"]
        assert page_1_secret not in c["chunk_text"], "Page 2 chunk leaked Page 1 text!"

