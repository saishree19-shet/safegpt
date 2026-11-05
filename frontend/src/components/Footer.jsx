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
    <footer className="bg-white pt-12 pb-16 text-charcoal">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Main 5-column layout */}
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          
          {/* Brand info (4 cols on lg) */}
          <div className="col-span-2 md:col-span-2 lg:col-span-4 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 text-darkGreen group">
              <Shield className="w-5 h-5 stroke-[2.2]" />
              <span className="text-xl font-bold tracking-tight text-darkGreen">
                CogniSec
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed max-w-xs">
              Your company knowledge. Protected <br />
              by design.
            </p>
          </div>

          {/* Col 1: Product (2 cols on lg) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="text-xs sm:text-sm font-medium text-darkGreen mb-3 sm:mb-4">
              Product
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal/75">
              <li>
                <button
                  onClick={() => scrollTo('product')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  Platform
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('how-it-works')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  How it works
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Features (2 cols on lg) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="text-xs sm:text-sm font-medium text-darkGreen mb-3 sm:mb-4">
              Features
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal/75">
              <li>
                <button
                  onClick={() => scrollTo('product')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  Knowledge assistant
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  Transparent answers
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Security (2 cols on lg) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="text-xs sm:text-sm font-medium text-darkGreen mb-3 sm:mb-4">
              Security
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal/75">
              <li>
                <button
                  onClick={() => scrollTo('security')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  Privacy by design
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('security')}
                  className="hover:text-darkGreen transition-colors text-left cursor-pointer"
                >
                  Local infrastructure
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Account (2 cols on lg) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <div className="text-xs sm:text-sm font-medium text-darkGreen mb-3 sm:mb-4">
              Account
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal/75">
              <li>
                <Link to="/login" className="hover:text-darkGreen transition-colors">
                  Log in
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
        <div className="mt-16 sm:mt-24 text-left font-mono text-[11px] sm:text-xs text-charcoal/70">
          © 2026 CogniSec. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
