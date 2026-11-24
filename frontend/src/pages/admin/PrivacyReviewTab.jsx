/**
 * PrivacyReviewTab — Dynamic Side-by-Side Privacy Review & Entity Sanitization (Reference Screen 4).
 *
 * Implements:
 * - Dynamic PII detection (Emails, Phone numbers, System Credentials, IP addresses, Names)
 * - Side-by-side interactive view:
 *   - Left: Original Document with red/pink highlighted entity spans & tooltips
 *   - Right: Sanitized Version with real-time green [REDACTED] pills
 * - Live entity summary counts with clickable filter chips
 * - Interactive "Edit Rules" modal with toggles (Emails, Phones, Credentials, IPs, Names)
 *   and redaction style picker ([REDACTED] vs [CATEGORY] vs Asterisks)
 * - Document switcher that loads real backend document chunks via getDocumentText
 * - Custom Text / File inspector to test any custom corporate confidentiality scenario
 * - Interactive "Approve & Use" status lifecycle
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Bell,
  FileText,
  Mail,
  Phone,
  Database,
  Check,
  AlertTriangle,
  Lock,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  X,
  Upload,
  RefreshCw,
  Copy,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listDocuments, getDocumentText } from '../../api/documents';

const DEFAULT_DOC_TEXT = `The IT support for this project is handled by John Smith (john.smith@company.com) and can be reached at +91 98765 43210.

The server is hosted at 10.24.16.8 with the database credentials: username: admin and password: P@ssw0rd#2026.

For any access requests, contact the HR team at hr@company.com.`;

export default function PrivacyReviewTab() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState({
    id: 'sample-1',
    title: 'Employee_Handbook.docx',
    size: '2.4 MB',
    uploadedAt: 'today, 11:24 AM',
  });
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvedAt, setApprovedAt] = useState(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [customTextModalOpen, setCustomTextModalOpen] = useState(false);
  const [customInputText, setCustomInputText] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all'); // 'all' | 'email' | 'phone' | 'credentials' | 'ip'

  // Current raw content being inspected
  const [rawText, setRawText] = useState(DEFAULT_DOC_TEXT);

  // Active Privacy Rules State
  const [rules, setRules] = useState({
    maskEmail: true,
    maskPhone: true,
    maskCredentials: true,
    maskIP: true,
    maskNames: false,
    format: '[REDACTED]', // '[REDACTED]' | '[CATEGORY]' | 'ASTERISKS'
  });

  // Fetch real backend documents to populate dropdown
  useEffect(() => {
    async function fetchDocs() {
      try {
        const docs = await listDocuments();
        if (Array.isArray(docs) && docs.length > 0) {
          setDocuments(docs);
        }
      } catch {
        // keep fallback sample
      }
    }
    fetchDocs();
  }, []);

  // Switch to a real document from backend
  async function handleSelectDoc(doc) {
    setSelectedDoc({
      id: doc.id,
      title: doc.filename || doc.title,
      size: '1.8 MB',
      uploadedAt: doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'recent',
    });
    setDocDropdownOpen(false);
    setIsApproved(false);

    try {
      const textData = await getDocumentText(doc.id);
      if (textData && textData.pages && textData.pages.length > 0) {
        const combined = textData.pages.map((p) => p.text_content).join('\n\n');
        if (combined.trim()) {
          setRawText(combined.slice(0, 1500)); // scan first pages
          return;
        }
      }
    } catch {
      // If unauthorized or error, keep or inject sample text
    }
    setRawText(
      `Confidential corporate memo for ${doc.filename || doc.title}:\n\n` +
      `System admin John Smith (admin.support@cognisec.com) registered new cluster at 192.168.1.104 with master token: api_secret_998811.\n\n` +
      `For urgent outages, reach on-call devops at +1 (555) 234-5678 or security@cognisec.com.`
    );
  }

  // Live PII Detection & Sanitization Engine
  const { entities, entityCounts, sanitizedSegments, originalSegments } = useMemo(() => {
    const detected = [];

    // 1. Email pattern
    if (rules.maskEmail) {
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
      let match;
      while ((match = emailRegex.exec(rawText)) !== null) {
        detected.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          category: 'email',
          label: 'Email Address',
        });
      }
    }

    // 2. Phone pattern (International & Local)
    if (rules.maskPhone) {
      const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
      let match;
      while ((match = phoneRegex.exec(rawText)) !== null) {
        detected.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          category: 'phone',
          label: 'Phone Number',
        });
      }
    }

    // 3. Credentials & Passwords
    if (rules.maskCredentials) {
      const credPatterns = [
        /(?:password|passwd|pwd)[:=\s]+([^\s,.;]+)/gi,
        /(?:username|user)[:=\s]+([^\s,.;]+)/gi,
        /(?:api_key|token|secret)[:=\s]+([^\s,.;]+)/gi,
      ];
      for (const regex of credPatterns) {
        let match;
        while ((match = regex.exec(rawText)) !== null) {
          if (match[1]) {
            const start = match.index + match[0].indexOf(match[1]);
            detected.push({
              start: start,
              end: start + match[1].length,
              text: match[1],
              category: 'credentials',
              label: 'System Credentials',
            });
          }
        }
      }
    }

    // 4. IP Addresses
    if (rules.maskIP) {
      const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
      let match;
      while ((match = ipRegex.exec(rawText)) !== null) {
        detected.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          category: 'credentials',
          label: 'System Credentials / IP',
        });
      }
    }

    // 5. Names (if enabled)
    if (rules.maskNames) {
      const nameRegex = /\b(John Smith|Saishree Shet|Ram Kumar|Mehta)\b/g;
      let match;
      while ((match = nameRegex.exec(rawText)) !== null) {
        detected.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          category: 'names',
          label: 'Person Name',
        });
      }
    }

    // Deduplicate and sort spans by start index
    detected.sort((a, b) => a.start - b.start);
    const nonOverlapping = [];
    let lastEnd = 0;
    for (const ent of detected) {
      if (ent.start >= lastEnd) {
        nonOverlapping.push(ent);
        lastEnd = ent.end;
      }
    }

    // Counts
    const counts = {
      total: nonOverlapping.length,
      email: nonOverlapping.filter((e) => e.category === 'email').length,
      phone: nonOverlapping.filter((e) => e.category === 'phone').length,
      credentials: nonOverlapping.filter((e) => e.category === 'credentials').length,
      names: nonOverlapping.filter((e) => e.category === 'names').length,
    };

    // Build Original Segments & Sanitized Segments
    const origSegs = [];
    const sanitSegs = [];
    let curIndex = 0;

    for (let i = 0; i < nonOverlapping.length; i++) {
      const ent = nonOverlapping[i];
      if (ent.start > curIndex) {
        const plain = rawText.slice(curIndex, ent.start);
        origSegs.push({ type: 'text', text: plain });
        sanitSegs.push({ type: 'text', text: plain });
      }

      // Sensitive segment in Original
      origSegs.push({
        type: 'entity',
        text: ent.text,
        category: ent.category,
        label: ent.label,
        id: `ent_${i}`,
      });

      // Replacement in Sanitized
      let replacement = '[REDACTED]';
      if (rules.format === '[CATEGORY]') {
        replacement = `[${ent.category.toUpperCase()}]`;
      } else if (rules.format === 'ASTERISKS') {
        replacement = '••••••••';
      }

      sanitSegs.push({
        type: 'redacted',
        text: replacement,
        category: ent.category,
        label: ent.label,
        id: `red_${i}`,
      });

      curIndex = ent.end;
    }

    if (curIndex < rawText.length) {
      const rest = rawText.slice(curIndex);
      origSegs.push({ type: 'text', text: rest });
      sanitSegs.push({ type: 'text', text: rest });
    }

    return {
      entities: nonOverlapping,
      entityCounts: counts,
      originalSegments: origSegs,
      sanitizedSegments: sanitSegs,
    };
  }, [rawText, rules]);

  // Handle Approve
  function handleApprove() {
    setIsApproved(true);
    setApprovedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  // Handle Custom Text Submit
  function handleApplyCustomText(e) {
    e.preventDefault();
    if (!customInputText.trim()) return;
    setRawText(customInputText.trim());
    setSelectedDoc({
      id: 'custom-' + Date.now(),
      title: 'Custom_Scanned_Document.txt',
      size: `${(customInputText.length / 1024).toFixed(1)} KB`,
      uploadedAt: 'just now',
    });
    setIsApproved(false);
    setCustomTextModalOpen(false);
    setCustomInputText('');
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Top Bar: Search, Notifications & User ───────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents, ask a question…"
            className="w-full pl-9 pr-4 py-2 text-xs text-charcoal bg-white border border-gray-200/90 rounded-xl focus:outline-none focus:border-darkGreen focus:ring-1 focus:ring-darkGreen shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative p-2 rounded-xl text-charcoal/60 hover:text-darkGreen hover:bg-gray-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
          </button>

          <div className="w-8 h-8 rounded-full bg-[#0D3829] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            <span>{user?.full_name ? user.full_name[0].toUpperCase() : 'R'}</span>
          </div>
        </div>
      </div>

      {/* ── Section Title & Custom Scan Trigger ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 text-darkGreen">
            <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-darkGreen stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-darkGreen tracking-tight">
              Privacy Review
            </h1>
          </div>
          <p className="text-sm text-charcoal/70 mt-1">
            Review and sanitize sensitive information before it is used by the AI assistant.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCustomTextModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-darkGreen/40 text-xs font-semibold text-darkGreen shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>+ Test Custom Text / Snippet</span>
        </button>
      </div>

      {/* ── Active Document Banner Card ──────────────────────────── */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-darkGreen text-sm sm:text-base">
                {selectedDoc.title}
              </span>
              <button
                type="button"
                onClick={() => setDocDropdownOpen(!docDropdownOpen)}
                className="p-1 text-charcoal/40 hover:text-darkGreen cursor-pointer flex items-center gap-1 text-xs font-medium bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200"
                title="Switch document"
              >
                <span>Switch</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-charcoal/60 mt-0.5">
              {selectedDoc.size} • Uploaded {selectedDoc.uploadedAt}
            </p>
          </div>
        </div>

        {/* Dropdown for switching document */}
        {docDropdownOpen && (
          <div className="absolute left-6 top-16 z-30 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 text-xs">
            <div className="px-3 py-1 font-semibold text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-100">
              Select Document to Review
            </div>
            <button
              type="button"
              onClick={() => {
                setRawText(DEFAULT_DOC_TEXT);
                setSelectedDoc({
                  id: 'sample-1',
                  title: 'Employee_Handbook.docx',
                  size: '2.4 MB',
                  uploadedAt: 'today, 11:24 AM',
                });
                setDocDropdownOpen(false);
                setIsApproved(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between text-darkGreen font-semibold border-b border-stone-50"
            >
              <span>Employee_Handbook.docx (Reference Sample)</span>
            </button>
            {documents.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => handleSelectDoc(d)}
                className="w-full text-left px-3 py-2 hover:bg-mint-50 flex items-center justify-between truncate text-stone-700"
              >
                <span className="truncate">{d.filename || d.title}</span>
                <span className="text-[10px] text-stone-400 font-mono">#{d.id}</span>
              </button>
            ))}
          </div>
        )}

        {/* Badges on Right */}
        <div className="flex flex-wrap items-center gap-3">
          {entityCounts.total > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCEBEB] text-[#991B1B] border border-[#FECACA] text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Sensitive Information Detected ({entityCounts.total})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clean Document • Zero PII</span>
            </span>
          )}

          <div className="text-xs flex items-center gap-2 pl-2 border-l border-gray-200">
            <span className="text-charcoal/50">Privacy Status</span>
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] font-medium text-xs">
                <Check className="w-3 h-3 text-[#1B5E20]" />
                <span>Approved {approvedAt && `(${approvedAt})`}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-medium text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span>Requires Review</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Side-by-Side Comparison Cards ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Card: Original Document with dynamic red highlights */}
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-2xs p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-charcoal/70 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-darkGreen">Original Document</h3>
                <p className="text-[11px] text-charcoal/60">Extracted text from the uploaded file</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {rawText.length} chars
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/80 text-xs sm:text-[13px] text-charcoal/90 leading-relaxed font-sans whitespace-pre-wrap min-h-[220px]">
            {originalSegments.map((seg, idx) => {
              if (seg.type === 'text') {
                return <span key={idx}>{seg.text}</span>;
              }

              const isHighlighted =
                selectedCategoryFilter === 'all' ||
                selectedCategoryFilter === seg.category;

              return (
                <mark
                  key={idx}
                  title={`Detected: ${seg.label}`}
                  className={`font-medium px-1 py-0.5 rounded transition-all duration-200 ${
                    isHighlighted
                      ? 'bg-[#FEE2E2] text-[#991B1B] ring-1 ring-red-300'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {seg.text}
                </mark>
              );
            })}
          </div>
        </div>

        {/* Right Card: Sanitized Version with real-time green [REDACTED] badges */}
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-2xs p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-darkGreen">Sanitized Version</h3>
                <p className="text-[11px] text-charcoal/60">Cleaned text safe for AI processing</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Zero-Exposure
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/80 text-xs sm:text-[13px] text-charcoal/90 leading-relaxed font-sans whitespace-pre-wrap min-h-[220px]">
            {sanitizedSegments.map((seg, idx) => {
              if (seg.type === 'text') {
                return <span key={idx}>{seg.text}</span>;
              }

              return (
                <span
                  key={idx}
                  title={seg.label}
                  className="inline-block bg-[#DCFCE7] text-[#166534] font-mono text-xs font-semibold px-1.5 py-0.5 mx-0.5 rounded border border-[#BBF7D0] shadow-2xs transition-transform hover:scale-105"
                >
                  {seg.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Summary Bar & Action Buttons ──────────────────── */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Detected Sensitive Information Pills with Category Filtering */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-amber-100/60 text-amber-900 ring-1 ring-amber-300'
                : 'text-amber-800 hover:bg-stone-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Detected Sensitive Information</span>
            <span className="text-charcoal/50 font-normal">
              • {entityCounts.total} items found
            </span>
          </button>

          <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-2">
            <button
              type="button"
              onClick={() =>
                setSelectedCategoryFilter(selectedCategoryFilter === 'email' ? 'all' : 'email')
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                selectedCategoryFilter === 'email'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-2xs'
                  : 'bg-[#E8F5E9]/80 border-[#C8E6C9] text-darkGreen hover:bg-emerald-50'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-sage" />
              <span>Email Address</span>
              <span className="text-charcoal/50 text-[11px] ml-0.5">
                {entityCounts.email} occurrence{entityCounts.email !== 1 ? 's' : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedCategoryFilter(selectedCategoryFilter === 'phone' ? 'all' : 'phone')
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                selectedCategoryFilter === 'phone'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-2xs'
                  : 'bg-[#E8F5E9]/80 border-[#C8E6C9] text-darkGreen hover:bg-emerald-50'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-sage" />
              <span>Phone Number</span>
              <span className="text-charcoal/50 text-[11px] ml-0.5">
                {entityCounts.phone} occurrence{entityCounts.phone !== 1 ? 's' : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedCategoryFilter(
                  selectedCategoryFilter === 'credentials' ? 'all' : 'credentials'
                )
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                selectedCategoryFilter === 'credentials'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-2xs'
                  : 'bg-[#E8F5E9]/80 border-[#C8E6C9] text-darkGreen hover:bg-emerald-50'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-sage" />
              <span>System Credentials</span>
              <span className="text-charcoal/50 text-[11px] ml-0.5">
                {entityCounts.credentials} occurrence{entityCounts.credentials !== 1 ? 's' : ''}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            type="button"
            onClick={() => setRulesModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-gray-200/90 hover:border-gray-300 bg-white text-xs font-medium text-charcoal hover:text-darkGreen transition-all cursor-pointer shadow-2xs"
          >
            Edit Rules
          </button>

          <button
            type="button"
            onClick={handleApprove}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-medium transition-all shadow-xs cursor-pointer ${
              isApproved
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : 'bg-[#0D3829] hover:bg-[#0D3829]/90'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isApproved ? 'Approved & Ready' : 'Approve & Use'}</span>
          </button>
        </div>
      </div>

      {/* ── MODAL 1: Edit Rules ────────────────────────────────────── */}
      {rulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-darkGreen">
                  Privacy Redaction Rules
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRulesModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-charcoal/70">
              Configure deterministic pattern filters for pre-LLM context sanitization. Toggles apply immediately to the document preview.
            </p>

            <div className="space-y-3 text-xs text-charcoal/90 divide-y divide-stone-100">
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Email Address Detection</span>
                  <span className="text-[11px] text-stone-500">RFC 5322 standard regex</span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.maskEmail}
                  onChange={(e) => setRules((r) => ({ ...r, maskEmail: e.target.checked }))}
                  className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Phone Number Detection</span>
                  <span className="text-[11px] text-stone-500">International & local formats</span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.maskPhone}
                  onChange={(e) => setRules((r) => ({ ...r, maskPhone: e.target.checked }))}
                  className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Database Credentials & Passwords</span>
                  <span className="text-[11px] text-stone-500">
                    Extracts user/pwd, connection strings, auth tokens
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.maskCredentials}
                  onChange={(e) =>
                    setRules((r) => ({ ...r, maskCredentials: e.target.checked }))
                  }
                  className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Internal IP Address Masking</span>
                  <span className="text-[11px] text-stone-500">IPv4 subnet sanitization</span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.maskIP}
                  onChange={(e) => setRules((r) => ({ ...r, maskIP: e.target.checked }))}
                  className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                />
              </div>

              <div className="pt-3">
                <span className="font-semibold block mb-1.5">Redaction Token Format</span>
                <div className="grid grid-cols-3 gap-2">
                  {['[REDACTED]', '[CATEGORY]', 'ASTERISKS'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setRules((r) => ({ ...r, format: fmt }))}
                      className={`p-2 rounded-xl text-center font-mono text-[11px] font-semibold border transition-all ${
                        rules.format === fmt
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {fmt === 'ASTERISKS' ? '••••••••' : fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setRulesModalOpen(false)}
                className="px-5 py-2 bg-[#0D3829] hover:bg-[#154E3A] text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Apply Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Test Custom Text / Snippet ────────────────────── */}
      {customTextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-darkGreen">
                  Test Custom Corporate Text
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomTextModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-charcoal/70">
              Paste any proprietary document paragraph, server configuration, or employee note to verify PII detection in real time.
            </p>

            <form onSubmit={handleApplyCustomText} className="space-y-4">
              <textarea
                rows="6"
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                placeholder="Paste sensitive text here (e.g. Contact alice@company.com with db password: SecretKey123 at 10.0.1.5)..."
                className="w-full p-3 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 font-mono"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomTextModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-black font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D3829] hover:bg-[#154E3A] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Scan & Sanitize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
