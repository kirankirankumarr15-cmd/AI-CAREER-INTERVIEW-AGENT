'use client';

import { useState } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { prepareApplicationAnswers, ApplicationPrepOutput } from '@/lib/ai/agents/application-agent';
import { Send, CheckCircle2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

export default function ApplicationsPage() {
  const { profile, skills, projects, experiences } = useProfileStore();

  const [company, setCompany] = useState('TechNovation Corp');
  const [role, setRole] = useState('Full Stack Engineer');
  const [loading, setLoading] = useState(false);
  const [prepData, setPrepData] = useState<ApplicationPrepOutput | null>(null);
  const [isStudentApproved, setIsStudentApproved] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePrepareApplication = async () => {
    setLoading(true);
    const res = await prepareApplicationAnswers(company, role, '', profile, skills, projects, experiences);
    setPrepData(res);
    setIsStudentApproved(false);
    setIsSubmitted(false);
    setLoading(false);
  };

  const handleFinalSubmit = () => {
    if (!isStudentApproved) return;
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Header */}
      <div className="white-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Send className="h-4 w-4" /> AI Job Application Assistant
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Application Prep & Approval Safety</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Generates verified application answers. Requires explicit student approval before final submission.
          </p>
        </div>
      </div>

      {/* Target Setup */}
      <div className="white-card p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Prepare New Application</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Company Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Target Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold"
            />
          </div>
        </div>

        <button
          onClick={handlePrepareApplication}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span>Generate Verified Answers & Check Eligibility</span>
        </button>
      </div>

      {/* Application Review & Student Approval Flow */}
      {prepData && (
        <div className="white-card p-6 space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Step 2: Student Review</span>
              <h2 className="text-lg font-bold text-slate-900">Application Answers for {company}</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {prepData.completenessPercentage}% Complete
            </span>
          </div>

          {/* Answers */}
          <div className="space-y-4">
            {prepData.fieldAnswers.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{item.questionLabel}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium bg-white p-3 rounded-lg border border-slate-200 leading-relaxed font-sans">
                  {item.generatedAnswer}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Generated using 100% verified student profile data.
                </div>
              </div>
            ))}
          </div>

          {/* Mandatory Approval Section */}
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Student Approval Required Before Submission</h4>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  CareerPilot AI will NEVER automatically submit applications without explicit human review and sign-off.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-indigo-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isStudentApproved}
                onChange={(e) => setIsStudentApproved(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
              />
              <span className="text-xs font-bold text-slate-800">
                I have reviewed all generated application answers and declare them accurate and truthful.
              </span>
            </label>

            <button
              onClick={handleFinalSubmit}
              disabled={!isStudentApproved || isSubmitted}
              className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isSubmitted
                  ? 'bg-emerald-600 text-white'
                  : isStudentApproved
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSubmitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <span>Application Status Updated to "Applied"!</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Approve & Record Application as Ready / Applied</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
