/**
 * SecurityPrivacyTab — Security Architecture Overview & Privacy Review (Step 7.4E).
 *
 * Requirements:
 * - Real API integration via:
 *   - GET  /privacy/documents/{document_id}/review
 *   - POST /privacy/analyze
 * - Displays real response fields: total_chunks, total_entities_detected,
 *   category_counts, detector_version, sanitizer_version, sanitized_text, original_text.
 * - Respects zero-trust ACLs: displays original text only when authorized by backend.
 * - No false compliance claims (e.g. no claims of 100% security or GDPR certification).
 * - No sensitive values written to browser console, storage, or URLs.
 * - Loading, empty, and 403 authorization error states.
 */
import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  FileText,
  Search,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Cpu,
  KeyRound,
  Activity,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronRight,
  SplitSquareVertical,
} from 'lucide-react';
import { listDocuments } from '../../api/documents';
import { reviewDocumentPrivacy, analyzePrivacy } from '../../api/privacy';

const IMPLEMENTED_SECURITY_PILLARS = [
  {
    title: 'Role-Based Access Control',
    icon: Lock,
    desc: 'Strict server-side separation between Employee and Administrator roles. Frontend navigation guards are non-authoritative.',
  },
  {
    title: 'Document Access Governance (ACL)',
    icon: KeyRound,
    desc: 'PostgreSQL-enforced read grants. Even administrators cannot read confidential document text without explicit authorization.',
  },
  {
    title: 'Permission-Aware Retrieval',
    icon: Search,
    desc: 'Vector embeddings are queried with SQL-level ownership and permission filters, preventing unauthorized chunk retrieval.',
  },
  {
    title: 'Sensitive Entity Detection',
    icon: ShieldCheck,
    desc: 'Layered regex and contextual detectors locate credentials, API keys, financial records, government IDs, and PII.',
  },
  {
    title: 'Deterministic Text Sanitization',
    icon: SplitSquareVertical,
    desc: 'Replaces sensitive entities with typed placeholders ([EMAIL_1], [PERSON_1]) before LLM prompt assembly to avoid raw data exposure.',
  },
  {
    title: 'Local Ollama Processing',
    icon: Cpu,
    desc: 'All embedding and chat synthesis runs on private local infrastructure. Zero document data is sent to third-party cloud APIs.',
  },
  {
    title: 'Security Audit Logging',
    icon: Activity,
    desc: 'Server-recorded audit events with strict metadata allowlisting. Passwords, tokens, and document texts are excluded from logs.',
  },
  {
    title: 'Citation & Claim Validation',
    icon: Sparkles,
    desc: 'Model outputs are automatically decomposed into claims and verified against authorized source chunks before presentation.',
  },
];

export default function SecurityPrivacyTab() {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState('');

  // Privacy Review state (GET /privacy/documents/{id}/review)
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Direct Text Scan state (POST /privacy/analyze)
  const [customText, setCustomText] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  // Active view mode: 'review' | 'scan'
  const [viewMode, setViewMode] = useState('review');

  useEffect(() => {
    async function fetchDocs() {
      setLoadingDocs(true);
      try {
        const data = await listDocuments();
        const docs = Array.isArray(data) ? data : [];
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocId(String(docs[0].id));
        }
      } catch {
        // Handled silently; empty state shown
      } finally {
        setLoadingDocs(false);
      }
    }
    fetchDocs();
  }, []);

  async function handleLoadReview(docIdToLoad) {
    const id = docIdToLoad || selectedDocId;
    if (!id) return;

    setReviewLoading(true);
    setReviewError('');
    setReviewData(null);

    try {
      const data = await reviewDocumentPrivacy(parseInt(id, 10));
      setReviewData(data);
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 403) {
        setReviewError(
          'Zero-Trust Access Restriction: You do not own this document and have not been granted explicit read permission. In CogniSec, administrator privilege alone does not bypass document privacy boundaries.'
        );
      } else {
        setReviewError(detail || 'Failed to retrieve document privacy review from backend.');
      }
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleCustomScan(e) {
    e.preventDefault();
    if (!customText.trim()) return;

    setScanLoading(true);
    setScanError('');
    setScanResult(null);

    try {
      const data = await analyzePrivacy({ text: customText.trim() });
      setScanResult(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setScanError(detail || 'Failed to complete privacy sanitization analysis.');
    } finally {
      setScanLoading(false);
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="pb-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-darkGreen">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Security & Privacy Architecture
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal/60 mt-1">
            Systemic technical controls, sensitive entity sanitization, and document privacy verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-mint-100 border border-mint-border text-darkGreen font-mono text-xs font-semibold">
            Zero-Trust Verified
          </span>
        </div>
      </div>

      {/* ── Scope & Non-Speculative Guarantee Notice ───────────────── */}
      <div className="p-4 rounded-2xl bg-cream/60 border border-beige/80 text-xs text-charcoal/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-sage shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-darkGreen block">
            Verifiable Security Scope
          </span>
          <p className="leading-relaxed">
            CogniSec enforces privacy through deterministic technical boundaries: local inference,
            SQL-level ACLs, and pre-LLM redaction. We report measured detection results without
            making speculative claims of 100% security or formal regulatory certification.
          </p>
        </div>
      </div>

      {/* ── 8 Implemented Security Pillars ─────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-charcoal/60 font-semibold">
          <Shield className="w-3.5 h-3.5 text-sage" />
          <span>Core Security Capabilities</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {IMPLEMENTED_SECURITY_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen">
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-xs font-bold text-darkGreen">{pillar.title}</h3>
                <p className="text-[11px] text-charcoal/70 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Privacy Inspection Section ────────────────── */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-darkGreen">
              Privacy Sanitization Inspector
            </h2>
            <p className="text-xs text-charcoal/60 mt-0.5">
              Review document sanitization records or evaluate sensitive entity detection.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl p-1 bg-gray-100 text-xs font-medium">
            <button
              onClick={() => setViewMode('review')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'review'
                  ? 'bg-white text-darkGreen shadow-2xs font-semibold'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              Document Review
            </button>
            <button
              onClick={() => setViewMode('scan')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'scan'
                  ? 'bg-white text-darkGreen shadow-2xs font-semibold'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              Live Text Scan
            </button>
          </div>
        </div>

        {/* ── MODE 1: Document Privacy Review ─────────────────────── */}
        {viewMode === 'review' && (
          <div className="space-y-6">
            {/* Document Selector & Action */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-charcoal/80 mb-1.5">
                  Select Document for Privacy Review
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-charcoal focus:outline-none focus:border-darkGreen bg-white"
                  >
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        #{doc.id} — {doc.filename || doc.title} (Owner #{doc.owner_id})
                        {doc.can_read ? ' [Read Authorized]' : ' [Restricted Text]'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={() => handleLoadReview(selectedDocId)}
                disabled={reviewLoading || !selectedDocId}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-darkGreen text-white text-xs font-medium hover:bg-darkGreen/90 transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{reviewLoading ? 'Loading Review…' : 'Inspect Privacy Review'}</span>
              </button>
            </div>

            {/* Error / Authorization Notice */}
            {reviewError && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <span className="leading-relaxed">{reviewError}</span>
              </div>
            )}

            {/* Review Results */}
            {reviewData && !reviewLoading && (
              <div className="space-y-6 pt-2 animate-in fade-in">
                {/* Metrics Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-charcoal/50 block">
                      DOCUMENT
                    </span>
                    <span className="font-semibold text-darkGreen truncate block">
                      {reviewData.filename}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-charcoal/50 block">
                      TOTAL CHUNKS
                    </span>
                    <span className="font-mono font-semibold text-darkGreen">
                      {reviewData.total_chunks}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-charcoal/50 block">
                      ENTITIES REDACTED
                    </span>
                    <span className="font-mono font-bold text-darkGreen">
                      {reviewData.total_entities_detected}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-charcoal/50 block">
                      PIPELINE VERSION
                    </span>
                    <span className="font-mono text-sage text-[11px]">
                      {reviewData.detector_version} / {reviewData.sanitizer_version}
                    </span>
                  </div>
                </div>

                {/* Detected Categories Badges */}
                {reviewData.category_counts && Object.keys(reviewData.category_counts).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase text-charcoal/50 block font-medium">
                      Detected Sensitive Entity Categories:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(reviewData.category_counts).map(([cat, count]) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint-100 text-darkGreen text-xs font-mono font-medium border border-mint-border"
                        >
                          <span>{cat}</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-darkGreen text-white text-[10px]">
                            {count}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chunks Side-by-Side Review */}
                <div className="space-y-4">
                  <span className="text-[11px] font-mono uppercase text-charcoal/50 block font-medium">
                    Sanitized vs. Original Document Chunks ({reviewData.chunks?.length || 0}):
                  </span>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                    {reviewData.chunks?.map((chunk) => (
                      <div
                        key={chunk.chunk_id}
                        className="p-4 rounded-xl border border-gray-200 bg-white space-y-3"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-charcoal/60 border-b border-gray-100 pb-2">
                          <span className="font-semibold text-darkGreen">
                            Chunk #{chunk.chunk_index + 1} (ID #{chunk.chunk_id})
                            {chunk.page_number && ` · Page ${chunk.page_number}`}
                          </span>
                          <span>
                            {Object.values(chunk.entity_counts || {}).reduce((a, b) => a + b, 0)} redactions
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Sanitized Text */}
                          <div className="p-3 rounded-lg bg-mint-50/40 border border-mint-border/50 font-sans leading-relaxed">
                            <span className="text-[10px] font-mono uppercase text-darkGreen font-semibold block mb-1">
                              Sanitized View (Sent to Local LLM)
                            </span>
                            <div className="whitespace-pre-wrap text-charcoal/90">
                              {chunk.sanitized_text}
                            </div>
                          </div>

                          {/* Original Text */}
                          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200/80 font-sans leading-relaxed">
                            <span className="text-[10px] font-mono uppercase text-charcoal/60 font-semibold block mb-1">
                              Original Text (Authorized Review)
                            </span>
                            {chunk.original_text ? (
                              <div className="whitespace-pre-wrap text-charcoal/80">
                                {chunk.original_text}
                              </div>
                            ) : (
                              <span className="text-amber-800 text-[11px] italic">
                                Original text restricted by document ACL.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODE 2: Live Text Scan (POST /privacy/analyze) ───────── */}
        {viewMode === 'scan' && (
          <form onSubmit={handleCustomScan} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-charcoal/80 mb-1.5">
                Evaluate Raw Text Against CogniSec Sensitive Entity Detector
              </label>
              <textarea
                rows={4}
                placeholder="Enter sample policy or text with emails, credentials, phone numbers or names to test redaction…"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-charcoal focus:outline-none focus:border-darkGreen focus:ring-1 focus:ring-darkGreen resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={scanLoading || !customText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-darkGreen text-white text-xs font-medium hover:bg-darkGreen/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-softGreen" />
                <span>{scanLoading ? 'Sanitizing…' : 'Execute Privacy Scan'}</span>
              </button>
            </div>

            {scanError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{scanError}</span>
              </div>
            )}

            {scanResult && !scanLoading && (
              <div className="space-y-4 pt-3 border-t border-gray-100 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-darkGreen">
                    Sanitization Output ({scanResult.detections?.length || 0} entities replaced)
                  </span>
                  <span className="text-[11px] font-mono text-sage">
                    {scanResult.detector_version} / {scanResult.sanitizer_version}
                  </span>
                </div>

                {/* Sanitized Text Result */}
                <div className="p-4 rounded-xl bg-mint-50/60 border border-mint-border text-xs text-charcoal whitespace-pre-wrap leading-relaxed font-sans">
                  {scanResult.sanitized_text}
                </div>

                {/* Detected Categories */}
                {scanResult.entity_counts && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(scanResult.entity_counts).map(([cat, count]) => (
                      <span
                        key={cat}
                        className="px-2.5 py-0.5 rounded-full bg-gray-100 text-darkGreen font-mono text-[11px]"
                      >
                        {cat}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

