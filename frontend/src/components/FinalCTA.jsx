import React from 'react';
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="pt-20 pb-24 md:pt-28 md:pb-32 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-left">
        <h2 className="text-3xl sm:text-[36px] lg:text-[40px] font-semibold text-darkGreen tracking-tight leading-[1.18] max-w-3xl">
          Make company knowledge accessible. <br />
          Keep company information protected.
        </h2>

        <p className="text-[15px] sm:text-base text-charcoal/75 mt-4 max-w-2xl leading-relaxed font-normal">
          Bring your organisation's knowledge into one secure and intelligent workspace.
        </p>

        <div className="mt-8">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center bg-darkGreen text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-darkGreen/90 transition-all shadow-xs active:scale-[0.99]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
