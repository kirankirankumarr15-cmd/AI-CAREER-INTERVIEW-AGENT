'use client';

import { ReadinessCard } from '@/components/dashboard/ReadinessCard';
import { WeakAreasCard } from '@/components/dashboard/WeakAreasCard';
import { TodayMissionCard } from '@/components/dashboard/TodayMissionCard';
import { RecommendedNextStep } from '@/components/dashboard/RecommendedNextStep';
import { Sparkles, Mic, FileText, Target, Flame, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useProfileStore } from '@/store/useProfileStore';
import { usePracticeStore } from '@/store/usePracticeStore';
import { fadeInUp, staggerContainer } from '@/lib/motion';

export default function DashboardPage() {
  const { profile } = useProfileStore();
  const { totalSolved } = usePracticeStore();
  const firstName = profile.fullName ? profile.fullName.split(' ')[0] : 'Student';

  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="initial"
      animate="animate"
      className="space-y-6 pb-12"
    >
      {/* Header Welcome Card */}
      <motion.div
        variants={fadeInUp}
        className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-colors duration-200"
      >
        <div>
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3.5 w-3.5" /> PRISM Placement Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex flex-wrap items-center gap-2">
            <span>Target Role:</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/80">
              {profile.targetRole || 'Software Developer (SDE)'}
            </span>
            <span className="text-slate-400">•</span>
            <span>College: <strong>{profile.college || 'PESITM Shivamogga'}</strong></span>
          </p>
        </div>

        {/* Primary Action Buttons with Tactile Motion */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/interview"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/25 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Mic className="h-4 w-4" />
            <span>Launch Mock Interview</span>
          </Link>
          <Link
            href="/resume"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-2 shadow-sm hover:border-slate-300 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>AI Resume Studio</span>
          </Link>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Readiness Score</p>
            <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{profile.readinessScore}%</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center text-amber-500 shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Daily Practice Streak</p>
            <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">1 Day Active</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Practice Drills</p>
            <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{totalSolved} Solved</p>
          </div>
        </div>

        <Link
          href="/readiness"
          className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between hover:border-blue-400/80 hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-all group"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pillars Evaluated</p>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400 tabular-nums">5 Pillars</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </motion.div>

      {/* Top Priority Action Spotlight */}
      <motion.div variants={fadeInUp}>
        <RecommendedNextStep />
      </motion.div>

      {/* Main Readiness Gauge + 9-Topic Breakdown */}
      <motion.div variants={fadeInUp}>
        <ReadinessCard />
      </motion.div>

      {/* Two Column Grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeakAreasCard />
        <TodayMissionCard />
      </motion.div>
    </motion.div>
  );
}
