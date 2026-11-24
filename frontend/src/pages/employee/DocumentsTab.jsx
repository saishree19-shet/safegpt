/**
 * DocumentsTab — Employee document management matching the exact style of SearchTab (Image 2).
 *
 * Implements:
 * - Exact same typography, font sizes, card design, and spacing as Image 2
 * - Prominent PDF (rose/red badge) & DOCX (blue badge) file icons
 * - "You can view" / "Restricted" access status pills
 * - Glassmorphism search & filter bar (All Accessible, My Personal Uploads, Company Knowledge)
 * - Modal integration for DocumentDetailModal and DocumentUploadModal
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  File,
  Search,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  Lock,
  ShieldAlert,
  ExternalLink,
  Upload,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listDocuments } from '../../api/documents';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentDetailModal from './DocumentDetailModal';

export default function DocumentsTab() {
  const { user } = useAuth();
  const canUpload = Boolean(user);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState('all'); // 'all' | 'mine' | 'shared'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'title'
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(null);

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

  // Filtered and sorted documents
  const filteredDocs = useMemo(() => {
    const list = documents.filter((doc) => {
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

    return list.sort((a, b) => {
      if (sortBy === 'title') {
        const titleA = a.title || a.filename || '';
        const titleB = b.title || b.filename || '';
        return titleA.localeCompare(titleB);
      }
      // 'recent' by created_at descending
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [documents, searchQuery, filterOwner, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header (Matching Image 2 Style) ────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-darkGreen tracking-tight">
            My Documents
          </h1>
          <p className="text-xs sm:text-sm text-charcoal/70 mt-0.5">
            Internal company documents authorized for your account and knowledge queries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchDocuments(true)}
            disabled={loading || refreshing}
            className="p-2.5 rounded-xl border border-gray-200/80 bg-white/80 hover:bg-white text-charcoal/70 hover:text-darkGreen transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Refresh document list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-darkGreen' : ''}`} />
          </button>

          {canUpload && (
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D3829] hover:bg-[#0D3829]/90 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Search & Filter Bar (Glassmorphic Container) ────────── */}
      <div className="bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or filename…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50/70 border border-gray-200/90 text-xs sm:text-sm text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-darkGreen focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-charcoal/40 hover:text-charcoal cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Ownership Filter Tabs (Matching Image 1 Options with Clean Rounded Pills) */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto text-xs">
          {[
            { id: 'all', label: 'All Accessible' },
            { id: 'mine', label: 'My Personal Uploads' },
            { id: 'shared', label: 'Company Knowledge' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterOwner(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer text-xs ${
                filterOwner === tab.id
                  ? 'bg-[#0D3829] text-white shadow-xs font-semibold'
                  : 'text-charcoal/70 hover:text-darkGreen hover:bg-gray-100/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Status Bar: Document Count & Sorting ────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs sm:text-sm font-medium text-charcoal/80">
          <span className="font-semibold text-darkGreen">{filteredDocs.length}</span> documents available
        </p>

        <div className="flex items-center gap-2 text-xs text-charcoal/70">
          <div className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-200/80 rounded-xl px-3 py-1.5 pr-7 text-xs font-medium text-charcoal hover:border-gray-300 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="recent">Sort by: Most Recent</option>
              <option value="title">Sort by: Title</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-charcoal/40 absolute right-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Document List (Matching Image 2 Exact Cards & Badges) ── */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-charcoal/50 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/80">
            <Loader2 className="w-6 h-6 animate-spin text-darkGreen" />
            <span className="text-xs font-mono">Loading authorized documents…</span>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3 bg-white/90 rounded-2xl border border-red-200 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-darkGreen">Failed to load documents</p>
            <p className="text-xs text-charcoal/60 max-w-sm mx-auto">{error}</p>
            <button
              type="button"
              onClick={() => fetchDocuments()}
              className="mt-2 px-4 py-2 rounded-xl bg-[#0D3829] text-white text-xs font-medium hover:bg-[#0D3829]/90 cursor-pointer shadow-xs"
            >
              Retry
            </button>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/80">
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
                  : canUpload
                    ? 'Upload PDF or Word documents to build your company knowledge base.'
                    : 'Authorized company documents will appear here once granted by an administrator.'}
              </p>
            </div>
            {!searchQuery && filterOwner === 'all' && canUpload && (
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3829] text-white text-xs font-medium hover:bg-[#0D3829]/90 transition-all cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload your first document</span>
              </button>
            )}
          </div>
        ) : (
          filteredDocs.map((doc, idx) => {
            const isSelected = activeCardIndex === idx;
            const filename = doc.filename || doc.title || '';
            const isDocx = filename.toLowerCase().endsWith('.docx');
            const pageCount = doc.page_count || 1;
            const updatedDateStr = doc.created_at
              ? new Date(doc.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={doc.id || idx}
                onClick={() => {
                  setActiveCardIndex(idx);
                  setSelectedDocId(doc.id);
                }}
                className={`group relative bg-white/95 backdrop-blur-sm border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-darkGreen/40 ring-1 ring-darkGreen/20 shadow-xs'
                    : 'border-gray-200/80 hover:border-gray-300'
                }`}
              >
                {/* Active Left Indicator Accent (matching Image 2) */}
                <span
                  className={`absolute left-0 top-3 bottom-3 w-1.5 bg-[#0D3829] rounded-r-full transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                />

                <div className="flex items-center gap-4 pl-1 sm:pl-2">
                  {/* PDF / DOCX Badge (exact match of Image 2) */}
                  <div
                    className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border text-[10px] font-bold uppercase tracking-wider font-mono ${
                      isDocx
                        ? 'bg-blue-50 border-blue-200/80 text-blue-700'
                        : 'bg-red-50 border-red-200/80 text-red-600'
                    }`}
                  >
                    <FileText className="w-4 h-4 mb-0.5" />
                    <span>{isDocx ? 'DOCX' : 'PDF'}</span>
                  </div>

                  {/* Title and Metadata Details (exact match of Image 2 font size & style) */}
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-darkGreen group-hover:text-darkGreen/90">
                      {doc.title || doc.filename}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal/60 mt-0.5">
                      <span className="flex items-center gap-1">
                        <File className="w-3 h-3 text-sage" />
                        <span>{pageCount} pages</span>
                      </span>
                      <span>•</span>
                      <span>Updated {updatedDateStr}</span>
                      <span>•</span>
                      <span className="inline-flex items-center text-[11px] font-medium">
                        {doc.is_owner ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                            Personal Document
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-charcoal/70">
                            Company Knowledge
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Status Badge & External Action (exact match of Image 2) */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] text-xs font-medium">
                    <Lock className="w-3 h-3" />
                    <span>You can view</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (doc.id) {
                        setSelectedDocId(doc.id);
                      }
                    }}
                    className="p-2 text-charcoal/40 hover:text-darkGreen hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="View document details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Document Full Detail Modal ──────────────────────────── */}
      {selectedDocId && (
        <DocumentDetailModal
          documentId={selectedDocId}
          onClose={() => setSelectedDocId(null)}
        />
      )}

      {/* ── Document Upload Modal ───────────────────────────────── */}
      {isUploadOpen && (
        <DocumentUploadModal
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => {
            setIsUploadOpen(false);
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
}
