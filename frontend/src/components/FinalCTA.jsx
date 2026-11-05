import React from 'react';
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="pt-24 pb-28 md:pt-32 md:pb-36 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-left">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-darkGreen tracking-tight leading-[1.12] max-w-4xl">
          Make company knowledge accessible. <br />
          Keep company information protected.
        </h2>

        <p className="text-base sm:text-lg text-charcoal/70 mt-6 max-w-2xl leading-relaxed">
          Bring your organisation's knowledge into one secure and intelligent workspace.
        </p>

        <div className="mt-8">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center bg-darkGreen text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-darkGreen/90 transition-all shadow-xs active:scale-[0.99]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
