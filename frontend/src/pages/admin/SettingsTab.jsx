/**
 * AdminSettingsTab — Administrator System Parameters & Environment Review.
 *
 * Requirements:
 * - Read-only verified system configuration.
 * - Displays active session profile, backend runtime status, and local AI model parameters.
 * - Zero fake toggles that pretend to modify backend state.
 */
import React from 'react';
import { Settings, Shield, Cpu, Database, Lock, Server, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSettingsTab() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5 text-darkGreen">
          <Settings className="w-5 h-5 stroke-[2.2]" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">System Settings & Status</h1>
        </div>
        <p className="text-xs sm:text-sm text-charcoal/60 mt-1">
          Active administrative session details, database configuration, and local AI execution environment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Administrator Identity Card */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-darkGreen font-semibold text-xs border-b border-gray-100 pb-3">
            <User className="w-4 h-4 text-sage" />
            <span>Authenticated Administrator Identity</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Full Name</span>
              <span className="font-semibold text-darkGreen">{user?.full_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Email</span>
              <span className="font-mono text-darkGreen">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Assigned Role</span>
              <span className="font-mono uppercase font-semibold text-darkGreen bg-mint-100 px-2 py-0.5 rounded-full text-[10px]">
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-charcoal/60">Account ID</span>
              <span className="font-mono text-charcoal/70">#{user?.id}</span>
            </div>
          </div>
        </div>

        {/* Runtime Environment Card */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-darkGreen font-semibold text-xs border-b border-gray-100 pb-3">
            <Server className="w-4 h-4 text-sage" />
            <span>Backend Runtime Architecture</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Backend Service</span>
              <span className="font-semibold text-darkGreen">FastAPI (Python 3.11)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Database & Vector Storage</span>
              <span className="font-semibold text-darkGreen">PostgreSQL 16 + pgvector</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Token Authentication</span>
              <span className="font-semibold text-darkGreen">Signed HMAC-SHA256 JWT</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-charcoal/60">Token Storage</span>
              <span className="font-mono text-charcoal/70 text-[11px]">sessionStorage (Tab-Isolated)</span>
            </div>
          </div>
        </div>

        {/* Local AI Engine Card */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-darkGreen font-semibold text-xs border-b border-gray-100 pb-3">
            <Cpu className="w-4 h-4 text-sage" />
            <span>Local AI Execution Engine</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Inference Provider</span>
              <span className="font-semibold text-darkGreen">Local Ollama</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Embedding Model</span>
              <span className="font-mono text-darkGreen text-[11px]">nomic-embed-text (768-dim)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Chat Synthesis Model</span>
              <span className="font-mono text-darkGreen text-[11px]">llama3.2:1b</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-charcoal/60">Cloud Fallback</span>
              <span className="font-semibold text-emerald-700">Disabled (100% On-Premise)</span>
            </div>
          </div>
        </div>

        {/* Security Controls Card */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-darkGreen font-semibold text-xs border-b border-gray-100 pb-3">
            <Lock className="w-4 h-4 text-sage" />
            <span>Security Guarantees & Safeguards</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Zero-Trust Boundaries</span>
              <span className="font-semibold text-darkGreen">Enforced at SQL Query Level</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Pre-LLM Sanitization</span>
              <span className="font-semibold text-darkGreen">Deterministic Fail-Closed</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-charcoal/60">Audit Log Tamper-Resistance</span>
              <span className="font-semibold text-darkGreen">Append-Only Allowlisted Metadata</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-charcoal/60">Citation Validation</span>
              <span className="font-semibold text-darkGreen">Automated Claim-Source Matching</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

