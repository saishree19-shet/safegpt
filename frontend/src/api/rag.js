/**
 * RAG API Service — communicates with backend /rag endpoints.
 *
 * Endpoints:
 * - POST /rag/answer  Generate natural-language answer with citation validation
 * - POST /rag/search  Perform semantic search over authorized chunks
 */
import api from './client';

/**
 * Ask a natural language question over authorized documents.
 * @param {string} question
 * @param {number} [topK=5]
 * @param {number|null} [similarityThreshold=null]
 * @returns {Promise<AnswerResponse>}
 */
export async function askQuestion(question, topK = 4, similarityThreshold = null) {
  const payload = {
    question: question.trim(),
    top_k: topK,
  };
  if (similarityThreshold !== null && similarityThreshold !== undefined) {
    payload.similarity_threshold = similarityThreshold;
  }

  const res = await api.post('/rag/answer', payload, {
    timeout: 90000, // Ollama generation may take up to 60-90s
  });
  return res.data;
}

/**
 * Search authorized document chunks by semantic similarity.
 * @param {string} query
 * @param {number} [topK=5]
 * @param {number|null} [similarityThreshold=null]
 * @returns {Promise<SearchResponse>}
 */
export async function semanticSearch(query, topK = 5, similarityThreshold = null) {
  const payload = {
    query: query.trim(),
    top_k: topK,
  };
  if (similarityThreshold !== null && similarityThreshold !== undefined) {
    payload.similarity_threshold = similarityThreshold;
  }

  const res = await api.post('/rag/search', payload, {
    timeout: 30000,
  });
  return res.data;
}

