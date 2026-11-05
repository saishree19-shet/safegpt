/**
 * SettingsTab — Employee Profile and Workspace Preferences.
 */
import React from 'react';
import { User, Shield, LogOut, Lock, Mail, Calendar, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SettingsTab() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logoutUser();
    navigate('/login', { replace: true });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-2 border-b border-gray-100">
        <h1 className="text-xl sm:text-2xl font-bold text-darkGreen tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-charcoal/60 mt-1">
          Manage your account profile and inspect session security parameters.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-mint-100 border border-mint-border flex items-center justify-center text-darkGreen text-xl font-bold font-mono">
            {user?.full_name
              ? user.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'EM'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-darkGreen tracking-tight">
              {user?.full_name || 'Employee'}
            </h2>
            <p className="text-xs text-charcoal/60 font-mono mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-mint-100 text-darkGreen text-[11px] font-mono uppercase font-semibold">
              Role: {user?.role || 'employee'}
            </span>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
            <Mail className="w-4 h-4 text-sage shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-charcoal/50 block">Work Email</span>
              <span className="text-darkGreen font-semibold">{user?.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
            <Shield className="w-4 h-4 text-sage shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-charcoal/50 block">Account Status</span>
              <span className="text-darkGreen font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-softGreen" />
                <span>Active & Authorized</span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
            <Calendar className="w-4 h-4 text-sage shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-charcoal/50 block">Account ID</span>
              <span className="text-darkGreen font-semibold">#{user?.id ?? 'N/A'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
            <Lock className="w-4 h-4 text-sage shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-charcoal/50 block">Auth Token Storage</span>
              <span className="text-darkGreen font-semibold">Browser SessionStorage (Tab-isolated)</span>
            </div>
          </div>
        </div>

        {/* Informative notice */}
        <div className="p-4 rounded-xl bg-mint-50/60 border border-mint-border flex items-start gap-3 text-xs text-charcoal/70 leading-relaxed">
          <Info className="w-4 h-4 text-darkGreen shrink-0 mt-0.5" />
          <div>
            <strong className="text-darkGreen font-medium block">Administrative Provisioning</strong>
            Role elevation (such as Administrator or Security Officer scopes) or document permission
            changes must be provisioned directly by an authorized organization administrator.
          </div>
        </div>

        {/* Sign Out Action */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-darkGreen">Terminate Active Session</p>
            <p className="text-[11px] text-charcoal/50">
              Clears the bearer session token from browser memory.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium border border-red-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

