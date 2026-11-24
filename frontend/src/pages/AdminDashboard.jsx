/**
 * AdminDashboard — Enterprise Administrator Dashboard matching CogniSec Reference Design.
 *
 * Implements:
 * - Solid deep dark forest green sidebar (#0D3829)
 * - Exact nav items from reference: Search, Chat, Documents, Privacy Review, Access Control, Audit Logs, Settings
 * - Full fidelity tab switching matching the 4 reference designs:
 *   1. Search: Secure Document Search (Screen 1)
 *   2. Chat: Ask your company documents (Screen 2)
 *   3. Documents: Document repository & governance
 *   4. Privacy Review: Side-by-side text redaction & PII detection (Screen 4)
 *   5. Access Control: Multi-column user permissions & roles (Screen 3)
 *   6. Audit Logs: Security metadata logs
 *   7. Settings: System parameters & configuration
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  Folder,
  ShieldCheck,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SearchTab from './employee/SearchTab';
import AskTab from './employee/AskTab';
import AdminDocumentsTab from './admin/DocumentsTab';
import PrivacyReviewTab from './admin/PrivacyReviewTab';
import AccessControlTab from './admin/AccessControlTab';
import AuditLogsTab from './admin/AuditLogsTab';
import AdminSettingsTab from './admin/SettingsTab';

const NAV_ITEMS = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'documents', label: 'Documents', icon: Folder },
  { id: 'privacy', label: 'Privacy Review', icon: ShieldCheck },
  { id: 'access', label: 'Access Control', icon: Users },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
];

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('access'); // default to Access Control (Screen 3) or search
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logoutUser();
    navigate('/login', { replace: true });
  }

  const displayName = user?.full_name || 'Admin';
  const initial = displayName[0]?.toUpperCase() || 'A';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans text-charcoal relative overflow-x-hidden">
      {/* ── Desktop Sidebar (#0D3829) ──────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0D3829] text-white shrink-0 sticky top-0 h-screen select-none z-30 justify-between p-4 shadow-xl">
        <div className="space-y-6">
          {/* Brand header */}
          <div className="px-3 pt-3 pb-1 flex items-center">
            <img
              src="/logo-white.png"
              alt="Cognisec"
              className="h-10 w-auto max-w-[195px] object-contain drop-shadow-sm"
            />
          </div>

          {/* Navigation list */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#1D4D3C] text-white font-semibold shadow-xs'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings & User Profile */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all text-left cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#1D4D3C] text-white font-semibold shadow-xs'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0 stroke-[2.2]" />
            <span>Settings</span>
          </button>

          {/* User profile pill */}
          <div className="relative">
            <div
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 hover:bg-black/30 transition-all cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {initial}
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-xs font-semibold text-white truncate block leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-white/60 block leading-tight">
                    System Administrator
                  </span>
                </div>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-white/50 transition-transform ${
                  userDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute bottom-14 left-0 right-0 bg-white text-charcoal rounded-xl shadow-xl border border-gray-200 py-1.5 text-xs z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <span className="font-semibold block text-darkGreen">{user?.full_name}</span>
                  <span className="text-[11px] text-charcoal/50 font-mono">{user?.email}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/app');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-mint-50 text-darkGreen font-medium cursor-pointer"
                >
                  Switch to Employee Workspace
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Header ──────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0D3829] text-white px-4 py-3 flex items-center justify-between border-b border-white/10 shadow-xs">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="CogniSec"
            className="w-6 h-6 object-contain filter invert brightness-200"
          />
          <span className="font-bold text-base">CogniSec Admin</span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-white/80 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-[#0D3829] text-white pt-16 px-4 pb-6 flex flex-col justify-between">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 text-left"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 text-red-300 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}

      {/* ── Main Canvas Content Container ─────────────────────────── */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 md:pt-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'search' && <SearchTab />}
          {activeTab === 'chat' && <AskTab />}
          {activeTab === 'documents' && <AdminDocumentsTab />}
          {activeTab === 'privacy' && <PrivacyReviewTab />}
          {activeTab === 'access' && <AccessControlTab />}
          {activeTab === 'audit' && <AuditLogsTab />}
          {activeTab === 'settings' && <AdminSettingsTab />}
        </div>
      </main>
    </div>
  );
}
