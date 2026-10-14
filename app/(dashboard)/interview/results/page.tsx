'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useInterviewStore } from '@/store/useInterviewStore';
import { createClient } from '@/utils/supabase/client';
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface ScorecardData {
  overall: number;
  technical: number;
  communication: number;
  confidence: number;
  problemSolving: number;
  project: number;
  hr: number;
  strongAreas: string[];
  weakAreas: string[];
  recommendations: string[];
}

export default function InterviewResultsPage() {
  const { interviewScore, targetRole, interviewType, difficulty } = useInterviewStore();
  const [sessionScore, setSessionScore] = useState<ScorecardData | null>(interviewScore || null);
  const [loading, setLoading] = useState(!interviewScore);

  useEffect(() => {
    async function loadLatestSession() {
      if (interviewScore) {
        setSessionScore(interviewScore);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data?.feedback?.finalScore) {
        setSessionScore(data.feedback.finalScore);
      }
      setLoading(false);
    }

    loadLatestSession();
  }, [interviewScore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sessionScore) {
    return (
      <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1000px] mx-auto font-sans">
        <div className="flex flex-col border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Interview Scorecard</h1>
            <p className="text-[13px] text-slate-500 font-medium max-w-3xl">
              Performance breakdown and diagnostic reports from your AI mock interviews
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-6">
            <Trophy className="h-8 w-8 text-slate-300" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">No completed interview sessions yet</h2>
          <p className="text-[13px] text-slate-500 font-medium max-w-md mx-auto mb-8">
            Complete a live mock interview round to unlock detailed skill metrics, filler-word analysis, and weak-area remediation tasks.
          </p>
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            Start Mock Interview &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1100px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
            Performance Diagnostic Report • AI Mock Round
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Interview Results: {targetRole || 'Software Engineer'}
          </h1>
          <p className="text-[13px] text-slate-500 font-medium">
            Track: {interviewType || 'Technical'} • Difficulty: {difficulty || 'Intermediate'}
          </p>
        </div>

        <Link
          href="/interview"
          className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Start Another Round
        </Link>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 shrink-0 rounded-3xl bg-blue-50 border-[3px] border-blue-600 flex items-center justify-center shadow-inner">
              <span className="text-4xl font-black text-blue-700">{sessionScore.overall}</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                Overall Interview Readiness
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest border border-emerald-200">
                  {sessionScore.overall >= 80 ? 'Pass • Tier 1 Ready' : 'Needs Practice'}
                </span>
              </h2>
              <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed max-w-xl">
                Diagnostic score computed across technical precision, structured communication, and project defense answers.
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { label: 'Technical Accuracy', score: sessionScore.technical },
            { label: 'Communication Clarity', score: sessionScore.communication },
            { label: 'Confidence & Delivery', score: sessionScore.confidence },
            { label: 'Problem Solving', score: sessionScore.problemSolving },
            { label: 'Project Defense', score: sessionScore.project },
          ].map((m) => (
            <div key={m.label} className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block h-6">
                {m.label}
              </span>
              <div className="text-2xl font-black text-slate-900">{m.score}%</div>
              <div className="h-1.5 rounded-full bg-slate-100 w-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${m.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Feedback Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Areas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Identified Strengths
            </h3>
          </div>
          <div className="space-y-3">
            {sessionScore.strongAreas.map((s, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 text-xs font-semibold text-emerald-950 flex items-center gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Weak Areas (Feeds into Learn Hub & Roadmap) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Weak Areas to Bridge
            </h3>
          </div>
          <div className="space-y-3">
            {sessionScore.weakAreas.map((w, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 text-xs font-semibold text-amber-950 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                  {w}
                </div>
                <Link
                  href="/practice"
                  className="text-[10px] font-bold text-amber-800 hover:text-amber-900 underline"
                >
                  Practice Topic &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations & Bridge to Roadmap */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            Actionable Next Steps from CareerPilot AI
          </h3>
        </div>
        <div className="space-y-3">
          {sessionScore.recommendations.map((rec, idx) => (
            <p key={idx} className="text-xs text-slate-600 leading-relaxed font-medium pl-4 border-l-2 border-blue-500">
              {rec}
            </p>
          ))}
        </div>

        <div className="pt-4 flex flex-wrap gap-4 border-t border-slate-100">
          <Link
            href="/roadmap"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-md shadow-blue-600/20"
          >
            Review in Live Roadmap <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/practice/communication"
            className="px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            Practice Communication Drills
          </Link>
        </div>
      </div>
    </div>
  );
}
