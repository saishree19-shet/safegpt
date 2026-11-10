import React from 'react';
import {
  Upload,
  FileSearch,
  UserCheck,
  Search,
  ShieldAlert,
  Bot,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Upload Company Documents',
      description: 'Upload PDF and Word files into secure enterprise storage with strict file validation.',
      icon: Upload,
      isHighlighted: false
    },
    {
      number: '02',
      title: 'Extract and Process Text',
      description: 'Text pages are extracted while preserving page references, offsets, and clean layouts.',
      icon: FileSearch,
      isHighlighted: false
    },
    {
      number: '03',
      title: 'Check User Permissions',
      description: 'Zero-trust authorization verifies ownership or explicit read grants before querying.',
      icon: UserCheck,
      isHighlighted: false
    },
    {
      number: '04',
      title: 'Retrieve Relevant Information',
      description: 'Cosine similarity semantic search retrieves top authorized chunks using pgvector.',
      icon: Search,
      isHighlighted: false
    },
    {
      number: '05',
      title: 'Detect and Protect Sensitive Data',
      description: 'Rule-based sanitization replaces detected PII and credentials with typed placeholders.',
      icon: ShieldAlert,
      isHighlighted: false
    },
    {
      number: '06',
      title: 'Generate an Answer Using Local AI',
      description: 'An on-premise local Ollama model constructs a structured response from sanitized context.',
      icon: Bot,
      isHighlighted: false
    },
    {
      number: '07',
      title: 'Display Answer with Sources',
      description: 'Grounded assertions are verified against source records and rendered with clickable citations.',
      icon: CheckCircle,
      isHighlighted: true
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-3xl mb-16 md:mb-20">
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs tracking-wider uppercase font-semibold">
            STEP-BY-STEP RAG PIPELINE
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-darkGreen tracking-tight leading-tight">
          A clear, verifiable path <br />
          <span className="text-emerald-700">to every single answer.</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-charcoal-600 leading-relaxed font-normal">
          From multi-format ingestion to final answer synthesis, every step is rigorously governed by access control, privacy protection, and transparent source validation.
        </p>
      </div>

      {/* Grid of 7 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          if (step.isHighlighted) {
            return (
              <div
                key={idx}
                className="bg-gradient-to-r from-darkGreen-900 to-darkGreen-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-darkGreen-800 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-2xl transition-all ring-1 ring-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <div className="text-xs font-mono tracking-widest text-emerald-400 uppercase font-bold mb-1">
                      STEP {step.number} — FINAL STEP
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed font-normal">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2.5 text-xs font-mono font-semibold bg-white/10 px-4 py-2.5 rounded-xl border border-white/15 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>100% Traceable Evidence</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs hover:border-emerald-300 transition-all hover:shadow-card flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md tracking-wider">
                    STEP {step.number}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-darkGreen group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    <Icon className="w-4 h-4 stroke-[2]" />
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-darkGreen tracking-tight mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-charcoal-400">
                <span>Verified pipeline stage</span>
                <span className="text-emerald-700 font-semibold">Active</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

