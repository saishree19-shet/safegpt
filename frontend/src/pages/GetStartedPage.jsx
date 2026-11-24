import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import GetStartedSection from '../components/GetStartedSection';
import Footer from '../components/Footer';

export default function GetStartedPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F120E] text-cream">
      <Navbar />
      <main className="flex-1">
        <GetStartedSection />
      </main>
      <Footer />
    </div>
  );
}
