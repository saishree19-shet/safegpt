import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Cpu, Lock } from 'lucide-react';

export default function Hero() {
  const scrollToProduct = () => {
    const elem = document.getElementById('product');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-12 md:pt-16 lg:pt-20 pb-16 md:pb-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      {/* Category Micro-label Badge */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-darkGreen font-mono text-xs tracking-wider uppercase font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          PRIVATE KNOWLEDGE • LOCAL INTELLIGENCE
        </span>
      </div>

      {/* Main Grid: Heading on left, Description & CTAs on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-end">
        {/* Left Column: Massive Heading */}
        <div className="lg:col-span-7">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] leading-[1.04] font-extrabold text-darkGreen tracking-[-0.035em]">
            Unlock your <br className="hidden sm:inline" />
            company's <br className="hidden sm:inline" />
            knowledge. <br />
            <span className="text-darkGreen-700">Without exposing </span>
            what matters.
          </h1>
        </div>

        {/* Right Column: Narrative + Action buttons */}
        <div className="lg:col-span-5 lg:pb-3 space-y-6 lg:pl-4">
          <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed font-normal">
            A zero-trust AI assistant designed for confidential company files. Query PDF and Word documents offline with role-based permissions, automated sensitive data redaction, and verified citations.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-darkGreen text-white text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-darkGreen-800 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              onClick={scrollToProduct}
              className="inline-flex items-center justify-center text-sm font-semibold text-charcoal-700 hover:text-darkGreen px-5 py-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer shadow-2xs"
            >
              Explore platform
            </button>
          </div>

          {/* Quick trust metrics */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-charcoal-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              100% Offline LLM
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Zero-Trust ACLs
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              Automated PII Redaction
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

