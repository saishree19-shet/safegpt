/**
 * EmployeeLayout — Enterprise Authenticated Layout matching CogniSec Reference Design.
 *
 * Implements:
 * - Collapsible drawer sidebar with React Bits animated morphing hamburger button
 * - Deep dark forest green (#0D3829) brand navigation drawer
 * - Exact nav items: Search, Chat, Documents, My Schedule, Privacy Review, Settings
 * - Bottom User Profile card: Avatar initial, Name, Role ("Enterprise"), dropdown chevron & logout
 * - Canvas background (#FAF7F2) with smooth rounded container and glassmorphic depth
 */
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  Folder,
  Calendar,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronDown,
  Zap,
  Pin,
  PinOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReactBitsHamburger from '../../components/ReactBitsHamburger';

const NAV_ITEMS = [
  { path: '/app', label: 'Search', icon: Search, exact: true, shortcut: '⌘K' },
  { path: '/app/ask', label: 'Chat', icon: MessageSquare },
  { path: '/app/documents', label: 'Documents', icon: Folder },
  { path: '/app/schedule', label: 'My Schedule', icon: Calendar },
  { path: '/app/privacy', label: 'Privacy Review', icon: ShieldCheck },
];

export default function EmployeeLayout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible sidebar state (persists user preference)
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem('cognisec_sidebar_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(isPinned);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Sync pinned state
  function togglePin() {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cognisec_sidebar_pinned', String(next));
      } catch {
        // ignore
      }
      if (next) setSidebarOpen(true);
      return next;
    });
  }

  // Close sidebar on ESC key or navigation if not pinned
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

  // Close sidebar on route change if not pinned
  useEffect(() => {
    if (!isPinned) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isPinned]);

  function handleLogout() {
    logoutUser();
    navigate('/login', { replace: true });
  }

  // Display metadata
  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Ram';
  const roleName = user?.role === 'admin' ? 'Administrator' : 'Enterprise';
  const initial = displayName[0]?.toUpperCase() || 'R';

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

          {/* Brand Logo & Current Workspace Indicator */}
          <div
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <img
              src="/logo.png"
              alt="Cognisec"
              className="h-8 w-auto max-w-[150px] object-contain drop-shadow-2xs group-hover:opacity-90 transition-opacity"
            />
          </div>
        </div>

        {/* Right Header Controls: User avatar */}
        <div className="flex items-center gap-3">
          {/* Quick User Avatar Icon */}
          <div
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 rounded-full bg-[#0D3829] text-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer hover:bg-[#154E3A] transition-colors"
            title={`${user?.full_name} (${roleName})`}
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

      <div className="flex-1 flex relative">
        {/* ── Drawer Sidebar (#0D3829) ─────────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0D3829] text-white flex flex-col justify-between p-4 shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isPinned ? 'md:sticky md:top-0 md:h-[calc(100vh-53px)] md:shadow-none' : ''}`}
        >
          <div className="space-y-5">
            {/* Drawer Header: Brand + Close/Pin Buttons */}
            <div className="px-2 pt-2 pb-1 flex items-center justify-between border-b border-white/10">
              <img
                src="/logo-white.png"
                alt="Cognisec"
                className="h-9 w-auto max-w-[170px] object-contain drop-shadow-sm"
              />

              <div className="flex items-center gap-1">
                {/* Pin/Unpin on desktop */}
                <button
                  type="button"
                  onClick={togglePin}
                  className="hidden md:flex p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                >
                  {isPinned ? <Pin className="w-4 h-4 text-emerald-400" /> : <PinOff className="w-4 h-4" />}
                </button>

                {/* Close Drawer Button */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close sidebar (Esc)"
                >
                  <span className="text-sm font-bold">✕</span>
                </button>
              </div>
            </div>

            {/* Navigation list */}
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path || location.pathname === '/app/search'
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (!isPinned) setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-[#1D4D3C] text-white font-semibold shadow-xs ring-1 ring-white/10'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                        {item.shortcut}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom Section: Settings, User Profile & Query Limit */}
          <div className="space-y-2.5 pt-4 border-t border-white/10">
            <NavLink
              to="/app/settings"
              onClick={() => {
                if (!isPinned) setSidebarOpen(false);
              }}
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium transition-all ${
                location.pathname.startsWith('/app/settings')
                  ? 'bg-[#1D4D3C] text-white font-semibold shadow-xs'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0 stroke-[2.2]" />
              <span>Settings</span>
            </NavLink>

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
                      {roleName}
                    </span>
                  </div>
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-white/50 transition-transform ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute bottom-14 left-0 right-0 bg-white text-charcoal rounded-xl shadow-xl border border-gray-200 py-1.5 text-xs z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <span className="font-semibold block text-darkGreen">{user?.full_name}</span>
                    <span className="text-[11px] text-charcoal/50 font-mono">{user?.email}</span>
                  </div>

                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/admin');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-mint-50 text-darkGreen font-medium cursor-pointer"
                    >
                      Go to Admin Portal
                    </button>
                  )}

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

            {/* Monthly query limit progress bar */}
            <div className="p-2.5 rounded-xl bg-black/20 text-white/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-emerald-300">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>73F</span>
                </span>
                <span className="text-[10px] text-white/50">Monthly query limit</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full w-[45%]" />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Canvas Content Container ─────────────────────────── */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto relative bg-[#FAF7F2]">
          {/* Atmospheric soft radial glows for clean glassmorphism depth */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-gradient-to-bl from-emerald-100/40 via-mint-50/20 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute bottom-10 left-1/3 w-[450px] h-[300px] bg-gradient-to-tr from-amber-50/30 via-stone-100/25 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="max-w-7xl mx-auto relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
