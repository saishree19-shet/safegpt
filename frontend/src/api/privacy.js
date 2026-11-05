/**
 * Privacy API Service — communicates with backend /privacy endpoints.
 *
 * Endpoints:
 * - POST /privacy/analyze                       Analyze and sanitize text or document chunk
 * - GET  /privacy/documents/{document_id}/review Review document sanitized vs original chunks
 */
import api from './client';

/**
 * Request sensitive entity analysis and sanitization.
 * @param {{ document_id?: number, chunk_id?: number, text?: string }} data
 * @returns {Promise<AnalyzeResponse>}
 */
export async function analyzePrivacy(data) {
  const res = await api.post('/privacy/analyze', data);
  return res.data;
}

/**
 * Retrieve comprehensive privacy review for an authorized document.
 * @param {number} documentId
 * @returns {Promise<DocumentPrivacyReviewResponse>}
 */
export async function reviewDocumentPrivacy(documentId) {
  const res = await api.get(`/privacy/documents/${documentId}/review`);
  return res.data;
}

