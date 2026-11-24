/**
 * SearchTab — 100% Dynamic Secure Document Search.
 *
 * Connected directly to:
 * - GET /documents (live PostgreSQL authorized documents)
 * - POST /rag/search (semantic vector retrieval across PostgreSQL pgvector embeddings)
 */
import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Lock,
  ShieldAlert,
  ExternalLink,
  FileText,
  File,
  ChevronDown,
  Loader2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { listDocuments } from '../../api/documents';
import { semanticSearch } from '../../api/rag';
import DocumentDetailModal from './DocumentDetailModal';
import DocumentUploadModal from './DocumentUploadModal';

export default function SearchTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [allDocs, setAllDocs] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [error, setError] = useState('');

  // Fetch real documents from database
  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const docs = await listDocuments();
      setAllDocs(Array.isArray(docs) ? docs : []);
    } catch (err) {
      setError('Could not fetch documents from database. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await semanticSearch(query.trim(), 8);
      if (data && data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch {
      // Fallback to local filtering of allDocs
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setQuery('');
    setSearchResults(null);
  }

  // Derive dynamic display list
  const displayDocs = (() => {
    if (searchResults !== null && Array.isArray(searchResults)) {
      if (searchResults.length === 0) return [];

      // Map semantic search chunks to their parent document objects
      const docMap = new Map();
      for (const res of searchResults) {
        const docId = res.document_id;
        if (!docMap.has(docId)) {
          const original = allDocs.find((d) => d.id === docId);
          docMap.set(docId, {
            id: docId,
            title: original?.title || res.filename || `Document #${docId}`,
            filename: res.filename || original?.filename,
            page_count: res.page_number || original?.page_count || 1,
            updated_at: original?.created_at
              ? new Date(original.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent',
            can_view: true,
            file_type: res.filename?.endsWith('.docx') ? 'docx' : 'pdf',
            match_score: res.similarity_score || 0.85,
            excerpt: res.chunk_text || '',
          });
        }
      }
      return Array.from(docMap.values());
    }

    if (!query.trim()) {
      return allDocs.map((d) => ({
        id: d.id,
        title: d.title || d.filename,
        filename: d.filename,
        page_count: d.page_count || 1,
        updated_at: d.created_at
          ? new Date(d.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Recent',
        can_view: Boolean(d.can_read ?? true),
        file_type: d.filename?.endsWith('.docx') ? 'docx' : 'pdf',
        match_score: 1.0,
        excerpt: d.title,
      }));
    }

    const qLower = query.toLowerCase();
    return allDocs
      .filter(
        (d) =>
          d.title?.toLowerCase().includes(qLower) ||
          d.filename?.toLowerCase().includes(qLower)
      )
      .map((d) => ({
        id: d.id,
        title: d.title || d.filename,
        filename: d.filename,
        page_count: d.page_count || 1,
        updated_at: d.created_at
          ? new Date(d.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Recent',
        can_view: Boolean(d.can_read ?? true),
        file_type: d.filename?.endsWith('.docx') ? 'docx' : 'pdf',
        match_score: 0.9,
        excerpt: d.title,
      }));
  })();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-darkGreen tracking-tight">
            Secure Document Search
          </h1>
          <p className="text-sm text-charcoal/70 mt-1">
            Find relevant information from your authorized company files with access controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D3829] hover:bg-[#0D3829]/90 text-white text-xs font-medium transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-center"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* ── Search Input Box ────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="relative flex items-center gap-3">
        <div className="relative flex-1 flex items-center bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:border-gray-300 focus-within:border-darkGreen focus-within:ring-1 focus-within:ring-darkGreen transition-all">
          <Search className="w-5 h-5 text-charcoal/40 ml-4 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company files, policies, and documentation…"
            className="w-full px-3 py-3 text-sm text-charcoal placeholder-charcoal/40 focus:outline-none bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 mr-2 text-charcoal/40 hover:text-charcoal transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 rounded-xl bg-[#0D3829] hover:bg-[#0D3829]/90 text-white text-sm font-medium transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching…</span>
            </>
          ) : (
            <span>Search</span>
          )}
        </button>
      </form>

      {/* ── Status Bar: Count & Sort Dropdown ───────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs sm:text-sm font-medium text-charcoal/80">
          <span className="font-semibold text-darkGreen">{displayDocs.length}</span> documents
          available
        </p>

        <div className="flex items-center gap-2 text-xs text-charcoal/70">
          <div className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-200/80 rounded-lg px-3 py-1.5 pr-7 text-xs font-medium text-charcoal hover:border-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="relevance">Sort by: Relevance</option>
              <option value="recent">Sort by: Most Recent</option>
              <option value="title">Sort by: Title</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-charcoal/40 absolute right-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Document Results List ───────────────────────────────── */}
      <div className="space-y-3.5">
        {displayDocs.length === 0 ? (
          <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl space-y-3">
            <FileText className="w-8 h-8 text-charcoal/40 mx-auto" />
            <h3 className="text-sm font-semibold text-darkGreen">No Matching Documents Found</h3>
            <p className="text-xs text-charcoal/60 max-w-sm mx-auto">
              No files in the knowledge base match your search. Try uploading a new document.
            </p>
          </div>
        ) : (
          displayDocs.map((doc, idx) => {
            const isSelected = activeCardIndex === idx;
            const isDocx = doc.file_type === 'docx' || doc.filename?.endsWith('.docx');

            return (
              <div
                key={doc.id || idx}
                onClick={() => setActiveCardIndex(idx)}
                className={`group relative bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-darkGreen/40 ring-1 ring-darkGreen/20 shadow-xs'
                    : 'border-gray-200/80 hover:border-gray-300'
                }`}
              >
                {isSelected && (
                  <span className="absolute left-0 top-3 bottom-3 w-1.5 bg-[#0D3829] rounded-r-full" />
                )}

                <div className="flex items-center gap-4 pl-1 sm:pl-2">
                  <div
                    className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border text-[10px] font-bold uppercase tracking-wider ${
                      isDocx
                        ? 'bg-blue-50 border-blue-200/80 text-blue-700'
                        : 'bg-red-50 border-red-200/80 text-red-600'
                    }`}
                  >
                    <FileText className="w-4 h-4 mb-0.5" />
                    <span>{isDocx ? 'DOCX' : 'PDF'}</span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-darkGreen group-hover:text-darkGreen/90">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-charcoal/60 mt-0.5">
                      <span className="flex items-center gap-1">
                        <File className="w-3 h-3 text-sage" />
                        <span>{doc.page_count} pages</span>
                      </span>
                      <span>•</span>
                      <span>Updated {doc.updated_at}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {doc.can_view ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] text-xs font-medium">
                      <Lock className="w-3 h-3" />
                      <span>You can view</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs font-medium">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Restricted</span>
                    </span>
                  )}

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

      {/* Document Detail Modal */}
      {selectedDocId && (
        <DocumentDetailModal
          documentId={selectedDocId}
          onClose={() => setSelectedDocId(null)}
        />
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <DocumentUploadModal
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={() => {
            setIsUploadOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
