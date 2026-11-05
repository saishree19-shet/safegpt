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
    <div className="min-h-screen bg-[#FBFDFB] flex font-sans text-charcoal">
      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200/80 bg-white shrink-0 sticky top-0 h-screen select-none">
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-base font-bold text-darkGreen tracking-tight block">CogniSec</span>
            <span className="text-[10px] font-mono text-sage block leading-none">
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-mint-100/70 text-darkGreen font-semibold shadow-2xs border border-mint-border/60'
                    : 'text-charcoal/70 hover:bg-gray-50 hover:text-darkGreen'
                }`}
              >
                <Icon
                  className={`w-4 h-4 stroke-[2.2] ${
                    isActive ? 'text-darkGreen' : 'text-charcoal/50'
                  }`}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at bottom */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen font-mono font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-darkGreen truncate block">
                  {user?.full_name || 'Employee'}
                </span>
                <span className="text-[10px] font-mono text-sage block uppercase tracking-wider">
                  Employee
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-charcoal/40 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
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
            className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-64 max-w-[80%] bg-white h-full flex flex-col z-10 shadow-xl">
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2 text-darkGreen">
                <Shield className="w-5 h-5 stroke-[2.2]" />
                <span className="text-base font-bold tracking-tight">CogniSec</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-charcoal/50 hover:text-darkGreen"
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
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-mint-100/70 text-darkGreen font-semibold border border-mint-border'
                        : 'text-charcoal/70 hover:bg-gray-50 hover:text-darkGreen'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-mint-100 text-darkGreen font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <span className="text-xs font-semibold text-darkGreen truncate">
                  {user?.full_name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-charcoal/40 hover:text-red-700 rounded-lg"
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
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-gray-200/80 px-6 sm:px-8 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-gray-200 text-charcoal/60 hover:text-darkGreen"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-charcoal/40 hidden sm:inline">Workspace</span>
              <span className="text-charcoal/30 hidden sm:inline">/</span>
              <span className="text-darkGreen font-semibold">
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
            <span className="px-2.5 py-0.5 rounded-full bg-mint-100 text-darkGreen text-[11px] font-mono uppercase font-semibold">
              Employee
            </span>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-7 h-7 rounded-full bg-darkGreen text-white font-mono font-bold text-[11px] flex items-center justify-center">
                {initials}
              </div>
              <span className="text-xs font-medium text-darkGreen max-w-[140px] truncate">
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

