import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProductWorkspacePreview from '../components/ProductWorkspacePreview';
import TrustBar from '../components/TrustBar';
import FeaturesSection from '../components/FeaturesSection';
import SecuritySection from '../components/SecuritySection';
import HowItWorks from '../components/HowItWorks';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

export default function LandingPage() {
  useEffect(() => {
    // Smooth scrolling to hash if present in URL
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-charcoal">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ProductWorkspacePreview />
        <TrustBar />
        <FeaturesSection />
        <SecuritySection />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

