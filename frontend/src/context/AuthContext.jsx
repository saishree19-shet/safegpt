/**
 * AuthContext — global authentication state for CogniSec.
 *
 * Provides:
 *   - user       : UserResponse | null   current authenticated user
 *   - loading    : boolean               true while restoring session on mount
 *   - loginUser  : (email, password) => void
 *   - logoutUser : () => void
 *   - signupUser : (full_name, email, password) => UserResponse
 *
 * Session restoration:
 *   On mount, if a token exists in sessionStorage the context calls GET /auth/me
 *   to verify the token is still valid and retrieve fresh role/profile data.
 *   If the token is expired or invalid the session is cleared silently.
 *
 * Role trust:
 *   The role displayed/used for routing is ALWAYS the value returned by the
 *   backend /auth/me endpoint, never anything supplied by the frontend.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearToken, getToken, saveToken } from '../api/client';
import { getMe, login, signup } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until initial session check is done

  // ── Restore session on mount ───────────────────────────────────────────
  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await getMe();
        setUser(me);
      } catch {
        // Token is invalid or expired — clear it silently
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  // ── login ──────────────────────────────────────────────────────────────
  const loginUser = useCallback(async (email, password) => {
    const { access_token } = await login({ email, password });
    saveToken(access_token);
    // Fetch authoritative user profile (role comes from backend, not token decode)
    const me = await getMe();
    setUser(me);
    return me;
  }, []);

  // ── signup ─────────────────────────────────────────────────────────────
  const signupUser = useCallback(async (full_name, email, password) => {
    // Signup returns UserResponse (not a token) — user must log in after
    const newUser = await signup({ full_name, email, password });
    return newUser;
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────
  const logoutUser = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, signupUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

