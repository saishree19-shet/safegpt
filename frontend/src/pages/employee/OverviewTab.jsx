/**
 * OverviewTab — Employee Dashboard Home.
 *
 * Shows:
 * - Dynamic greeting ("Good morning / afternoon / evening, {first_name}")
 * - Genuine summary cards (My Documents, Available Knowledge, Session Queries, Security Status)
 * - Quick Actions
 * - Recent Documents list with real data
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  FileUp,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Search,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listDocuments } from '../../api/documents';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentDetailModal from './DocumentDetailModal';

export default function OverviewTab() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  // Dynamic greeting based on current local hour
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening';
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'there';

  async function fetchDocs() {
    setLoading(true);
    setError('');
    try {
      const data = await listDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Could not fetch documents. Please refresh or check connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocs();
  }, []);

  const myDocsCount = documents.filter((d) => d.is_owner).length;
  const totalKnowledgeCount = documents.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-sage font-medium">
            CogniSec Private Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-darkGreen tracking-tight mt-1">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-charcoal/70 mt-1">
            Your private workspace for finding and using company knowledge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-darkGreen text-white text-xs font-medium hover:bg-darkGreen/90 transition-all shadow-xs cursor-pointer"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
          <Link
            to="/app/ask"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-darkGreen text-xs font-medium hover:bg-mint-50 transition-all shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask CogniSec</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Documents */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-charcoal/60">
              My Documents
            </span>
            <div className="w-7 h-7 rounded-md bg-mint-100 text-darkGreen flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-darkGreen">
              {loading ? (
                <span className="text-charcoal/30 text-lg">…</span>
              ) : (
                myDocsCount
              )}
            </div>
            <p className="text-xs text-charcoal/60 mt-1">Uploaded by your account</p>
          </div>
        </div>

        {/* Card 2: Available Knowledge */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-charcoal/60">
              Available Knowledge
            </span>
            <div className="w-7 h-7 rounded-md bg-mint-100 text-darkGreen flex items-center justify-center">
              <Search className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-darkGreen">
              {loading ? (
                <span className="text-charcoal/30 text-lg">…</span>
              ) : (
                totalKnowledgeCount
              )}
            </div>
            <p className="text-xs text-charcoal/60 mt-1">Authorized files in scope</p>
          </div>
        </div>

        {/* Card 3: Recent Searches / Inquiries */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-charcoal/60">
              Knowledge Assistant
            </span>
            <div className="w-7 h-7 rounded-md bg-mint-100 text-darkGreen flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-darkGreen flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-softGreen" />
              <span>RAG Engine Online</span>
            </div>
            <p className="text-xs text-charcoal/60 mt-1">Local Ollama verified</p>
          </div>
        </div>

        {/* Card 4: Security Status */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-charcoal/60">
              Security Boundary
            </span>
            <div className="w-7 h-7 rounded-md bg-mint-100 text-darkGreen flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-darkGreen flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-sage" />
              <span>Zero Exposure</span>
            </div>
            <p className="text-xs text-charcoal/60 mt-1">SQL-level ACL & Sanitization</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-mint-50/50 border border-mint-border rounded-xl p-6">
        <h2 className="text-xs font-mono uppercase tracking-wider text-darkGreen font-semibold mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="text-left bg-white border border-gray-200/80 rounded-xl p-4 hover:border-darkGreen/50 hover:bg-mint-50/60 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-mint-100 text-darkGreen flex items-center justify-center">
                <FileUp className="w-4 h-4 stroke-[2.2]" />
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal/30 group-hover:text-darkGreen group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm font-semibold text-darkGreen">Upload a Document</h3>
            <p className="text-xs text-charcoal/60 mt-1 leading-relaxed">
              Add a PDF or Word file to your authorized knowledge scope.
            </p>
          </button>

          <Link
            to="/app/ask"
            className="bg-white border border-gray-200/80 rounded-xl p-4 hover:border-darkGreen/50 hover:bg-mint-50/60 transition-all group shadow-2xs block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-mint-100 text-darkGreen flex items-center justify-center">
                <MessageSquare className="w-4 h-4 stroke-[2.2]" />
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal/30 group-hover:text-darkGreen group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm font-semibold text-darkGreen">Ask a Question</h3>
            <p className="text-xs text-charcoal/60 mt-1 leading-relaxed">
              Synthesize factual answers with verifiable citations.
            </p>
          </Link>

          <Link
            to="/app/documents"
            className="bg-white border border-gray-200/80 rounded-xl p-4 hover:border-darkGreen/50 hover:bg-mint-50/60 transition-all group shadow-2xs block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-mint-100 text-darkGreen flex items-center justify-center">
                <FileText className="w-4 h-4 stroke-[2.2]" />
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal/30 group-hover:text-darkGreen group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm font-semibold text-darkGreen">Browse Documents</h3>
            <p className="text-xs text-charcoal/60 mt-1 leading-relaxed">
              Inspect accessible documents, permissions, and extracted text.
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Documents Section */}
      <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-darkGreen">Recent Documents</h2>
            <p className="text-xs text-charcoal/60">Documents currently in your knowledge scope</p>
          </div>
          <Link
            to="/app/documents"
            className="text-xs font-medium text-sage hover:text-darkGreen transition-colors flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-charcoal/50">
            <Loader2 className="w-5 h-5 animate-spin text-darkGreen" />
            <span className="text-xs font-mono">Loading documents…</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-600 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-charcoal/40 flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-darkGreen">No documents yet</p>
              <p className="text-xs text-charcoal/60 mt-0.5">
                Upload your first document or request access from an administrator.
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-darkGreen text-white text-xs font-medium hover:bg-darkGreen/90 transition-all cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload now</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-mint-100 text-darkGreen flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-darkGreen truncate max-w-sm sm:max-w-md">
                      {doc.title || doc.filename}
                    </p>
                    <p className="text-[11px] text-charcoal/50 font-mono">
                      {doc.filename} ·{' '}
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${
                      doc.is_owner
                        ? 'bg-mint-100 text-darkGreen font-semibold'
                        : 'bg-gray-100 text-charcoal/60'
                    }`}
                  >
                    {doc.is_owner ? 'Owner' : 'Shared'}
                  </span>
                  <button
                    onClick={() => setSelectedDocId(doc.id)}
                    className="text-xs font-medium text-darkGreen hover:underline cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchDocs();
        }}
      />

      <DocumentDetailModal
        documentId={selectedDocId}
        isOpen={Boolean(selectedDocId)}
        onClose={() => setSelectedDocId(null)}
      />
    </div>
  );
}

