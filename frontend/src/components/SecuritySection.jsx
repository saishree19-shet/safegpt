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
      description: 'Run open-weight models locally on company-controlled hardware. Document data and search queries never leave your perimeter.'
    },
    {
      icon: KeyRound,
      title: 'Permission-Aware Retrieval',
      description: 'SQL-level authorization checks verify document ownership and explicit read grants before vector retrieval takes place.'
    },
    {
      icon: EyeOff,
      title: 'Sensitive Data Protection',
      description: 'Configurable detection sanitizes emails, phone numbers, API keys, credentials and personal data prior to prompt compilation.'
    },
    {
      icon: FileCheck2,
      title: 'Transparent Answers',
      description: 'Per-claim factual validation matches model assertions back to source chunks, eliminating ungrounded hallucinations.'
    },
    {
      icon: ScrollText,
      title: 'Security Audit Logging',
      description: 'Comprehensive, metadata-allowlisted audit records track user access, searches, permissions, and security events.'
    }
  ];

  return (
    <section id="security" className="py-20 md:py-32 bg-[#FAF7F2] border-t border-b border-[#E8ECE6]/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <div className="mb-4">
            <span className="font-mono text-[11px] sm:text-xs tracking-[0.16em] uppercase text-sage font-medium">
              ZERO-TRUST ARCHITECTURE
            </span>
          </div>
          <h2 className="text-3xl sm:text-[36px] lg:text-[38px] font-semibold text-darkGreen tracking-tight leading-[1.18]">
            Security and privacy, <br />
            enforced at every layer.
          </h2>
          <p className="mt-4 text-[15px] sm:text-base text-charcoal/75 leading-relaxed font-normal">
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
                className="bg-[#FAF7F2] border border-[#D5DCCE]/80 rounded-2xl p-6 sm:p-7 shadow-xs hover:border-softGreen transition-all hover:shadow-sm group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen mb-5 group-hover:bg-darkGreen group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <h3 className="text-[17px] font-semibold text-darkGreen tracking-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-charcoal/75 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center text-xs font-mono text-sage">
                  <span>Enforced at backend</span>
                </div>
              </div>
            );
          })}

          {/* 6th Card: Security Commitment Statement */}
          <div className="bg-darkGreen text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-darkGreen flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-softGreen mb-5">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-[17px] font-semibold text-white tracking-tight mb-2">
                Privacy by Design
              </h3>
              <p className="text-sm text-mint-100/80 leading-relaxed">
                Raw sensitive information is strictly filtered from prompts and logs. We treat every internal document as strictly confidential.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center text-xs font-mono text-softGreen">
              <span>Fail-closed guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

