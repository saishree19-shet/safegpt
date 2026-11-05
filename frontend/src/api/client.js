/**
 * Centralized Axios API client for CogniSec.
 *
 * Security decisions:
 * - JWT is stored in sessionStorage (not localStorage) so it is cleared when
 *   the browser tab/session closes and cannot be accessed cross-tab.
 * - The token is NEVER logged or exposed in error messages.
 * - Authorization header is injected per-request via interceptor.
 * - On 401 responses the session is cleared and the user is redirected to /login.
 */
import axios from 'axios';

const TOKEN_KEY = 'cognisec_session';

// ── Token helpers ──────────────────────────────────────────────────────────
export function saveToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // sessionStorage unavailable (private browsing, storage full) — silent fail;
    // the user will simply be unauthenticated on next request.
  }
}

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ── Axios instance ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',          // proxied by Vite to http://localhost:8000
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach Bearer token when present
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      // Only redirect if not already on an auth page to avoid redirect loops
      const isAuthPage =
        window.location.pathname === '/login' ||
        window.location.pathname === '/signup';
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

