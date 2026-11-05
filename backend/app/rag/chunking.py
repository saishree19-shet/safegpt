"""
Text chunking module for Retrieval-Augmented Generation (RAG).

Provides deterministic, word-boundary-aware text chunking with configurable
chunk sizes and overlapping windows. Preserves character offsets, document IDs,
and page numbers across multi-page PDF and DOCX extractions.
"""

from typing import Any, Optional, Sequence, Union


class ChunkRecord(dict):
    """
    Structured dictionary representing a chunk.

    Guarantees standard dictionary behavior with the required fields:
      - document_id
      - page_number
      - chunk_index
      - chunk_text
      - start_char
      - end_char

    Also provides transparent fallback access to 'text' for callers or tests
    that reference chunk['text'] interchangeably with chunk['chunk_text'].
    """

    def __getitem__(self, key: str) -> Any:
        if key == "text" and "text" not in self and "chunk_text" in self:
            return self["chunk_text"]
        return super().__getitem__(key)

    def get(self, key: str, default: Any = None) -> Any:
        if key == "text" and "text" not in self and "chunk_text" in self:
            return self["chunk_text"]
        return super().get(key, default)


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    *,
    overlap: Optional[int] = None,
) -> list[dict]:
    """
    Split text into overlapping chunks while preserving word boundaries.

    Parameters:
        text: The extracted string content to chunk.
        chunk_size: Maximum chunk size in characters (default: 1000).
        chunk_overlap: Overlap size in characters between adjacent chunks (default: 200).
        overlap: Keyword-only alias for chunk_overlap.

    Returns:
        List of chunk dictionaries with:
            - "chunk_text": Substring text of the chunk.
            - "start_char": Starting character index in the source text.
            - "end_char": Ending character index (exclusive) in the source text.
            - "text": Convenient alias pointing to chunk_text.

    Raises:
        ValueError: If chunk_size <= 0, chunk_overlap < 0, or chunk_overlap >= chunk_size.
        TypeError: If input text is not a string (None is treated as empty text).
    """
    if overlap is not None:
        chunk_overlap = overlap

    if chunk_size is None or not isinstance(chunk_size, int) or isinstance(chunk_size, bool):
        raise ValueError(f"chunk_size must be a positive integer, got {chunk_size!r}")

    if chunk_overlap is None or not isinstance(chunk_overlap, int) or isinstance(chunk_overlap, bool):
        raise ValueError(f"chunk_overlap must be a non-negative integer, got {chunk_overlap!r}")

    if chunk_size <= 0:
        raise ValueError(f"chunk_size must be a positive integer (> 0), got {chunk_size}")

    if chunk_overlap < 0:
        raise ValueError(f"chunk_overlap cannot be negative, got {chunk_overlap}")

    if chunk_overlap >= chunk_size:
        raise ValueError(
            f"chunk_overlap ({chunk_overlap}) must be strictly less than chunk_size ({chunk_size})"
        )

    if text is None:
        return []

    if not isinstance(text, str):
        raise TypeError(f"text must be a string, got {type(text).__name__}")

    if not text or not text.strip():
        return []

    n = len(text)
    chunks: list[dict] = []
    current_start = 0

    # Advance past any initial whitespace to establish a clean starting offset
    while current_start < n and text[current_start].isspace():
        current_start += 1

    while current_start < n:
        target_end = min(current_start + chunk_size, n)

        if target_end >= n:
            # Final chunk reaches the end of the text
            end_char = n
            while end_char > current_start and text[end_char - 1].isspace():
                end_char -= 1

            if end_char > current_start:
                chunk_slice = text[current_start:end_char]
                chunks.append(
                    ChunkRecord(
                        {
                            "chunk_text": chunk_slice,
                            "start_char": current_start,
                            "end_char": end_char,
                        }
                    )
                )
            break

        # If target_end lands directly on or immediately after whitespace,
        # the boundary already falls between words.
        if text[target_end].isspace() or text[target_end - 1].isspace():
            split_point = target_end
        else:
            # target_end lands in the middle of a word. Look for a natural boundary
            # within a window before target_end.
            window_len = max(chunk_overlap, min(100, chunk_size // 5))
            search_start = max(current_start + 1, target_end - window_len)
            search_text = text[search_start:target_end]

            # Priority 1: Paragraph break (\n\n)
            p_idx = search_text.rfind("\n\n")
            if p_idx != -1:
                split_point = search_start + p_idx + 2
            else:
                # Priority 2: Sentence boundaries (. , ! , ? , .\n, etc.)
                best_sent = -1
                for punct in [". ", "? ", "! ", ".\n", "?\n", "!\n"]:
                    idx = search_text.rfind(punct)
                    if idx != -1:
                        best_sent = max(best_sent, idx + len(punct))
                if best_sent != -1:
                    split_point = search_start + best_sent
                else:
                    # Priority 3: Single newline (\n)
                    nl_idx = search_text.rfind("\n")
                    if nl_idx != -1:
                        split_point = search_start + nl_idx + 1
                    else:
                        # Priority 4: Last whitespace before target_end
                        ws_idx = -1
                        for i in range(target_end - 1, current_start, -1):
                            if text[i].isspace():
                                ws_idx = i
                                break
                        if ws_idx != -1:
                            split_point = ws_idx
                        else:
                            # Priority 5: Hard cut at target_end if no boundary exists
                            # (e.g. single word longer than chunk_size)
                            split_point = target_end

        # Trim trailing whitespace from the chunk's ending offset
        end_char = split_point
        while end_char > current_start and text[end_char - 1].isspace():
            end_char -= 1

        if end_char > current_start:
            chunk_slice = text[current_start:end_char]
            chunks.append(
                ChunkRecord(
                    {
                        "chunk_text": chunk_slice,
                        "start_char": current_start,
                        "end_char": end_char,
                    }
                )
            )

        # Calculate starting position for the next chunk
        if chunk_overlap == 0:
            next_start = split_point
            while next_start < n and text[next_start].isspace():
                next_start += 1
        else:
            candidate_start = end_char - chunk_overlap
            if candidate_start <= current_start:
                candidate_start = current_start + 1

            # Adjust candidate_start to avoid cutting words at the chunk head
            if (
                candidate_start < end_char
                and not text[candidate_start].isspace()
                and candidate_start > 0
                and not text[candidate_start - 1].isspace()
            ):
                word_start = -1
                for i in range(candidate_start - 1, current_start - 1, -1):
                    if text[i].isspace():
                        word_start = i + 1
                        break

                next_word_start = -1
                for i in range(candidate_start, end_char):
                    if text[i].isspace():
                        j = i
                        while j < end_char and text[j].isspace():
                            j += 1
                        if j < end_char:
                            next_word_start = j
                        break

                if word_start != -1 and word_start > current_start:
                    candidate_start = word_start
                elif (
                    next_word_start != -1
                    and next_word_start > current_start
                    and next_word_start < end_char
                ):
                    candidate_start = next_word_start

            next_start = candidate_start
            while next_start < n and text[next_start].isspace():
                next_start += 1

        # Strictly enforce forward progress to prevent infinite loops
        if next_start <= current_start:
            next_start = current_start + 1
            while next_start < n and text[next_start].isspace():
                next_start += 1

        current_start = next_start

    return chunks


def chunk_document_pages(
    pages: Sequence[Any],
    document_id: Optional[int] = None,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    *,
    overlap: Optional[int] = None,
) -> list[dict]:
    """
    Split extracted document pages into structured chunk records.

    Processes each page independently to ensure page boundaries are respected.
    Preserves document ID, page numbers (integer for PDF, None for DOCX),
    sequential 0-indexed chunk indexes, and exact character offsets relative to each page.

    Parameters:
        pages: Sequence of DocumentTextPage objects or dictionaries.
        document_id: The ID of the document.
        chunk_size: Maximum chunk size in characters (default: 1000).
        chunk_overlap: Overlap size in characters between adjacent chunks (default: 200).
        overlap: Keyword-only alias for chunk_overlap.

    Returns:
        List of structured chunk dictionaries:
        {
            "document_id": document_id,
            "page_number": page_number,
            "chunk_index": chunk_index,
            "chunk_text": chunk_text,
            "start_char": start_char,
            "end_char": end_char
        }
    """
    # Allow passing (document_id, pages) if caller swaps order
    if isinstance(pages, int) and not isinstance(document_id, int):
        document_id, pages = pages, document_id

    if pages is None:
        return []

    # If document_id was omitted, attempt to retrieve it from page records
    if document_id is None:
        for p in pages:
            d_id = (
                p.get("document_id")
                if isinstance(p, dict)
                else getattr(p, "document_id", None)
            )
            if d_id is not None:
                document_id = d_id
                break
        if document_id is None:
            raise ValueError("document_id must be provided as an integer.")

    if not isinstance(document_id, int) or isinstance(document_id, bool):
        raise ValueError(f"document_id must be an integer, got {document_id!r}")

    records: list[dict] = []
    chunk_index = 0

    for page in pages:
        if isinstance(page, dict):
            page_num = page.get("page_number", page.get("page"))
            text = page.get("text_content", page.get("text", ""))
        else:
            page_num = getattr(page, "page_number", getattr(page, "page", None))
            text = getattr(page, "text_content", getattr(page, "text", ""))

        if not text or not isinstance(text, str) or not text.strip():
            continue

        page_chunks = chunk_text(
            text=text,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            overlap=overlap,
        )

        for pc in page_chunks:
            records.append(
                ChunkRecord(
                    {
                        "document_id": document_id,
                        "page_number": page_num,
                        "chunk_index": chunk_index,
                        "chunk_text": pc["chunk_text"],
                        "start_char": pc["start_char"],
                        "end_char": pc["end_char"],
                    }
                )
            )
            chunk_index += 1

    return records

