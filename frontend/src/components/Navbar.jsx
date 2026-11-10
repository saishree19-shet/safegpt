import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs'
          : 'bg-white/70 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-3 text-darkGreen font-semibold text-xl tracking-tight hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-darkGreen text-white flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-darkGreen">
            CogniSec
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-charcoal-700">
          <button
            onClick={() => scrollToSection('product')}
            className="hover:text-darkGreen transition-colors cursor-pointer"
          >
            Product
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-darkGreen transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className="hover:text-darkGreen transition-colors cursor-pointer"
          >
            Security
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-darkGreen transition-colors cursor-pointer"
          >
            How It Works
          </button>
        </nav>

        {/* Desktop CTA / Auth */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-charcoal-700 hover:text-darkGreen transition-colors px-3.5 py-2 rounded-lg hover:bg-slate-50"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="bg-darkGreen text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-darkGreen-800 transition-all shadow-xs hover:shadow hover:-translate-y-0.5 active:translate-y-0"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-charcoal-700 hover:text-darkGreen rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-3 font-medium text-charcoal-700">
            <button
              onClick={() => scrollToSection('product')}
              className="text-left py-2 hover:text-darkGreen border-b border-slate-100 cursor-pointer"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-left py-2 hover:text-darkGreen border-b border-slate-100 cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="text-left py-2 hover:text-darkGreen border-b border-slate-100 cursor-pointer"
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-2 hover:text-darkGreen border-b border-slate-100 cursor-pointer"
            >
              How It Works
            </button>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <Link
              to="/login"
              className="text-center py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-charcoal-700 hover:bg-slate-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-center py-2.5 bg-darkGreen text-white rounded-xl text-sm font-semibold hover:bg-darkGreen-800 transition-colors shadow-xs"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

