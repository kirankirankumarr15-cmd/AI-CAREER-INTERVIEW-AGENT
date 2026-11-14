'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Download,
  Edit3,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Building,
  Mail,
} from 'lucide-react';

interface Purpose {
  id: string;
  title: string;
  description: string;
  isMandatory: boolean;
}

interface PrivacyRequest {
  id: string;
  request_type: string;
  details: string;
  status: string;
  resolution_note?: string;
  created_at: string;
  due_at?: string;
}

export default function StudentPrivacyPage() {
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [requestType, setRequestType] = useState('data_access');
  const [requestDetails, setRequestDetails] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [consRes, reqRes] = await Promise.all([
        fetch('/api/student/privacy/consents'),
        fetch('/api/student/privacy/requests'),
      ]);

      if (consRes.ok) {
        const cData = await consRes.json();
        setPurposes(cData.purposes || []);
        setConsents(cData.consents || {});
      }
      if (reqRes.ok) {
        const rData = await reqRes.json();
        setRequests(rData.requests || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load privacy settings' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleConsent = async (purposeId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    // Optimistic update
    setConsents((prev) => ({ ...prev, [purposeId]: newVal }));

    try {
      const res = await fetch('/api/student/privacy/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purposeId,
          status: newVal ? 'granted' : 'withdrawn',
        }),
      });

      if (!res.ok) throw new Error('Failed to update consent');
      setMessage({
        type: 'success',
        text: `Consent for "${purposeId}" ${newVal ? 'granted' : 'withdrawn'} successfully.`,
      });
    } catch {
      // Revert on failure
      setConsents((prev) => ({ ...prev, [purposeId]: currentVal }));
      setMessage({ type: 'error', text: 'Failed to record consent decision.' });
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDetails.trim()) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/student/privacy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          description: requestDetails,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit request');
      }

      setMessage({
        type: 'success',
        text: 'Your Data Subject Request has been filed with the PESITM Data Protection Officer.',
      });
      setShowRequestModal(false);
      setRequestDetails('');
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Submission failed' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link & Header */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 mb-3 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Student Portal
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Privacy &amp; Data Rights Portal
                </h1>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                India Digital Personal Data Protection Act, 2023 (DPDP Act) Student Self-Service Center.
              </p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition"
            >
              File Data Rights Request
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-lg text-xs border flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Modal for filing request */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Submit DPDP Data Rights Request</h3>
                <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-600">
                You have the statutory right under DPDP Act 2023 to request access, rectification, or erasure of your personal
                records. The placement office must respond within 30 days.
              </p>

              <form onSubmit={handleCreateRequest} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Request Type</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
                  >
                    <option value="data_access">Data Access (Export copy of all my data)</option>
                    <option value="data_correction">Data Correction (Rectify academic records or USN)</option>
                    <option value="data_erasure">Data Erasure (Delete optional interview recordings/assessments)</option>
                    <option value="grievance">Privacy Grievance (File complaint to Data Protection Officer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Details &amp; Reason</label>
                  <textarea
                    value={requestDetails}
                    onChange={(e) => setRequestDetails(e.target.value)}
                    placeholder="Specify the exact records, incorrect details, or privacy concern..."
                    rows={4}
                    required
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Consent Preferences Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Data Processing Consents</h2>
            <p className="text-xs text-slate-500">
              Control how PESITM and CareerPilot process your personal, academic, and evaluation data.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {purposes.map((p) => {
              const isChecked = consents[p.id] ?? false;
              return (
                <div key={p.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">{p.title}</span>
                      {p.isMandatory ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          <Lock className="h-3 w-3" /> Mandatory for Placement
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{p.description}</p>
                  </div>

                  <div>
                    {p.isMandatory ? (
                      <span className="text-xs text-slate-400 font-medium px-2 py-1">Enforced</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleConsent(p.id, isChecked)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isChecked ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isChecked ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filed Requests Tracker */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Data Subject Requests History</h2>
            <p className="text-xs text-slate-500">
              Track statutory requests filed with the institutional placement office.
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              You haven&apos;t filed any data rights requests.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Request Type</th>
                    <th className="p-2.5">Details</th>
                    <th className="p-2.5">Submitted On</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">DPO Resolution Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="p-2.5 font-medium capitalize text-slate-900">
                        {r.request_type.replace('_', ' ')}
                      </td>
                      <td className="p-2.5 max-w-xs truncate text-slate-600">{r.details}</td>
                      <td className="p-2.5 text-slate-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            r.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : r.status === 'rejected'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500 text-[11px]">
                        {r.resolution_note || 'In review by DPO'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DPO Institutional Contact Information */}
        <div className="bg-slate-100 rounded-xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Building className="h-4 w-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Institutional Data Protection Officer (DPO) Contact
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            For unresolved privacy concerns or immediate questions regarding personal data under the DPDP Act 2023:
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-700">
            <span>
              <strong>Officer:</strong> Prof. Ramesh Rao (DPO)
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-slate-500" /> dpo@pesitm.edu.in
            </span>
            <span>
              <strong>Office:</strong> Placement &amp; Training Cell, Administrative Block, PESITM Shivamogga
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

