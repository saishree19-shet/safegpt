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
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-sage font-medium">
            INTELLIGENCE WITH BOUNDARIES
          </span>
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-darkGreen tracking-tight leading-[1.1]">
          Everything your team needs to know. <br className="hidden sm:inline" />
          Nothing they shouldn't.
        </h2>
      </div>

      <div className="space-y-28 md:space-y-40">
        
        {/* ========================================================================= */}
        {/* 01 / FIND */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Narrative (Left) */}
          <div className="lg:col-span-5 space-y-5">
            <span className="font-mono text-xs tracking-widest uppercase text-sage font-semibold">
              01 / FIND
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-darkGreen tracking-tight leading-tight">
              Enterprise knowledge, <br />
              one conversation.
            </h3>
            <p className="text-base sm:text-lg text-charcoal/75 leading-relaxed">
              Ask questions in plain language. Search across PDFs and Word files, and get context-aware answers that turn scattered documents into shared understanding.
            </p>
          </div>

          {/* Pale Mint Panel (Right) */}
          <div className="lg:col-span-7">
            <div className="bg-mint-100 border border-mint-border rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm">
              <div className="text-[11px] font-mono tracking-widest uppercase text-sage font-medium mb-5">
                YOUR COMPANY, CONNECTED
              </div>

              {/* 3 Document Cards */}
              <div className="space-y-3.5">
                <div className="bg-white border border-mint-border/90 rounded-xl p-4 sm:p-5 flex items-center gap-3.5 hover:border-softGreen transition-colors shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-mint-50 border border-mint-border flex items-center justify-center text-darkGreen shrink-0">
                    <FileText className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <div className="font-semibold text-darkGreen text-sm sm:text-base">
                      Employee Handbook.pdf
                    </div>
                    <div className="text-xs text-charcoal/60 mt-0.5">
                      People & culture · 42 pages
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-mint-border/90 rounded-xl p-4 sm:p-5 flex items-center gap-3.5 hover:border-softGreen transition-colors shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-mint-50 border border-mint-border flex items-center justify-center text-darkGreen shrink-0">
                    <FileText className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <div className="font-semibold text-darkGreen text-sm sm:text-base">
                      Information Security.docx
                    </div>
                    <div className="text-xs text-charcoal/60 mt-0.5">
                      Policies · 28 pages
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-mint-border/90 rounded-xl p-4 sm:p-5 flex items-center gap-3.5 hover:border-softGreen transition-colors shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-mint-50 border border-mint-border flex items-center justify-center text-darkGreen shrink-0">
                    <FileText className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <div className="font-semibold text-darkGreen text-sm sm:text-base">
                      Product Playbook.pdf
                    </div>
                    <div className="text-xs text-charcoal/60 mt-0.5">
                      Product · 64 pages
                    </div>
                  </div>
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
            <div className="bg-mint-100 border border-mint-border rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm">
              <div className="bg-white border border-mint-border rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
                <div>
                  <div className="text-[10px] font-mono tracking-wider uppercase text-sage font-semibold">
                    DOCUMENT ACCESS
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-darkGreen mt-1">
                    Q4 Financial Report.pdf
                  </h4>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-[#E3EDE0] rounded-lg px-4 py-3 text-xs sm:text-sm">
                    <span className="font-medium text-charcoal">Finance team</span>
                    <span className="text-xs text-charcoal/80">Access granted</span>
                  </div>

                  <div className="flex items-center justify-between bg-[#E3EDE0] rounded-lg px-4 py-3 text-xs sm:text-sm">
                    <span className="font-medium text-charcoal">Leadership</span>
                    <span className="text-xs text-charcoal/80">Access granted</span>
                  </div>

                  <div className="flex items-center justify-between bg-[#E3EDE0] rounded-lg px-4 py-3 text-xs sm:text-sm">
                    <span className="font-medium text-charcoal">All employees</span>
                    <span className="text-xs text-charcoal/80">Restricted</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const sec = document.getElementById('security');
                    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#205244] hover:bg-darkGreen text-white rounded-lg py-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
                >
                  View access rules
                </button>
              </div>
            </div>
          </div>

          {/* Narrative (Right) */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <span className="font-mono text-xs tracking-widest uppercase text-sage font-semibold">
              02 / CONTROL
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-darkGreen tracking-tight leading-tight">
              The right answers. <br />
              For the right people.
            </h3>
            <p className="text-base sm:text-lg text-charcoal/75 leading-relaxed">
              Access follows your organisation's rules. Employees retrieve only the information they're authorised to see, with permissions checked before retrieval.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 03 / PROTECT */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Narrative (Left) */}
          <div className="lg:col-span-5 space-y-5">
            <span className="font-mono text-xs tracking-widest uppercase text-sage font-semibold">
              03 / PROTECT
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-darkGreen tracking-tight leading-tight">
              Privacy comes <br />
              before processing.
            </h3>
            <p className="text-base sm:text-lg text-charcoal/75 leading-relaxed">
              Identify and protect sensitive information before it reaches the model. Keep the useful context. Leave confidential details out.
            </p>
          </div>

          {/* Pale Mint Panel (Right) */}
          <div className="lg:col-span-7">
            <div className="bg-mint-100 border border-mint-border rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm space-y-4">
              
              {/* Original Passage Card */}
              <div className="bg-white border border-mint-border rounded-xl p-5 shadow-xs">
                <div className="text-[10px] font-mono tracking-wider uppercase text-sage font-semibold mb-2">
                  ORIGINAL PASSAGE
                </div>
                <p className="text-sm text-charcoal font-mono leading-relaxed">
                  Contact Maya Patel at maya.patel@company.com. Contract value: £240,000.
                </p>
              </div>

              {/* Protected Context Card (Dark Forest Green) */}
              <div className="bg-darkGreen border border-darkGreen rounded-xl p-5 shadow-sm text-white">
                <div className="text-[10px] font-mono tracking-wider uppercase text-softGreen font-semibold mb-2">
                  PROTECTED CONTEXT
                </div>
                <p className="text-sm font-mono leading-relaxed text-mint-50">
                  Contact <span className="text-softGreen font-semibold">[PERSON]</span> at <span className="text-softGreen font-semibold">[EMAIL]</span>. Contract value: <span className="text-softGreen font-semibold">[FINANCIAL DATA]</span>.
                </p>
              </div>

              <div className="text-xs text-charcoal/60 pt-1 font-mono text-center sm:text-left">
                Sensitive details protected before model processing.
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
            <div className="bg-darkGreen border border-darkGreen/80 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl">
              <div className="text-[10px] font-mono tracking-widest uppercase text-softGreen font-medium mb-6">
                WITHIN YOUR SECURITY BOUNDARY
              </div>

              <div className="space-y-3.5">
                <div className="bg-[#24473B] border border-white/10 rounded-xl p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-softGreen">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-white">Company documents</div>
                      <div className="text-xs text-mint-200/70">Private on-premise or VPC store</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-softGreen bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    Encrypted
                  </span>
                </div>

                <div className="bg-[#24473B] border border-white/10 rounded-xl p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-softGreen">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-white">Permission-aware retrieval</div>
                      <div className="text-xs text-mint-200/70">Authorised user context only</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-softGreen bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    SQL ACL
                  </span>
                </div>

                <div className="bg-[#24473B] border border-white/10 rounded-xl p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-softGreen">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-white">Local AI model</div>
                      <div className="text-xs text-mint-200/70">No external AI API required</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-softGreen bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    Local Model (Ollama)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative (Right) */}
          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <span className="font-mono text-xs tracking-widest uppercase text-sage font-semibold">
              04 / KEEP LOCAL
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-darkGreen tracking-tight leading-tight">
              Your infrastructure. <br />
              Your intelligence.
            </h3>
            <p className="text-base sm:text-lg text-charcoal/75 leading-relaxed">
              Designed to run AI locally, so company documents don't need to be sent to external AI APIs. Keep control of where knowledge is processed.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 05 / VERIFY */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Narrative (Left) */}
          <div className="lg:col-span-5 space-y-5">
            <span className="font-mono text-xs tracking-widest uppercase text-sage font-semibold">
              05 / VERIFY
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-darkGreen tracking-tight leading-tight">
              An answer you <br />
              can trace back.
            </h3>
            <p className="text-base sm:text-lg text-charcoal/75 leading-relaxed">
              See the document, the page and the passage behind every response. Give your team a clear path from an answer to its evidence.
            </p>
          </div>

          {/* Pale Mint Panel (Right) */}
          <div className="lg:col-span-7">
            <div className="bg-mint-100 border border-mint-border rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm">
              <div className="text-[11px] font-mono tracking-widest uppercase text-sage font-medium mb-4">
                AUTHENTICATED EVIDENCE
              </div>

              {/* Source Document Card */}
              <div className="bg-white border border-mint-border rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-mint-50 border border-mint-border flex items-center justify-center text-darkGreen">
                      <BookmarkCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-darkGreen text-base">
                        Employee Handbook.pdf
                      </h4>
                      <div className="text-xs text-charcoal/60 mt-0.5">
                        Page 28 · Section 3.1 Leave Entitlement
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-darkGreen bg-mint-100 border border-mint-border px-2.5 py-1 rounded-full">
                    Authorised Source
                  </span>
                </div>

                <div className="bg-[#FAFBF9] border-l-3 border-darkGreen p-3.5 rounded-r-lg text-xs sm:text-sm text-charcoal/85 italic leading-relaxed">
                  "Eligible full-time employees accrue 25 days of annual paid leave, prorated based on employment commencement date and subject to departmental approval."
                </div>

                <div className="flex items-center justify-between text-xs text-charcoal/60 pt-2 border-t border-gray-100 font-mono">
                  <span>Backend Chunk ID: #142</span>
                  <span className="text-softGreen font-medium">100% Factually Grounded</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

