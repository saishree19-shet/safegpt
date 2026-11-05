"""
Unit tests for the Ollama embedding client.
Tests batching, asymmetric prefixing, validation, and error handling using mocked Ollama responses.
"""

from unittest.mock import MagicMock, patch
import httpx
import pytest

from app.rag.embeddings import (
    DOCUMENT_PREFIX,
    EXPECTED_EMBEDDING_DIM,
    QUERY_PREFIX,
    EmbeddingError,
    EmbeddingValidationError,
    OllamaConnectionError,
    OllamaEmbeddingClient,
    OllamaModelNotFoundError,
)


def make_dummy_vector(dim: int = EXPECTED_EMBEDDING_DIM, val: float = 0.05) -> list[float]:
    return [val] * dim


def test_embed_document_chunks_success():
    """Verify document chunk embedding prepends search_document prefix and returns valid vectors."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "model": "nomic-embed-text",
        "embeddings": [
            make_dummy_vector(EXPECTED_EMBEDDING_DIM, 0.1),
            make_dummy_vector(EXPECTED_EMBEDDING_DIM, 0.2),
        ],
    }

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post.return_value = mock_response

    client = OllamaEmbeddingClient(http_client=mock_client)
    chunks = ["First company policy chunk.", "Second company strategy chunk."]
    vectors = client.embed_document_chunks(chunks)

    assert len(vectors) == 2
    assert len(vectors[0]) == EXPECTED_EMBEDDING_DIM
    assert len(vectors[1]) == EXPECTED_EMBEDDING_DIM

    # Verify asymmetric prefixing was applied to the payload
    mock_client.post.assert_called_once()
    call_args, call_kwargs = mock_client.post.call_args
    sent_payload = call_kwargs["json"]
    assert sent_payload["model"] == "nomic-embed-text"
    assert sent_payload["input"] == [
        f"{DOCUMENT_PREFIX}First company policy chunk.",
        f"{DOCUMENT_PREFIX}Second company strategy chunk.",
    ]


def test_embed_query_success():
    """Verify query embedding prepends search_query prefix."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "model": "nomic-embed-text",
        "embeddings": [make_dummy_vector(EXPECTED_EMBEDDING_DIM, 0.3)],
    }

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post.return_value = mock_response

    client = OllamaEmbeddingClient(http_client=mock_client)
    query = "What is the security policy?"
    vec = client.embed_query(query)

    assert len(vec) == EXPECTED_EMBEDDING_DIM
    call_args, call_kwargs = mock_client.post.call_args
    sent_payload = call_kwargs["json"]
    assert sent_payload["input"] == [f"{QUERY_PREFIX}{query}"]


def test_bounded_batching():
    """Verify requests exceeding batch size are sliced into multiple bounded batches."""
    mock_client = MagicMock(spec=httpx.Client)

    def side_effect(url, json=None):
        batch_inputs = json["input"]
        resp = MagicMock(spec=httpx.Response)
        resp.status_code = 200
        resp.json.return_value = {
            "model": "nomic-embed-text",
            "embeddings": [make_dummy_vector(EXPECTED_EMBEDDING_DIM, 0.1) for _ in batch_inputs],
        }
        return resp

    mock_client.post.side_effect = side_effect

    client = OllamaEmbeddingClient(batch_size=3, http_client=mock_client)
    chunks = [f"Chunk number {i}" for i in range(10)]  # 10 chunks, batch_size=3 -> 4 calls (3, 3, 3, 1)

    vectors = client.embed_document_chunks(chunks)
    assert len(vectors) == 10
    assert mock_client.post.call_count == 4


def test_empty_and_whitespace_chunk_validation():
    """Verify embedding empty or whitespace-only chunks raises EmbeddingValidationError."""
    client = OllamaEmbeddingClient()

    with pytest.raises(EmbeddingValidationError, match="Cannot embed empty or whitespace-only chunk"):
        client.embed_document_chunks([""])

    with pytest.raises(EmbeddingValidationError, match="Cannot embed empty or whitespace-only chunk"):
        client.embed_document_chunks(["Valid chunk", "   \n\t  "])

    with pytest.raises(EmbeddingValidationError, match="Cannot embed empty or whitespace-only query"):
        client.embed_query("   ")


def test_dimension_mismatch_validation():
    """Verify embedding responses with dimension != 768 raise EmbeddingValidationError."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "model": "nomic-embed-text",
        "embeddings": [make_dummy_vector(512, 0.1)],  # 512 != 768
    }

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post.return_value = mock_response

    client = OllamaEmbeddingClient(http_client=mock_client)
    with pytest.raises(EmbeddingValidationError, match="Embedding dimension mismatch: expected 768, got 512"):
        client.embed_document_chunks(["Test chunk"])


def test_non_finite_values_validation():
    """Verify embedding responses with NaN or Inf values raise EmbeddingValidationError."""
    nan_vector = make_dummy_vector(EXPECTED_EMBEDDING_DIM, 0.1)
    nan_vector[10] = float("nan")

    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "model": "nomic-embed-text",
        "embeddings": [nan_vector],
    }

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post.return_value = mock_response

    client = OllamaEmbeddingClient(http_client=mock_client)
    with pytest.raises(EmbeddingValidationError, match="non-finite or invalid numeric value"):
        client.embed_document_chunks(["Test chunk"])


def test_ollama_connection_error_handling():
    """Verify connection errors to Ollama raise OllamaConnectionError."""
    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post.side_effect = httpx.ConnectError("Connection refused")

    client = OllamaEmbeddingClient(http_client=mock_client)
    with pytest.raises(OllamaConnectionError, match="Could not connect to Ollama"):
        client.embed_document_chunks(["Test chunk"])


def test_ollama_timeout_handling():
    """Verify timeout errors raise OllamaConnectionError."""
    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post.side_effect = httpx.TimeoutException("Read timed out")

    client = OllamaEmbeddingClient(http_client=mock_client)
    with pytest.raises(OllamaConnectionError, match="timed out"):
        client.embed_document_chunks(["Test chunk"])


def test_ollama_model_not_found_handling():
    """Verify HTTP 404 raises OllamaModelNotFoundError."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 404
    mock_response.text = "model not found"

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post.return_value = mock_response

    client = OllamaEmbeddingClient(http_client=mock_client)
    with pytest.raises(OllamaModelNotFoundError, match="Model 'nomic-embed-text' was not found in Ollama"):
        client.embed_document_chunks(["Test chunk"])


def test_ollama_http_500_handling():
    """Verify HTTP 500 raises EmbeddingError."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 500
    mock_response.text = "internal model execution error"

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.post.return_value = mock_response

    client = OllamaEmbeddingClient(http_client=mock_client)
    with pytest.raises(EmbeddingError, match="Ollama returned HTTP error 500"):
        client.embed_document_chunks(["Test chunk"])

