'use client';

import { useState } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { calculateJobMatch } from '@/lib/ai/agents/job-match-agent';
import { JobMatchResult } from '@/types';
import { Briefcase, Sparkles, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function JobsPage() {
  const { profile, skills, projects, experiences } = useProfileStore();
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);

  const sampleJd = `Company: TechNovation Solutions
Role: Full Stack Software Engineer (Entry Level)
Requirements:
- Strong proficiency in React.js, Node.js, and TypeScript
- Solid understanding of SQL Databases (PostgreSQL / MySQL)
- Experience designing RESTful APIs and state management
- Basic familiarity with Docker containerization & AWS Cloud is preferred
- B.S. or B.E. in Computer Science or related engineering field`;

  const handleAnalyzeJob = async () => {
    const jdText = jobDescriptionInput.trim() || sampleJd;
    setLoading(true);
    const res = await calculateJobMatch(jdText, profile, skills, projects, experiences);
    setMatchResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Header */}
      <div className="white-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Briefcase className="h-4 w-4" /> AI Job Matching Agent
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Job Description Match Analyzer</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Paste any Job Description to compare against your verified profile facts & calculate match score.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="white-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900">Paste Job Description Text:</label>
          <button
            onClick={() => setJobDescriptionInput(sampleJd)}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Load Sample Tech Job JD
          </button>
        </div>

        <textarea
          rows={5}
          value={jobDescriptionInput}
          onChange={(e) => setJobDescriptionInput(e.target.value)}
          placeholder="Paste company job requirements, required skills, and responsibilities here..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 font-mono"
        />

        <button
          onClick={handleAnalyzeJob}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span>Calculate Job Match & Skill Gaps</span>
        </button>
      </div>

      {/* Results */}
      {matchResult && (
        <div className="white-card p-6 space-y-6 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs text-slate-500 font-bold block">Calculated Match Score</span>
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 mt-1">
                <span className="text-indigo-600">{matchResult.matchScore}%</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Strong Alignment
                </span>
              </h2>
            </div>

            <Link
              href="/applications"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2"
            >
              <span>Prepare Application</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h3 className="font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Verified Skill Matches ({matchResult.strongMatches.length})
              </h3>
              <div className="space-y-1 pt-1 text-slate-800">
                {matchResult.strongMatches.map((m, i) => (
                  <p key={i} className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span> {m}
                  </p>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <h3 className="font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Partial / Related Skills ({matchResult.partialMatches.length})
              </h3>
              <div className="space-y-1 pt-1 text-slate-800">
                {matchResult.partialMatches.map((m, i) => (
                  <p key={i} className="flex items-center gap-1.5">
                    <span className="text-amber-600 font-bold">⚠️</span> {m}
                  </p>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
              <h3 className="font-bold text-rose-800 flex items-center gap-1.5">
                <XCircle className="h-4 w-4" /> Missing Skill Gaps ({matchResult.missingSkills.length})
              </h3>
              <div className="space-y-1 pt-1 text-slate-800">
                {matchResult.missingSkills.map((m, i) => (
                  <p key={i} className="flex items-center gap-1.5">
                    <span className="text-rose-600 font-bold">✕</span> {m}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
