import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const scrollToProduct = () => {
    const elem = document.getElementById('product');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-12 md:pt-16 lg:pt-20 pb-16 md:pb-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      {/* Category Micro-label */}
      <div className="mb-6">
        <span className="font-mono text-xs md:text-[13px] tracking-[0.2em] uppercase text-sage font-medium">
          PRIVATE KNOWLEDGE. SHARED INTELLIGENCE.
        </span>
      </div>

      {/* Main Grid: Heading on left, Description & CTAs on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
        {/* Left Column: Massive Heading */}
        <div className="lg:col-span-7">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] leading-[1.06] font-bold text-darkGreen tracking-[-0.03em]">
            Unlock your <br className="hidden sm:inline" />
            company's <br className="hidden sm:inline" />
            knowledge. <br />
            Without exposing <br className="hidden sm:inline" />
            what matters.
          </h1>
        </div>

        {/* Right Column: Narrative + Action buttons */}
        <div className="lg:col-span-5 lg:pb-3 space-y-6 lg:pl-4">
          <p className="text-base sm:text-lg text-charcoal/75 leading-relaxed font-normal">
            An intelligent enterprise document assistant that helps teams find answers from internal company files while respecting access permissions and protecting sensitive information.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center bg-darkGreen text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-darkGreen/90 transition-all shadow-sm active:scale-[0.99]"
            >
              Get Started
            </Link>

            <button
              onClick={scrollToProduct}
              className="text-sm font-medium text-charcoal/80 hover:text-darkGreen transition-colors px-2 py-3 cursor-pointer"
            >
              Explore the platform
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

