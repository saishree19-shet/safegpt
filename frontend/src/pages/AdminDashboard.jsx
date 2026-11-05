/**
 * AdminDashboard — Professional Administrator Dashboard Shell for CogniSec (Step 7.4A).
 *
 * Requirements:
 * - Restricted exclusively to authenticated users with role="admin" via ProtectedRoute.
 * - Enterprise CogniSec visual identity (#1D3B30, #778873, #A1BC98, #DCCFC0, #252922).
 * - Fixed/slim desktop sidebar + responsive mobile slide-over drawer.
 * - Shell navigation: Overview, Users, Documents, Permissions, Audit Logs, Security/Privacy, Settings.
 * - Real user profile and session data from AuthContext.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Users,
  FileText,
  KeyRound,
  Activity,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UsersTab from './admin/UsersTab';
import DocumentsTab from './admin/DocumentsTab';
import PermissionsTab from './admin/PermissionsTab';
import AuditLogsTab from './admin/AuditLogsTab';
import SecurityPrivacyTab from './admin/SecurityPrivacyTab';
import AdminSettingsTab from './admin/SettingsTab';

const ADMIN_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'permissions', label: 'Permissions', icon: KeyRound },
  { id: 'audit', label: 'Audit Logs', icon: Activity },
  { id: 'security', label: 'Security / Privacy', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [preselectedDocId, setPreselectedDocId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logoutUser();
    navigate('/login', { replace: true });
  }

  // Admin Initials for avatar
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD';

  return (
    <div className="min-h-screen bg-[#FBFDFB] flex font-sans text-charcoal">
      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200/80 bg-white shrink-0 sticky top-0 h-screen select-none">
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2.5 text-darkGreen">
            <div className="w-8 h-8 rounded-lg bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-bold text-darkGreen tracking-tight block">CogniSec</span>
              <span className="text-[10px] font-mono text-sage block leading-none">
                Administration
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-darkGreen text-white text-[10px] font-mono uppercase font-bold tracking-wider">
            Admin
          </span>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
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
              </button>
            );
          })}
        </nav>

        {/* User Card at bottom */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-darkGreen text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-darkGreen truncate block">
                  {user?.full_name || 'Administrator'}
                </span>
                <span className="text-[10px] font-mono text-sage block uppercase tracking-wider">
                  Admin
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
                <span className="text-base font-bold tracking-tight">CogniSec Admin</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-charcoal/50 hover:text-darkGreen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left ${
                      isActive
                        ? 'bg-mint-100/70 text-darkGreen font-semibold border border-mint-border/60'
                        : 'text-charcoal/70 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-charcoal/70 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Context breadcrumb */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-charcoal/50">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal/30" />
              <span className="font-semibold text-darkGreen capitalize">
                {ADMIN_NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-darkGreen text-white text-[11px] font-mono font-medium">
              <Lock className="w-3 h-3 text-softGreen" />
              <span>Admin</span>
            </span>

            {/* User display */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-7 h-7 rounded-full bg-darkGreen text-white flex items-center justify-center font-mono font-bold text-[11px]">
                {initials}
              </div>
              <span className="text-xs font-medium text-charcoal/80">
                {user?.full_name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-charcoal/60 hover:text-darkGreen px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Welcome Section */}
              <div className="pb-6 border-b border-gray-100">
                <span className="text-[11px] font-mono uppercase tracking-widest text-sage block mb-1">
                  System Administration
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-darkGreen tracking-tight">
                  Admin Workspace, {user?.full_name?.split(' ')[0] || 'Admin'}.
                </h1>
                <p className="text-xs sm:text-sm text-charcoal/60 mt-1 max-w-2xl leading-relaxed">
                  Enterprise control plane for managing users, governance permissions, audit logs,
                  and verifiable privacy mechanisms across the organization.
                </p>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-mint-50/60 border border-mint-border/60 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-darkGreen font-semibold">
                    CogniSec Core Online · Role: {user?.role}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-charcoal/50">
                  Authenticated session: {user?.email}
                </span>
              </div>

              {/* Functional Subsystem Shell Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    id: 'users',
                    icon: Users,
                    title: 'User Management',
                    desc: 'Inspect registered accounts, roles, and authorization states.',
                  },
                  {
                    id: 'documents',
                    icon: FileText,
                    title: 'Document Governance',
                    desc: 'View uploaded enterprise documents, extraction status, and owners.',
                  },
                  {
                    id: 'permissions',
                    icon: KeyRound,
                    title: 'Access Permissions',
                    desc: 'Enforce and audit document-level access permissions with zero leakage.',
                  },
                  {
                    id: 'audit',
                    icon: Activity,
                    title: 'Security Audit Logs',
                    desc: 'Review tamper-evident security audit events and access activity.',
                  },
                  {
                    id: 'security',
                    icon: ShieldCheck,
                    title: 'Security & Privacy',
                    desc: 'Inspect redaction boundaries, privacy scans, and LLM grounding.',
                  },
                  {
                    id: 'settings',
                    icon: Settings,
                    title: 'Admin Settings',
                    desc: 'Review system parameters, Ollama model configs, and API status.',
                  },
                ].map(({ id, icon: Icon, title, desc }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="bg-white border border-gray-200/90 hover:border-darkGreen/40 rounded-2xl p-6 text-left shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen group-hover:scale-105 transition-transform mb-4">
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <h3 className="text-sm font-semibold text-darkGreen mb-1">{title}</h3>
                      <p className="text-xs text-charcoal/60 leading-relaxed">{desc}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs text-sage font-medium group-hover:text-darkGreen transition-colors">
                      <span>Open subsystem</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && <UsersTab />}

          {activeTab === 'documents' && (
            <DocumentsTab
              onManagePermissions={(docId) => {
                setPreselectedDocId(docId);
                setActiveTab('permissions');
              }}
            />
          )}

          {activeTab === 'permissions' && (
            <PermissionsTab preselectedDocId={preselectedDocId} />
          )}

          {activeTab === 'audit' && <AuditLogsTab />}

          {activeTab === 'security' && <SecurityPrivacyTab />}

          {activeTab === 'settings' && <AdminSettingsTab />}

          {activeTab !== 'overview' &&
            activeTab !== 'users' &&
            activeTab !== 'documents' &&
            activeTab !== 'permissions' &&
            activeTab !== 'audit' &&
            activeTab !== 'security' &&
            activeTab !== 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-darkGreen capitalize">
                    {ADMIN_NAV_ITEMS.find((item) => item.id === activeTab)?.label}
                  </h1>
                  <p className="text-xs text-charcoal/60 mt-0.5">
                    Administrative interface module — Step 7.4 Shell Ready.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="text-xs text-sage hover:text-darkGreen font-medium cursor-pointer"
                >
                  ← Back to Overview
                </button>
              </div>

              {/* Subsystem Shell Card */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-8 sm:p-12 text-center shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-mint-100 border border-mint-border mx-auto flex items-center justify-center text-darkGreen">
                  {React.createElement(
                    ADMIN_NAV_ITEMS.find((item) => item.id === activeTab)?.icon || Shield,
                    { className: 'w-6 h-6 stroke-[2.2]' }
                  )}
                </div>
                <div className="max-w-md mx-auto">
                  <h2 className="text-base font-semibold text-darkGreen capitalize">
                    {ADMIN_NAV_ITEMS.find((item) => item.id === activeTab)?.label} Subsystem
                  </h2>
                  <p className="text-xs text-charcoal/60 mt-1.5 leading-relaxed">
                    This administrative interface is scaffolded and ready. The endpoint integration
                    for this section will be linked in Step 7.4B/C according to the CogniSec roadmap.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-charcoal/60 text-[11px] font-mono">
                    <Sparkles className="w-3 h-3 text-sage" />
                    <span>Shell Scaffolding Complete</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
