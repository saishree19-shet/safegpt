/**
 * LoginPage — Role-based login connected to POST /auth/login and GET /auth/me.
 *
 * Role selection:
 * - Employee (Icon: User) → routes to /employee upon verified employee role.
 * - Administrator (Icon: ShieldCheck) → routes to /admin upon verified admin role.
 *
 * Zero-Trust Verification:
 * 1. Authenticate credentials via backend POST /auth/login.
 * 2. Retrieve authoritative profile via GET /auth/me.
 * 3. Verify actual backend role matches selected portal role.
 * 4. If mismatch occurs, clear session and display an explicit error.
 *    The frontend NEVER trusts or elevates the user's role.
 */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Shield, ShieldCheck, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';

export default function LoginPage() {
  const { loginUser, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState(ROLES.EMPLOYEE.id);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  function validate() {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Please enter a valid work email address.';
    if (!password) errs.password = 'Password is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Authenticate credentials & retrieve verified user from backend
      const user = await loginUser(email.trim(), password);

      // 2. Authoritative role verification
      if (user.role !== selectedRole) {
        // Discard session to prevent unauthorized role holding
        logoutUser();

        if (selectedRole === ROLES.ADMIN.id && user.role === ROLES.EMPLOYEE.id) {
          setError(
            'Access restricted: This account has Employee permissions only. Please select the Employee portal to sign in.'
          );
        } else if (selectedRole === ROLES.EMPLOYEE.id && user.role === ROLES.ADMIN.id) {
          setError(
            'Portal mismatch: This account has Administrator privileges. Please select the Administrator portal to sign in.'
          );
        } else {
          setError(
            `Access denied: Your account role (${user.role}) is not authorised for the ${
              selectedRole === ROLES.ADMIN.id ? 'Administrator' : 'Employee'
            } portal.`
          );
        }
        return;
      }

      // 3. Matching role confirmed by backend — redirect to corresponding dashboard
      const destination =
        from && from !== '/login' && from !== '/signup'
          ? from
          : user.role === ROLES.ADMIN.id
          ? ROLES.ADMIN.route
          : ROLES.EMPLOYEE.route;

      navigate(destination, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 429) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else if (status === 401) {
        setError(detail || 'Invalid email or password.');
      } else if (status >= 500) {
        setError('A server error occurred. Please try again shortly.');
      } else {
        setError(detail || 'Login failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFDFB] flex flex-col justify-between p-6 sm:p-10 font-sans">
      {/* Top nav */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-charcoal/70 hover:text-darkGreen transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CogniSec</span>
        </Link>
      </div>

      {/* Main card */}
      <div className="max-w-xl w-full mx-auto bg-white border border-gray-200/80 rounded-2xl p-7 sm:p-10 shadow-sm my-8">
        {/* Brand header */}
        <div className="flex items-center gap-2.5 text-darkGreen mb-6">
          <div className="w-8 h-8 rounded-lg bg-mint-100 border border-mint-border flex items-center justify-center">
            <Shield className="w-5 h-5 text-darkGreen stroke-[2.2]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-darkGreen">CogniSec</span>
        </div>

        <h1 className="text-2xl font-bold text-darkGreen tracking-tight">Enterprise Sign In</h1>
        <p className="text-sm text-charcoal/70 mt-1 mb-6">
          Select your portal role and enter your enterprise credentials.
        </p>

        {/* Role Selector */}
        <div className="mb-7">
          <label className="block text-xs font-mono uppercase tracking-wider text-charcoal/70 font-medium mb-2.5">
            Select Portal Role
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Employee card */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole(ROLES.EMPLOYEE.id);
                setError('');
              }}
              className={`relative text-left p-4 rounded-xl border transition-all cursor-pointer ${
                selectedRole === ROLES.EMPLOYEE.id
                  ? 'border-darkGreen bg-mint-100/50 shadow-xs ring-1 ring-darkGreen'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedRole === ROLES.EMPLOYEE.id
                      ? 'bg-darkGreen text-white'
                      : 'bg-gray-100 text-charcoal/60'
                  }`}
                >
                  <User className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                    selectedRole === ROLES.EMPLOYEE.id
                      ? 'bg-darkGreen/10 text-darkGreen font-semibold'
                      : 'bg-gray-100 text-charcoal/50'
                  }`}
                >
                  Workspace
                </span>
              </div>
              <p className="text-sm font-semibold text-darkGreen mb-0.5">Employee</p>
              <p className="text-xs text-charcoal/60 leading-relaxed">
                Access your organisation's knowledge workspace.
              </p>
            </button>

            {/* Administrator card */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole(ROLES.ADMIN.id);
                setError('');
              }}
              className={`relative text-left p-4 rounded-xl border transition-all cursor-pointer ${
                selectedRole === ROLES.ADMIN.id
                  ? 'border-darkGreen bg-mint-100/50 shadow-xs ring-1 ring-darkGreen'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedRole === ROLES.ADMIN.id
                      ? 'bg-darkGreen text-white'
                      : 'bg-gray-100 text-charcoal/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                    selectedRole === ROLES.ADMIN.id
                      ? 'bg-darkGreen/10 text-darkGreen font-semibold'
                      : 'bg-gray-100 text-charcoal/50'
                  }`}
                >
                  Security
                </span>
              </div>
              <p className="text-sm font-semibold text-darkGreen mb-0.5">Administrator</p>
              <p className="text-xs text-charcoal/60 leading-relaxed">
                Manage users, documents, permissions and security activities.
              </p>
            </button>
          </div>
        </div>

        {/* Global error banner */}
        {error && (
          <div
            role="alert"
            className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Work Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-mono uppercase tracking-wider text-charcoal/70 font-medium mb-1.5"
            >
              Work Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={
                selectedRole === ROLES.ADMIN.id ? 'admin@company.com' : 'employee@company.com'
              }
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
              }}
              disabled={loading}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 transition-all disabled:opacity-60 ${
                fieldErrors.email
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                  : 'border-gray-200 focus:border-darkGreen focus:ring-darkGreen'
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-mono uppercase tracking-wider text-charcoal/70 font-medium"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
                }}
                disabled={loading}
                className={`w-full px-3.5 py-2.5 pr-11 rounded-lg border text-sm focus:outline-none focus:ring-1 transition-all disabled:opacity-60 ${
                  fieldErrors.password
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                    : 'border-gray-200 focus:border-darkGreen focus:ring-darkGreen'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/70 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-darkGreen text-white rounded-lg py-3 text-sm font-medium hover:bg-darkGreen/90 transition-all shadow-xs mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying credentials…</span>
              </>
            ) : (
              <span>Sign in as {selectedRole === ROLES.ADMIN.id ? 'Administrator' : 'Employee'}</span>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-charcoal/60">
          <span>New to CogniSec?</span>
          <Link to="/signup" className="text-darkGreen font-semibold hover:underline">
            Register as Employee
          </Link>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-mono text-sage">
          <Lock className="w-3 h-3" />
          <span>Role authorisation strictly validated by backend</span>
        </div>
      </div>

      {/* Page footer */}
      <div className="text-center text-xs text-charcoal/50">
        © 2026 CogniSec. Intelligence, Without Exposure.
      </div>
    </div>
  );
}
