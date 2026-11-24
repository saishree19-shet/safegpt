/**
 * AccessControlTab — Enterprise Access Control & Governance (Reference Screen 3).
 *
 * Implements:
 * - ADMIN eyebrow, "Access Control" title, "+ Add User" primary action button
 * - Sub-tabs: Users, Roles, Document Permissions
 * - Left column: Users table with avatars, search input, Role dropdowns,
 *   Access Level text, Active/Inactive status dots, action menus, pagination.
 * - Right column:
 *   - "Roles" summary card (Admin, Editor, Viewer) with user counts
 *   - "Document Permissions" summary card with folder access breakdown
 * - Fully interactive "+ Add User" modal and role switcher.
 */
import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Shield,
  Edit3,
  Eye,
  Folder,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccessControlTab() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' | 'roles' | 'permissions'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Form state for adding user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Editor');

  // Real mock user data aligned with Reference Screen 3
  const [usersList, setUsersList] = useState([
    {
      id: 1,
      name: 'Saishree R.',
      email: 'saishree@company.com',
      initials: 'SR',
      role: 'Admin',
      accessLevel: 'Full Access',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Thanushree K.',
      email: 'thanushree@company.com',
      initials: 'TK',
      role: 'Editor',
      accessLevel: 'Read & Write',
      status: 'Active',
    },
    {
      id: 3,
      name: 'Sejal J.',
      email: 'sejal@company.com',
      initials: 'SJ',
      role: 'Editor',
      accessLevel: 'Read & Write',
      status: 'Active',
    },
    {
      id: 4,
      name: 'Soniya Y.',
      email: 'soniya@company.com',
      initials: 'SY',
      role: 'Viewer',
      accessLevel: 'Read Only',
      status: 'Active',
    },
    {
      id: 5,
      name: 'Saishree S.',
      email: 'saishrees@company.com',
      initials: 'SS',
      role: 'Viewer',
      accessLevel: 'Read Only',
      status: 'Inactive',
    },
  ]);

  // Insert logged in user if not in list
  useEffect(() => {
    if (user?.full_name && !usersList.some((u) => u.email === user.email)) {
      const initials = user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      setUsersList((prev) => [
        {
          id: user.id || 99,
          name: user.full_name,
          email: user.email,
          initials: initials || 'AD',
          role: user.role === 'admin' ? 'Admin' : 'Editor',
          accessLevel: user.role === 'admin' ? 'Full Access' : 'Read & Write',
          status: 'Active',
        },
        ...prev,
      ]);
    }
  }, [user]);

  function handleSelectAll(e) {
    if (e.target.checked) {
      setSelectedUserIds(usersList.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  }

  function handleSelectUser(id) {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleRoleChange(userId, newRole) {
    const levelMap = {
      Admin: 'Full Access',
      Editor: 'Read & Write',
      Viewer: 'Read Only',
    };
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: newRole, accessLevel: levelMap[newRole] } : u
      )
    );
    setOpenDropdownId(null);
  }

  function handleAddUser(e) {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const initials = newUserName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const levelMap = {
      Admin: 'Full Access',
      Editor: 'Read & Write',
      Viewer: 'Read Only',
    };

    const newUser = {
      id: Date.now(),
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      initials: initials || 'US',
      role: newUserRole,
      accessLevel: levelMap[newUserRole],
      status: 'Active',
    };

    setUsersList((prev) => [newUser, ...prev]);
    setNewUserName('');
    setNewUserEmail('');
    setIsAddUserOpen(false);
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] font-semibold tracking-widest uppercase text-sage">
            ADMIN
          </span>
          <h1 className="text-2xl sm:text-[28px] font-bold text-darkGreen tracking-tight mt-0.5">
            Access Control
          </h1>
          <p className="text-sm text-charcoal/70 mt-1">
            Manage users, roles and document permissions across your organization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddUserOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D3829] hover:bg-[#0D3829]/90 text-white text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add User</span>
        </button>
      </div>

      {/* ── Sub Navigation Tabs ───────────────────────────────────── */}
      <div className="flex items-center gap-8 border-b border-gray-200 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer relative ${
            activeSubTab === 'users'
              ? 'text-darkGreen font-semibold'
              : 'text-charcoal/60 hover:text-darkGreen'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users</span>
          {activeSubTab === 'users' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D3829]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('roles')}
          className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer relative ${
            activeSubTab === 'roles'
              ? 'text-darkGreen font-semibold'
              : 'text-charcoal/60 hover:text-darkGreen'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Roles</span>
          {activeSubTab === 'roles' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D3829]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('permissions')}
          className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer relative ${
            activeSubTab === 'permissions'
              ? 'text-darkGreen font-semibold'
              : 'text-charcoal/60 hover:text-darkGreen'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Document Permissions</span>
          {activeSubTab === 'permissions' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D3829]" />
          )}
        </button>
      </div>

      {/* ── Main Two-Column Layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Users Table ───────────────────────────── */}
        <div className="lg:col-span-8 bg-white border border-gray-200/90 rounded-2xl shadow-2xs overflow-hidden">
          {/* Card Header with Search Input */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-darkGreen">Users</h2>
              <p className="text-xs text-charcoal/60 mt-0.5">
                Manage user access and role assignments.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users…"
                className="w-full pl-9 pr-3 py-1.5 text-xs text-charcoal bg-gray-50/80 hover:bg-gray-50 border border-gray-200/80 rounded-lg focus:outline-none focus:border-darkGreen focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 text-charcoal/60 border-b border-gray-100 font-medium">
                <tr>
                  <th className="px-5 py-3.5 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedUserIds.length > 0 &&
                        selectedUserIds.length === usersList.length
                      }
                      className="rounded border-gray-300 text-darkGreen focus:ring-darkGreen cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Access Level</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-charcoal">
                {filteredUsers.map((u) => {
                  const isChecked = selectedUserIds.includes(u.id);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      {/* Checkbox */}
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectUser(u.id)}
                          className="rounded border-gray-300 text-darkGreen focus:ring-darkGreen cursor-pointer"
                        />
                      </td>

                      {/* User (Avatar with Initials + Name + Email) */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] text-darkGreen font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {u.initials}
                          </div>
                          <div>
                            <span className="font-semibold text-darkGreen block">
                              {u.name}
                            </span>
                            <span className="text-[11px] text-charcoal/60 font-mono">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Dropdown */}
                      <td className="px-4 py-4 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdownId(openDropdownId === u.id ? null : u.id)
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-xs font-medium text-darkGreen cursor-pointer"
                        >
                          <span>{u.role}</span>
                          <ChevronDown className="w-3 h-3 text-charcoal/50" />
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdownId === u.id && (
                          <div className="absolute left-4 top-12 z-20 w-32 bg-white border border-gray-200 rounded-xl shadow-lg py-1 text-xs">
                            {['Admin', 'Editor', 'Viewer'].map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => handleRoleChange(u.id, r)}
                                className={`w-full text-left px-3 py-1.5 hover:bg-mint-50 flex items-center justify-between cursor-pointer ${
                                  u.role === r ? 'font-semibold text-darkGreen' : 'text-charcoal'
                                }`}
                              >
                                <span>{r}</span>
                                {u.role === r && <Check className="w-3 h-3 text-darkGreen" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Access Level */}
                      <td className="px-4 py-4 text-charcoal/80 font-medium">
                        {u.accessLevel}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            u.status === 'Active' ? 'text-emerald-700' : 'text-charcoal/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                          <span>{u.status}</span>
                        </span>
                      </td>

                      {/* Action 3-dots */}
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          className="p-1 text-charcoal/40 hover:text-charcoal transition-colors cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-charcoal/60">
            <span>Showing 1 - {filteredUsers.length} of 24 users</span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-charcoal/50 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                className="w-7 h-7 rounded-lg bg-[#0D3829] text-white font-medium text-xs flex items-center justify-center cursor-pointer shadow-2xs"
              >
                1
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-lg hover:bg-gray-100 text-charcoal font-medium text-xs flex items-center justify-center cursor-pointer"
              >
                2
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-lg hover:bg-gray-100 text-charcoal font-medium text-xs flex items-center justify-center cursor-pointer"
              >
                3
              </button>
              <span className="px-1 text-charcoal/40">…</span>
              <button
                type="button"
                className="w-7 h-7 rounded-lg hover:bg-gray-100 text-charcoal font-medium text-xs flex items-center justify-center cursor-pointer"
              >
                5
              </button>

              <button
                type="button"
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-charcoal/50 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Roles & Document Permissions ─────────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Roles Summary */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-semibold text-darkGreen">Roles</h3>
              <p className="text-xs text-charcoal/60 mt-0.5">
                Define roles and their default permissions.
              </p>
            </div>

            <div className="space-y-3">
              {/* Admin */}
              <div className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-darkGreen text-xs">Admin</h4>
                    <p className="text-[11px] text-charcoal/60">
                      Full system access and control
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-medium text-charcoal/60 group-hover:text-darkGreen">
                  <span>5 users</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Editor */}
              <div className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center shrink-0">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-darkGreen text-xs">Editor</h4>
                    <p className="text-[11px] text-charcoal/60">
                      View, upload and modify documents
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-medium text-charcoal/60 group-hover:text-darkGreen">
                  <span>8 users</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Viewer */}
              <div className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 text-charcoal/70 border border-gray-200 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-darkGreen text-xs">Viewer</h4>
                    <p className="text-[11px] text-charcoal/60">
                      View documents and use chat
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-medium text-charcoal/60 group-hover:text-darkGreen">
                  <span>11 users</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Document Permissions */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-semibold text-darkGreen">Document Permissions</h3>
              <p className="text-xs text-charcoal/60 mt-0.5">
                Set access rules for documents and folders.
              </p>
            </div>

            <div className="space-y-3">
              {/* Company Policies */}
              <div className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-sage" />
                  <span className="font-semibold text-darkGreen text-xs">
                    Company Policies
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-charcoal/60 group-hover:text-darkGreen">
                  <span>Admin, Editor</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Project Documents */}
              <div className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-sage" />
                  <span className="font-semibold text-darkGreen text-xs">
                    Project Documents
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-charcoal/60 group-hover:text-darkGreen">
                  <span>Admin, Editor, Viewer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* HR & Employee Data */}
              <div className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-sage" />
                  <span className="font-semibold text-darkGreen text-xs">
                    HR & Employee Data
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-charcoal/60 group-hover:text-darkGreen">
                  <span className="text-amber-800 font-medium">Admin only</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Financial Records */}
              <div className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-sage" />
                  <span className="font-semibold text-darkGreen text-xs">
                    Financial Records
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-charcoal/60 group-hover:text-darkGreen">
                  <span>Admin, Editor</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add User Modal ────────────────────────────────────────── */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-darkGreen">Add New User</h3>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-charcoal/40 hover:text-charcoal p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-darkGreen mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-darkGreen"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-darkGreen mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. john.doe@company.com"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-darkGreen font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-darkGreen mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-darkGreen bg-white"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Editor">Editor (Read & Write)</option>
                  <option value="Viewer">Viewer (Read Only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 text-xs text-charcoal/70 hover:text-charcoal font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D3829] hover:bg-[#0D3829]/90 text-white text-xs font-medium transition-all shadow-xs"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
