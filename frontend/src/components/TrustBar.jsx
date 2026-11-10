import React from 'react';
import { Server, UserCheck, ShieldCheck, FileCheck } from 'lucide-react';

export default function TrustBar() {
  const pillars = [
    {
      icon: Server,
      title: 'Local AI Processing',
      subtitle: 'Zero data leaves your infrastructure',
    },
    {
      icon: UserCheck,
      title: 'Permission-Aware Retrieval',
      subtitle: 'Enforced at SQL & vector layers',
    },
    {
      icon: ShieldCheck,
      title: 'Sensitive Data Protection',
      subtitle: 'Automated PII & credential masking',
    },
    {
      icon: FileCheck,
      title: 'Transparent Answers',
      subtitle: 'Strict source attribution & page citations',
    },
  ];

  return (
    <section className="py-16 md:py-20 border-t border-b border-slate-200/80 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-darkGreen tracking-tight mb-12">
          Enterprise Security Architecture by Design
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 text-left hover:border-emerald-300 transition-all shadow-2xs hover:shadow-sm group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform mb-4">
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-darkGreen tracking-tight mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-charcoal-500 font-medium leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

