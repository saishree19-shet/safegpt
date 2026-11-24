import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const scrollTo = (id) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="relative bg-[#F3F1EC] pt-16 pb-8 text-charcoal overflow-hidden">
      {/* Decorative organic green blob – top right */}
      <div className="absolute top-0 right-0 w-[380px] h-[320px] pointer-events-none">
        <svg viewBox="0 0 380 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-30">
          <path
            d="M380 0C380 0 340 60 310 120C280 180 300 240 260 280C220 320 160 300 120 310C80 320 40 320 0 320L380 320V0Z"
            fill="#B9CEBE"
          />
          <path
            d="M380 0C380 0 350 50 330 100C310 150 320 200 290 240C260 280 200 260 160 270"
            stroke="#A3B8A5"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* ── Main Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-10 lg:gap-8 items-start pb-14 border-b border-stone-300/50">

          {/* Brand Column */}
          <div className="col-span-2 md:col-span-2 lg:col-span-3 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src="/logo-icon.png"
                alt="Cognisec"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-[#0D3829] tracking-tight">
                Cognisec
              </span>
            </Link>
            <p className="text-[13px] text-charcoal/65 leading-relaxed max-w-[200px]">
              Your company knowledge. Protected by design.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-1">
              {/* LinkedIn */}
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-[#E8ECE6] hover:bg-[#0D3829] text-[#0D3829] hover:text-white flex items-center justify-center transition-all duration-200"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>

              {/* X / Twitter */}
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-[#E8ECE6] hover:bg-[#0D3829] text-[#0D3829] hover:text-white flex items-center justify-center transition-all duration-200"
                aria-label="X"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-[#E8ECE6] hover:bg-[#0D3829] text-[#0D3829] hover:text-white flex items-center justify-center transition-all duration-200"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-[#E8ECE6] hover:bg-[#0D3829] text-[#0D3829] hover:text-white flex items-center justify-center transition-all duration-200"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-sm font-semibold text-[#0D3829] mb-4 tracking-tight">
              Product
            </h4>
            <ul className="space-y-2.5 text-[13px] text-charcoal/70">
              <li>
                <button
                  onClick={() => scrollTo('product')}
                  className="hover:text-[#0D3829] transition-colors text-left cursor-pointer"
                >
                  Platform
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('how-it-works')}
                  className="hover:text-[#0D3829] transition-colors text-left cursor-pointer"
                >
                  How it works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('get-started')}
                  className="hover:text-[#0D3829] transition-colors text-left cursor-pointer"
                >
                  Get Started
                </button>
              </li>
            </ul>
          </div>

          {/* Features Column */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-sm font-semibold text-[#0D3829] mb-4 tracking-tight">
              Features
            </h4>
            <ul className="space-y-2.5 text-[13px] text-charcoal/70">
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-[#0D3829] transition-colors text-left cursor-pointer"
                >
                  Knowledge assistant
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-[#0D3829] transition-colors text-left cursor-pointer"
                >
                  Transparent answers
                </button>
              </li>
            </ul>
          </div>

          {/* Security Column */}
          <div className="col-span-1 lg:col-span-1">
            <h4 className="text-sm font-semibold text-[#0D3829] mb-4 tracking-tight">
              Security
            </h4>
            <ul className="space-y-2.5 text-[13px] text-charcoal/70">
              <li>
                <button
                  onClick={() => scrollTo('security')}
                  className="hover:text-[#0D3829] transition-colors text-left cursor-pointer"
                >
                  Privacy by design
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('security')}
                  className="hover:text-[#0D3829] transition-colors text-left cursor-pointer"
                >
                  Local infrastructure
                </button>
              </li>
            </ul>
          </div>

          {/* Account Column */}
          <div className="col-span-1 lg:col-span-1">
            <h4 className="text-sm font-semibold text-[#0D3829] mb-4 tracking-tight">
              Account
            </h4>
            <ul className="space-y-2.5 text-[13px] text-charcoal/70">
              <li>
                <Link to="/login" className="hover:text-[#0D3829] transition-colors">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-[#0D3829] transition-colors">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          {/* Stay in the loop — Newsletter Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-3">
            <h4 className="text-sm font-semibold text-[#0D3829] mb-2 tracking-tight italic">
              Stay in the loop
            </h4>
            <p className="text-[12px] text-charcoal/60 leading-relaxed mb-3">
              Get updates on new features, security insights and more.
            </p>
            <form onSubmit={handleSubscribe} className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="flex-1 px-4 py-2.5 rounded-full bg-[#FAF7F2] border border-stone-300/70 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-[#0D3829]/50 focus:ring-2 focus:ring-[#0D3829]/10 transition-all"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-[#0D3829] hover:bg-[#0D3829]/90 text-white flex items-center justify-center shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            {subscribed && (
              <p className="text-xs text-emerald-600 mt-2 font-medium animate-in fade-in duration-200">
                ✓ Thanks! You're subscribed.
              </p>
            )}
          </div>
        </div>

        {/* ── Bottom Bar ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-[12px] text-charcoal/55 tracking-tight">
            © 2026 Cognisec. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-[12px] text-charcoal/55">
            <button className="hover:text-[#0D3829] transition-colors cursor-pointer underline-offset-2 hover:underline">
              Terms of Service
            </button>
            <span className="text-charcoal/30">|</span>
            <button className="hover:text-[#0D3829] transition-colors cursor-pointer underline-offset-2 hover:underline">
              Privacy Policy
            </button>
            <span className="text-charcoal/30">|</span>
            <button className="hover:text-[#0D3829] transition-colors cursor-pointer underline-offset-2 hover:underline">
              Cookie Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
