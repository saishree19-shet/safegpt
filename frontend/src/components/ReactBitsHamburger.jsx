/**
 * ReactBitsHamburger — Animated Morphing Hamburger Component.
 *
 * Inspired by React Bits (reactbits.dev):
 * Features:
 * - Fluid spring transition from 3 horizontal bars into an "X"
 * - Micro-interaction hover states with smooth cubic-bezier easing
 * - Glassmorphic pill container
 */
import React from 'react';

export default function ReactBitsHamburger({ isOpen, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      className={`relative w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none cursor-pointer group ${
        isOpen
          ? 'bg-[#0D3829] text-white shadow-sm'
          : 'bg-white/90 hover:bg-white text-darkGreen border border-stone-200/80 shadow-2xs hover:shadow-xs'
      } ${className}`}
    >
      {/* Top Bar */}
      <span
        className={`w-5 h-0.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform origin-center ${
          isOpen
            ? 'rotate-45 translate-y-2 bg-white'
            : 'bg-[#0D3829] group-hover:bg-[#1B5E20]'
        }`}
      />

      {/* Middle Bar */}
      <span
        className={`w-5 h-0.5 rounded-full transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen
            ? 'opacity-0 scale-x-0 bg-white'
            : 'opacity-100 scale-x-100 bg-[#0D3829] group-hover:bg-[#1B5E20]'
        }`}
      />

      {/* Bottom Bar */}
      <span
        className={`w-5 h-0.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform origin-center ${
          isOpen
            ? '-rotate-45 -translate-y-2 bg-white'
            : 'bg-[#0D3829] group-hover:bg-[#1B5E20]'
        }`}
      />
    </button>
  );
}
