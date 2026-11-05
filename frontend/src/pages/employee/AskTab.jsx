/**
 * AskTab — Main RAG Knowledge Assistant for CogniSec.
 *
 * Connected to POST /rag/answer:
 * - Real Ollama language model generation
 * - Sanitized context enforcement
 * - Verified claims with status breakdown
 * - Authoritative clickable source citations
 * - Distinct Insufficient Evidence presentation
 */
import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Info,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { askQuestion } from '../../api/rag';

const SUGGESTED_QUESTIONS = [
  'What are the core employee policies regarding remote work?',
  'What security protocols are required for confidential company data?',
  'What is the project scope outlined in our product documentation?',
  'How are expense reimbursements handled according to company guidelines?',
];

const LOADING_STEPS = [
  'Searching authorized knowledge base…',
  'Sanitizing confidential data & verifying privacy boundaries…',
  'Synthesizing answer with local AI…',
  'Validating evidence claims & citations…',
];

export default function AskTab() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!loading) {
      setLoadingStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleAsk(queryToSubmit) {
    const q = (queryToSubmit || question).trim();
    if (!q || loading) return;

    setLoading(true);
    setError('');
    setResult(null);
    setSelectedSource(null);

    try {
      const data = await askQuestion(q);
      setResult(data);
      setHistory((prev) => [
        {
          id: Date.now(),
          question: q,
          evidence_status: data.evidence_status,
          timestamp: new Date(),
          data,
        },
        ...prev,
      ]);
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 422) {
        setError(detail || 'Invalid question format or query length.');
      } else if (status === 500 && detail?.includes('Sanitization failure')) {
        setError(
          'Privacy protection halted processing: Context could not be sanitized with 100% certainty. Your query was not sent to the language model.'
        );
      } else if (err.code === 'ECONNABORTED' || status === 504) {
        setError(
          'The local language model timed out while synthesizing an answer. Please verify Ollama is active or try a more specific question.'
        );
      } else {
        setError(
          detail || 'Failed to generate answer. Please verify local Ollama service is running.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 text-darkGreen">
          <Sparkles className="w-5 h-5 text-softGreen stroke-[2.2]" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Ask CogniSec</h1>
        </div>
        <p className="text-xs sm:text-sm text-charcoal/60 mt-1">
          Ask questions in natural language. Answers are synthesized strictly from authorized
          documents using local AI, with privacy sanitization and verified citations.
        </p>
      </div>

      {/* Input Area */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              rows={3}
              placeholder="Ask anything about policies, contracts, or company documentation…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-darkGreen focus:ring-1 focus:ring-darkGreen transition-all resize-none disabled:opacity-60 text-charcoal"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <span className="text-[10px] font-mono text-charcoal/40 hidden sm:block">
                Press Enter ↵ to ask
              </span>
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-darkGreen text-white text-xs font-medium hover:bg-darkGreen/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching…</span>
                  </>
                ) : (
                  <>
                    <span>Ask</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Suggested Prompts */}
          <div className="pt-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal/50 block mb-2">
              Suggested questions:
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestion(q);
                    handleAsk(q);
                  }}
                  disabled={loading}
                  className="text-left text-xs text-charcoal/70 bg-gray-50 hover:bg-mint-50 hover:text-darkGreen border border-gray-200/80 rounded-lg px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-7 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between text-xs text-darkGreen font-mono">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-darkGreen" />
              <span className="font-medium">{LOADING_STEPS[loadingStepIndex]}</span>
            </div>
            <span className="text-[11px] text-charcoal/50">
              Step {loadingStepIndex + 1} of {LOADING_STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {LOADING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-700 ${
                  i <= loadingStepIndex ? 'bg-darkGreen' : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-gray-100/80 rounded-md w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-100/80 rounded-md w-full animate-pulse" />
            <div className="h-4 bg-gray-100/80 rounded-md w-5/6 animate-pulse" />
          </div>
        </div>
      )}

      {/* Answer & Result Section */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Main Answer Card */}
          <div
            className={`bg-white border rounded-2xl p-6 sm:p-7 shadow-xs transition-all ${
              result.evidence_status === 'insufficient_evidence'
                ? 'border-amber-200/90 bg-amber-50/20'
                : 'border-gray-200/90'
            }`}
          >
            {/* Status Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {result.evidence_status === 'insufficient_evidence' ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-medium">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    <span>Insufficient Evidence in Authorized Documents</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint-100 text-darkGreen text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-darkGreen" />
                    <span>Verified Against Authorized Evidence</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-charcoal/50">
                <span>Model: {result.model || 'Local Ollama'}</span>
                <span>·</span>
                <span>Context chunks: {result.used_context_chunks ?? 0}</span>
              </div>
            </div>

            {/* Answer Content */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal/50 block font-medium">
                Synthesized Answer
              </span>
              <div className="text-sm sm:text-base text-charcoal/90 leading-relaxed whitespace-pre-wrap font-sans">
                {result.answer}
              </div>
            </div>

            {/* Insufficient Evidence Notice */}
            {result.evidence_status === 'insufficient_evidence' && (
              <div className="mt-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span className="leading-relaxed">
                  The model did not locate sufficient authorized documentation to substantiate this
                  answer with verified evidence. Unsubstantiated claims are omitted to prevent
                  hallucination.
                </span>
              </div>
            )}
          </div>

          {/* Claims Breakdown & Verification */}
          {result.claims && result.claims.length > 0 && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-darkGreen" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-darkGreen font-semibold">
                  Claim Verification Analysis
                </h3>
              </div>
              <p className="text-xs text-charcoal/60 leading-relaxed">
                Each statement in the synthesized answer was independently verified against retrieved
                sanitized document passages:
              </p>
              <div className="space-y-2 mt-2">
                {result.claims.map((claim, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-gray-50/70 border border-gray-100 flex items-start justify-between gap-3 text-xs"
                  >
                    <span className="text-charcoal/80 leading-relaxed">"{claim.text}"</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-semibold shrink-0 ${
                        claim.status === 'supported'
                          ? 'bg-mint-100 text-darkGreen'
                          : claim.status === 'partially_supported'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {claim.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources and Citations Panel */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-darkGreen">
                <FileText className="w-4 h-4" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold">
                  Source Citations ({result.sources?.length ?? 0})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-charcoal/50">
                Derived strictly from authorized files
              </span>
            </div>

            {!result.sources || result.sources.length === 0 ? (
              <p className="text-xs text-charcoal/50 py-2">
                No citations cited for this response.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.sources.map((src, idx) => (
                  <button
                    key={src.source_id || idx}
                    type="button"
                    onClick={() => setSelectedSource(src)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedSource?.chunk_id === src.chunk_id
                        ? 'border-darkGreen bg-mint-50/80 ring-1 ring-darkGreen'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-darkGreen truncate max-w-[200px]">
                        {src.filename}
                      </span>
                      {src.source_id && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-charcoal/60">
                          {src.source_id}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-charcoal/60">
                      <span>Page {src.page_number ?? '1'}</span>
                      <span>·</span>
                      <span>Similarity {(src.similarity_score * 100).toFixed(1)}%</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Clicked Source Preview */}
            {selectedSource && (
              <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200/80 animate-in fade-in space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-darkGreen">
                    Citation Details: {selectedSource.filename}
                  </span>
                  <button
                    onClick={() => setSelectedSource(null)}
                    className="text-[11px] font-mono text-charcoal/50 hover:text-darkGreen"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-charcoal/70">
                  <div>
                    <span className="text-charcoal/40 block">Doc ID:</span>{' '}
                    #{selectedSource.document_id}
                  </div>
                  <div>
                    <span className="text-charcoal/40 block">Page:</span>{' '}
                    {selectedSource.page_number ?? '1'}
                  </div>
                  <div>
                    <span className="text-charcoal/40 block">Chunk:</span>{' '}
                    #{selectedSource.chunk_index}
                  </div>
                  <div>
                    <span className="text-charcoal/40 block">Relevance:</span>{' '}
                    {(selectedSource.similarity_score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Query History */}
      {history.length > 1 && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-darkGreen pb-2 border-b border-gray-100">
            <Clock className="w-4 h-4 text-sage" />
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold">
              Recent Queries in this Session
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {history.slice(1, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setQuestion(item.question);
                  setResult(item.data);
                }}
                className="py-2.5 flex items-center justify-between hover:text-darkGreen cursor-pointer text-xs text-charcoal/70 transition-colors"
              >
                <span className="truncate max-w-md">{item.question}</span>
                <span className="font-mono text-[10px] text-charcoal/40 shrink-0">
                  {item.evidence_status === 'supported' ? 'Supported' : 'Insufficient Evidence'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

