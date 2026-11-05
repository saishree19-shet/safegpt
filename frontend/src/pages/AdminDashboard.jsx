/**
 * AdminDashboard — protected placeholder (Step 7.2).
 * Full admin implementation is Step 7.3+.
 */
import React from 'react';
import { Shield, LogOut, Users, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logoutUser();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#FBFDFB] font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200/70 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-darkGreen">
          <Shield className="w-5 h-5 stroke-[2.2]" />
          <span className="text-lg font-bold tracking-tight">CogniSec</span>
          <span className="ml-3 px-2 py-0.5 rounded-full bg-darkGreen text-white text-xs font-mono">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-charcoal/70 hidden sm:block">{user?.full_name}</span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-darkGreen transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
        <div className="mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-sage mb-3">
            Administration panel
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-darkGreen tracking-tight leading-tight">
            Admin workspace,<br />
            {user?.full_name?.split(' ')[0] ?? 'Admin'}.
          </h1>
          <p className="text-base text-charcoal/60 mt-4 max-w-xl leading-relaxed">
            Manage users, documents and access permissions across your organisation.
          </p>
        </div>

        {/* Placeholder cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: Users, label: 'User management', desc: 'Manage employee accounts and roles.' },
            { icon: FileText, label: 'Document library', desc: 'Upload, review and control access.' },
            { icon: Activity, label: 'Audit logs', desc: 'Review access and activity records.' },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-white border border-gray-200/80 rounded-xl p-7 flex flex-col gap-3 opacity-60 cursor-not-allowed"
            >
              <div className="w-9 h-9 rounded-lg bg-mint-100 border border-mint-border flex items-center justify-center">
                <Icon className="w-5 h-5 text-darkGreen" />
              </div>
              <div>
                <p className="text-sm font-semibold text-darkGreen">{label}</p>
                <p className="text-xs text-charcoal/60 mt-1 leading-relaxed">
                  {desc} Coming in Step 7.3.
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs font-mono text-charcoal/40 text-center">
          Authenticated as {user?.email} · Role: {user?.role}
        </p>
      </main>
    </div>
  );
}

