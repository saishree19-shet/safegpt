/**
 * DocumentsTab — Employee document management connected to GET /documents.
 *
 * Features:
 * - Search & filter across accessible documents
 * - Professional table with Document, Uploaded, Owner/Access, Status, Actions
 * - Empty, Loading, Error states
 * - Manual Refresh action
 * - Integrated upload trigger
 * - Detail and extracted text inspector
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  FileUp,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  Lock,
} from 'lucide-react';
import { listDocuments } from '../../api/documents';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentDetailModal from './DocumentDetailModal';

export default function DocumentsTab() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState('all'); // 'all' | 'mine' | 'shared'
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  async function fetchDocuments(isManualRefresh = false) {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await listDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to load documents. Please check your connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        doc.title?.toLowerCase().includes(q) ||
        doc.filename?.toLowerCase().includes(q);

      const matchesOwner =
        filterOwner === 'all'
          ? true
          : filterOwner === 'mine'
          ? doc.is_owner
          : !doc.is_owner;

      return matchesQuery && matchesOwner;
    });
  }, [documents, searchQuery, filterOwner]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-darkGreen tracking-tight">
            My Documents
          </h1>
          <p className="text-xs sm:text-sm text-charcoal/60 mt-0.5">
            Internal company documents authorized for your account and knowledge queries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDocuments(true)}
            disabled={loading || refreshing}
            className="p-2.5 rounded-lg border border-gray-200 text-charcoal/60 hover:text-darkGreen hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh document list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-darkGreen' : ''}`} />
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-darkGreen text-white text-xs font-medium hover:bg-darkGreen/90 transition-all shadow-xs cursor-pointer"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or filename…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-darkGreen focus:ring-1 focus:ring-darkGreen transition-all"
          />
        </div>

        {/* Ownership Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          {[
            { id: 'all', label: 'All Documents' },
            { id: 'mine', label: 'Owned by Me' },
            { id: 'shared', label: 'Shared with Me' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterOwner(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
                filterOwner === tab.id
                  ? 'bg-darkGreen text-white shadow-2xs'
                  : 'text-charcoal/60 hover:text-darkGreen hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Documents Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-charcoal/50">
            <Loader2 className="w-6 h-6 animate-spin text-darkGreen" />
            <span className="text-xs font-mono">Loading authorized documents…</span>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-darkGreen">Failed to load documents</p>
            <p className="text-xs text-charcoal/60 max-w-sm mx-auto">{error}</p>
            <button
              onClick={() => fetchDocuments()}
              className="mt-2 px-4 py-2 rounded-lg bg-darkGreen text-white text-xs font-medium"
            >
              Retry
            </button>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-mint-50 text-darkGreen flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-darkGreen">
                {searchQuery || filterOwner !== 'all'
                  ? 'No matching documents found'
                  : 'No documents in your workspace'}
              </p>
              <p className="text-xs text-charcoal/60 mt-1 max-w-sm mx-auto">
                {searchQuery || filterOwner !== 'all'
                  ? 'Try adjusting your search query or ownership filter.'
                  : 'Upload PDF or Word documents to build your company knowledge base.'}
              </p>
            </div>
            {!searchQuery && filterOwner === 'all' && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-darkGreen text-white text-xs font-medium hover:bg-darkGreen/90 transition-all cursor-pointer shadow-xs"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload your first document</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-charcoal/60 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-5 font-medium">Document</th>
                  <th className="py-3 px-5 font-medium">Uploaded</th>
                  <th className="py-3 px-5 font-medium">Owner / Access</th>
                  <th className="py-3 px-5 font-medium">Status</th>
                  <th className="py-3 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-mint-50/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedDocId(doc.id)}
                  >
                    {/* Document title & filename */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-mint-100 text-darkGreen flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 stroke-[2]" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-darkGreen truncate block max-w-xs sm:max-w-md">
                            {doc.title || doc.filename}
                          </span>
                          <span className="text-[11px] text-charcoal/50 font-mono truncate block">
                            {doc.filename}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Uploaded date */}
                    <td className="py-3.5 px-5 text-charcoal/70 whitespace-nowrap">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                    </td>

                    {/* Owner / Access */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {doc.is_owner ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-mint-100 text-darkGreen text-[11px] font-medium">
                          <span>Owner (You)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-charcoal/70 text-[11px]">
                          <Lock className="w-2.5 h-2.5 text-sage" />
                          <span>Shared with read access</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-darkGreen font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-softGreen" />
                        <span className="capitalize">{doc.status || 'Ready'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedDocId(doc.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-darkGreen hover:bg-mint-100 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        {!loading && filteredDocs.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-charcoal/60 font-mono">
            <span>Showing {filteredDocs.length} of {documents.length} authorized files</span>
            <span>Zero-Trust SQL-enforced</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => fetchDocuments(true)}
      />

      <DocumentDetailModal
        documentId={selectedDocId}
        isOpen={Boolean(selectedDocId)}
        onClose={() => setSelectedDocId(null)}
      />
    </div>
  );
}

