/**
 * Audit API Service — communicates with backend /audit endpoints.
 *
 * Endpoints:
 * - GET /audit       Administrator-only: view all audit events with filtering and pagination
 * - GET /audit/me    Employee: view own audit history
 */
import api from './client';

/**
 * Fetch paginated audit logs for administrators.
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.page_size=50]
 * @param {string} [params.event_type]
 * @param {number} [params.user_id]
 * @param {string} [params.start_date] ISO string
 * @param {string} [params.end_date] ISO string
 * @returns {Promise<{ total: number, page: number, page_size: number, items: Array }>}
 */
export async function getAdminAuditLogs(params = {}) {
  const cleanParams = {};
  if (params.page) cleanParams.page = params.page;
  if (params.page_size) cleanParams.page_size = params.page_size;
  if (params.event_type) cleanParams.event_type = params.event_type;
  if (params.user_id !== undefined && params.user_id !== null && params.user_id !== '') {
    cleanParams.user_id = params.user_id;
  }
  if (params.start_date) cleanParams.start_date = params.start_date;
  if (params.end_date) cleanParams.end_date = params.end_date;

  const res = await api.get('/audit', { params: cleanParams });
  return res.data;
}

/**
 * Fetch personal audit history for the current authenticated user.
 * @param {Object} [params]
 * @returns {Promise<{ total: number, page: number, page_size: number, items: Array }>}
 */
export async function getMyAuditLogs(params = {}) {
  const res = await api.get('/audit/me', { params });
  return res.data;
}

