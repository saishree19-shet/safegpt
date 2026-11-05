/**
 * AuditLogsTab — Security Audit Log Viewer for CogniSec Administrators (Step 7.4D).
 *
 * Requirements:
 * - Real API integration via GET /audit with supported query parameters:
 *   page, page_size, event_type, user_id.
 * - Displays verified fields: id, created_at, event_type, event_status, user_id,
 *   resource_type, resource_id, ip_address, and safe metadata from details.
 * - Server-side pagination with real total count from AuditLogListResponse.
 * - Client-side status and category filtering.
 * - Explicit exclusion of sensitive tokens, passwords, document text, and embeddings.
 * - Zero fabricated audit records or mock counters.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Lock,
  Clock,
  Search,
  Info,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { getAdminAuditLogs } from '../../api/audit';

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Event Types' },
  // Authentication
  { value: 'LOGIN_SUCCESS', label: 'LOGIN_SUCCESS' },
  { value: 'LOGIN_FAILURE', label: 'LOGIN_FAILURE' },
  { value: 'SIGNUP_SUCCESS', label: 'SIGNUP_SUCCESS' },
  { value: 'ACCOUNT_INACTIVE_ACCESS', label: 'ACCOUNT_INACTIVE_ACCESS' },
  // Documents & Permissions
  { value: 'DOCUMENT_UPLOAD', label: 'DOCUMENT_UPLOAD' },
  { value: 'DOCUMENT_READ', label: 'DOCUMENT_READ' },
  { value: 'DOCUMENT_PERMISSION_GRANTED', label: 'DOCUMENT_PERMISSION_GRANTED' },
  { value: 'DOCUMENT_PERMISSION_REVOKED', label: 'DOCUMENT_PERMISSION_REVOKED' },
  { value: 'UNAUTHORIZED_DOCUMENT_ACCESS', label: 'UNAUTHORIZED_DOCUMENT_ACCESS' },
  // Privacy
  { value: 'PRIVACY_ANALYSIS', label: 'PRIVACY_ANALYSIS' },
  { value: 'SANITIZATION_SUCCESS', label: 'SANITIZATION_SUCCESS' },
  { value: 'SANITIZATION_FAILURE', label: 'SANITIZATION_FAILURE' },
  { value: 'PRIVACY_REVIEW_ACCESS', label: 'PRIVACY_REVIEW_ACCESS' },
  // RAG / LLM
  { value: 'SEMANTIC_SEARCH', label: 'SEMANTIC_SEARCH' },
  { value: 'ANSWER_GENERATION_SUCCESS', label: 'ANSWER_GENERATION_SUCCESS' },
  { value: 'ANSWER_GENERATION_FAILURE', label: 'ANSWER_GENERATION_FAILURE' },
  { value: 'CITATION_VALIDATION_FAILURE', label: 'CITATION_VALIDATION_FAILURE' },
  { value: 'INSUFFICIENT_EVIDENCE', label: 'INSUFFICIENT_EVIDENCE' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
  { value: 'denied', label: 'Denied' },
  { value: 'warning', label: 'Warning' },
];

export default function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        page_size: pageSize,
      };
      if (eventTypeFilter) params.event_type = eventTypeFilter;
      if (userIdFilter.trim()) {
        const uid = parseInt(userIdFilter.trim(), 10);
        if (!isNaN(uid)) params.user_id = uid;
      }

      const res = await getAdminAuditLogs(params);
      setLogs(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Failed to retrieve audit logs from backend.');
    } finally {
      setLoading(false);
    }
  }, [page, eventTypeFilter, userIdFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Client-side status filter applied on current page items
  const displayedLogs = statusFilter
    ? logs.filter((l) => l.event_status === statusFilter)
    : logs;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function getStatusBadge(status) {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-mono font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>SUCCESS</span>
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 text-[10px] font-mono font-medium">
            <ShieldX className="w-3 h-3 text-red-600" />
            <span>DENIED</span>
          </span>
        );
      case 'failure':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[10px] font-mono font-medium">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>FAILURE</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-mono font-medium">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>WARNING</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-charcoal/70 text-[10px] font-mono">
            <span>{status || 'UNKNOWN'}</span>
          </span>
        );
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="pb-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-darkGreen">
            <Activity className="w-5 h-5 stroke-[2.2]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Security Audit Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal/60 mt-1">
            Immutable, server-recorded security events for access control, sanitization, and model queries.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200/90 text-xs font-medium text-charcoal/80 hover:text-darkGreen hover:border-darkGreen/40 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Security Allowlist Notice ──────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-cream/60 border border-beige/80 text-xs text-charcoal/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-sage shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-darkGreen block">
            Safe Metadata Logging Guarantee
          </span>
          <p className="leading-relaxed">
            CogniSec enforces an explicit server-side metadata allowlist before persisting audit
            records. Passwords, JWT tokens, document contents, and LLM query prompts are strictly
            excluded from audit storage by architectural design.
          </p>
        </div>
      </div>

      {/* ── Filters Toolbar ───────────────────────────────────────── */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-darkGreen">
          <Filter className="w-4 h-4 text-sage" />
          <span>Filter Audit Records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Event Type Filter (Backend query param) */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-charcoal/50 mb-1">
              Event Type
            </label>
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-charcoal focus:outline-none focus:border-darkGreen bg-white"
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (Client-side view filter) */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-charcoal/50 mb-1">
              Event Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-charcoal focus:outline-none focus:border-darkGreen bg-white"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* User ID Filter (Backend query param) */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-charcoal/50 mb-1">
              Actor User ID
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="e.g. 18"
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-charcoal focus:outline-none focus:border-darkGreen font-mono"
              />
              {userIdFilter && (
                <button
                  type="button"
                  onClick={() => setUserIdFilter('')}
                  className="absolute right-2.5 top-2.5 text-charcoal/40 hover:text-charcoal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchLogs}
            className="text-xs font-semibold underline hover:text-red-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading Skeleton ──────────────────────────────────────── */}
      {loading && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4 animate-pulse">
          <div className="h-4 bg-gray-100 rounded-md w-1/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-12 bg-gray-50 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* ── Audit Logs Table ──────────────────────────────────────── */}
      {!loading && !error && (
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-charcoal/60 font-semibold">
              <span>Verified Records</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-darkGreen">
                {total} total
              </span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-charcoal/50 font-mono text-[11px]">
                Page {page} of {totalPages}
              </span>
              <div className="inline-flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-charcoal hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-charcoal hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {displayedLogs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-charcoal/40 mx-auto flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-darkGreen">No Matching Audit Events</h3>
              <p className="text-xs text-charcoal/60 max-w-sm mx-auto">
                No security audit records match the current filter parameters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-mono uppercase tracking-wider text-charcoal/60">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp (UTC)</th>
                    <th className="px-5 py-3.5">Event Type</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Actor</th>
                    <th className="px-5 py-3.5">Resource</th>
                    <th className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {displayedLogs.map((log) => {
                    const utcDate = new Date(log.created_at).toISOString().replace('T', ' ').slice(0, 19);

                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-charcoal/70 whitespace-nowrap">
                          {utcDate}
                        </td>

                        <td className="px-5 py-3.5 font-semibold text-darkGreen whitespace-nowrap">
                          {log.event_type}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {getStatusBadge(log.event_status)}
                        </td>

                        <td className="px-5 py-3.5 text-charcoal/80 whitespace-nowrap">
                          {log.user_id !== null && log.user_id !== undefined ? (
                            <span className="inline-flex items-center gap-1 text-darkGreen">
                              <User className="w-3 h-3 text-sage" />
                              <span>User #{log.user_id}</span>
                            </span>
                          ) : (
                            <span className="text-charcoal/40 italic font-sans text-xs">
                              Unauthenticated
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-charcoal/70 whitespace-nowrap">
                          {log.resource_type ? (
                            <span className="capitalize">
                              {log.resource_type}
                              {log.resource_id !== null && log.resource_id !== undefined ? (
                                <span className="text-darkGreen font-semibold ml-1">
                                  #{log.resource_id}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-charcoal/30">—</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap font-sans">
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-charcoal/70 hover:text-darkGreen hover:border-darkGreen/40 bg-white text-xs font-medium transition-colors cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-sage" />
                              <span>Inspect</span>
                            </button>
                          ) : (
                            <span className="text-charcoal/30 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Metadata Inspection Modal ─────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200/90 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-darkGreen">
                <ShieldCheck className="w-4 h-4 text-sage" />
                <h3 className="text-sm font-semibold">Audit Event Metadata #{selectedLog.id}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-charcoal/40 hover:text-charcoal hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 font-mono text-[11px]">
                <div>
                  <span className="text-charcoal/50 block text-[10px] uppercase">EVENT TYPE</span>
                  <span className="font-semibold text-darkGreen">{selectedLog.event_type}</span>
                </div>
                <div>
                  <span className="text-charcoal/50 block text-[10px] uppercase">STATUS</span>
                  <span className="capitalize">{selectedLog.event_status}</span>
                </div>
                <div>
                  <span className="text-charcoal/50 block text-[10px] uppercase">ACTOR</span>
                  <span>{selectedLog.user_id ? `User #${selectedLog.user_id}` : 'Unauthenticated'}</span>
                </div>
                <div>
                  <span className="text-charcoal/50 block text-[10px] uppercase">IP ADDRESS</span>
                  <span>{selectedLog.ip_address || 'Not recorded'}</span>
                </div>
              </div>

              {/* Safe Metadata Key-Value Display */}
              <div>
                <span className="text-[10px] font-mono uppercase text-charcoal/50 block mb-2 font-medium">
                  Allowlisted Metadata Key-Values:
                </span>
                <div className="rounded-xl border border-gray-200 p-3 bg-white font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto">
                  {Object.entries(selectedLog.details || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between border-b border-gray-50 pb-1">
                      <span className="text-charcoal/60">{key}:</span>
                      <span className="font-semibold text-darkGreen">
                        {typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-mint-50/60 border border-mint-border/60 text-[11px] text-darkGreen leading-relaxed font-sans">
                ✓ Confidential payload elements (passwords, tokens, document text, and embeddings)
                are strictly excluded by server allowlist rules.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-charcoal text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

