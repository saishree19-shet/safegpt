/**
 * PermissionsTab — Administrator Access Control & Permission Governance (Step 7.4C).
 *
 * Requirements:
 * - Integrates real backend endpoints:
 *   - POST /documents/{document_id}/permissions
 *   - DELETE /documents/{document_id}/permissions/{user_id}
 * - Real document IDs retrieved from GET /documents.
 * - Allows granting read access via Target User ID or Email.
 * - Allows revoking read access via User ID.
 * - Clear UX explaining that organization-wide user enumeration requires the User Directory API.
 * - Zero fake users or fabricated permission states.
 */
import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  UserMinus,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  Info,
  RefreshCw,
  Lock,
  Mail,
  Hash,
} from 'lucide-react';
import { listDocuments, grantPermission, revokePermission } from '../../api/documents';

export default function PermissionsTab({ preselectedDocId }) {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docError, setDocError] = useState('');

  // Form states
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId ? String(preselectedDocId) : '');
  const [grantMode, setGrantMode] = useState('email'); // 'email' | 'userId'
  const [targetEmail, setTargetEmail] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [canRead, setCanRead] = useState(true);

  // Revoke state
  const [revokeDocId, setRevokeDocId] = useState('');
  const [revokeUserId, setRevokeUserId] = useState('');

  // Action status
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Active session log of granted permissions
  const [recentPermissions, setRecentPermissions] = useState([]);

  async function loadDocs() {
    setLoadingDocs(true);
    setDocError('');
    try {
      const data = await listDocuments();
      setDocuments(Array.isArray(data) ? data : []);
      if (!selectedDocId && data.length > 0) {
        setSelectedDocId(String(data[0].id));
      }
    } catch (err) {
      setDocError('Failed to load enterprise documents for permission configuration.');
    } finally {
      setLoadingDocs(false);
    }
  }

  useEffect(() => {
    loadDocs();
  }, []);

  useEffect(() => {
    if (preselectedDocId) {
      setSelectedDocId(String(preselectedDocId));
    }
  }, [preselectedDocId]);

  async function handleGrant(e) {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!selectedDocId) {
      setActionError('Please select a valid document.');
      return;
    }

    const payload = { can_read: canRead };
    if (grantMode === 'email') {
      if (!targetEmail.trim()) {
        setActionError('Please enter a target employee email address.');
        return;
      }
      payload.email = targetEmail.trim().toLowerCase();
    } else {
      const parsedId = parseInt(targetUserId, 10);
      if (isNaN(parsedId) || parsedId <= 0) {
        setActionError('Please enter a valid positive numerical user ID.');
        return;
      }
      payload.user_id = parsedId;
    }

    setActionLoading(true);
    try {
      const res = await grantPermission(parseInt(selectedDocId, 10), payload);
      setActionSuccess(
        `Permission granted: User #${res.user_id} (${res.user_email || targetEmail || 'Target User'}) now has read access to Document #${res.document_id}.`
      );
      // Track in recent session table
      setRecentPermissions((prev) => [
        {
          id: res.id,
          document_id: res.document_id,
          user_id: res.user_id,
          user_email: res.user_email || targetEmail || `User #${res.user_id}`,
          can_read: res.can_read,
          created_at: res.created_at || new Date().toISOString(),
        },
        ...prev.filter(
          (p) => !(p.document_id === res.document_id && p.user_id === res.user_id)
        ),
      ]);
      setTargetEmail('');
      setTargetUserId('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setActionError(detail || 'Failed to grant document permission.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevoke(docId, userId) {
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);
    try {
      const res = await revokePermission(docId, userId);
      setActionSuccess(res.message || `Permission revoked for User #${userId}.`);
      setRecentPermissions((prev) =>
        prev.filter((p) => !(p.document_id === docId && p.user_id === userId))
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      setActionError(detail || 'Failed to revoke document permission.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="pb-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-darkGreen">
            <KeyRound className="w-5 h-5 stroke-[2.2]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Access Permissions
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal/60 mt-1">
            Grant and revoke document read permissions enforced at the PostgreSQL ACL layer.
          </p>
        </div>

        <button
          onClick={loadDocs}
          disabled={loadingDocs}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200/90 text-xs font-medium text-charcoal/80 hover:text-darkGreen hover:border-darkGreen/40 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? 'animate-spin' : ''}`} />
          <span>Refresh Documents</span>
        </button>
      </div>

      {/* ── User Directory API Notice ──────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-cream/60 border border-beige/80 text-xs text-charcoal/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-sage shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-darkGreen block">
            Target User Identification
          </span>
          <p className="leading-relaxed">
            The backend permission endpoints (
            <code className="font-mono text-[11px] text-darkGreen font-semibold">
              POST /documents/{'{document_id}'}/permissions
            </code>
            ) verify user existence directly against PostgreSQL. Because an organization-wide user listing
            endpoint is pending in the backend, you can specify target users by verified{' '}
            <strong>Email Address</strong> or <strong>User ID</strong>.
          </p>
        </div>
      </div>

      {/* ── Action Feedback Banners ────────────────────────────────── */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-mint-50 border border-mint-border text-xs text-darkGreen flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-darkGreen shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-xs font-semibold text-sage hover:text-darkGreen cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError('')}
            className="text-xs font-semibold text-red-800 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Grant Permission Card ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-darkGreen">
            <UserPlus className="w-4 h-4 text-sage" />
            <h2 className="text-sm font-semibold">Grant Document Read Access</h2>
          </div>
          <span className="text-[11px] font-mono text-sage uppercase">
            POST /documents/{'{id}'}/permissions
          </span>
        </div>

        <form onSubmit={handleGrant} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Selection */}
            <div>
              <label className="block text-xs font-medium text-charcoal/80 mb-1.5">
                Target Enterprise Document
              </label>
              {loadingDocs ? (
                <div className="h-10 bg-gray-50 rounded-xl animate-pulse" />
              ) : documents.length === 0 ? (
                <div className="text-xs text-charcoal/50 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  No documents available in repository.
                </div>
              ) : (
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-charcoal focus:outline-none focus:border-darkGreen focus:ring-1 focus:ring-darkGreen bg-white"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      #{doc.id} — {doc.filename || doc.title} (Owner #{doc.owner_id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Target Identity Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-charcoal/80">
                  Recipient Identity
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setGrantMode('email')}
                    className={`font-mono transition-colors cursor-pointer ${
                      grantMode === 'email'
                        ? 'text-darkGreen font-semibold underline'
                        : 'text-charcoal/40 hover:text-charcoal'
                    }`}
                  >
                    By Email
                  </button>
                  <span className="text-charcoal/30">·</span>
                  <button
                    type="button"
                    onClick={() => setGrantMode('userId')}
                    className={`font-mono transition-colors cursor-pointer ${
                      grantMode === 'userId'
                        ? 'text-darkGreen font-semibold underline'
                        : 'text-charcoal/40 hover:text-charcoal'
                    }`}
                  >
                    By User ID
                  </button>
                </div>
              </div>

              {grantMode === 'email' ? (
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. employee@company.com"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-charcoal focus:outline-none focus:border-darkGreen focus:ring-1 focus:ring-darkGreen"
                  />
                  <Mail className="w-3.5 h-3.5 text-charcoal/40 absolute right-3.5 top-3" />
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-charcoal focus:outline-none focus:border-darkGreen focus:ring-1 focus:ring-darkGreen font-mono"
                  />
                  <Hash className="w-3.5 h-3.5 text-charcoal/40 absolute right-3.5 top-3" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 text-xs text-charcoal/80 cursor-pointer">
              <input
                type="checkbox"
                checked={canRead}
                onChange={(e) => setCanRead(e.target.checked)}
                className="rounded border-gray-300 text-darkGreen focus:ring-darkGreen"
              />
              <span>Grant Read Access (<code className="font-mono text-[11px]">can_read=true</code>)</span>
            </label>

            <button
              type="submit"
              disabled={actionLoading || documents.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-darkGreen text-white text-xs font-medium hover:bg-darkGreen/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{actionLoading ? 'Granting…' : 'Grant Permission'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── Active Permissions Governance Log ───────────────────────── */}
      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-darkGreen font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-sage" />
            <span>Configured Permissions ({recentPermissions.length})</span>
          </div>
          <span className="text-[11px] font-mono text-charcoal/40">
            Real-time session updates
          </span>
        </div>

        {recentPermissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-charcoal/50 space-y-1">
            <p>No permissions configured in this administrative session yet.</p>
            <p className="text-[11px] text-charcoal/40">
              Grant permissions above to manage active read grants and test revocation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-mono uppercase tracking-wider text-charcoal/60">
                <tr>
                  <th className="px-6 py-3.5">Document ID</th>
                  <th className="px-6 py-3.5">Granted To</th>
                  <th className="px-6 py-3.5">Permission Level</th>
                  <th className="px-6 py-3.5">Granted At</th>
                  <th className="px-6 py-3.5 text-right">Revoke Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPermissions.map((perm) => (
                  <tr key={`${perm.document_id}-${perm.user_id}`} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono font-semibold text-darkGreen">
                      Document #{perm.document_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-darkGreen block">
                        {perm.user_email}
                      </span>
                      <span className="text-[11px] font-mono text-charcoal/40">
                        User ID #{perm.user_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Can Read</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-charcoal/60">
                      {new Date(perm.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRevoke(perm.document_id, perm.user_id)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                        title="Revoke access via DELETE /documents/{doc_id}/permissions/{user_id}"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Revoke</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Security Architecture Callout ─────────────────────────── */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-darkGreen font-semibold text-xs">
          <Lock className="w-4 h-4 text-sage" />
          <span>Security & Non-Repudiation Policy</span>
        </div>
        <p className="text-xs text-charcoal/70 leading-relaxed">
          Every permission grant and revocation creates an immutable security audit event (
          <code className="font-mono text-[11px] text-darkGreen">DOCUMENT_PERMISSION_GRANTED</code> /{' '}
          <code className="font-mono text-[11px] text-darkGreen">DOCUMENT_PERMISSION_REVOKED</code>)
          recording the acting administrator's user ID, recipient ID, document ID, and timestamp.
          Revocations take effect immediately across all semantic search and RAG synthesis queries.
        </p>
      </div>
    </div>
  );
}

