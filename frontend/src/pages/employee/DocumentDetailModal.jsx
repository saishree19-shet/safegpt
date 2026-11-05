/**
 * DocumentDetailModal — View document metadata and authorized extracted text pages.
 *
 * Calls:
 * - GET /documents/{id} for metadata
 * - GET /documents/{id}/text for authorized extracted text pages
 */
import React, { useEffect, useState } from 'react';
import { AlertCircle, FileText, Loader2, Lock, Shield, X } from 'lucide-react';
import { getDocument, getDocumentText } from '../../api/documents';

export default function DocumentDetailModal({ documentId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [textData, setTextData] = useState(null);
  const [activeTab, setActiveTab] = useState('meta'); // 'meta' | 'text'
  const [activePage, setActivePage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !documentId) return;

    let isMounted = true;
    setLoading(true);
    setError('');
    setMeta(null);
    setTextData(null);
    setActiveTab('meta');
    setActivePage(1);

    async function fetchData() {
      try {
        const metadata = await getDocument(documentId);
        if (!isMounted) return;
        setMeta(metadata);

        // Fetch text pages if available/authorized
        try {
          const text = await getDocumentText(documentId);
          if (isMounted) setTextData(text);
        } catch (textErr) {
          // If unauthorized or not available, textData remains null
          if (textErr.response?.status === 403) {
            // Document text read permission restricted
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.detail || 'Failed to load document information.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [documentId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200/80 shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-darkGreen tracking-tight truncate max-w-md">
                {meta?.title || meta?.filename || 'Document Details'}
              </h3>
              <p className="text-[11px] text-charcoal/50 font-mono">ID: #{documentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-charcoal/40 hover:text-charcoal/80 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-100 px-6 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('meta')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'meta'
                ? 'border-darkGreen text-darkGreen'
                : 'border-transparent text-charcoal/60 hover:text-darkGreen'
            }`}
          >
            Overview & Metadata
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'text'
                ? 'border-darkGreen text-darkGreen'
                : 'border-transparent text-charcoal/60 hover:text-darkGreen'
            }`}
          >
            <span>Extracted Text</span>
            {textData && (
              <span className="px-1.5 py-0.2 rounded-full bg-mint-100 text-[10px] font-mono text-darkGreen">
                {textData.total_pages} {textData.total_pages === 1 ? 'page' : 'pages'}
              </span>
            )}
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1 text-sm text-charcoal/80">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-charcoal/50">
              <Loader2 className="w-6 h-6 animate-spin text-darkGreen" />
              <span className="text-xs font-mono">Loading document information…</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : activeTab === 'meta' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal/50 block mb-1">
                    Filename
                  </span>
                  <span className="text-xs font-semibold text-darkGreen font-mono truncate block">
                    {meta?.filename}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal/50 block mb-1">
                    Uploaded Date
                  </span>
                  <span className="text-xs text-charcoal/80">
                    {meta?.created_at ? new Date(meta.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal/50 block mb-1">
                    Ownership
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    {meta?.is_owner ? (
                      <span className="px-2 py-0.5 rounded-md bg-mint-100 text-darkGreen font-medium text-[11px]">
                        Owner (You)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-charcoal/70 text-[11px]">
                        Shared Access
                      </span>
                    )}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal/50 block mb-1">
                    Status
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-darkGreen font-medium">
                    <span className="w-2 h-2 rounded-full bg-softGreen" />
                    <span className="capitalize">{meta?.status || 'Active'}</span>
                  </span>
                </div>
              </div>

              {/* Security note */}
              <div className="p-4 rounded-xl bg-mint-50/70 border border-mint-border flex items-start gap-3">
                <Shield className="w-4 h-4 text-darkGreen shrink-0 mt-0.5" />
                <div className="text-xs text-charcoal/70 leading-relaxed">
                  <strong className="text-darkGreen font-medium block">
                    Zero-Exposure Storage
                  </strong>
                  Physical storage paths and raw database IDs are protected. The document's text is
                  only retrievable through authorized SQL-permissioned queries.
                </div>
              </div>
            </div>
          ) : (
            /* Text tab */
            <div>
              {textData && textData.pages && textData.pages.length > 0 ? (
                <div className="space-y-4">
                  {/* Page switcher if multi-page */}
                  {textData.pages.length > 1 && (
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
                      <span className="font-mono text-charcoal/60">
                        Page {activePage} of {textData.pages.length}
                      </span>
                      <div className="flex gap-1.5">
                        {textData.pages.map((p, idx) => (
                          <button
                            key={p.id || idx}
                            onClick={() => setActivePage(idx + 1)}
                            className={`w-7 h-7 rounded-md font-mono text-xs transition-colors cursor-pointer ${
                              activePage === idx + 1
                                ? 'bg-darkGreen text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-charcoal/70'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active page text */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 font-mono text-xs leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap text-charcoal/90">
                    {textData.pages[activePage - 1]?.text_content || 'No text on this page.'}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <Lock className="w-6 h-6 text-charcoal/40 mx-auto" />
                  <p className="text-xs text-charcoal/60">
                    Extracted text is not available or restricted by server authorization.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-darkGreen text-white hover:bg-darkGreen/90 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

