'use client';

import { ReadinessCard } from '@/components/dashboard/ReadinessCard';
import { WeakAreasCard } from '@/components/dashboard/WeakAreasCard';
import { TodayMissionCard } from '@/components/dashboard/TodayMissionCard';
import { RecommendedNextStep } from '@/components/dashboard/RecommendedNextStep';
import { Sparkles, Mic, FileText } from 'lucide-react';
import Link from 'next/link';
import { useProfileStore } from '@/store/useProfileStore';

export default function DashboardPage() {
  const { profile } = useProfileStore();
  const firstName = profile.fullName ? profile.fullName.split(' ')[0] : 'Student';

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Header Banner */}
      <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-[0.15em] flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Dashboard Overview
          </span>
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-xs text-[#71717A] mt-1 font-medium">
            Your AI Career Profile is active. Target role set to{' '}
            <strong className="text-[#FAFAFA]">{profile.targetRole || 'Full Stack Developer'}</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/interview"
            className="btn-shine px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
          >
            <Mic className="h-4 w-4" />
            <span>Launch Mock Interview</span>
          </Link>
          <Link
            href="/resume"
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#FAFAFA] border border-[#27272F] text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <FileText className="h-4 w-4 text-indigo-400" />
            <span>Build Resume</span>
          </Link>
        </div>
      </div>

      {/* Top Priority Action */}
      <RecommendedNextStep />

      {/* Main Readiness Gauge + Breakdown */}
      <ReadinessCard />

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeakAreasCard />
        <TodayMissionCard />
      </div>
    </div>
  );
}
