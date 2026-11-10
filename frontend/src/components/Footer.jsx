import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Footer() {
  const scrollTo = (id) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-50/70 border-t border-slate-200/80 pt-16 pb-16 text-charcoal">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Main 5-column layout */}
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          
          {/* Brand info (4 cols on lg) */}
          <div className="col-span-2 md:col-span-2 lg:col-span-4 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 text-darkGreen group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-darkGreen text-white flex items-center justify-center shadow-2xs">
                <Shield className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-darkGreen">
                CogniSec
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed max-w-xs font-normal">
              Zero-Trust Offline AI Assistant for Confidential Company Documents.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-800 font-semibold">
              ● Local Runtime Verified
            </div>
          </div>

          {/* Col 1: Product (2 cols on lg) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="text-xs sm:text-sm font-bold text-darkGreen mb-3 sm:mb-4 uppercase tracking-wider font-mono">
              Product
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal-600 font-medium">
              <li>
                <button
                  onClick={() => scrollTo('product')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  Platform Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('how-it-works')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  RAG Pipeline
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Features (2 cols on lg) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="text-xs sm:text-sm font-bold text-darkGreen mb-3 sm:mb-4 uppercase tracking-wider font-mono">
              Capabilities
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal-600 font-medium">
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  Knowledge Assistant
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  Privacy Redaction
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Security (2 cols on lg) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="text-xs sm:text-sm font-bold text-darkGreen mb-3 sm:mb-4 uppercase tracking-wider font-mono">
              Security
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal-600 font-medium">
              <li>
                <button
                  onClick={() => scrollTo('security')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  Zero-Trust ACLs
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('security')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  Local Infrastructure
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Account (2 cols on lg) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="text-xs sm:text-sm font-bold text-darkGreen mb-3 sm:mb-4 uppercase tracking-wider font-mono">
              Portals
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal-600 font-medium">
              <li>
                <Link to="/login" className="hover:text-darkGreen transition-colors">
                  Employee Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-darkGreen transition-colors">
                  Admin Console
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-darkGreen transition-colors">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Monospace Copyright Row */}
        <div className="mt-14 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] sm:text-xs text-charcoal-400">
          <div>© 2026 CogniSec Enterprise. Confidential & Proprietary.</div>
          <div className="flex items-center gap-4 text-emerald-800 font-semibold">
            <span>Security Status: Nominal</span>
            <span>•</span>
            <span>Zero Cloud Ingestion</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
