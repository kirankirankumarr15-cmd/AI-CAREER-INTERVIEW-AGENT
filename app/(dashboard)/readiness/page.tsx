'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  TrendingUp,
  ShieldCheck,
  Target,
  ArrowRight,
  BookOpen,
  Mic,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import { ReadinessIndexReport } from '@/types';

export default function ReadinessPage() {
  const [report, setReport] = useState<ReadinessIndexReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReadiness = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/readiness');
      if (!res.ok) throw new Error('Failed to load readiness index');
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error fetching readiness report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-pulse">
        <div className="h-28 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="md:col-span-2 h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="max-w-md mx-auto my-12 card p-8 text-center rounded-2xl space-y-4">
        <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Failed to Load Readiness Index</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'Unknown error'}</p>
        <button
          onClick={fetchReadiness}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { overallScore, coveragePercentage, pillars, topRecommendations, strengths, weaknesses, history } = report;

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto text-slate-900">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Award className="h-3.5 w-3.5" /> PRISM 5-Pillar Readiness Index
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Placement Readiness Index
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Normalized composite preparation score computed across Assessments (25%), Resume (20%), Interview (25%), GD (15%), and Profile (15%).
          </p>
        </div>

        <button
          onClick={fetchReadiness}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start md:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
          <span>Recalculate Index</span>
        </button>
      </div>

      {/* Hero Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Circular Score Card */}
        <div className="card p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">
                Composite Score
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                {coveragePercentage}% Assessed
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">Overall Readiness</h2>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative h-40 w-40 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-blue-600 transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray={`${overallScore * 2.51} 251.2`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-4xl font-black text-slate-900 tracking-tight">{overallScore}</span>
                <span className="text-xs font-bold text-slate-400 block">/ 100</span>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-3 text-center">
              {overallScore >= 75
                ? 'High Placement Competitiveness'
                : overallScore >= 60
                ? 'Moderate Readiness — Focus on Weak Areas'
                : 'Needs Structured 12-Week Preparation'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Info className="h-3.5 w-3.5 text-blue-600" />
              <span>Unassessed Pillar Policy:</span>
            </div>
            <p className="leading-relaxed">
              Unassessed pillars are excluded from the denominator to prevent unfairly penalizing students before they attempt drills.
            </p>
          </div>
        </div>

        {/* Top 3 High-Impact Priority Actions */}
        <div className="lg:col-span-2 card p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Optimization Algorithm
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">What to Improve First</h2>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              Formula: Weight × (100 - Score) / Effort
            </span>
          </div>

          <div className="space-y-3">
            {topRecommendations.map((rec, idx) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                      {rec.pillar}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Priority Score: {rec.priorityScore}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">{rec.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Current: <strong>{rec.currentScore}%</strong> → Target: <strong>{rec.targetScore}%</strong> • Est. Effort: <strong>{rec.estimatedEffortHours} hrs</strong>
                  </p>
                </div>

                <Link
                  href={rec.href}
                  className="shrink-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>{rec.actionText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>

          {/* Strengths & Weaknesses Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Demonstrated Strengths
              </span>
              <div className="flex flex-wrap gap-1.5">
                {strengths.length > 0 ? (
                  strengths.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Complete more assessments to reveal strengths</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1 mb-2">
                <AlertTriangle className="h-3.5 w-3.5" /> High-Priority Growth Areas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {weaknesses.map((w, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Five Individual Pillar Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Individual Pillar Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* 1. Assessments */}
          <div className="card p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase">Weight: 25%</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pillars.assessments.isAssessed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {pillars.assessments.isAssessed ? 'Assessed' : 'Pending'}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Assessments</h3>
            <p className="text-2xl font-black text-slate-900">{pillars.assessments.score}%</p>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pillars.assessments.score}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{pillars.assessments.evidence}</p>
            <Link href="/practice" className="text-xs font-bold text-blue-600 hover:underline block pt-1">
              Take Test →
            </Link>
          </div>

          {/* 2. Resume */}
          <div className="card p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase">Weight: 20%</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pillars.resume.isAssessed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {pillars.resume.isAssessed ? 'Assessed' : 'Pending'}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Resume ATS</h3>
            <p className="text-2xl font-black text-slate-900">{pillars.resume.score}%</p>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pillars.resume.score}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{pillars.resume.evidence}</p>
            <Link href="/resume/ats" className="text-xs font-bold text-blue-600 hover:underline block pt-1">
              Analyze ATS →
            </Link>
          </div>

          {/* 3. Interview */}
          <div className="card p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase">Weight: 25%</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pillars.interview.isAssessed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {pillars.interview.isAssessed ? 'Assessed' : 'Pending'}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Mock Interview</h3>
            <p className="text-2xl font-black text-slate-900">{pillars.interview.score}%</p>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pillars.interview.score}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{pillars.interview.evidence}</p>
            <Link href="/interview" className="text-xs font-bold text-blue-600 hover:underline block pt-1">
              Launch Voice Interview →
            </Link>
          </div>

          {/* 4. Group Discussion */}
          <div className="card p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase">Weight: 15%</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pillars.groupDiscussion.isAssessed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {pillars.groupDiscussion.isAssessed ? 'Assessed' : 'Pending'}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Group Discussion</h3>
            <p className="text-2xl font-black text-slate-900">{pillars.groupDiscussion.score}%</p>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pillars.groupDiscussion.score}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{pillars.groupDiscussion.evidence}</p>
            <Link href="/interview/gd" className="text-xs font-bold text-blue-600 hover:underline block pt-1">
              Join GD Room →
            </Link>
          </div>

          {/* 5. Profile */}
          <div className="card p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase">Weight: 15%</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                Assessed
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Profile Verification</h3>
            <p className="text-2xl font-black text-slate-900">{pillars.profile.score}%</p>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pillars.profile.score}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{pillars.profile.evidence}</p>
            <Link href="/profile" className="text-xs font-bold text-blue-600 hover:underline block pt-1">
              Edit Profile →
            </Link>
          </div>
        </div>
      </div>

      {/* Historical Trend */}
      <div className="card p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          Readiness Trajectory (Last 14 Days)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {history.map((h, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{h.date}</span>
                <p className="text-base font-black text-slate-900 mt-0.5">{h.overallScore}% Readiness</p>
              </div>
              <span className="text-xs font-bold text-blue-600">{h.coveragePercentage}% Data</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
