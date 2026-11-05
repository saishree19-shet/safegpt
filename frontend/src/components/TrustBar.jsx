import React from 'react';
import { Server, UserCheck, ShieldCheck, FileCheck } from 'lucide-react';

export default function TrustBar() {
  const pillars = [
    {
      icon: Server,
      title: 'Local AI Processing',
    },
    {
      icon: UserCheck,
      title: 'Permission-Aware Retrieval',
    },
    {
      icon: ShieldCheck,
      title: 'Sensitive Data Protection',
    },
    {
      icon: FileCheck,
      title: 'Transparent Answers',
    },
  ];

  return (
    <section className="py-16 md:py-20 border-t border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-darkGreen tracking-tight mb-12">
          Built for organisations where information matters.
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-center gap-3 text-charcoal/80 hover:text-darkGreen transition-colors group"
              >
                <Icon className="w-5 h-5 text-sage group-hover:text-darkGreen transition-colors stroke-[1.8]" />
                <span className="text-sm sm:text-base font-medium tracking-tight">
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

