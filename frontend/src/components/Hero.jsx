/**
 * Hero — Premium Enterprise Security Landing Hero matching Reference Design.
 *
 * Implements:
 * - Editorial Typography: Newsreader serif for "Unlock your company's knowledge. Without exposing what matters."
 * - Eyebrow pill: "● Privacy-First AI Security"
 * - Dual CTAs: "Explore Platform →" & "Learn More"
 * - Trust metric strip: 100% Data Privacy | Real-Time Threat Detection | Enterprise-Grade Security
 * - Right-hand realistic laptop display with CogniSec brand wallpaper and ambient scene.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Lock, ArrowRight } from 'lucide-react';

export default function Hero() {
  const scrollToProduct = () => {
    const elem = document.getElementById('product');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] pt-6 md:pt-10 pb-0 lg:pb-0 min-h-[92vh] flex items-center">
      {/* Decorative organic background curves & ambient glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-100/40 via-mint-50/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-40 -mt-20" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[300px] bg-[#B9CEBE]/25 rounded-tl-[160px] pointer-events-none hidden lg:block" />

      {/* Elegant background contour arcs */}
      <svg
        className="absolute top-12 right-6 w-[580px] h-[480px] text-darkGreen/8 pointer-events-none hidden lg:block"
        viewBox="0 0 580 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 240C90 120 280 40 560 30"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M60 320C160 180 340 80 570 70"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path
          d="M120 400C220 250 400 130 570 120"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ── Left Column: Editorial Headline & Actions ─────────────── */}
          <div className="lg:col-span-4 space-y-6 pb-12 pt-4">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8ECE6] text-[#24352D] text-xs font-semibold tracking-normal shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#1B5E20] shrink-0" />
              <span>Privacy-First AI Security</span>
            </div>

            {/* Main Headline with Signature Editorial Typography */}
            <div>
              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[62px] font-medium text-[#0D3829] leading-[1.08] tracking-tight">
                Unlock your <br />
                company&apos;s <br />
                knowledge.
              </h1>
              <h2 className="font-editorial italic text-3xl sm:text-4xl lg:text-[46px] text-[#0D3829]/90 leading-[1.1] tracking-tight mt-1">
                Without exposing what matters.
              </h2>
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-charcoal/70 leading-relaxed max-w-lg">
              Cognisec helps you find answers from internal documents while keeping your sensitive data
              private and secure.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#0D3829] hover:bg-[#0D3829]/90 text-white text-sm font-semibold transition-all shadow-xs active:scale-[0.99]"
              >
                <span>Explore Platform</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={scrollToProduct}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-gray-300/80 bg-white/75 hover:bg-white text-charcoal text-sm font-medium transition-all shadow-2xs cursor-pointer"
              >
                Learn More
              </button>
            </div>

            {/* Trust Metric Strip */}
            <div className="pt-8 flex flex-wrap items-center gap-5 sm:gap-6 text-charcoal/80 border-t border-stone-200/80">
              {/* 100% Data Privacy */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E8ECE6] text-[#0D3829] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-xs sm:text-sm text-[#0D3829] block">
                    100%
                  </span>
                  <span className="text-[11px] text-charcoal/60">Data Privacy</span>
                </div>
              </div>

              <span className="text-stone-300 hidden sm:inline">|</span>

              {/* Real-Time Threat Detection */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E8ECE6] text-[#0D3829] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-xs sm:text-sm text-[#0D3829] block">
                    Real-Time
                  </span>
                  <span className="text-[11px] text-charcoal/60">Threat Detection</span>
                </div>
              </div>

              <span className="text-stone-300 hidden sm:inline">|</span>

              {/* Enterprise-Grade Security */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E8ECE6] text-[#0D3829] flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-xs sm:text-sm text-[#0D3829] block">
                    Enterprise-Grade
                  </span>
                  <span className="text-[11px] text-charcoal/60">Security</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Exact Reference Laptop & Ambient Workspace ── */}
          <div className="lg:col-span-8 relative flex justify-end items-start self-start lg:-mr-16 xl:-mr-28 2xl:-mr-40">
            {/* Ambient glow */}
            <div className="absolute -top-10 -left-6 w-40 h-40 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />

            {/* Hero Image – large, flush to top-right, aligned with headline */}
            <div className="relative w-full group">
              <img
                src="/hero-laptop.png"
                alt="Cognisec Laptop on Desk"
                className="w-full h-auto object-cover object-left-top drop-shadow-2xl rounded-2xl transform transition-transform duration-500 hover:scale-[1.01]"
                style={{ maxHeight: '82vh' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
