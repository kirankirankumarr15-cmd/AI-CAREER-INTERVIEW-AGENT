'use client';

import { useState, useEffect } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { generateJobTailoredResume, analyzeResumeATS, ResumeGenerationOutput, ATSAnalysisOutput } from '@/lib/ai/agents/resume-agent';
import { FileText, Sparkles, Loader2, Award, AlertTriangle, Printer, CheckCircle2 } from 'lucide-react';
import { RadialProgressRing } from '@/components/common/RadialProgressRing';

export default function ResumePage() {
  const { profile, skills, projects, experiences, education, certifications } = useProfileStore();

  const [loading, setLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<ResumeGenerationOutput | null>(null);
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysisOutput | null>(null);
  const [targetRole, setTargetRole] = useState(profile.targetRole || 'Full Stack Developer');

  const handleGenerateResume = async (roleToUse?: string) => {
    setLoading(true);
    const role = roleToUse || targetRole;
    const resume = await generateJobTailoredResume(role, profile, skills, projects, experiences, education, certifications);
    setGeneratedResume(resume);
    const ats = await analyzeResumeATS(resume);
    setAtsAnalysis(ats);
    setLoading(false);
  };

  useEffect(() => {
    if (!generatedResume) handleGenerateResume();
  }, []);

  return (
    <div className="space-y-6 pb-16 animate-fade-in-up">
      {/* Header */}
      <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <FileText className="h-4 w-4" /> AI Resume Generator & ATS Scanner
          </div>
          <h1 className="text-2xl font-extrabold text-[#FAFAFA]">Job-Specific Resume Builder</h1>
          <p className="text-xs text-[#71717A] mt-1 font-medium">
            Generates ATS-optimized resumes built 100% from your <span className="text-emerald-400 font-bold">Verified</span> profile facts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {generatedResume && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#FAFAFA] text-xs font-bold flex items-center gap-2 border border-[#27272F] transition-colors"
            >
              <Printer className="h-4 w-4 text-[#71717A]" />
              <span>Print / Save PDF</span>
            </button>
          )}
          <button
            onClick={() => handleGenerateResume()}
            disabled={loading}
            className="btn-shine px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>{generatedResume ? 'Re-Generate Resume' : 'Build Resume'}</span>
          </button>
        </div>
      </div>

      {/* Target Role Selector */}
      <div className="card p-4 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-[#71717A] font-bold">Target Resume Role:</span>
        {['Software Developer', 'Full Stack Developer', 'Frontend Developer', 'Data Analyst', 'AI/ML Engineer'].map((r) => (
          <button
            key={r}
            onClick={() => { setTargetRole(r); handleGenerateResume(r); }}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors ${
              targetRole === r
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : 'bg-white/5 text-[#A1A1AA] border border-[#27272F] hover:border-[#3A3A45] hover:text-[#FAFAFA]'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading && !generatedResume && (
        <div className="card p-16 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-400" />
          <p className="text-xs text-[#71717A] font-medium">Building tailored ATS resume from verified candidate facts...</p>
        </div>
      )}

      {/* Resume + ATS Grid */}
      {generatedResume && atsAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resume Preview */}
          <div
            id="printable-resume"
            className="lg:col-span-2 card p-8 space-y-6"
            style={{ background: '#ffffff', color: '#0f172a' }}
          >
            {/* Header */}
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-black text-slate-900">{profile.fullName}</h2>
              <p className="text-xs text-indigo-600 font-bold mt-0.5">{targetRole}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {profile.email} • {profile.phone} • {profile.location} • {profile.githubUrl}
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Professional Summary</h3>
              <p className="text-xs leading-relaxed text-slate-700 font-medium">{generatedResume.summary}</p>
            </div>

            {/* Skills */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Core Technical Skills</h3>
              <div className="text-xs text-slate-700 font-medium space-y-1">
                <p><strong className="text-slate-900">Languages & Core:</strong> {generatedResume.skillsCategorized.languages.join(', ')}</p>
                <p><strong className="text-slate-900">Frameworks:</strong> {generatedResume.skillsCategorized.frameworks.join(', ')}</p>
                <p><strong className="text-slate-900">Tools & Infra:</strong> {generatedResume.skillsCategorized.tools.join(', ')}</p>
              </div>
            </div>

            {/* Projects */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Projects</h3>
              {generatedResume.tailoredProjects.map((p, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{p.title}</span>
                    <span className="text-[10px] text-indigo-600 font-bold">{p.tech.join(', ')}</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-700 font-medium space-y-0.5 pl-1">
                    {p.bulletPoints.map((bp, bIdx) => <li key={bIdx}>{bp}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Education</h3>
              {generatedResume.education.map((e, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-700 font-medium">
                  <span><strong>{e.degree}</strong>, {e.institution} ({e.cgpa})</span>
                  <span className="text-slate-500">{e.year}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ATS Analysis Column */}
          <div className="space-y-4">
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F1F27]">
                <h3 className="font-bold text-sm text-[#FAFAFA] flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" /> ATS Compatibility
                </h3>
              </div>

              <div className="flex justify-center">
                <RadialProgressRing
                  score={atsAnalysis.atsScore}
                  size={100}
                  strokeWidth={8}
                  color="#10B981"
                  sublabel="ATS Score"
                />
              </div>

              <div className="space-y-2 text-xs font-medium">
                {[
                  { label: 'Formatting Match', value: atsAnalysis.formattingScore, color: '#10B981' },
                  { label: 'Keyword Density', value: atsAnalysis.keywordScore, color: '#6366F1' },
                  { label: 'Readability', value: atsAnalysis.readabilityScore, color: '#0EA5E9' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[#A1A1AA] mb-1">
                      <span>{label}</span>
                      <span className="font-bold tabular-nums" style={{ color }}>{value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#27272F] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#1F1F27] space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Recommendations:
                </span>
                {atsAnalysis.actionableRecommendations.map((rec, i) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-500/8 border border-amber-500/20 text-xs text-[#A1A1AA] font-medium flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified data notice */}
            <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs text-emerald-400 font-medium flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Resume built exclusively from <strong>Verified</strong> profile data only.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
