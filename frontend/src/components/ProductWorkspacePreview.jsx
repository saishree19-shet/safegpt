import React from 'react';
import {
  Shield,
  MessageSquare,
  Files,
  Clock,
  Sparkles,
  Lock,
  ArrowUp,
  FileText,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function ProductWorkspacePreview() {
  return (
    <section id="product" className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-24 md:pb-32">
      {/* Dark Forest Green Outer Container */}
      <div className="bg-gradient-to-b from-darkGreen-900 to-darkGreen-950 rounded-2xl md:rounded-3xl p-3 sm:p-5 md:p-7 shadow-2xl border border-darkGreen-700/40 overflow-hidden ring-1 ring-white/10">
        {/* Window controls bar */}
        <div className="flex items-center justify-between pb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-[11px] font-mono text-emerald-300/60 uppercase tracking-widest hidden sm:inline">
            cognisec-enterprise-instance // port 8001
          </span>
          <div className="w-10"></div>
        </div>

        {/* Workspace Window Container */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200/90 shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Workspace Sidebar */}
          <div className="lg:col-span-3 bg-slate-50/80 border-b lg:border-b-0 lg:border-r border-slate-200/80 p-5 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Brand in preview */}
              <div className="flex items-center gap-2.5 pb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-darkGreen flex items-center justify-center text-white shadow-xs">
                  <Shield className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-darkGreen leading-tight">CogniSec</div>
                  <div className="text-[10px] text-emerald-800 font-semibold tracking-wider uppercase">ENTERPRISE WORKSPACE</div>
                </div>
              </div>

              {/* Navigation List */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono tracking-wider uppercase text-charcoal-400 px-2.5 mb-1.5 font-semibold">
                  WORKSPACE
                </div>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-50 text-darkGreen font-semibold text-xs shadow-2xs border border-emerald-200/90">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ask CogniSec</span>
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-charcoal-600 hover:bg-white font-medium text-xs transition-colors">
                  <Files className="w-3.5 h-3.5 text-slate-500" />
                  <span>My Documents</span>
                  <span className="ml-auto text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-full font-semibold text-charcoal-700">14</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-charcoal-600 hover:bg-white font-medium text-xs transition-colors">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Recent Questions</span>
                </button>
              </div>

              {/* Sample Document List */}
              <div className="space-y-1.5 pt-2 hidden sm:block">
                <div className="text-[10px] font-mono tracking-wider uppercase text-charcoal-400 px-2.5 mb-1 font-semibold">
                  INDEXED REPOSITORIES
                </div>
                <div className="px-2.5 py-1.5 text-xs text-charcoal-700 flex items-center justify-between bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                  <span className="truncate font-medium">Information Security.docx</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">v2.4</span>
                </div>
                <div className="px-2.5 py-1.5 text-xs text-charcoal-700 flex items-center justify-between bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                  <span className="truncate font-medium">Employee Handbook.pdf</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">2026</span>
                </div>
              </div>
            </div>

            {/* Privacy indicator footer in sidebar */}
            <div className="pt-6 border-t border-slate-200 mt-4">
              <div className="flex items-start gap-2.5 text-[11px] text-charcoal-600 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="leading-snug">
                  <strong className="text-darkGreen block font-semibold">Local Privacy Active</strong>
                  Zero context transmitted to third-party model providers.
                </p>
              </div>
            </div>
          </div>

          {/* Main Chat/Assistant Area */}
          <div className="lg:col-span-9 p-5 sm:p-7 md:p-8 flex flex-col justify-between bg-white">
            <div>
              {/* Header inside assistant */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-darkGreen">
                    Knowledge Assistant
                  </h3>
                  <p className="text-xs text-charcoal-500 font-medium">
                    Querying 3 authorized department document collections
                  </p>
                </div>
                
                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    LOCAL AI / PRIVATE
                  </span>
                  <span className="text-[10px] font-mono uppercase text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded font-medium">
                    INTERACTIVE DEMO
                  </span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="py-6 space-y-6">
                {/* User Prompt */}
                <div className="flex items-start justify-end gap-3">
                  <div className="bg-darkGreen text-white px-4 py-2.5 rounded-2xl rounded-tr-xs text-sm max-w-lg shadow-xs leading-relaxed font-medium">
                    What is our company's data retention policy?
                  </div>
                </div>

                {/* Assistant Response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="space-y-4 max-w-2xl">
                    <div className="bg-slate-50/70 border border-slate-200/90 p-4 sm:p-5 rounded-2xl rounded-tl-xs text-sm text-charcoal-800 leading-relaxed space-y-3">
                      <p>
                        According to the <strong className="text-darkGreen font-semibold">Information Security Policy (Section 4.2)</strong>, company records are retained according to the following schedule:
                      </p>
                      <ul className="list-disc list-inside space-y-1.5 text-charcoal-700 text-[13px] pl-1 font-normal">
                        <li><strong className="text-charcoal-900 font-semibold">Financial and accounting records:</strong> 7 years from transaction date.</li>
                        <li><strong className="text-charcoal-900 font-semibold">Employee personnel and HR files:</strong> 5 years post-termination.</li>
                        <li><strong className="text-charcoal-900 font-semibold">General internal correspondence:</strong> 1 year active retention.</li>
                      </ul>
                      <p className="text-xs text-charcoal-500 pt-2 border-t border-slate-200 font-medium">
                        Confidential employee identifiers and personal data undergo automated sanitization before context ingestion.
                      </p>
                    </div>

                    {/* Grounded Source Cards */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Source Documents (2)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Source Card 1 */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors flex items-start gap-2.5 shadow-2xs">
                          <FileText className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-darkGreen truncate">
                              Information Security.docx
                            </div>
                            <div className="text-[11px] text-charcoal-500 font-medium">
                              Section 4.2 · Page 12 · Chunk 3
                            </div>
                            <div className="text-[10px] text-emerald-700 font-mono font-semibold mt-0.5">
                              0.94 cosine similarity
                            </div>
                          </div>
                        </div>

                        {/* Source Card 2 */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors flex items-start gap-2.5 shadow-2xs">
                          <FileText className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-darkGreen truncate">
                              Employee Handbook.pdf
                            </div>
                            <div className="text-[11px] text-charcoal-500 font-medium">
                              Record Schedules · Page 28
                            </div>
                            <div className="text-[10px] text-emerald-700 font-mono font-semibold mt-0.5">
                              0.89 cosine similarity
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-2xs">
                <input
                  type="text"
                  readOnly
                  value="How are employee medical and personal records disposed of?"
                  className="bg-transparent w-full text-xs sm:text-sm text-charcoal-700 font-medium focus:outline-none cursor-default"
                />
                <button
                  aria-label="Send query"
                  className="w-7 h-7 rounded-lg bg-darkGreen text-white flex items-center justify-center shrink-0 hover:bg-darkGreen-800 transition-colors shadow-2xs"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-[11px] text-center text-charcoal-400 mt-2 font-mono">
                Illustrative sample preview · Backend retrieval validated against SQL-level ACLs
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

