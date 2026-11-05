/**
 * DocumentsTab — Admin Enterprise Document Management for CogniSec (Step 7.4C).
 *
 * Requirements:
 * - Uses ONLY real backend data from GET /documents.
 * - Displays verified fields: id, filename, owner_id, status, created_at, is_owner, can_read.
 * - Inspects document metadata strictly via GET /documents/{id}.
 * - Respects zero-trust ACL: admin role alone does not bypass document text restrictions.
 * - Loading, empty, error, and refresh states.
 * - No fake documents or fabricated statistics.
 */
import React, { useState, useEffect } from 'react';
import {
  FileText,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  Info,
  CheckCircle2,
  X,
  Lock,
  Eye,
  FileCode,
} from 'lucide-react';
import { listDocuments, getDocument } from '../../api/documents';

export default function DocumentsTab({ onManagePermissions }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  async function loadDocuments() {
    setLoading(true);
    setError('');
    try {
      const data = await listDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Failed to load enterprise documents from backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleInspect(docId) {
    setDetailLoading(true);
    setDetailError('');
    setSelectedDoc(null);
    try {
      const detail = await getDocument(docId);
      setSelectedDoc(detail);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setDetailError(detail || 'Failed to retrieve document metadata from backend.');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="pb-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-darkGreen">
            <FileText className="w-5 h-5 stroke-[2.2]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Document Governance
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal/60 mt-1">
            Enterprise document repository, processing status, and verified ownership records.
          </p>
        </div>

        <button
          onClick={loadDocuments}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200/90 text-xs font-medium text-charcoal/80 hover:text-darkGreen hover:border-darkGreen/40 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Zero-Trust Access Boundary Banner ──────────────────────── */}
      <div className="p-4 rounded-2xl bg-cream/60 border border-beige/80 text-xs text-charcoal/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-sage shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-darkGreen block">
            Zero-Trust Administrative Boundary
          </span>
          <p className="leading-relaxed">
            Administrators can govern metadata and configure access permissions across enterprise
            files via <code className="font-mono text-[11px] text-darkGreen font-semibold">GET /documents</code>.
            However, an administrator role alone does not grant automatic access to read confidential document text
            without explicit ownership or a granted permission record.
          </p>
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
            onClick={loadDocuments}
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
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-gray-50 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* ── Document Table ────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-charcoal/60 font-semibold">
              Repository Documents ({documents.length})
            </span>
            <span className="text-[11px] font-mono text-charcoal/40">
              Verified records via GET /documents
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-charcoal/40 mx-auto flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-darkGreen">No Documents Found</h3>
              <p className="text-xs text-charcoal/60 max-w-sm mx-auto">
                No enterprise documents have been uploaded to the backend repository yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-mono uppercase tracking-wider text-charcoal/60">
                  <tr>
                    <th className="px-6 py-3.5">Document</th>
                    <th className="px-6 py-3.5">Owner ID</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Uploaded</th>
                    <th className="px-6 py-3.5">Text Access</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {documents.map((doc) => {
                    const formattedDate = doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—';

                    return (
                      <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen shrink-0">
                              <FileText className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-darkGreen block truncate max-w-xs sm:max-w-md">
                                {doc.filename || doc.title || `Document #${doc.id}`}
                              </span>
                              <span className="text-[11px] text-charcoal/40 font-mono block">
                                ID: #{doc.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-charcoal/70">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3 text-sage" />
                            <span>User #{doc.owner_id}</span>
                            {doc.is_owner && (
                              <span className="text-[10px] text-darkGreen font-semibold ml-1">
                                (You)
                              </span>
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono capitalize">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {doc.status || 'Active'}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono text-charcoal/60">
                          {formattedDate}
                        </td>

                        <td className="px-6 py-4">
                          {doc.can_read ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Authorized</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Restricted</span>
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleInspect(doc.id)}
                              className="px-2.5 py-1 rounded-lg border border-gray-200 text-charcoal/70 hover:text-darkGreen hover:border-darkGreen/40 bg-white text-[11px] font-medium transition-colors cursor-pointer"
                              title="Inspect metadata via GET /documents/{id}"
                            >
                              Inspect
                            </button>
                            {onManagePermissions && (
                              <button
                                onClick={() => onManagePermissions(doc.id)}
                                className="px-2.5 py-1 rounded-lg bg-mint-100 text-darkGreen hover:bg-mint-100/80 border border-mint-border text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                Permissions
                              </button>
                            )}
                          </div>
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

      {/* ── Document Inspection Modal ─────────────────────────────── */}
      {(selectedDoc || detailLoading || detailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200/90 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-darkGreen">
                <FileCode className="w-4 h-4 text-sage" />
                <h3 className="text-sm font-semibold">Document Metadata Inspection</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedDoc(null);
                  setDetailError('');
                }}
                className="p-1 rounded-lg text-charcoal/40 hover:text-charcoal hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading && (
              <div className="py-8 text-center text-xs text-charcoal/50 animate-pulse font-mono">
                Fetching verified metadata via GET /documents/{selectedDoc?.id}…
              </div>
            )}

            {detailError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{detailError}</span>
              </div>
            )}

            {selectedDoc && !detailLoading && (
              <div className="space-y-4 text-xs text-charcoal">
                <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-charcoal/40 block">
                    Verified Schema: DocumentDetailResponse
                  </span>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-charcoal/50 block font-mono text-[10px]">DOCUMENT ID</span>
                      <span className="font-mono font-semibold text-darkGreen">#{selectedDoc.id}</span>
                    </div>
                    <div>
                      <span className="text-charcoal/50 block font-mono text-[10px]">OWNER ID</span>
                      <span className="font-mono font-semibold text-darkGreen">User #{selectedDoc.owner_id}</span>
                    </div>
                    <div>
                      <span className="text-charcoal/50 block font-mono text-[10px]">STATUS</span>
                      <span className="font-mono text-emerald-700 font-semibold">{selectedDoc.status}</span>
                    </div>
                    <div>
                      <span className="text-charcoal/50 block font-mono text-[10px]">CAN MANAGE</span>
                      <span className="font-mono font-semibold text-darkGreen">
                        {selectedDoc.can_manage_permissions ? 'Yes (Admin Authorized)' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-charcoal/50 block font-mono text-[10px]">FILENAME</span>
                  <span className="font-semibold text-darkGreen break-all block">
                    {selectedDoc.filename}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-mint-50/60 border border-mint-border/60 text-[11px] text-darkGreen leading-relaxed">
                  ✓ Document metadata verified through server-side ACL. Storage paths and raw text
                  remain protected in private server storage.
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setSelectedDoc(null);
                  setDetailError('');
                }}
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

