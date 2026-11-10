/**
 * EmployeeLayout — Enterprise Authenticated Layout for CogniSec.
 *
 * Includes:
 * - Slim fixed desktop sidebar with CogniSec brand, navigation, and user card
 * - Contextual top header with breadcrumb, employee role pill, user avatar, and logout
 * - Responsive mobile drawer with backdrop
 * - Smooth content container rendering <Outlet />
 */
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  FileText,
  Sparkles,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/app', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/app/documents', label: 'My Documents', icon: FileText },
  { path: '/app/ask', label: 'Ask CogniSec', icon: Sparkles },
  { path: '/app/security', label: 'Security', icon: ShieldCheck },
  { path: '/app/settings', label: 'Settings', icon: Settings },
];

export default function EmployeeLayout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logoutUser();
    navigate('/login', { replace: true });
  }

  // Initials for avatar
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'EM';

  return (
    <div className="min-h-screen bg-slate-50/60 flex font-sans text-charcoal-800">
      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 bg-white shrink-0 sticky top-0 h-screen select-none">
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-darkGreen text-white flex items-center justify-center shadow-xs">
            <Shield className="w-4 h-4 stroke-[2.4]" />
          </div>
          <div>
            <span className="text-base font-extrabold text-darkGreen tracking-tight block">CogniSec</span>
            <span className="text-[10px] font-mono text-emerald-800 font-semibold block leading-none uppercase tracking-wider">
              Workspace
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-darkGreen font-bold shadow-2xs border border-emerald-200/80'
                    : 'text-charcoal-600 hover:bg-slate-50 hover:text-darkGreen'
                }`}
              >
                <Icon
                  className={`w-4 h-4 stroke-[2.2] ${
                    isActive ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at bottom */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200/80 flex items-center justify-center text-emerald-900 font-mono font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-darkGreen truncate block">
                  {user?.full_name || 'Employee'}
                </span>
                <span className="text-[10px] font-mono text-emerald-800 font-bold block uppercase tracking-wider">
                  Employee
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-charcoal-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Slide-Over Drawer ───────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-64 max-w-[80%] bg-white h-full flex flex-col z-10 shadow-xl">
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-darkGreen">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-darkGreen text-white flex items-center justify-center">
                  <Shield className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-base font-bold tracking-tight">CogniSec</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-darkGreen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-darkGreen font-bold border border-emerald-200'
                        : 'text-charcoal-600 hover:bg-slate-50 hover:text-darkGreen'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                  {initials}
                </div>
                <span className="text-xs font-bold text-darkGreen truncate">
                  {user?.full_name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-charcoal-400 hover:text-rose-700 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-slate-200 text-charcoal-600 hover:text-darkGreen"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-charcoal-400 hidden sm:inline font-medium">Workspace</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-darkGreen font-bold">
                {NAV_ITEMS.find((item) =>
                  item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path)
                )?.label || 'Employee Portal'}
              </span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3.5">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-mono uppercase font-bold tracking-wider">
              Employee
            </span>
            <div className="hidden sm:flex items-center gap-2.5 pl-2.5 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-darkGreen text-white font-mono font-bold text-[11px] flex items-center justify-center shadow-2xs">
                {initials}
              </div>
              <span className="text-xs font-semibold text-darkGreen max-w-[140px] truncate">
                {user?.full_name}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

