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
      <div className="bg-darkGreen rounded-2xl md:rounded-3xl p-3 sm:p-5 md:p-8 shadow-2xl border border-darkGreen/40 overflow-hidden">
        {/* Workspace Window Container */}
        <div className="bg-[#FAFBF9] rounded-xl md:rounded-2xl border border-gray-200/80 shadow-inner overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Workspace Sidebar */}
          <div className="lg:col-span-3 bg-[#F4F7F2] border-b lg:border-b-0 lg:border-r border-gray-200/80 p-5 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Brand in preview */}
              <div className="flex items-center gap-2.5 pb-2">
                <div className="w-7 h-7 rounded-md bg-darkGreen flex items-center justify-center text-white">
                  <Shield className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-darkGreen leading-tight">CogniSec</div>
                  <div className="text-[11px] text-sage font-medium tracking-wide">ENTERPRISE WORKSPACE</div>
                </div>
              </div>

              {/* Navigation List */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono tracking-wider uppercase text-charcoal/50 px-2.5 mb-1.5 font-semibold">
                  WORKSPACE
                </div>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white text-darkGreen font-medium text-xs shadow-xs border border-gray-200/60">
                  <MessageSquare className="w-3.5 h-3.5 text-darkGreen" />
                  <span>Ask CogniSec</span>
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-softGreen"></span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-charcoal/70 hover:bg-white/60 font-medium text-xs transition-colors">
                  <Files className="w-3.5 h-3.5 text-sage" />
                  <span>My Documents</span>
                  <span className="ml-auto text-[10px] bg-gray-200/60 px-1.5 py-0.5 rounded text-charcoal/60">14</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-charcoal/70 hover:bg-white/60 font-medium text-xs transition-colors">
                  <Clock className="w-3.5 h-3.5 text-sage" />
                  <span>Recent Questions</span>
                </button>
              </div>

              {/* Sample Document List */}
              <div className="space-y-1.5 pt-2 hidden sm:block">
                <div className="text-[10px] font-mono tracking-wider uppercase text-charcoal/50 px-2.5 mb-1 font-semibold">
                  INDEXED REPOSITORIES
                </div>
                <div className="px-2.5 py-1.5 text-xs text-charcoal/80 flex items-center justify-between bg-white/40 rounded border border-transparent hover:border-gray-200/50">
                  <span className="truncate">Information Security.docx</span>
                  <span className="text-[10px] text-sage font-mono">v2.4</span>
                </div>
                <div className="px-2.5 py-1.5 text-xs text-charcoal/80 flex items-center justify-between bg-white/40 rounded border border-transparent hover:border-gray-200/50">
                  <span className="truncate">Employee Handbook.pdf</span>
                  <span className="text-[10px] text-sage font-mono">2026</span>
                </div>
              </div>
            </div>

            {/* Privacy indicator footer in sidebar */}
            <div className="pt-6 border-t border-gray-200/60 mt-4">
              <div className="flex items-start gap-2 text-[11px] text-charcoal/70 bg-white/80 p-2.5 rounded-lg border border-gray-200/60">
                <Lock className="w-3.5 h-3.5 text-darkGreen mt-0.5 shrink-0" />
                <p className="leading-tight">
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
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-gray-100">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-darkGreen">
                    Knowledge Assistant
                  </h3>
                  <p className="text-xs text-charcoal/60">
                    Querying 3 authorized department document collections
                  </p>
                </div>
                
                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium bg-mint-100 text-darkGreen border border-mint-border px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-darkGreen animate-pulse"></span>
                    LOCAL AI / PRIVATE
                  </span>
                  <span className="text-[10px] font-mono uppercase text-sage bg-gray-50 border border-gray-200 px-2 py-1 rounded">
                    MARKETING PREVIEW
                  </span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="py-6 space-y-6">
                {/* User Prompt */}
                <div className="flex items-start justify-end gap-3">
                  <div className="bg-darkGreen text-white px-4 py-2.5 rounded-2xl rounded-tr-xs text-sm max-w-lg shadow-xs leading-relaxed">
                    What is our company's data retention policy?
                  </div>
                </div>

                {/* Assistant Response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-darkGreen" />
                  </div>
                  <div className="space-y-4 max-w-2xl">
                    <div className="bg-[#F8FAF7] border border-gray-200/70 p-4 sm:p-5 rounded-2xl rounded-tl-xs text-sm text-charcoal leading-relaxed space-y-3">
                      <p>
                        According to the <strong className="text-darkGreen">Information Security Policy (Section 4.2)</strong>, company records are retained according to the following schedule:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-charcoal/85 text-[13px] pl-1">
                        <li><strong>Financial and accounting records:</strong> 7 years from transaction date.</li>
                        <li><strong>Employee personnel and HR files:</strong> 5 years post-termination.</li>
                        <li><strong>General internal correspondence:</strong> 1 year active retention.</li>
                      </ul>
                      <p className="text-xs text-charcoal/70 pt-1 border-t border-gray-200/60">
                        Confidential employee identifiers and personal data undergo automated sanitization before context ingestion.
                      </p>
                    </div>

                    {/* Grounded Source Cards */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-sage font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-darkGreen" />
                        <span>Verified Source Documents (2)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Source Card 1 */}
                        <div className="p-3 bg-white border border-gray-200 rounded-xl hover:border-softGreen transition-colors flex items-start gap-2.5 shadow-2xs">
                          <FileText className="w-4 h-4 text-darkGreen shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-darkGreen truncate">
                              Information Security.docx
                            </div>
                            <div className="text-[11px] text-charcoal/60">
                              Section 4.2 · Page 12 · Chunk 3
                            </div>
                            <div className="text-[10px] text-softGreen font-mono font-medium mt-0.5">
                              0.94 cosine similarity
                            </div>
                          </div>
                        </div>

                        {/* Source Card 2 */}
                        <div className="p-3 bg-white border border-gray-200 rounded-xl hover:border-softGreen transition-colors flex items-start gap-2.5 shadow-2xs">
                          <FileText className="w-4 h-4 text-darkGreen shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-darkGreen truncate">
                              Employee Handbook.pdf
                            </div>
                            <div className="text-[11px] text-charcoal/60">
                              Record Schedules · Page 28
                            </div>
                            <div className="text-[10px] text-softGreen font-mono font-medium mt-0.5">
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
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 bg-[#F4F7F2] border border-gray-200/80 rounded-xl px-4 py-2.5 focus-within:border-darkGreen/50 focus-within:bg-white transition-all shadow-xs">
                <input
                  type="text"
                  readOnly
                  value="How are employee medical and personal records disposed of?"
                  className="bg-transparent w-full text-xs sm:text-sm text-charcoal/70 focus:outline-none cursor-default"
                />
                <button
                  aria-label="Send query"
                  className="w-7 h-7 rounded-lg bg-darkGreen text-white flex items-center justify-center shrink-0 hover:bg-darkGreen/90 transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-[11px] text-center text-charcoal/50 mt-2 font-mono">
                Illustrative sample preview · Backend retrieval validated against SQL-level ACLs
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

