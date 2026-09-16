'use client';

import { useProgressStore } from '@/store/useProgressStore';
import { useProfileStore } from '@/store/useProfileStore';
import { RadialProgressRing } from '@/components/common/RadialProgressRing';
import { Award, TrendingUp } from 'lucide-react';

export function ReadinessCard() {
  const { profile } = useProfileStore();
  const { progress } = useProgressStore();

  const breakdown = [
    { label: 'Technical Knowledge', score: progress.technicalKnowledge, color: '#6366F1' },
    { label: 'Communication',       score: progress.communicationScore,  color: '#8B5CF6' },
    { label: 'Confidence',          score: progress.confidenceScore,     color: '#0EA5E9' },
    { label: 'DSA & Problem Solving', score: progress.dsaScore,          color: '#3B82F6' },
    { label: 'DBMS & SQL',          score: progress.dbmsScore,           color: '#F59E0B' },
    { label: 'Operating Systems',   score: progress.osScore,             color: '#10B981' },
    { label: 'OOP & Architecture',  score: progress.oopScore,            color: '#EC4899' },
    { label: 'Projects Quality',    score: progress.projectsScore,       color: '#14B8A6' },
    { label: 'Resume ATS Score',    score: progress.resumeScore,         color: '#6366F1' },
  ];

  return (
    <div className="card p-6 rounded-2xl relative overflow-hidden animate-fade-in-up">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#1F1F27]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1.5">
            <Award className="h-4 w-4" />
            AI Career Readiness Estimate
          </div>
          <h2 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">
            Overall Placement Readiness
          </h2>
          <p className="text-xs text-[#71717A] mt-1 max-w-md font-medium">
            Calculated across 9 technical, communication, resume & interview metrics.
          </p>
        </div>

        {/* Radial Gauge */}
        <div className="flex items-center gap-5 bg-white/4 border border-[#27272F] rounded-2xl px-6 py-4">
          <RadialProgressRing
            score={profile.readinessScore}
            size={110}
            strokeWidth={9}
            sublabel="Readiness"
          />
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 block text-center">
              Job Ready Pace
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+6% this week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {breakdown.map((item) => (
          <div
            key={item.label}
            className="p-3.5 rounded-xl bg-white/3 border border-[#1F1F27] hover:border-[#3A3A45] transition-colors group"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-[#A1A1AA] truncate pr-2">{item.label}</span>
              <span
                className="text-xs font-extrabold tabular-nums"
                style={{ color: item.score >= 80 ? '#34D399' : item.score >= 65 ? '#FBBF24' : '#F87171' }}
              >
                {item.score}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#27272F] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${item.score}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
