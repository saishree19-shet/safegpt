"""
Ollama Embedding Client for CogniSec.

Provides client and validation utilities for generating dense 768-dimensional
embeddings using nomic-embed-text running in local Ollama.
"""

import math
import os
from typing import Optional, Sequence

import httpx

DEFAULT_OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL_NAME", "nomic-embed-text")
EXPECTED_EMBEDDING_DIM: int = 768
DEFAULT_BATCH_SIZE: int = int(os.getenv("EMBEDDING_BATCH_SIZE", "32"))
DEFAULT_TIMEOUT_SECONDS: float = float(os.getenv("OLLAMA_EMBEDDING_TIMEOUT_SECONDS", "60.0"))

# Task prefixes required by nomic-embed-text for asymmetric retrieval
DOCUMENT_PREFIX: str = "search_document: "
QUERY_PREFIX: str = "search_query: "


class EmbeddingError(Exception):
    """Base exception for all embedding generation and validation errors."""
    pass


class OllamaConnectionError(EmbeddingError):
    """Raised when Ollama is unreachable, times out, or fails at network level."""
    pass


class OllamaModelNotFoundError(EmbeddingError):
    """Raised when the specified model is not installed or available in Ollama."""
    pass


class EmbeddingValidationError(EmbeddingError):
    """Raised when embeddings fail dimension, finiteness, or consistency checks."""
    pass


class OllamaEmbeddingClient:
    """
    Robust HTTP client for Ollama embedding generation with validation.
    """

    def __init__(
        self,
        base_url: str = DEFAULT_OLLAMA_BASE_URL,
        model: str = DEFAULT_EMBEDDING_MODEL,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        batch_size: int = DEFAULT_BATCH_SIZE,
        http_client: Optional[httpx.Client] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self.batch_size = max(1, batch_size)
        self._http_client = http_client

    def _get_client(self) -> httpx.Client:
        if self._http_client is not None:
            return self._http_client
        return httpx.Client(timeout=self.timeout)

    @staticmethod
    def validate_vector(vector: Sequence[float], expected_dim: int = EXPECTED_EMBEDDING_DIM) -> None:
        """
        Validate that a vector has the required dimension and all values are finite numbers.
        """
        if not isinstance(vector, (list, tuple)):
            raise EmbeddingValidationError(f"Expected embedding vector to be a list/tuple, got {type(vector).__name__}")

        if len(vector) != expected_dim:
            raise EmbeddingValidationError(
                f"Embedding dimension mismatch: expected {expected_dim}, got {len(vector)}"
            )

        for i, val in enumerate(vector):
            if not isinstance(val, (int, float)) or isinstance(val, bool) or not math.isfinite(val):
                raise EmbeddingValidationError(
                    f"Vector contains non-finite or invalid numeric value at index {i}: {val!r}"
                )

    def embed_document_chunks(
        self,
        chunks: list[str],
        prefix: str = DOCUMENT_PREFIX,
    ) -> list[list[float]]:
        """
        Generate embeddings for a list of document chunk texts using bounded batching.

        Validates:
          - No chunk is empty or whitespace-only.
          - Number of returned vectors matches number of input chunks.
          - Every vector has exactly EXPECTED_EMBEDDING_DIM dimensions.
          - Every vector contains finite numeric values.
          - Network errors, timeouts, and missing models are handled safely.
        """
        if not chunks:
            return []

        # Validate that no chunk is empty or whitespace-only
        for idx, chunk in enumerate(chunks):
            if not isinstance(chunk, str) or not chunk.strip():
                raise EmbeddingValidationError(
                    f"Cannot embed empty or whitespace-only chunk at index {idx}."
                )

        all_embeddings: list[list[float]] = []
        embed_endpoint = f"{self.base_url}/api/embed"

        client = self._get_client()
        should_close = (self._http_client is None)

        try:
            # Process in bounded batches
            for i in range(0, len(chunks), self.batch_size):
                batch_texts = chunks[i : i + self.batch_size]
                prefixed_inputs = [f"{prefix}{text}" for text in batch_texts]

                payload = {
                    "model": self.model,
                    "input": prefixed_inputs,
                }

                try:
                    response = client.post(embed_endpoint, json=payload)
                except (httpx.ConnectError, httpx.ConnectTimeout) as err:
                    raise OllamaConnectionError(
                        f"Could not connect to Ollama at {self.base_url}. Ensure the service is running."
                    ) from err
                except httpx.TimeoutException as err:
                    raise OllamaConnectionError(
                        f"Ollama embedding request timed out after {self.timeout}s."
                    ) from err
                except httpx.RequestError as err:
                    raise OllamaConnectionError(
                        f"HTTP communication error with Ollama: {type(err).__name__}"
                    ) from err

                if response.status_code == 404:
                    raise OllamaModelNotFoundError(
                        f"Model '{self.model}' was not found in Ollama. "
                        f"Pull it using 'ollama pull {self.model}'."
                    )

                if response.status_code != 200:
                    raise EmbeddingError(
                        f"Ollama returned HTTP error {response.status_code}: {response.text[:200]}"
                    )

                try:
                    resp_json = response.json()
                except Exception as err:
                    raise EmbeddingError("Ollama returned invalid non-JSON response.") from err

                batch_embeddings = resp_json.get("embeddings")
                if not isinstance(batch_embeddings, list):
                    raise EmbeddingValidationError(
                        f"Ollama response missing 'embeddings' list: {resp_json}"
                    )

                if len(batch_embeddings) != len(batch_texts):
                    raise EmbeddingValidationError(
                        f"Ollama returned {len(batch_embeddings)} embeddings for a batch of {len(batch_texts)} chunks."
                    )

                for vec in batch_embeddings:
                    self.validate_vector(vec, expected_dim=EXPECTED_EMBEDDING_DIM)
                    all_embeddings.append(list(vec))

        finally:
            if should_close:
                client.close()

        return all_embeddings

    def embed_query(self, query: str) -> list[float]:
        """
        Generate an embedding vector for a single search query with search_query prefix.
        """
        if not isinstance(query, str) or not query.strip():
            raise EmbeddingValidationError("Cannot embed empty or whitespace-only query.")

        results = self.embed_document_chunks([query], prefix=QUERY_PREFIX)
        return results[0]


def get_embedding_client() -> OllamaEmbeddingClient:
    """Provide a standard instance of OllamaEmbeddingClient."""
    return OllamaEmbeddingClient()


def generate_embeddings(
    chunks: list[str],
    client: Optional[OllamaEmbeddingClient] = None,
) -> list[list[float]]:
    """
    Helper function to generate embeddings for chunks with input validation.
    """
    embedding_client = client or get_embedding_client()
    return embedding_client.embed_document_chunks(chunks)

