/**
 * SignupPage — employee registration connected to POST /auth/signup.
 *
 * Backend schema (SignupRequest):
 *   full_name : string (min 2, max 150)
 *   email     : EmailStr
 *   password  : string (min 8, max 128)
 *
 * Security:
 * - Role is ALWAYS assigned as "employee" by the backend — no role field sent.
 * - Confirm password is frontend-only validation and is NEVER sent to the API.
 * - Passwords are never logged.
 * - After successful registration the user is redirected to login (not auto-logged in).
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signupUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function set(field) {
    return (e) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      if (fieldErrors[field]) setFieldErrors((p) => ({ ...p, [field]: '' }));
    };
  }

  function validate() {
    const errs = {};
    const name = form.full_name.trim();
    if (!name) errs.full_name = 'Full name is required.';
    else if (name.length < 2) errs.full_name = 'Full name must be at least 2 characters.';
    else if (name.length > 150) errs.full_name = 'Full name must be 150 characters or fewer.';

    const email = form.email.trim();
    if (!email) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Please enter a valid email address.';

    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.';
    else if (form.password.length > 128)
      errs.password = 'Password must be 128 characters or fewer.';

    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await signupUser(form.full_name.trim(), form.email.trim(), form.password);
      setSuccess(true);
      // Redirect to login after short delay so user sees the success message
      setTimeout(() => navigate('/login', { replace: true }), 2200);
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 409) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (status === 422) {
        // Pydantic validation error — extract first message
        const firstMsg = err.response?.data?.detail?.[0]?.msg;
        setError(firstMsg || 'Please check your inputs and try again.');
      } else if (status >= 500) {
        setError('A server error occurred. Please try again shortly.');
      } else {
        setError(detail || 'Registration failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white border border-slate-200/90 rounded-2xl p-10 shadow-card">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 mb-5 shadow-2xs">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 stroke-[2]" />
          </div>
          <h2 className="text-2xl font-extrabold text-darkGreen tracking-tight">Account created successfully</h2>
          <p className="text-sm text-charcoal-600 mt-2 leading-relaxed font-normal">
            Your employee account has been registered. Redirecting you to sign in…
          </p>
          <div className="mt-6 w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col justify-between p-6 sm:p-10 font-sans">
      {/* Top nav */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-charcoal-600 hover:text-darkGreen transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CogniSec</span>
        </Link>
      </div>

      {/* Card */}
      <div className="max-w-md w-full mx-auto bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-card my-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 text-darkGreen mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-darkGreen text-white flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-darkGreen">CogniSec</span>
        </div>

        <h1 className="text-2xl font-extrabold text-darkGreen tracking-tight">Get Started</h1>
        <p className="text-sm text-charcoal-500 mt-1 mb-8 font-medium">
          Create your employee account to query company documents within your verified role permissions.
        </p>

        {/* Global error banner */}
        {error && (
          <div
            role="alert"
            className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-xs font-mono uppercase tracking-wider text-charcoal-700 font-bold mb-1.5"
            >
              Full Name
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              placeholder="Alex Johnson"
              value={form.full_name}
              onChange={set('full_name')}
              disabled={loading}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60 text-charcoal-900 ${
                fieldErrors.full_name
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-200 focus:border-emerald-600'
              }`}
            />
            {fieldErrors.full_name && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="signup_email"
              className="block text-xs font-mono uppercase tracking-wider text-charcoal-700 font-bold mb-1.5"
            >
              Work Email
            </label>
            <input
              id="signup_email"
              type="email"
              autoComplete="email"
              placeholder="alex@company.com"
              value={form.email}
              onChange={set('email')}
              disabled={loading}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60 text-charcoal-900 ${
                fieldErrors.email
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-200 focus:border-emerald-600'
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="signup_password"
              className="block text-xs font-mono uppercase tracking-wider text-charcoal-700 font-bold mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup_password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set('password')}
                disabled={loading}
                className={`w-full px-3.5 py-2.5 pr-11 rounded-xl border text-sm font-medium bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60 text-charcoal-900 ${
                  fieldErrors.password
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 focus:border-emerald-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirm_password"
              className="block text-xs font-mono uppercase tracking-wider text-charcoal-700 font-bold mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                disabled={loading}
                className={`w-full px-3.5 py-2.5 pr-11 rounded-xl border text-sm font-medium bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60 text-charcoal-900 ${
                  fieldErrors.confirmPassword
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 focus:border-emerald-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 transition-colors p-1 cursor-pointer"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-darkGreen text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-darkGreen-800 transition-all shadow-sm hover:shadow-md mt-3 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:translate-y-0"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating account…</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-charcoal-500">
          <span>Already registered?</span>
          <Link to="/login" className="text-emerald-700 font-bold hover:text-emerald-800 hover:underline">
            Sign in
          </Link>
        </div>

        {/* Security note */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-800 font-semibold text-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Default employee role assigned · Zero-trust role enforcement</span>
        </div>
      </div>

      {/* Page footer */}
      <div className="text-center text-xs text-charcoal-400 font-mono">
        © 2026 CogniSec. Intelligence, Without Exposure.
      </div>
    </div>
  );
}
