/**
 * AdminDashboard — Enterprise Administrator Dashboard matching CogniSec Reference Design.
 *
 * Implements:
 * - Collapsible drawer sidebar with React Bits animated morphing hamburger button (matching Employee layout)
 * - Solid deep dark forest green sidebar (#0D3829)
 * - Exact nav items: Search, Chat, Documents, Privacy Review, Access Control, Audit Logs, Settings
 * - Smooth tab switching with full fidelity:
 *   1. Search: Secure Document Search (Screen 1)
 *   2. Chat: Ask your company documents (Screen 2)
 *   3. Documents: Document repository & governance (Screen 2 style)
 *   4. Privacy Review: Side-by-side text redaction & PII detection (Screen 4)
 *   5. Access Control: Multi-column user permissions & roles (Screen 3)
 *   6. Audit Logs: Security metadata logs
 *   7. Settings: System parameters & configuration
 */
import React, { useState, useEffect } from 'react';
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
  Pin,
  PinOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReactBitsHamburger from '../components/ReactBitsHamburger';
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
  const [activeTab, setActiveTab] = useState('access'); // default to Access Control
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Collapsible sidebar state (persists user preference)
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem('cognisec_admin_sidebar_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(isPinned);

  function togglePin() {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cognisec_admin_sidebar_pinned', String(next));
      } catch {
        // ignore
      }
      if (next) setSidebarOpen(true);
      return next;
    });
  }

  // Keyboard shortcut: Escape to close, Ctrl+B / Cmd+B to toggle
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isPinned) {
        setSidebarOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen((p) => !p);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinned]);

  function handleLogout() {
    logoutUser();
    navigate('/login', { replace: true });
  }

  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Mehta';
  const initial = displayName[0]?.toUpperCase() || 'M';

  const activeNavItem = NAV_ITEMS.find((item) => item.id === activeTab) || {
    label: activeTab === 'settings' ? 'Settings' : 'Dashboard',
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans text-charcoal relative">
      {/* ── Top Floating Navigation Header Bar with React Bits Hamburger ── */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF7F2]/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          {/* React Bits Animated Morphing Hamburger */}
          <ReactBitsHamburger
            isOpen={sidebarOpen}
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="shrink-0"
          />

          {/* Brand Logo & Indicator */}
          <div
            onClick={() => setActiveTab('access')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <img
              src="/logo.png"
              alt="Cognisec"
              className="h-8 w-auto max-w-[150px] object-contain drop-shadow-2xs group-hover:opacity-90 transition-opacity"
            />
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-100/80 text-[10px] font-bold tracking-wider text-emerald-900 uppercase">
              Admin Governance
            </span>
          </div>
        </div>

        {/* Right Header Controls: Current Section + User avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-charcoal/60 font-medium">
            <span>Admin</span>
            <span>/</span>
            <span className="text-darkGreen font-semibold">{activeNavItem.label}</span>
          </div>

          {/* Quick User Avatar Icon */}
          <div
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 rounded-full bg-[#0D3829] text-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer hover:bg-[#154E3A] transition-colors"
            title={`${user?.full_name || 'Admin'} (Administrator)`}
          >
            {initial}
          </div>
        </div>
      </header>

      {/* ── Backdrop Overlay when Sidebar Drawer is Open ──────────────── */}
      {sidebarOpen && !isPinned && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* ── Main Layout Body ────────────────────────────────────────── */}
      <div className="flex-1 flex min-w-0 relative">
        {/* ── Animated Sliding Drawer Sidebar (#0D3829) ───────────────── */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0D3829] text-white select-none flex flex-col justify-between p-5 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            {/* Header: Brand Logo & Pin/Close Controls */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <img
                src="/logo-white.png"
                alt="Cognisec"
                className="h-8 w-auto max-w-[160px] object-contain drop-shadow-sm"
              />

              <div className="flex items-center gap-1">
                {/* Pin/Unpin Toggle Button */}
                <button
                  type="button"
                  onClick={togglePin}
                  className={`p-1.5 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer ${
                    isPinned ? 'bg-white/15 text-white' : 'hover:bg-white/10'
                  }`}
                  title={isPinned ? 'Unpin sidebar (auto-close)' : 'Pin sidebar (keep open)'}
                >
                  {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>

                {/* Close Button (X) */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close sidebar (Esc)"
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation List */}
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      if (!isPinned) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all text-left cursor-pointer ${
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

          {/* Bottom Section: Settings & User Profile Card */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                if (!isPinned) setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all text-left cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#1D4D3C] text-white font-semibold shadow-xs'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0 stroke-[2.2]" />
              <span>Settings</span>
            </button>

            {/* User Profile Pill Card */}
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
                      {user?.full_name || 'Mehta'}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-mono block leading-tight">
                      Administrator
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
                <div className="absolute bottom-14 left-0 right-0 bg-white text-charcoal rounded-xl shadow-xl border border-gray-200 py-1.5 text-xs z-50 animate-in fade-in duration-100">
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
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer border-t border-gray-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main Canvas Content Container ─────────────────────────── */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto relative bg-[#FAF7F2]">
          {/* Ambient soft radial glows */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-gradient-to-bl from-emerald-100/40 via-mint-50/20 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute bottom-10 left-1/3 w-[450px] h-[300px] bg-gradient-to-tr from-amber-50/30 via-stone-100/25 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="max-w-7xl mx-auto relative z-10">
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
    </div>
  );
}
