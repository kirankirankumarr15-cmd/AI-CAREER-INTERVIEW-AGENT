'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, roleFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    if (action.includes('drilldown')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (action.includes('import')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('privacy') || action.includes('consent')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('report')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Administrative Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
              Immutable
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Tracks all staff actions, individual student drilldown views, bulk imports, report downloads, and DPDP privacy modifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Filter By:</span>
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800"
          >
            <option value="all">All Actions</option>
            <option value="student.drilldown_viewed">Student Drilldown Views</option>
            <option value="import.executed">Bulk Roster Imports</option>
            <option value="reports.exported">Report Exports</option>
            <option value="privacy.request_resolved">Privacy Request Resolutions</option>
            <option value="staff.invited">Staff Invitations</option>
          </select>
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="institution_admin">Institution Admin</option>
            <option value="tpo">TPO</option>
            <option value="department_coordinator">Department Coordinator</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500">
          Showing <strong>{logs.length}</strong> logged events
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {loading ? 'Loading audit trail...' : 'No audit entries match the current filter criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor / User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{entry.actorName}</div>
                      <div className="text-[11px] text-slate-400">{entry.actorEmail}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {entry.actorRole || 'admin'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionBadge(
                          entry.action
                        )}`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {entry.targetType ? `${entry.targetType}: ${entry.targetId ?? 'N/A'}` : '—'}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {entry.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="p-3 text-right">
                      {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                        >
                          View JSON
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Metadata Inspector Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Audit Event Metadata</h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>
                <strong>Action:</strong> {selectedEntry.action}
              </div>
              <div>
                <strong>Actor:</strong> {selectedEntry.actorName} ({selectedEntry.actorEmail})
              </div>
              <div>
                <strong>Recorded:</strong> {new Date(selectedEntry.createdAt).toISOString()}
              </div>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
              {JSON.stringify(selectedEntry.metadata, null, 2)}
            </pre>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

