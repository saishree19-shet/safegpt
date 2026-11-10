import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Lock } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="relative rounded-3xl bg-gradient-to-br from-darkGreen-900 via-darkGreen to-darkGreen-950 p-8 sm:p-12 md:p-16 text-white overflow-hidden shadow-2xl border border-darkGreen-800 ring-1 ring-white/10">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-emerald-300 font-mono text-xs tracking-wider uppercase font-semibold mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ENTERPRISE-GRADE COMPLIANCE
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
              Make company knowledge accessible. <br />
              <span className="text-emerald-400">Keep company information protected.</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 mt-5 leading-relaxed font-normal max-w-2xl">
              Equip your teams with an on-premise AI document assistant that respects SQL-level authorization, redacts sensitive entities, and eliminates unauthorized leakage.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-darkGreen-950 text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-emerald-400 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center text-sm font-semibold text-white/90 hover:text-white px-6 py-3.5 rounded-xl border border-white/20 hover:bg-white/10 transition-all"
              >
                Sign In to Workspace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
