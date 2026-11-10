import React from 'react';
import {
  FileText,
  Shield,
  Check,
  Lock,
  Server,
  Layers,
  Cpu,
  BookmarkCheck,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      {/* Feature Section Header */}
      <div className="mb-20 md:mb-28 max-w-3xl">
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs tracking-wider uppercase font-semibold">
            INTELLIGENCE WITH STRICT BOUNDARIES
          </span>
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-darkGreen tracking-tight leading-[1.08]">
          Everything your team needs to know. <br className="hidden sm:inline" />
          <span className="text-emerald-700">Nothing they shouldn't.</span>
        </h2>
      </div>

      <div className="space-y-28 md:space-y-36">
        
        {/* ========================================================================= */}
        {/* 01 / FIND */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Narrative (Left) */}
          <div className="lg:col-span-5 space-y-5">
            <span className="font-mono text-xs tracking-widest uppercase text-emerald-800 font-bold">
              01 / DISCOVER & SEARCH
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-darkGreen tracking-tight leading-tight">
              Enterprise knowledge, <br />
              unified in one chat.
            </h3>
            <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed font-normal">
              Ask questions in natural language. Search across thousands of pages in PDFs and Word documents, and receive context-rich answers that turn scattered files into actionable insights.
            </p>
          </div>

          {/* Clean Panel (Right) */}
          <div className="lg:col-span-7">
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm">
              <div className="text-[11px] font-mono tracking-widest uppercase text-charcoal-500 font-semibold mb-5">
                INDEXED ENTERPRISE REPOSITORIES
              </div>

              {/* 3 Document Cards */}
              <div className="space-y-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:border-emerald-300 transition-colors shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <FileText className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <div className="font-semibold text-darkGreen text-sm sm:text-base">
                      Employee Handbook.pdf
                    </div>
                    <div className="text-xs text-charcoal-500 font-medium mt-0.5">
                      People & Culture · 42 pages · PyMuPDF indexed
                    </div>
                  </div>
                  <span className="ml-auto text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                    Indexed
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:border-emerald-300 transition-colors shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <FileText className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <div className="font-semibold text-darkGreen text-sm sm:text-base">
                      Information Security.docx
                    </div>
                    <div className="text-xs text-charcoal-500 font-medium mt-0.5">
                      IT & Security Policies · 28 sections · Validated
                    </div>
                  </div>
                  <span className="ml-auto text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                    Indexed
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:border-emerald-300 transition-colors shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <FileText className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <div className="font-semibold text-darkGreen text-sm sm:text-base">
                      Product Architecture Playbook.pdf
                    </div>
                    <div className="text-xs text-charcoal-500 font-medium mt-0.5">
                      Engineering · 64 pages · Vector Chunks
                    </div>
                  </div>
                  <span className="ml-auto text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                    Indexed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 02 / CONTROL */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Pale Mint Panel (Left) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                <div>
                  <div className="text-[10px] font-mono tracking-wider uppercase text-emerald-800 font-bold">
                    ZERO-TRUST ACCESS PERMISSIONS
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-darkGreen mt-1">
                    Q4 Financial Report.pdf
                  </h4>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-xl px-4 py-3 text-xs sm:text-sm">
                    <span className="font-semibold text-charcoal-800">Finance team</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Access Granted
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-xl px-4 py-3 text-xs sm:text-sm">
                    <span className="font-semibold text-charcoal-800">Executive Leadership</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Access Granted
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-xl px-4 py-3 text-xs sm:text-sm">
                    <span className="font-semibold text-charcoal-800">General Employees</span>
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      Restricted (SQL Filtered)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const sec = document.getElementById('security');
                    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-darkGreen hover:bg-darkGreen-800 text-white rounded-xl py-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs"
                >
                  Explore Permission Model
                </button>
              </div>
            </div>
          </div>

          {/* Narrative (Right) */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <span className="font-mono text-xs tracking-widest uppercase text-emerald-800 font-bold">
              02 / ACCESS CONTROL
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-darkGreen tracking-tight leading-tight">
              The right answers. <br />
              For the right people.
            </h3>
            <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed font-normal">
              Access permissions are enforced before retrieval. Even with admin privileges, users cannot retrieve confidential text unless explicitly authorized on that specific document.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 03 / PROTECT */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Narrative (Left) */}
          <div className="lg:col-span-5 space-y-5">
            <span className="font-mono text-xs tracking-widest uppercase text-emerald-800 font-bold">
              03 / PRIVACY GUARDRAILS
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-darkGreen tracking-tight leading-tight">
              Privacy comes <br />
              before processing.
            </h3>
            <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed font-normal">
              Automated detectors sanitize personal identifiers, contact details, API keys, and credentials before prompt construction. Retain the semantic knowledge while redacting confidential tokens.
            </p>
          </div>

          {/* Pale Mint Panel (Right) */}
          <div className="lg:col-span-7">
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm space-y-4">
              
              {/* Original Passage Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="text-[10px] font-mono tracking-wider uppercase text-charcoal-400 font-bold mb-2 flex items-center justify-between">
                  <span>ORIGINAL RAW TEXT</span>
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono">Contains PII</span>
                </div>
                <p className="text-sm text-charcoal-800 font-mono leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  Contact Maya Patel at maya.patel@company.com. Key: sk-live-9938210. Value: $240,000.
                </p>
              </div>

              {/* Protected Context Card (Dark Forest Green) */}
              <div className="bg-gradient-to-br from-darkGreen-900 to-darkGreen-950 border border-darkGreen-800 rounded-xl p-5 shadow-md text-white">
                <div className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-bold mb-2 flex items-center justify-between">
                  <span>SANITIZED CONTEXT SENT TO LLM</span>
                  <span className="text-emerald-300 bg-white/10 px-2 py-0.5 rounded font-mono">Protected</span>
                </div>
                <p className="text-sm font-mono leading-relaxed text-emerald-50 bg-black/25 p-3 rounded-lg border border-white/10">
                  Contact <span className="text-emerald-400 font-semibold">[PERSON]</span> at <span className="text-emerald-400 font-semibold">[EMAIL]</span>. Key: <span className="text-emerald-400 font-semibold">[API_KEY]</span>. Value: <span className="text-emerald-400 font-semibold">[FINANCIAL]</span>.
                </p>
              </div>

              <div className="text-xs text-charcoal-500 pt-1 font-mono text-center sm:text-left font-medium">
                Automated privacy filtering prevents sensitive entity leakage into model context.
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 04 / KEEP LOCAL */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Dark Forest Green Panel (Left) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="bg-gradient-to-b from-darkGreen-900 to-darkGreen-950 border border-darkGreen-800 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl ring-1 ring-white/10">
              <div className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold mb-6">
                WITHIN YOUR SECURE PERIMETER
              </div>

              <div className="space-y-3.5">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 flex items-center justify-between hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-white">Company Documents Store</div>
                      <div className="text-xs text-slate-300/80">Private local filesystem + SQLite/Postgres</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-white/10 border border-white/10 px-2.5 py-1 rounded">
                    Encrypted
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 flex items-center justify-between hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-white">Permission Authorization Engine</div>
                      <div className="text-xs text-slate-300/80">Zero-trust SQL per-document checks</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-white/10 border border-white/10 px-2.5 py-1 rounded">
                    Zero-Trust
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 flex items-center justify-between hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-white">Local Ollama LLM Runtime</div>
                      <div className="text-xs text-slate-300/80">llama3.2 + nomic-embed-text (offline)</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-white/10 border border-white/10 px-2.5 py-1 rounded">
                    Offline
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative (Right) */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <span className="font-mono text-xs tracking-widest uppercase text-emerald-800 font-bold">
              04 / SOVEREIGN AI
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-darkGreen tracking-tight leading-tight">
              Your hardware. <br />
              Your intelligence.
            </h3>
            <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed font-normal">
              Execute modern open-weights language models entirely on your own machines. No API keys to manage, no telemetry sent to third parties, and complete compliance sovereignty.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 05 / VERIFY */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Narrative (Left) */}
          <div className="lg:col-span-5 space-y-5">
            <span className="font-mono text-xs tracking-widest uppercase text-emerald-800 font-bold">
              05 / AUDIT & CITATIONS
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-darkGreen tracking-tight leading-tight">
              Every single claim <br />
              traced to its origin.
            </h3>
            <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed font-normal">
              Say goodbye to AI hallucinations. Every synthesized sentence is validated against authorized source chunks with page numbers, document titles, and similarity metrics.
            </p>
          </div>

          {/* Pale Mint Panel (Right) */}
          <div className="lg:col-span-7">
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm">
              <div className="text-[11px] font-mono tracking-widest uppercase text-charcoal-500 font-semibold mb-4">
                AUTHENTICATED EVIDENCE CHAIN
              </div>

              {/* Source Document Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                      <BookmarkCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-darkGreen text-base">
                        Employee Handbook.pdf
                      </h4>
                      <div className="text-xs text-charcoal-500 font-medium mt-0.5">
                        Page 28 · Section 3.1 Leave Entitlement
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Authorised Source
                  </span>
                </div>

                <div className="bg-slate-50 border-l-4 border-emerald-600 p-4 rounded-r-xl text-xs sm:text-sm text-charcoal-800 italic leading-relaxed">
                  "Eligible full-time employees accrue 25 days of annual paid leave, prorated based on employment commencement date and subject to departmental approval."
                </div>

                <div className="flex items-center justify-between text-xs text-charcoal-500 pt-2 border-t border-slate-100 font-mono">
                  <span>Chunk Reference: #142</span>
                  <span className="text-emerald-700 font-semibold">100% Factually Grounded</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
