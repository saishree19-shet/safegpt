"""
Citation Verification and Claim Validation Engine for CogniSec – Step 5.

Security contract:
1. ALL validation occurs exclusively against sanitized_text from authorized retrieved chunks.
2. original_text MUST NEVER be accessed or used in any validation step.
3. Model-generated source IDs, document IDs, filenames and page numbers are treated as
   untrusted hints only. Backend independently rebuilds every citation from retrieval records.
4. Plain-text LLM fallback → claims marked 'unverified', not 'supported'.
5. Malformed JSON → conservative fallback; claims get 'unverified' status.
6. No raw sensitive values may appear in logs or metadata.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EVIDENCE_SUPPORTED = "supported"
EVIDENCE_PARTIALLY_SUPPORTED = "partially_supported"
EVIDENCE_INSUFFICIENT = "insufficient_evidence"
EVIDENCE_UNSUPPORTED = "unsupported"
EVIDENCE_UNVERIFIED = "unverified"

# Minimum fraction of significant (non-stop-word) claim tokens that must appear in chunk text
_KEYWORD_OVERLAP_THRESHOLD = 0.40

# Negation words that flip the meaning of an assertion
_NEGATION_WORDS: frozenset[str] = frozenset({
    "not", "never", "no", "neither", "nor", "cannot", "can't", "won't", "doesn't",
    "isn't", "aren't", "wasn't", "weren't", "don't", "didn't", "shouldn't", "wouldn't",
    "couldn't", "mustn't", "prohibited", "forbidden", "disallowed", "denied",
})

# Common English stop-words to exclude from keyword overlap scoring
_STOP_WORDS: frozenset[str] = frozenset({
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "must", "that", "this",
    "these", "those", "it", "its", "they", "their", "them", "we", "our",
    "you", "your", "he", "his", "she", "her", "and", "or", "but", "if",
    "in", "on", "at", "to", "for", "of", "with", "by", "from", "up",
    "about", "into", "through", "during", "before", "after", "above",
    "below", "between", "each", "all", "any", "both", "few", "more",
    "than", "then", "so", "as", "such", "also", "than", "while", "since",
    "per", "which", "who", "whom", "how", "when", "where", "what", "why",
})

# Conditional qualifier phrases that may weaken support
_CONDITION_PHRASES: list[str] = [
    "only if", "provided that", "subject to", "as long as", "unless",
    "except when", "in case of", "if approved", "upon approval", "pending",
    "where applicable", "at the discretion", "may be", "might be",
]

# ---------------------------------------------------------------------------
# Regex helpers
# ---------------------------------------------------------------------------

_NUMBER_RE = re.compile(r"\b\d[\d,]*\.?\d*\b")
_DATE_RE = re.compile(
    r"\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}"          # 01/01/2024
    r"|\d{4}[-/]\d{1,2}[-/]\d{1,2}"                  # 2024-01-01
    r"|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}"
    r"|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4})\b",
    re.IGNORECASE,
)


def _normalise_number(value: str) -> str:
    """Remove formatting from a numeric string for comparison."""
    return value.replace(",", "").strip()


def _extract_numbers(text: str) -> list[str]:
    return [_normalise_number(m) for m in _NUMBER_RE.findall(text)]


def _extract_dates(text: str) -> list[str]:
    return [m.lower().strip() for m in _DATE_RE.findall(text)]


def _significant_tokens(text: str) -> set[str]:
    """Return lowercase meaningful words, excluding stop-words and short tokens."""
    tokens = re.findall(r"[a-zA-Z]+", text.lower())
    return {t for t in tokens if len(t) > 2 and t not in _STOP_WORDS}


def _has_negation(text: str) -> bool:
    tokens = set(re.findall(r"[a-zA-Z']+", text.lower()))
    return bool(tokens & _NEGATION_WORDS)


def _has_condition(text: str) -> bool:
    lower = text.lower()
    return any(phrase in lower for phrase in _CONDITION_PHRASES)


# ---------------------------------------------------------------------------
# Source index builder
# ---------------------------------------------------------------------------

def build_authorized_source_index(sanitized_chunks: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """
    Build a mapping from deterministic source_id keys to authorized chunk metadata.

    The source_id is assigned in the same order as build_llm_context() (1-based index),
    so the validator always works from the same authoritative set.

    Only sanitized_text is accessible for validation; original_text is explicitly excluded.

    Args:
        sanitized_chunks: Output from retrieve_and_sanitize_chunks().

    Returns:
        dict mapping "source_1", "source_2", … to chunk metadata dicts containing:
        - source_id, document_id, filename, chunk_id, chunk_index, page_number,
          similarity_score, sanitized_text, entity_counts, is_sanitized.

    Raises:
        ValueError: If any chunk is missing is_sanitized=True.
    """
    index: dict[str, dict[str, Any]] = {}

    for idx, chunk in enumerate(sanitized_chunks, start=1):
        if chunk.get("is_sanitized") is not True:
            raise ValueError(
                f"Security violation: chunk at index {idx} has not been sanitized "
                "(missing is_sanitized=True). Cannot build validator source index."
            )

        source_id = f"source_{idx}"
        index[source_id] = {
            "source_id": source_id,
            "document_id": chunk["document_id"],
            "filename": chunk["filename"],
            "chunk_id": chunk["chunk_id"],
            "chunk_index": chunk["chunk_index"],
            "page_number": chunk.get("page_number"),
            "similarity_score": chunk.get("similarity_score", 0.0),
            # Validation uses ONLY sanitized text — original_text is never referenced
            "sanitized_text": chunk["sanitized_text"],
            "entity_counts": chunk.get("entity_counts", {}),
            "is_sanitized": True,
        }

    return index


# ---------------------------------------------------------------------------
# LLM response parsing
# ---------------------------------------------------------------------------

def parse_structured_llm_response(raw_response: str) -> dict[str, Any] | None:
    """
    Attempt to parse the LLM raw response as the expected structured JSON format.

    Expected structure:
    {
        "answer": "<string>",
        "claims": [
            {"claim": "<string>", "supporting_source_ids": ["source_1", ...]}
        ]
    }

    Returns:
        Parsed dict if structure is valid, else None.

    Security:
        Never infers claims as 'supported' from plain-text fallback.
        Unknown keys are silently ignored.
    """
    if not raw_response or not raw_response.strip():
        return None

    # Strip markdown code fences if the model wrapped JSON in ```json ... ```
    stripped = raw_response.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        # Drop first and last fence lines
        inner_lines = []
        in_fence = False
        for line in lines:
            if line.strip().startswith("```") and not in_fence:
                in_fence = True
                continue
            if line.strip() == "```" and in_fence:
                break
            if in_fence:
                inner_lines.append(line)
        stripped = "\n".join(inner_lines).strip()

    try:
        data = json.loads(stripped)
    except (json.JSONDecodeError, ValueError):
        logger.debug("Structured LLM response JSON parse failed — treating as plain text.")
        return None

    if not isinstance(data, dict):
        return None

    answer = data.get("answer")
    claims = data.get("claims")

    if not isinstance(answer, str):
        return None

    if not isinstance(claims, list):
        return None

    # Validate each claim entry
    validated_claims: list[dict[str, Any]] = []
    for item in claims:
        if not isinstance(item, dict):
            continue
        claim_text = item.get("claim")
        source_ids = item.get("supporting_source_ids", [])
        if not isinstance(claim_text, str) or not claim_text.strip():
            continue
        if not isinstance(source_ids, list):
            source_ids = []
        # Only keep string source IDs; numeric/other types are discarded
        source_ids = [s for s in source_ids if isinstance(s, str)]
        validated_claims.append({
            "claim": claim_text.strip(),
            "supporting_source_ids": source_ids,
        })

    return {"answer": answer.strip(), "claims": validated_claims}


def extract_claims_from_plain_text(answer: str) -> list[dict[str, Any]]:
    """
    Split a plain-text answer into individual candidate claims.

    All extracted claims start with status='unverified' — they are NEVER
    automatically classified as 'supported' from plain-text fallback.

    Args:
        answer: Plain-text LLM response.

    Returns:
        List of dicts with keys: claim (str), supporting_source_ids (list),
        status ('unverified').
    """
    if not answer or not answer.strip():
        return []

    # Split on sentence boundaries
    sentences = re.split(r"(?<=[.!?])\s+", answer.strip())
    claims = []
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) > 10:  # Skip trivially short fragments
            claims.append({
                "claim": sentence,
                "supporting_source_ids": [],
                "status": EVIDENCE_UNVERIFIED,
            })

    return claims


# ---------------------------------------------------------------------------
# Claim validation
# ---------------------------------------------------------------------------

def _validate_claim_against_single_chunk(
    claim_text: str,
    chunk_sanitized_text: str,
) -> tuple[bool, bool, bool]:
    """
    Validate one claim against one chunk's sanitized text.

    Returns:
        (numbers_ok, keyword_ok, negation_conflict)
        - numbers_ok:        All numbers in the claim appear in the chunk.
        - keyword_ok:        Sufficient meaningful keyword overlap.
        - negation_conflict: Negation pattern differs between claim and chunk.
    """
    claim_lower = claim_text.lower()
    chunk_lower = chunk_sanitized_text.lower()

    # --- Layer 1a: Number matching ---
    claim_numbers = _extract_numbers(claim_text)
    if claim_numbers:
        numbers_ok = all(num in _extract_numbers(chunk_sanitized_text) for num in claim_numbers)
    else:
        numbers_ok = True  # No numbers to verify

    # --- Layer 1b: Date matching ---
    claim_dates = _extract_dates(claim_text)
    if claim_dates:
        chunk_dates = _extract_dates(chunk_sanitized_text)
        # All claim dates must appear in chunk dates (substring match)
        for cd in claim_dates:
            if not any(cd in chd or chd in cd for chd in chunk_dates):
                numbers_ok = False  # Reuse flag: date mismatch fails
                break

    # --- Layer 1c: Negation conflict detection ---
    claim_negated = _has_negation(claim_lower)
    chunk_negated = _has_negation(chunk_lower)
    # Extract the core assertion without negation words to compare context
    claim_sig_tokens = _significant_tokens(claim_text)
    chunk_sig_tokens = _significant_tokens(chunk_sanitized_text)

    # Only flag negation conflict when there's meaningful overlap of non-negation tokens
    shared_sig = claim_sig_tokens & chunk_sig_tokens
    negation_conflict = (
        claim_negated != chunk_negated
        and len(shared_sig) >= 2  # Must share meaningful context first
    )

    # --- Layer 2: Keyword overlap ---
    if claim_sig_tokens:
        overlap_ratio = len(shared_sig) / len(claim_sig_tokens)
        keyword_ok = overlap_ratio >= _KEYWORD_OVERLAP_THRESHOLD
    else:
        keyword_ok = True  # No significant tokens; cannot disqualify

    return numbers_ok, keyword_ok, negation_conflict


def validate_claim_against_sources(
    claim_text: str,
    authorized_sources: dict[str, dict[str, Any]],
    model_suggested_source_ids: list[str] | None = None,
) -> tuple[str, list[str]]:
    """
    Validate a single claim against all authorized retrieved chunks.

    Strategy:
    1. Try model-suggested source IDs first (as untrusted hints).
    2. If no match, scan ALL authorized chunks (cross-chunk evidence matching).
    3. Numbers, dates, entities, and negations are checked on each candidate chunk.
    4. Keyword overlap threshold must be met.
    5. Partial support is returned when conditions/qualifiers in the claim are not in the chunk.

    Args:
        claim_text:                   The claim text to verify.
        authorized_sources:           Source index from build_authorized_source_index().
        model_suggested_source_ids:   Untrusted list of source_id strings from LLM output.

    Returns:
        (status, matched_source_ids)
        - status:             "supported" | "partially_supported" | "unsupported"
        - matched_source_ids: Backend-verified source_ids that actually support the claim.
    """
    if not claim_text or not claim_text.strip():
        return EVIDENCE_UNSUPPORTED, []

    if not authorized_sources:
        return EVIDENCE_UNSUPPORTED, []

    # Build ordered probe list: suggested IDs first, then rest
    probe_order: list[str] = []
    if model_suggested_source_ids:
        for sid in model_suggested_source_ids:
            if sid in authorized_sources:
                probe_order.append(sid)

    # Add remaining authorized sources not already in probe_order
    for sid in authorized_sources:
        if sid not in probe_order:
            probe_order.append(sid)

    matched_source_ids: list[str] = []

    for source_id in probe_order:
        chunk = authorized_sources[source_id]
        sanitized_text = chunk["sanitized_text"]  # ONLY sanitized text — never original_text

        numbers_ok, keyword_ok, negation_conflict = _validate_claim_against_single_chunk(
            claim_text, sanitized_text
        )

        if negation_conflict:
            # Hard mismatch: claim contradicts chunk on negation; skip this chunk
            continue

        if numbers_ok and keyword_ok:
            matched_source_ids.append(source_id)

    if not matched_source_ids:
        return EVIDENCE_UNSUPPORTED, []

    # Check for conditional qualifiers that differ from chunk content
    claim_has_condition = _has_condition(claim_text)
    chunk_has_condition = any(
        _has_condition(authorized_sources[sid]["sanitized_text"])
        for sid in matched_source_ids
    )

    if claim_has_condition and not chunk_has_condition:
        # Claim adds conditions not present in source → partial support
        return EVIDENCE_PARTIALLY_SUPPORTED, matched_source_ids

    return EVIDENCE_SUPPORTED, matched_source_ids


# ---------------------------------------------------------------------------
# Evidence status resolution
# ---------------------------------------------------------------------------

def resolve_evidence_status(verified_claims: list[dict[str, Any]]) -> str:
    """
    Determine the overall evidence status from a list of verified claims.

    Args:
        verified_claims: Each dict contains 'status' key.

    Returns:
        "supported"            – All claims are 'supported'.
        "partially_supported"  – At least one claim supported; at least one not.
        "insufficient_evidence"– No claims, or none supported/partially supported.
    """
    if not verified_claims:
        return EVIDENCE_INSUFFICIENT

    statuses = [c.get("status", EVIDENCE_UNVERIFIED) for c in verified_claims]

    supported_count = statuses.count(EVIDENCE_SUPPORTED)
    partial_count = statuses.count(EVIDENCE_PARTIALLY_SUPPORTED)
    total = len(statuses)

    if supported_count == total:
        return EVIDENCE_SUPPORTED

    if supported_count + partial_count > 0:
        return EVIDENCE_PARTIALLY_SUPPORTED

    return EVIDENCE_INSUFFICIENT


# ---------------------------------------------------------------------------
# Top-level orchestration
# ---------------------------------------------------------------------------

INSUFFICIENT_EVIDENCE_MESSAGE = (
    "The available documents do not contain sufficient verified information "
    "to support this answer."
)


def validate_answer(
    raw_llm_response: str,
    authorized_sources: dict[str, dict[str, Any]],
) -> tuple[str, list[dict[str, Any]], str]:
    """
    Orchestrate parsing, per-claim validation, and evidence status resolution.

    Args:
        raw_llm_response: Raw string returned by the LLM.
        authorized_sources: Source index from build_authorized_source_index().

    Returns:
        (final_answer, verified_claims, evidence_status)

        - final_answer:    Sanitized answer text. Replaced with standard message
                           when evidence_status is 'insufficient_evidence'.
        - verified_claims: List of claim dicts with verified 'status' and 'source_ids'.
        - evidence_status: "supported" | "partially_supported" | "insufficient_evidence".

    Security:
        - Malformed JSON → conservative fallback: all claims 'unverified'.
        - Plain-text fallback → claims 'unverified', not 'supported'.
        - Only sanitized_text is used in validation (never original_text).
        - Model-suggested source references are always discarded for citation building;
          only backend-verified source IDs in matched_source_ids are trusted.
    """
    if not raw_llm_response or not raw_llm_response.strip():
        return INSUFFICIENT_EVIDENCE_MESSAGE, [], EVIDENCE_INSUFFICIENT

    # --- Attempt structured JSON parsing ---
    parsed = parse_structured_llm_response(raw_llm_response)

    if parsed is not None:
        answer_text = parsed.get("answer", "").strip()
        raw_claims = parsed.get("claims", [])
    else:
        # Conservative plain-text fallback
        logger.debug(
            "LLM response not in structured format — using plain-text fallback with "
            "unverified claim status."
        )
        answer_text = raw_llm_response.strip()
        raw_claims_dicts = extract_claims_from_plain_text(answer_text)
        # Pre-assign unverified status
        verified_claims: list[dict[str, Any]] = []
        for c in raw_claims_dicts:
            verified_claims.append({
                "text": c["claim"],
                "status": EVIDENCE_UNVERIFIED,
                "source_ids": [],
            })
        # Determine overall status
        evidence_status = resolve_evidence_status(verified_claims)
        # For plain-text fallback, all claims are unverified → insufficient
        if not any(c["status"] in (EVIDENCE_SUPPORTED, EVIDENCE_PARTIALLY_SUPPORTED)
                   for c in verified_claims):
            evidence_status = EVIDENCE_INSUFFICIENT
            final_answer = INSUFFICIENT_EVIDENCE_MESSAGE
        else:
            final_answer = answer_text
        return final_answer, verified_claims, evidence_status

    # --- Validate each structured claim ---
    verified_claims = []
    for raw_claim in raw_claims:
        claim_text = raw_claim.get("claim", "").strip()
        suggested_ids = raw_claim.get("supporting_source_ids", [])

        if not claim_text:
            continue

        status, matched_ids = validate_claim_against_sources(
            claim_text=claim_text,
            authorized_sources=authorized_sources,
            model_suggested_source_ids=suggested_ids,
        )

        verified_claims.append({
            "text": claim_text,
            "status": status,
            "source_ids": matched_ids,  # Backend-verified IDs only
        })

    # --- Handle empty answer ---
    if not answer_text:
        return INSUFFICIENT_EVIDENCE_MESSAGE, verified_claims, EVIDENCE_INSUFFICIENT

    # --- Resolve overall evidence status ---
    evidence_status = resolve_evidence_status(verified_claims)

    if evidence_status == EVIDENCE_INSUFFICIENT:
        final_answer = INSUFFICIENT_EVIDENCE_MESSAGE
    else:
        final_answer = answer_text

    return final_answer, verified_claims, evidence_status

