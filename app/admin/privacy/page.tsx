'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  RefreshCw,
  Mail,
  Phone,
  Building,
} from 'lucide-react';

interface PrivacyRequestItem {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentUsn: string;
  requestType: 'access' | 'correction' | 'erasure' | 'portability';
  details: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  resolutionNote?: string;
  dueAt: string;
  createdAt: string;
  isOverdue: boolean;
}

interface PolicyData {
  institution: {
    organizationName: string;
    dpoName: string;
    dpoEmail: string;
    dpoPhone: string;
    policyVersion: string;
    lastRevisedAt: string;
    framework: string;
  };
  purposes: Array<{
    code: string;
    title: string;
    description: string;
    legal_basis: string;
    is_required: boolean;
    retention_days: number;
    version: string;
  }>;
  complianceStats: {
    totalStudents: number;
    consentedCount: number;
    complianceRate: number;
  };
}

export default function AdminPrivacyPage() {
  const [requests, setRequests] = useState<PrivacyRequestItem[]>([]);
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'completed' | 'rejected' | 'in_progress'>('completed');
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, polRes] = await Promise.all([
        fetch(`/api/admin/privacy/requests?status=${statusFilter}`),
        fetch('/api/admin/privacy/policies'),
      ]);

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
      if (polRes.ok) {
        const polData = await polRes.json();
        setPolicy(polData);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load privacy data' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async () => {
    if (!resolvingId) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/privacy/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: resolvingId,
          status: resolutionStatus,
          resolutionNote,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update request');
      }

      setMessage({ type: 'success', text: `Request marked as ${resolutionStatus}` });
      setResolvingId(null);
      setResolutionNote('');
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const overdueCount = requests.filter((r) => r.isOverdue).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              DPDP Act 2023 Consent & Privacy Governance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Statutory Compliance
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Enforces India Digital Personal Data Protection Act, 2023 rules for PESITM. Governs personal data processing,
            purpose consent lifecycles, and Data Subject Rights requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-sm border flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">Consent Rate</span>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {policy?.complianceStats.complianceRate ?? 100}%
          </div>
          <p className="text-xs text-slate-500 mt-1">Active verified consent coverage</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">Pending Requests</span>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{pendingCount}</div>
          <p className="text-xs text-slate-500 mt-1">Awaiting DPO action</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">Overdue (&gt;30 Days)</span>
            <AlertTriangle className={`h-5 w-5 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold mt-2 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {overdueCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Strict statutory resolution window</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">Enrolled Students</span>
            <UserCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {policy?.complianceStats.totalStudents ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Covered under DPDP notice v1.4</p>
        </div>
      </div>

      {/* Resolution Modal */}
      {resolvingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Resolve Data Subject Rights Request</h3>
            <p className="text-sm text-slate-600">
              Submit formal resolution under DPDP Act 2023. This action is permanently recorded in the institutional audit log.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Status</label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value as 'completed' | 'rejected' | 'in_progress')}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
              >
                <option value="completed">Completed / Fulfilled</option>
                <option value="in_progress">In Progress (Under DPO Review)</option>
                <option value="rejected">Rejected (Lawful Exemption)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 uppercase mb-1">
                Resolution Note (Shared with Student &amp; Audited)
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Detail the steps taken (e.g., student records exported securely, optional interview transcripts purged)..."
                rows={4}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setResolvingId(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Submit Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Subject Requests Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Data Subject Rights (DSR) Requests</h2>
            <p className="text-xs text-slate-500">Student access, rectification, erasure, and grievance petitions.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            No privacy requests currently pending action.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Student &amp; USN</th>
                  <th className="p-3">Request Type</th>
                  <th className="p-3">Details / Reason</th>
                  <th className="p-3">Filed On</th>
                  <th className="p-3">30-Day Due Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{r.studentName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{r.studentUsn}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {r.requestType}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="truncate text-slate-800" title={r.details}>
                        {r.details || 'No details provided'}
                      </div>
                      {r.resolutionNote && (
                        <div className="text-[11px] text-emerald-600 mt-0.5 truncate" title={r.resolutionNote}>
                          Note: {r.resolutionNote}
                        </div>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={r.isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                        {new Date(r.dueAt).toLocaleDateString()}
                      </span>
                      {r.isOverdue && (
                        <span className="block text-[10px] text-red-600 uppercase font-semibold">Overdue</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {r.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                        </span>
                      )}
                      {r.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="h-3.5 w-3.5" /> In Progress
                        </span>
                      )}
                      {r.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                          <Clock className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                      {r.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {r.status !== 'completed' && r.status !== 'rejected' ? (
                        <button
                          onClick={() => {
                            setResolvingId(r.id);
                            setResolutionStatus('completed');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purpose Taxonomy Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-bold text-slate-900 mb-1">Institutional Consent Purpose Matrix</h2>
        <p className="text-xs text-slate-500 mb-4">
          Statutory processing purposes declared to students during enrollment and profile creation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(policy?.purposes || []).map((p) => (
            <div key={p.code} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">{p.title}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    p.is_required
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {p.is_required ? 'Mandatory Basis' : 'Freely Revocable'}
                </span>
              </div>
              <p className="text-xs text-slate-600">{p.description}</p>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span>
                  <strong>Legal Basis:</strong> {p.legal_basis}
                </span>
                <span>
                  <strong>Retention:</strong> {p.retention_days} days
                </span>
                <span>
                  <strong>Version:</strong> {p.version}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Institutional DPO Contact Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-300" />
              <h3 className="font-bold text-base">Institutional Data Protection Officer (DPO)</h3>
            </div>
            <p className="text-xs text-blue-200 mt-1 max-w-xl">
              In compliance with Section 8(5) of the Digital Personal Data Protection Act, 2023, the institution has
              designated a formal DPO to address student inquiries, rights requests, and data security audits.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-blue-100">
              <span className="font-medium">{policy?.institution.dpoName}</span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {policy?.institution.dpoEmail}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {policy?.institution.dpoPhone}
              </span>
            </div>
          </div>
          <div className="text-right whitespace-nowrap">
            <span className="text-[11px] text-blue-300 block">Policy Framework</span>
            <span className="text-xs font-semibold text-white">{policy?.institution.policyVersion}</span>
            <span className="text-[11px] text-blue-300 block mt-1">DPDP Act, 2023 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

