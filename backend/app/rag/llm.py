"""
Local Ollama Chat Client for CogniSec RAG Answer Generation.

Provides robust, bounded HTTP communication with the local Ollama `/api/chat` endpoint.
Enforces:
- Local-only execution (no cloud fallbacks).
- Bounded timeouts (default 120s).
- Detailed exception classification (connection drop, missing model, generation error).
- Non-empty response validation.
- Zero logging of prompt text, document content, or confidential tokens.
"""

import logging
import os
from typing import Optional

import httpx

from app.rag.embeddings import OllamaConnectionError, OllamaModelNotFoundError
from app.rag.prompts import (
    COGNISEC_SYSTEM_PROMPT,
    STRUCTURED_SYSTEM_PROMPT,
    format_structured_user_prompt,
    format_user_prompt,
)

logger = logging.getLogger(__name__)

DEFAULT_OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_OLLAMA_CHAT_MODEL: str = os.getenv("OLLAMA_CHAT_MODEL", "llama3.2:1b")
DEFAULT_OLLAMA_TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "120.0"))


class LLMGenerationError(Exception):
    """Base exception for LLM response generation failures."""
    pass


class OllamaChatClient:
    """
    HTTP client for generating natural-language answers using a local Ollama chat model.
    """

    def __init__(
        self,
        base_url: str = DEFAULT_OLLAMA_BASE_URL,
        model: str = DEFAULT_OLLAMA_CHAT_MODEL,
        timeout: float = DEFAULT_OLLAMA_TIMEOUT,
        http_client: Optional[httpx.Client] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = max(5.0, timeout)
        self._http_client = http_client

    def _get_client(self) -> httpx.Client:
        if self._http_client is not None:
            return self._http_client
        return httpx.Client(timeout=self.timeout)

    def generate_answer(
        self,
        question: str,
        context_text: str,
        system_prompt: str = COGNISEC_SYSTEM_PROMPT,
        temperature: float = 0.1,
    ) -> str:
        """
        Send formatted messages to Ollama /api/chat and return the generated answer text.

        Args:
            question:      Natural-language user query.
            context_text:  Sanitized context string.
            system_prompt: Trusted system instructions.
            temperature:   Sampling temperature (default 0.1 for high factual grounding).

        Returns:
            The trimmed text of the generated answer.

        Raises:
            OllamaConnectionError: If Ollama service is unreachable or times out.
            OllamaModelNotFoundError: If the configured chat model is not installed.
            LLMGenerationError: If the model returns an empty or malformed response.
        """
        if not question or not question.strip():
            raise LLMGenerationError("Question must not be empty.")

        if not context_text or not context_text.strip():
            raise LLMGenerationError("Context text must not be empty for answer generation.")

        chat_endpoint = f"{self.base_url}/api/chat"
        if system_prompt == STRUCTURED_SYSTEM_PROMPT or "JSON" in system_prompt:
            user_message_content = format_structured_user_prompt(question, context_text)
        else:
            user_message_content = format_user_prompt(question, context_text)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message_content},
            ],
            "stream": False,
            "keep_alive": "15m",
            "options": {
                "temperature": temperature,
                "top_p": 0.9,
                "num_predict": 300,
            },
        }

        client = self._get_client()
        should_close = (self._http_client is None)

        try:
            try:
                response = client.post(chat_endpoint, json=payload)
            except (httpx.ConnectError, httpx.ConnectTimeout) as err:
                raise OllamaConnectionError(
                    f"Could not connect to local Ollama at {self.base_url}. Ensure Ollama is running."
                ) from err
            except httpx.TimeoutException as err:
                raise OllamaConnectionError(
                    f"Ollama chat generation request timed out after {self.timeout}s."
                ) from err
            except httpx.RequestError as err:
                raise OllamaConnectionError(
                    f"HTTP communication error with Ollama chat API: {type(err).__name__}"
                ) from err

            # Handle model missing
            if response.status_code == 404:
                raise OllamaModelNotFoundError(
                    f"Chat model '{self.model}' was not found in Ollama. "
                    f"Install it locally using 'ollama pull {self.model}'."
                )

            if response.status_code != 200:
                raise LLMGenerationError(
                    f"Ollama returned HTTP error {response.status_code}: {response.text[:150]}"
                )

            try:
                resp_json = response.json()
            except Exception as err:
                raise LLMGenerationError("Ollama returned invalid non-JSON response.") from err

            # Extract message content
            message = resp_json.get("message")
            if not isinstance(message, dict):
                raise LLMGenerationError(
                    f"Ollama response missing 'message' object: {resp_json}"
                )

            answer = message.get("content", "")
            if not isinstance(answer, str) or not answer.strip():
                raise LLMGenerationError("Ollama returned an empty answer content.")

            return answer.strip()

        finally:
            if should_close:
                client.close()


def get_chat_client() -> OllamaChatClient:
    """Provide a standard instance of OllamaChatClient reading from environment."""
    return OllamaChatClient(
        base_url=os.getenv("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL),
        model=os.getenv("OLLAMA_CHAT_MODEL", DEFAULT_OLLAMA_CHAT_MODEL),
        timeout=float(os.getenv("OLLAMA_TIMEOUT", str(DEFAULT_OLLAMA_TIMEOUT))),
    )

