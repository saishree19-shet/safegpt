import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function CodeSnippet({ code, language = 'bash' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group bg-[#131612] border border-[#272B24] rounded-xl overflow-hidden my-4 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#181C16] border-b border-[#272B24]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sage" />
          <span className="font-mono text-[11px] text-sage tracking-wider uppercase">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-sage hover:text-softGreen transition-colors px-2 py-1 rounded bg-[#20251E] border border-white/5 active:scale-95"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-softGreen" />
              <span className="text-softGreen text-[11px] font-mono">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 sm:p-5 font-mono text-xs sm:text-[13px] text-[#E3ECE0] overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function GetStartedSection() {
  const [activeSection, setActiveSection] = useState('get-started');

  const navItems = [
    { id: 'prerequisites', label: 'Prerequisites' },
    { id: 'get-started', label: 'Get started' },
    { id: 'local-llm', label: 'Local AI (Ollama)' },
    { id: 'backend-setup', label: 'Backend & Database' },
    { id: 'frontend-workspace', label: 'Frontend Workspace' },
    { id: 'first-query', label: 'First Employee Query' },
  ];

  const scrollToAnchor = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="get-started"
      className="py-20 md:py-28 bg-[#0F120E] text-cream border-t border-b border-[#22271F] scroll-mt-16"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Main Content Column (Left ~8 cols) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Header intro */}
            <div>
              <div className="text-[11px] sm:text-xs font-mono tracking-[0.16em] uppercase text-sage font-medium mb-3">
                EMPLOYEE & DEVELOPER SETUP GUIDE
              </div>
              <h2 className="text-3xl sm:text-[36px] lg:text-[38px] font-semibold tracking-tight text-white leading-[1.18]">
                Get started
              </h2>
              <p className="mt-4 text-[15px] sm:text-base text-cream/75 leading-relaxed font-normal">
                Follow this quick guide to run CogniSec on your workstation or internal enterprise server. All document processing, vector search, and model inference run strictly offline within your boundary.
              </p>
            </div>

            {/* Section 1: Prerequisites */}
            <div id="prerequisites" className="scroll-mt-24 space-y-4 pt-4 border-t border-[#22271F]">
              <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
                <span>01.</span>
                <span>Prerequisites</span>
              </h3>
              <p className="text-sm sm:text-base text-cream/75 leading-relaxed">
                Ensure you have the following system dependencies installed on your environment:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-[#151914] border border-[#262C23] p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">Python 3.10+</div>
                    <div className="text-xs text-sage">FastAPI & RAG pipeline</div>
                  </div>
                  <span className="font-mono text-xs text-softGreen bg-softGreen/10 px-2 py-0.5 rounded border border-softGreen/20">
                    v3.11.9
                  </span>
                </div>
                <div className="bg-[#151914] border border-[#262C23] p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">Node.js & npm</div>
                    <div className="text-xs text-sage">React 18 + Vite frontend</div>
                  </div>
                  <span className="font-mono text-xs text-softGreen bg-softGreen/10 px-2 py-0.5 rounded border border-softGreen/20">
                    Node 18+
                  </span>
                </div>
                <div className="bg-[#151914] border border-[#262C23] p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">PostgreSQL</div>
                    <div className="text-xs text-sage">With pgvector extension</div>
                  </div>
                  <span className="font-mono text-xs text-softGreen bg-softGreen/10 px-2 py-0.5 rounded border border-softGreen/20">
                    v15+
                  </span>
                </div>
                <div className="bg-[#151914] border border-[#262C23] p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">Ollama</div>
                    <div className="text-xs text-sage">Local open-weight LLM</div>
                  </div>
                  <span className="font-mono text-xs text-softGreen bg-softGreen/10 px-2 py-0.5 rounded border border-softGreen/20">
                    llama3.2
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Clone repository */}
            <div id="get-started" className="scroll-mt-24 space-y-4 pt-4 border-t border-[#22271F]">
              <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
                <span>02.</span>
                <span>Clone the repository</span>
              </h3>
              <p className="text-sm sm:text-base text-cream/75 leading-relaxed">
                Clone the CogniSec project repository and navigate into the root directory:
              </p>

              <CodeSnippet
                code={`git clone https://github.com/saishree/safe-company-chatbot.git\ncd safe-company-chatbot`}
                language="bash"
              />

              <p className="text-sm text-cream/60 leading-relaxed font-light">
                The repository structure contains the <code className="bg-[#1C201A] text-softGreen px-1.5 py-0.5 rounded text-xs font-mono border border-white/5">backend/</code> (FastAPI, auth, document ingestion, ACLs), the <code className="bg-[#1C201A] text-softGreen px-1.5 py-0.5 rounded text-xs font-mono border border-white/5">frontend/</code> (React employee workspace), and the <code className="bg-[#1C201A] text-softGreen px-1.5 py-0.5 rounded text-xs font-mono border border-white/5">database/</code> schema migrations.
              </p>
            </div>

            {/* Section 3: Local LLM (Ollama) */}
            <div id="local-llm" className="scroll-mt-24 space-y-4 pt-4 border-t border-[#22271F]">
              <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
                <span>03.</span>
                <span>Configure Local AI (Ollama)</span>
              </h3>
              <p className="text-sm sm:text-base text-cream/75 leading-relaxed">
                CogniSec runs language model inference locally on your workstation using Ollama. Pull the verified <code className="bg-[#1C201A] text-softGreen px-1.5 py-0.5 rounded text-xs font-mono border border-white/5">llama3.2</code> model weights:
              </p>

              <CodeSnippet
                code={`# Pull the local model engine and weights\nollama pull llama3.2\n\n# Start Ollama service (default listens on http://localhost:11434)\nollama serve`}
                language="bash"
              />

              <p className="text-sm text-cream/60 leading-relaxed font-light">
                Subsequent requests reuse the local cached weights. Because the model runs entirely on localhost, confidential enterprise passages and employee questions never traverse third-party model APIs.
              </p>
            </div>

            {/* Section 4: Backend & Database */}
            <div id="backend-setup" className="scroll-mt-24 space-y-4 pt-4 border-t border-[#22271F]">
              <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
                <span>04.</span>
                <span>Setup Backend & Apply Migrations</span>
              </h3>
              <p className="text-sm sm:text-base text-cream/75 leading-relaxed">
                Initialize the Python virtual environment and install backend dependencies:
              </p>

              <CodeSnippet
                code={`cd backend\n\n# Create and activate Python virtual environment\npython -m venv .venv\n.\\.venv\\Scripts\\Activate.ps1    # On Windows PowerShell (or source .venv/bin/activate on macOS/Linux)\n\n# Install core packages\npip install -r requirements.txt`}
                language="powershell"
              />

              <p className="text-sm sm:text-base text-cream/75 leading-relaxed">
                Apply the idempotent SQL database migrations to prepare user accounts and document storage:
              </p>

              <CodeSnippet
                code={`# Apply zero-trust database migrations\npsql -U postgres -d safe_company_chatbot -f ../database/migrations/001_add_password_hash_to_users.sql\npsql -U postgres -d safe_company_chatbot -f ../database/migrations/002_create_document_text_pages.sql\n\n# Launch the FastAPI backend server with hot-reload\nuvicorn app.main:app --reload --port 8001`}
                language="bash"
              />

              <p className="text-sm text-cream/60 leading-relaxed font-light">
                The backend will be ready at <code className="bg-[#1C201A] text-softGreen px-1.5 py-0.5 rounded text-xs font-mono border border-white/5">http://127.0.0.1:8001</code>. Interactive OpenAPI docs are available at <code className="bg-[#1C201A] text-softGreen px-1.5 py-0.5 rounded text-xs font-mono border border-white/5">http://127.0.0.1:8001/docs</code>.
              </p>
            </div>

            {/* Section 5: Frontend Workspace */}
            <div id="frontend-workspace" className="scroll-mt-24 space-y-4 pt-4 border-t border-[#22271F]">
              <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
                <span>05.</span>
                <span>Launch the Frontend Web Workspace</span>
              </h3>
              <p className="text-sm sm:text-base text-cream/75 leading-relaxed">
                In a separate terminal window, start the React + Vite frontend application:
              </p>

              <CodeSnippet
                code={`cd frontend\n\n# Install web client dependencies\nnpm install\n\n# Start Vite development server\nnpm run dev`}
                language="bash"
              />

              <p className="text-sm text-cream/60 leading-relaxed font-light">
                Open <code className="bg-[#1C201A] text-softGreen px-1.5 py-0.5 rounded text-xs font-mono border border-white/5">http://localhost:5173</code> in your browser. All API requests are automatically reverse-proxied to port 8001.
              </p>
            </div>

            {/* Section 6: First Query Verification */}
            <div id="first-query" className="scroll-mt-24 space-y-4 pt-4 border-t border-[#22271F]">
              <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
                <span>06.</span>
                <span>Employee Login & First Secure Query</span>
              </h3>
              <p className="text-sm sm:text-base text-cream/75 leading-relaxed">
                Log into the employee portal with enterprise credentials or register a local testing account:
              </p>

              <div className="bg-[#151914] border border-[#272D24] p-5 sm:p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-softGreen/10 border border-softGreen/20 flex items-center justify-center text-softGreen text-sm font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm sm:text-base">Ready for Testing</div>
                    <div className="text-xs text-sage">Verify zero-trust retrieval in the browser</div>
                  </div>
                </div>

                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-cream/80 pl-1 leading-relaxed">
                  <li>Navigate to <Link to="/login" className="text-softGreen underline hover:text-white">Sign In</Link> and select the <strong>Employee</strong> portal role.</li>
                  <li>Go to <strong>My Documents</strong> and upload an authorized internal file (<code className="bg-[#1C201A] text-softGreen px-1 py-0.5 rounded text-xs font-mono">.pdf</code> or <code className="bg-[#1C201A] text-softGreen px-1 py-0.5 rounded text-xs font-mono">.docx</code>).</li>
                  <li>Click <strong>Ask CogniSec</strong> to ask a question. Notice that detected PII is masked, citations link directly to verified page numbers, and query records are logged in the audit stream.</li>
                </ol>

                <div className="pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 bg-darkGreen hover:bg-darkGreen/90 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg transition-colors border border-softGreen/30 shadow-xs"
                  >
                    <span>Open Employee Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Table of Contents Sidebar (Right ~4 cols) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-28 self-start pl-6 border-l border-[#22271F]">
            <div className="text-[11px] font-mono tracking-widest uppercase text-sage font-semibold mb-4">
              ON THIS PAGE
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToAnchor(item.id)}
                  className={`block w-full text-left py-1.5 text-xs transition-colors font-medium ${
                    activeSection === item.id
                      ? 'text-softGreen pl-2 border-l-2 border-softGreen -ml-[25px]'
                      : 'text-cream/60 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Quick Helper Box */}
            <div className="mt-8 p-4 rounded-xl bg-[#141813] border border-[#262C23] text-xs text-cream/70 space-y-2">
              <div className="font-semibold text-white text-xs">Need Assistance?</div>
              <p className="text-[11px] leading-relaxed text-cream/60">
                Check the backend unit tests in <code className="text-softGreen font-mono">backend/tests</code> to verify token validation, role boundaries, and zero-trust ACL policies.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
