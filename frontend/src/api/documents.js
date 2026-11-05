/**
 * Documents API Service — communicates with backend /documents endpoints.
 *
 * Endpoints:
 * - GET  /documents                List authorized documents
 * - POST /documents/upload         Upload PDF or DOCX file
 * - GET  /documents/{id}           Get safe document metadata
 * - GET  /documents/{id}/text      Get extracted text pages (authorized only)
 * - GET  /documents/{id}/chunks    Get chunk metadata
 */
import api from './client';

/**
 * Fetch all documents the current user has access to.
 * Returns DocumentResponse[]
 */
export async function listDocuments() {
  const res = await api.get('/documents');
  return res.data;
}

/**
 * Upload a document file (PDF or DOCX).
 * @param {File} file
 * @param {(progress: number) => void} [onProgress]
 * @returns {Promise<DocumentUploadResponse>}
 */
export async function uploadDocument(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // uploads & embedding can take time
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return res.data;
}

/**
 * Retrieve safe metadata for a specific document.
 * @param {number} documentId
 * @returns {Promise<DocumentDetailResponse>}
 */
export async function getDocument(documentId) {
  const res = await api.get(`/documents/${documentId}`);
  return res.data;
}

/**
 * Retrieve authorized extracted text pages for a document.
 * @param {number} documentId
 * @returns {Promise<DocumentTextResponse>}
 */
export async function getDocumentText(documentId) {
  const res = await api.get(`/documents/${documentId}/text`);
  return res.data;
}

/**
 * Grant read access to a document for a user (by user_id or email).
 * @param {number} documentId
 * @param {{ user_id?: number, email?: string, can_read?: boolean }} data
 * @returns {Promise<DocumentPermissionResponse>}
 */
export async function grantPermission(documentId, data) {
  const res = await api.post(`/documents/${documentId}/permissions`, data);
  return res.data;
}

/**
 * Revoke document access permission for a user.
 * @param {number} documentId
 * @param {number} userId
 * @returns {Promise<ActionMessageResponse>}
 */
export async function revokePermission(documentId, userId) {
  const res = await api.delete(`/documents/${documentId}/permissions/${userId}`);
  return res.data;
}


