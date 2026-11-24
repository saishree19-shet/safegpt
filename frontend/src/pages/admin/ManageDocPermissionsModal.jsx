/**
 * ManageDocPermissionsModal — Admin modal to inspect, grant, and revoke employee permissions on a document.
 */
import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserCheck,
  UserX,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Lock
} from 'lucide-react';
import {
  listDocumentPermissions,
  grantPermission,
  revokePermission,
  listUsers
} from '../../api/documents';

export default function ManageDocPermissionsModal({ documentId, docTitle, isOpen, onClose, onUpdated }) {
  const [permissions, setPermissions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!isOpen || !documentId) return;
    setMsg({ type: '', text: '' });
    loadData();
  }, [isOpen, documentId]);

  async function loadData() {
    setLoading(true);
    try {
      const [permsData, usersData] = await Promise.all([
        listDocumentPermissions(documentId).catch(() => []),
        listUsers().catch(() => [])
      ]);

      setPermissions(Array.isArray(permsData) ? permsData : []);

      const emps = Array.isArray(usersData) ? usersData.filter((u) => u.role === 'employee') : [];
      setEmployees(emps);
      if (emps.length > 0) {
        setSelectedUserId(String(emps[0].id));
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to load document permissions.' });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  async function handleGrant(e) {
    e.preventDefault();
    if (!selectedUserId) return;
    setActionLoading(true);
    setMsg({ type: '', text: '' });

    try {
      await grantPermission(documentId, {
        user_id: parseInt(selectedUserId, 10),
        can_read: true,
      });

      setMsg({ type: 'success', text: 'Permission granted successfully!' });
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMsg({ type: 'error', text: detail || 'Failed to grant permission.' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevoke(userId) {
    if (!window.confirm('Are you sure you want to revoke this employee\'s access?')) return;
    setActionLoading(true);
    setMsg({ type: '', text: '' });

    try {
      await revokePermission(documentId, userId);
      setMsg({ type: 'success', text: 'Access revoked successfully.' });
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMsg({ type: 'error', text: detail || 'Failed to revoke permission.' });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-darkGreen text-base">
              Document Access Permissions
            </h3>
            <p className="text-xs text-stone-500 truncate max-w-sm">
              {docTitle || `Document #${documentId}`}
            </p>
          </div>
        </div>

        {msg.text && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              msg.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {msg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Grant New Employee Access Section */}
        <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200/80 mb-5">
          <span className="font-semibold text-xs text-charcoal block mb-2">
            Grant Access to Employee:
          </span>
          <form onSubmit={handleGrant} className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={actionLoading || loading}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name || 'Employee'} ({emp.email})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={actionLoading || loading || !selectedUserId}
              className="px-4 py-2 bg-[#0D3829] hover:bg-[#154E3A] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer shrink-0"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Grant</span>
            </button>
          </form>
        </div>

        {/* Current Authorized Users List */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Currently Authorized Users ({permissions.length})
          </span>

          {loading ? (
            <div className="py-6 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              <span>Loading authorized users...</span>
            </div>
          ) : permissions.length === 0 ? (
            <div className="p-4 text-center rounded-2xl bg-stone-50 border border-stone-100 text-xs text-stone-500">
              No individual employee permissions have been granted yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto">
              {permissions.map((perm) => (
                <div key={perm.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-darkGreen block font-mono">
                      {perm.user_email}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      User #{perm.user_id} • Can Read
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevoke(perm.user_id)}
                    disabled={actionLoading}
                    className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 text-[11px] font-semibold border border-red-200 transition-colors cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
