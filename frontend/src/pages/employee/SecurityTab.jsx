/**
 * SecurityTab — Security & Privacy Architecture for Employee Workspace.
 *
 * Communicates:
 * - Local AI processing (Ollama local inference)
 * - Access-controlled retrieval (SQL-level ACL)
 * - Sensitive information protection (PII & secrets sanitizer)
 * - Immutable security auditability
 */
import React from 'react';
import {
  ShieldCheck,
  Server,
  Lock,
  EyeOff,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SecurityTab() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 text-darkGreen">
          <ShieldCheck className="w-5 h-5 text-softGreen stroke-[2.2]" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Security & Privacy</h1>
        </div>
        <p className="text-xs sm:text-sm text-charcoal/60 mt-1">
          CogniSec operates strictly under the principle: "Intelligence, Without Exposure."
        </p>
      </div>

      {/* Main Principle Banner */}
      <div className="bg-mint-50/60 border border-mint-border rounded-2xl p-6 sm:p-7">
        <span className="text-[11px] font-mono uppercase tracking-widest text-sage font-medium">
          Core Commitment
        </span>
        <h2 className="text-2xl font-bold text-darkGreen tracking-tight mt-1">
          Your company knowledge stays protected.
        </h2>
        <p className="text-sm text-charcoal/70 mt-2 max-w-2xl leading-relaxed">
          Every layer of the system—from document ingestion to semantic retrieval and answer
          generation—enforces rigorous confidentiality boundaries. Zero employee queries or file
          contents leave your secured environment.
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pillar 1 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-mint-100 text-darkGreen flex items-center justify-center">
            <Server className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-bold text-darkGreen">Local AI Processing</h3>
          <p className="text-xs text-charcoal/70 leading-relaxed">
            All language model inferences and vector embeddings are executed on an internal local
            Ollama instance. No document text, prompts, or embeddings are transmitted to third-party
            cloud AI providers.
          </p>
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-[11px] font-mono text-darkGreen">
            <CheckCircle2 className="w-3.5 h-3.5 text-softGreen" />
            <span>Ollama local execution verified</span>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-mint-100 text-darkGreen flex items-center justify-center">
            <Lock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-bold text-darkGreen">Access-Controlled Retrieval</h3>
          <p className="text-xs text-charcoal/70 leading-relaxed">
            Document authorization is evaluated strictly at the database query level (SQL ACL). You
            can only search, browse, or generate answers from documents you explicitly own or have
            been granted read permission for.
          </p>
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-[11px] font-mono text-darkGreen">
            <CheckCircle2 className="w-3.5 h-3.5 text-softGreen" />
            <span>Zero-Trust SQL permissions active</span>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-mint-100 text-darkGreen flex items-center justify-center">
            <EyeOff className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-bold text-darkGreen">Sensitive Information Protection</h3>
          <p className="text-xs text-charcoal/70 leading-relaxed">
            Retrieved context passes through an automated redaction engine detecting PII (names,
            emails, phones), credentials (API keys, secrets, JWTs), and financial records. Only
            sanitized tokens reach the local model.
          </p>
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-[11px] font-mono text-darkGreen">
            <CheckCircle2 className="w-3.5 h-3.5 text-softGreen" />
            <span>Fail-closed privacy policy enabled</span>
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-xl bg-mint-100 text-darkGreen flex items-center justify-center">
            <FileCheck2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-bold text-darkGreen">Auditability & Verification</h3>
          <p className="text-xs text-charcoal/70 leading-relaxed">
            Security audit logs record authentication, retrieval, and permission operations without
            persisting raw document text or confidential user queries. Every claim is validated
            against grounded source documents.
          </p>
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-[11px] font-mono text-darkGreen">
            <CheckCircle2 className="w-3.5 h-3.5 text-softGreen" />
            <span>Immutable audit trail maintained</span>
          </div>
        </div>
      </div>

      {/* Active Session Security Context */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-darkGreen pb-2 border-b border-gray-100">
          <Key className="w-4 h-4 text-sage" />
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold">
            Active Session Security Context
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-[10px] text-charcoal/50 block mb-1">Authenticated Account</span>
            <span className="font-semibold text-darkGreen truncate block">{user?.email}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-[10px] text-charcoal/50 block mb-1">Enforced Role</span>
            <span className="font-semibold text-darkGreen uppercase block">{user?.role}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-[10px] text-charcoal/50 block mb-1">Session Storage</span>
            <span className="font-semibold text-darkGreen block">Tab-scoped SessionStorage</span>
          </div>
        </div>
      </div>
    </div>
  );
}

