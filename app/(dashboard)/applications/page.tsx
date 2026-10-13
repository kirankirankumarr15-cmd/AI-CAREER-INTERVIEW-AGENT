'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useProfileStore } from '@/store/useProfileStore';

interface ApplicationCard {
  id: string;
  company: string;
  role: string;
  type: string;
  salary: string;
  status: 'Saved' | 'Ready to Apply' | 'Applied' | 'Assessment' | 'Offer';
  date: string;
  submissionApproved: boolean;
  alert?: string;
}

const defaultOpportunities: ApplicationCard[] = [
  {
    id: 'app-1',
    company: 'Stripe',
    role: 'Backend Software Engineer (Early Career)',
    type: 'Full-Time',
    salary: '₹18 - 24 LPA',
    status: 'Ready to Apply',
    date: 'Active Now',
    submissionApproved: false,
    alert: 'Awaiting explicit student approval',
  },
  {
    id: 'app-2',
    company: 'Razorpay',
    role: 'Software Development Engineer - I',
    type: 'Full-Time',
    salary: '₹15 - 20 LPA',
    status: 'Assessment',
    date: 'In Progress',
    submissionApproved: true,
    alert: 'Online Assessment in 3 days',
  },
];

export default function ApplicationsPage() {
  const { profile } = useProfileStore();
  const [applications, setApplications] = useState<ApplicationCard[]>(defaultOpportunities);
  const [selectedApp, setSelectedApp] = useState<ApplicationCard | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [approvedCheckbox, setApprovedCheckbox] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newSalary, setNewSalary] = useState('');

  useEffect(() => {
    async function loadApplications() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        const loaded: ApplicationCard[] = data.map((d: { id: string; company: string; role: string; type?: string; salary?: string; status: string; applied_at: string; submission_approved: boolean; notes?: string }) => ({
          id: d.id,
          company: d.company,
          role: d.role,
          type: d.type || 'Full-Time',
          salary: d.salary || 'Competitive',
          status: (d.status as ApplicationCard['status']) || 'Saved',
          date: d.applied_at ? new Date(d.applied_at).toLocaleDateString() : 'Just added',
          submissionApproved: d.submission_approved || false,
          alert: d.notes,
        }));
        setApplications(loaded);
      }
    }

    loadApplications();
  }, []);

  const handleApproveSubmission = async () => {
    if (!selectedApp || !approvedCheckbox) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const updated = applications.map((a) =>
      a.id === selectedApp.id
        ? { ...a, status: 'Applied' as const, submissionApproved: true, alert: undefined }
        : a
    );
    setApplications(updated);

    if (user) {
      await supabase
        .from('applications')
        .upsert({
          id: selectedApp.id,
          user_id: user.id,
          company: selectedApp.company,
          role: selectedApp.role,
          status: 'Applied',
          submission_approved: true,
          applied_at: new Date().toISOString(),
        });
    }

    setShowApprovalModal(false);
    setSelectedApp(null);
    setApprovedCheckbox(false);
  };

  const handleAddApplication = async () => {
    if (!newCompany.trim() || !newRole.trim()) return;

    const newApp: ApplicationCard = {
      id: `app-${Date.now()}`,
      company: newCompany.trim(),
      role: newRole.trim(),
      type: 'Full-Time',
      salary: newSalary.trim() || 'Competitive',
      status: 'Saved',
      date: 'Today',
      submissionApproved: false,
    };

    setApplications((prev) => [newApp, ...prev]);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('applications').insert({
        id: newApp.id,
        user_id: user.id,
        company: newApp.company,
        role: newApp.role,
        status: 'Saved',
        submission_approved: false,
      });
    }

    setNewCompany('');
    setNewRole('');
    setNewSalary('');
    setShowAddModal(false);
  };

  const stages: Array<{ id: ApplicationCard['status']; title: string }> = [
    { id: 'Saved', title: 'Saved' },
    { id: 'Ready to Apply', title: 'Ready to Apply' },
    { id: 'Applied', title: 'Applied (Approved)' },
    { id: 'Assessment', title: 'Assessment & Rounds' },
    { id: 'Offer', title: 'Offers' },
  ];

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto font-sans">
      {/* Top Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Job Applications</h1>
        <p className="text-[13px] text-slate-500 font-medium mt-1">
          Active application pipeline • Explicit student approval required prior to submission
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Zero-Unapproved-Submission Guarantee
            </p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Application Pipeline Tracker</h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Opportunity
          </button>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x">
          {stages.map((stage) => {
            const stageCards = applications.filter((a) => a.status === stage.id);
            return (
              <div key={stage.id} className="w-[300px] shrink-0 snap-start flex flex-col max-h-[75vh]">
                {/* Column Header */}
                <div className="flex items-center justify-between p-3.5 mb-3 rounded-2xl bg-slate-100 border border-slate-200/60 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-700 font-extrabold text-[12px]">
                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                    {stage.title}
                  </div>
                  <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-black">
                    {stageCards.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {stageCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">{card.company}</h3>
                          <p className="text-[11px] text-slate-500 font-bold mt-0.5 line-clamp-1">{card.role}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {card.type}
                        </span>
                      </div>

                      <p className="text-[11px] font-bold text-slate-700 mb-3">{card.salary}</p>

                      {card.alert && (
                        <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span className="text-[10px] font-bold text-amber-800 leading-tight">{card.alert}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-400 font-semibold">{card.date}</span>

                        {card.status === 'Ready to Apply' && !card.submissionApproved ? (
                          <button
                            onClick={() => {
                              setSelectedApp(card);
                              setShowApprovalModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer"
                          >
                            Review &amp; Approve
                          </button>
                        ) : card.submissionApproved ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Approved
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold">{card.status}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {stageCards.length === 0 && (
                    <div className="h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      No applications in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Explicit Student Approval Prior to Submission */}
      {showApprovalModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="text-base font-black text-slate-900">Student Explicit Approval</h3>
              </div>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedApp(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                You are about to approve the submission of your verified application to{' '}
                <span className="font-bold text-slate-900">{selectedApp.company}</span> for the position of{' '}
                <span className="font-bold text-slate-900">{selectedApp.role}</span>.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider block">
                  Application Summary:
                </span>
                <p>• Student Name: {profile.fullName || 'Student'}</p>
                <p>• Verified ATS Resume: Standard Single-Column Master</p>
                <p>• Verified Contact: {profile.email || 'Email in profile'}</p>
              </div>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvedCheckbox}
                  onChange={(e) => setApprovedCheckbox(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px] font-bold text-indigo-950">
                  I have verified my profile details and explicitly approve submitting this application.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedApp(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!approvedCheckbox}
                onClick={handleApproveSubmission}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Confirm &amp; Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Opportunity */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Add Job Opportunity</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Google, Microsoft, Startup"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Role Title
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Junior Backend Engineer, SDE-1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Compensation / CTC
                </label>
                <input
                  type="text"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  placeholder="e.g. ₹16 - 22 LPA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddApplication}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Save Opportunity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
