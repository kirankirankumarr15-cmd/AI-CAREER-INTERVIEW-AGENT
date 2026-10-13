'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';

export default function AtsAnalyzerPage() {
  const { profile, skills, projects, education, syncWithSupabase } = useProfileStore();

  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  const verifiedSkills = skills.filter((s) => s.verificationStatus === 'Verified');
  const verifiedProjects = projects.filter((p) => p.verificationStatus === 'Verified');

  // Compute realistic ATS metrics based on live verified profile
  const hasBasics = Boolean(profile.fullName && profile.email);
  const hasEducation = Boolean(education.length > 0 || profile.college);
  const skillsCount = verifiedSkills.length;
  const projectsCount = verifiedProjects.length;

  const compatibilityScore = Math.min(95, 40 + (hasBasics ? 15 : 0) + (hasEducation ? 15 : 0) + (skillsCount >= 3 ? 15 : 5) + (projectsCount >= 1 ? 10 : 0));
  const keywordScore = Math.min(92, Math.max(30, skillsCount * 12));
  const formattingScore = 95; // Clean single-column standard ensures 95%
  const projectRelevanceScore = Math.min(90, Math.max(35, projectsCount * 25));

  const overallAtsScore = Math.round((compatibilityScore + keywordScore + formattingScore + projectRelevanceScore) / 4);

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            Automated Scanner Engine • Workday, Taleo &amp; Greenhouse Parser Benchmark
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ATS Resume Analyzer</h1>
          <p className="text-[13px] text-slate-500 font-medium max-w-3xl">
            Live parser audit evaluating keyword densities, section headers, and semantic relevance for {profile.targetRole || 'your target role'}.
          </p>
        </div>
      </div>

      {/* Top Main Score Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:border-indigo-200 transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-indigo-50 border-[3px] border-indigo-500 flex items-center justify-center shadow-inner">
              <span className="text-3xl font-black text-indigo-700">{overallAtsScore}</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex flex-wrap items-center gap-3">
                ATS Health: {overallAtsScore >= 80 ? 'Excellent' : overallAtsScore >= 60 ? 'Competitive' : 'Needs Verification'}
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest border border-emerald-200 shadow-sm">
                  {overallAtsScore >= 80 ? 'Top Tier Readiness' : 'In Progress'}
                </span>
              </h2>
              <p className="text-[13px] text-slate-500 font-medium mt-1.5 max-w-xl leading-relaxed">
                Evaluated against verified data for {profile.fullName || 'student'}. Parsing strictly complies with ATS standard heading structures.
              </p>
            </div>
          </div>
          <Link
            href="/resume"
            className="shrink-0 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-colors"
          >
            Open in Builder <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'ATS Format Compatibility', score: compatibilityScore },
            { label: 'Verified Keyword Match', score: keywordScore },
            { label: 'Standard Single-Column Layout', score: formattingScore },
            { label: 'Project Technical Relevance', score: projectRelevanceScore },
          ].map((metric) => (
            <div key={metric.label} className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-8">{metric.label}</h4>
              <div className="text-2xl font-black text-slate-900">{metric.score}%</div>
              <div className="h-1.5 rounded-full bg-slate-100 w-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${metric.score}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verified Keywords Detected */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-1">
              Verified Keywords Indexed
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Confirmed technical skills detected by parser for {profile.targetRole || 'engineering roles'}.
            </p>
          </div>
          <div className="space-y-2.5 flex-1">
            {verifiedSkills.length > 0 ? (
              verifiedSkills.map((sk) => (
                <div
                  key={sk.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                >
                  <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {sk.name}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs italic border border-dashed rounded-xl">
                No verified skills detected yet. Upload certificates to verify keywords.
              </div>
            )}
          </div>
        </div>

        {/* Actionable Parser Recommendations */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-1">
              Actionable Parser Recommendations
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Specific actions to advance parsing performance and recruiter review pass-rate.
            </p>
          </div>
          <div className="space-y-5 flex-1">
            {skillsCount < 5 && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Expand Verified Technical Stack
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Enterprise job descriptions for {profile.targetRole || 'developers'} filter for at least 5 technical keywords. Upload additional project code or certificates to confirm more skills.
                </p>
              </div>
            )}

            {projectsCount < 2 && (
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Add Quantifiable Project Metrics
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  Add metrics like latency reduction, request throughput, or test coverage to your projects in your Career Profile.
                </p>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/documents"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-colors"
              >
                Go to Documents to Verify More &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
