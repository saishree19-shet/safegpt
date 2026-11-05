/**
 * Auth API service — thin wrappers around backend auth endpoints.
 * Returns the response data directly; throws axios errors for callers to handle.
 *
 * Endpoints verified against backend/app/routes/auth.py:
 *   POST /auth/signup   → UserResponse  (201)
 *   POST /auth/login    → TokenResponse (200)
 *   GET  /auth/me       → UserResponse  (200)
 */
import api from './client';

/**
 * Register a new employee account.
 * @param {{ full_name: string, email: string, password: string }} data
 * @returns {Promise<UserResponse>}
 */
export async function signup(data) {
  const res = await api.post('/auth/signup', data);
  return res.data; // UserResponse
}

/**
 * Authenticate an existing user and return the access token.
 * @param {{ email: string, password: string }} data
 * @returns {Promise<TokenResponse>}
 */
export async function login(data) {
  const res = await api.post('/auth/login', data);
  return res.data; // { access_token, token_type }
}

/**
 * Fetch the currently authenticated user's profile.
 * @returns {Promise<UserResponse>}
 */
export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data; // UserResponse
}

