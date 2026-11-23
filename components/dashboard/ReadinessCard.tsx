'use client';

import { useProgressStore } from '@/store/useProgressStore';
import { useProfileStore } from '@/store/useProfileStore';
import { RadialProgressRing } from '@/components/common/RadialProgressRing';
import { Award, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function ReadinessCard() {
  const { profile } = useProfileStore();
  const { progress } = useProgressStore();

  const breakdown = [
    { label: 'Technical Fundamentals', score: progress.technicalKnowledge, color: '#2563EB' },
    { label: 'Communication & Soft Skills', score: progress.communicationScore, color: '#3B82F6' },
    { label: 'Interview Confidence', score: progress.confidenceScore, color: '#0EA5E9' },
    { label: 'DSA & Algorithms', score: progress.dsaScore, color: '#1D4ED8' },
    { label: 'DBMS & Querying', score: progress.dbmsScore, color: '#F59E0B' },
    { label: 'Operating Systems', score: progress.osScore, color: '#0284C7' },
    { label: 'OOP & Architecture', score: progress.oopScore, color: '#6366F1' },
    { label: 'Project Portfolio', score: progress.projectsScore, color: '#0D9488' },
    { label: 'Resume ATS Score', score: progress.resumeScore, color: '#2563EB' },
  ];

  return (
    <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden transition-colors duration-200">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
            <Award className="h-4 w-4" />
            AI Placement Readiness Engine
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Overall Placement Readiness Index
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg font-medium leading-relaxed">
            Composite index derived across 5 core pillars: Timed Assessments (25%), Resume ATS (20%), Mock Interviews (25%), Group Discussion (15%), and Verified Profile (15%).
          </p>
          <div className="mt-3">
            <Link
              href="/readiness"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
            >
              <span>Explore 5-Pillar Breakdown & Recommendations</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Radial Gauge */}
        <div className="flex items-center gap-5 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-6 py-4 shrink-0">
          <RadialProgressRing
            score={profile.readinessScore || 0}
            size={110}
            strokeWidth={9}
            sublabel="Readiness"
          />
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 block text-center">
              {profile.readinessScore >= 75 ? 'Job Ready' : profile.readinessScore > 0 ? 'Building Pace' : 'Needs Diagnostic'}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>{profile.readinessScore > 0 ? `${profile.readinessScore}% Complete` : 'Take First Mock'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {breakdown.map((item) => (
          <div
            key={item.label}
            className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-colors group"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{item.label}</span>
              <span
                className="text-xs font-black tabular-nums"
                style={{
                  color:
                    item.score >= 80
                      ? '#10B981'
                      : item.score >= 60
                      ? '#F59E0B'
                      : item.score > 0
                      ? '#EF4444'
                      : '#94A3B8',
                }}
              >
                {item.score > 0 ? `${item.score}%` : 'Unassessed'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-700 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${item.score}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
