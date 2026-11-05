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
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm'
          : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-darkGreen font-semibold text-xl tracking-tight hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-darkGreen">
            <Shield className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-darkGreen">
            CogniSec
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-charcoal/80">
          <button
            onClick={() => scrollToSection('product')}
            className="hover:text-darkGreen transition-colors"
          >
            Product
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-darkGreen transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className="hover:text-darkGreen transition-colors"
          >
            Security
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-darkGreen transition-colors"
          >
            How It Works
          </button>
        </nav>

        {/* Desktop CTA / Auth */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            to="/login"
            className="text-sm font-medium text-charcoal/80 hover:text-darkGreen transition-colors px-2 py-1"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="bg-darkGreen text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-darkGreen/90 transition-all shadow-sm active:scale-[0.99]"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-charcoal hover:text-darkGreen"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-3 font-medium text-charcoal">
            <button
              onClick={() => scrollToSection('product')}
              className="text-left py-2 hover:text-darkGreen border-b border-gray-50"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-left py-2 hover:text-darkGreen border-b border-gray-50"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="text-left py-2 hover:text-darkGreen border-b border-gray-50"
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-2 hover:text-darkGreen border-b border-gray-50"
            >
              How It Works
            </button>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <Link
              to="/login"
              className="text-center py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-charcoal"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-center py-2.5 bg-darkGreen text-white rounded-lg text-sm font-medium hover:bg-darkGreen/90"
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

