'use client';

import { useProgressStore } from '@/store/useProgressStore';
import { LineChart as LineChartIcon, Award, Flame, CheckCircle2, TrendingUp, Mic, Code2, ShieldCheck } from 'lucide-react';

export default function ProgressPage() {
  const { progress } = useProgressStore();

  const comparisonData = [
    { metric: 'Overall Readiness', previous: 64, current: 78, diff: '+14%' },
    { metric: 'Technical Knowledge', previous: 70, current: 82, diff: '+12%' },
    { metric: 'Communication Skills', previous: 58, current: 72, diff: '+14%' },
    { metric: 'Estimated Confidence', previous: 51, current: 68, diff: '+17%' },
    { metric: 'DSA & Problem Solving', previous: 65, current: 75, diff: '+10%' },
  ];

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Header */}
      <div className="white-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <LineChartIcon className="h-4 w-4" /> Progress Tracking & Interview Analytics
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Career Readiness Progression</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Track your interview score improvements over time across technical, verbal communication & confidence metrics.
          </p>
        </div>
      </div>

      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="white-card p-5 space-y-1">
          <span className="text-xs text-slate-500 font-bold block">Questions Solved</span>
          <p className="text-3xl font-black text-indigo-600">{progress.questionsSolved}</p>
        </div>
        <div className="white-card p-5 space-y-1">
          <span className="text-xs text-slate-500 font-bold block">Mock Interviews Completed</span>
          <p className="text-3xl font-black text-sky-600">{progress.interviewsCompleted}</p>
        </div>
        <div className="white-card p-5 space-y-1">
          <span className="text-xs text-slate-500 font-bold block">Daily Active Streak</span>
          <p className="text-3xl font-black text-amber-600 flex items-center gap-1">
            {progress.dailyStreak} <Flame className="h-5 w-5 fill-amber-500 text-amber-500" />
          </p>
        </div>
        <div className="white-card p-5 space-y-1">
          <span className="text-xs text-slate-500 font-bold block">Resume ATS Score</span>
          <p className="text-3xl font-black text-emerald-600">{progress.resumeScore}/100</p>
        </div>
      </div>

      {/* Interview Comparison Table */}
      <div className="white-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> Interview Session Growth Comparison
          </h3>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Average Improvement: +13.4%
          </span>
        </div>

        <div className="space-y-3">
          {comparisonData.map((row) => (
            <div
              key={row.metric}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
            >
              <span className="font-bold text-slate-900 w-44">{row.metric}</span>
              <div className="flex items-center gap-6">
                <span className="text-slate-500">Previous: <strong className="text-slate-700">{row.previous}%</strong></span>
                <span className="text-slate-500">Current: <strong className="text-emerald-700">{row.current}%</strong></span>
                <span className="font-black text-emerald-700 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200">
                  {row.diff}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

