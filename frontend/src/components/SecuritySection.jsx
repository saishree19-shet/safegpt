import React from 'react';
import {
  Server,
  KeyRound,
  EyeOff,
  FileCheck2,
  ScrollText,
  Shield
} from 'lucide-react';

export default function SecuritySection() {
  const principles = [
    {
      icon: Server,
      title: 'Local AI Processing',
      description: 'Run open-weight models locally on company-controlled hardware. Document data and search queries never leave your private network boundary.',
      tag: 'Offline Runtime'
    },
    {
      icon: KeyRound,
      title: 'Permission-Aware Retrieval',
      description: 'SQL-level authorization checks verify document ownership and explicit read grants before vector retrieval takes place.',
      tag: 'Zero-Trust ACL'
    },
    {
      icon: EyeOff,
      title: 'Sensitive Data Protection',
      description: 'Configurable detection sanitizes emails, phone numbers, API keys, credentials, and personal data prior to prompt compilation.',
      tag: 'PII Sanitized'
    },
    {
      icon: FileCheck2,
      title: 'Transparent Answers',
      description: 'Per-claim factual validation matches model assertions back to source chunks, eliminating ungrounded hallucinations.',
      tag: 'Grounded Proof'
    },
    {
      icon: ScrollText,
      title: 'Security Audit Logging',
      description: 'Comprehensive, metadata-allowlisted audit records track user access, searches, permissions, and security events.',
      tag: 'Immutable Trail'
    }
  ];

  return (
    <section id="security" className="py-20 md:py-32 bg-slate-50/50 border-t border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs tracking-wider uppercase font-semibold">
              ZERO-TRUST ARCHITECTURE
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-darkGreen tracking-tight leading-tight">
            Security and privacy, <br />
            <span className="text-emerald-700">enforced at every layer.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-charcoal-600 leading-relaxed font-normal">
            CogniSec combines strict application-level access controls, client-side data isolation, and local language models to keep enterprise assets confidential.
          </p>
        </div>

        {/* 5 Security Principle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {principles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs hover:border-emerald-300 transition-all hover:shadow-card group flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-5 group-hover:bg-darkGreen group-hover:text-white transition-colors shadow-2xs">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <h3 className="text-lg font-bold text-darkGreen tracking-tight mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-charcoal-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-charcoal-400">Enforced at backend</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">{item.tag}</span>
                </div>
              </div>
            );
          })}

          {/* 6th Card: Security Commitment Statement */}
          <div className="bg-gradient-to-br from-darkGreen-900 to-darkGreen-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-darkGreen-800 flex flex-col justify-between ring-1 ring-white/10">
            <div>
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-emerald-400 mb-5">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mb-2.5">
                Privacy by Design
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Raw confidential data is strictly filtered from prompt contexts and audit logs. The system fails closed: when in doubt, access is denied.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
              <span>Fail-closed guarantee</span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-emerald-300">RFC Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

