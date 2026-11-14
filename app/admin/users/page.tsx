'use client';

import { useState, useEffect } from 'react';
import {
  UserCog,
  UserPlus,
  Mail,
  Shield,
  Building2,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { AdminRole } from '@/lib/admin/types';

interface StaffUser {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: AdminRole;
  departmentName: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('faculty');
  const [inviteDept, setInviteDept] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus('saving');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          departmentId: inviteDept || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite staff member');
      setInviteStatus('done');
      fetchUsers();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteStatus('idle');
        setInviteEmail('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error sending invite');
      setInviteStatus('idle');
    }
  };

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'institution_admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tpo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'department_coordinator':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'faculty':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <UserCog className="h-3.5 w-3.5" /> Institutional Administration
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Faculty Directory</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage institutional access, assign placement roles, and supervise departmental permissions.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start md:self-auto"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Invite Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="card rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Department Scope</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Added On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                      {u.fullName.charAt(0)}
                    </div>
                    <span>{u.fullName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getRoleBadge(u.role)}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">{u.departmentName}</td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400 font-medium">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="card max-w-md w-full p-6 rounded-2xl border border-slate-200 space-y-5 bg-white shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-extrabold text-xs uppercase tracking-wider">
                <UserPlus className="h-4 w-4" /> Invite Staff Member
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="faculty@pesitm.edu.in"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="faculty">Faculty Member (Read-Only Dept)</option>
                  <option value="department_coordinator">Department Coordinator</option>
                  <option value="tpo">Training & Placement Officer (TPO)</option>
                  <option value="institution_admin">Institution Administrator</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Department Scope</label>
                <select
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">All Departments (Institutional)</option>
                  <option value="dept_cse">Computer Science & Engineering</option>
                  <option value="dept_ise">Information Science & Engineering</option>
                  <option value="dept_ece">Electronics & Communication</option>
                  <option value="dept_aiml">AI & Machine Learning</option>
                </select>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {inviteStatus === 'done' && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Invitation created successfully!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteStatus === 'saving' || inviteStatus === 'done'}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {inviteStatus === 'saving' ? 'Inviting...' : 'Send Staff Invite →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

