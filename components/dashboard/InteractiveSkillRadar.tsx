'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { useProgressStore } from '@/store/useProgressStore';
import { AlertCircle, TrendingUp, Compass, Grid, Activity } from 'lucide-react';
import Link from 'next/link';

interface SkillPoint {
  subject: string;
  shortLabel: string;
  score: number;
  fullMark: number;
  category: string;
  drillUrl: string;
}

export function InteractiveSkillRadar() {
  const { progress } = useProgressStore();
  const [activeTab, setActiveTab] = useState<'radar' | 'matrix'>('radar');

  const rawData: SkillPoint[] = [
    { subject: 'Technical', shortLabel: 'Tech', score: progress.technicalKnowledge, fullMark: 100, category: 'Core CS', drillUrl: '/practice/technical' },
    { subject: 'Communication', shortLabel: 'Comm', score: progress.communicationScore, fullMark: 100, category: 'Behavioral', drillUrl: '/practice/communication' },
    { subject: 'Confidence', shortLabel: 'Conf', score: progress.confidenceScore, fullMark: 100, category: 'Voice AI', drillUrl: '/interview' },
    { subject: 'DSA', shortLabel: 'DSA', score: progress.dsaScore, fullMark: 100, category: 'Algorithms', drillUrl: '/practice/technical' },
    { subject: 'DBMS & SQL', shortLabel: 'DBMS', score: progress.dbmsScore, fullMark: 100, category: 'Databases', drillUrl: '/practice/technical' },
    { subject: 'OS', shortLabel: 'OS', score: progress.osScore, fullMark: 100, category: 'Systems', drillUrl: '/practice/technical' },
    { subject: 'OOP', shortLabel: 'OOP', score: progress.oopScore, fullMark: 100, category: 'Architecture', drillUrl: '/practice/technical' },
    { subject: 'Projects', shortLabel: 'Projects', score: progress.projectsScore, fullMark: 100, category: 'Portfolio', drillUrl: '/profile' },
    { subject: 'Resume ATS', shortLabel: 'ATS', score: progress.resumeScore, fullMark: 100, category: 'Resume', drillUrl: '/resume/ats' },
  ];

  // Identify weakest axis among non-zero or all
  const sorted = [...rawData].sort((a, b) => a.score - b.score);
  const weakestAxis = sorted[0];

  // Custom HUD Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: SkillPoint = payload[0].payload;
      const isWeak = data.subject === weakestAxis?.subject && data.score < 75;

      return (
        <div className="p-3.5 rounded-2xl hud-glass border border-white/20 shadow-2xl backdrop-blur-xl text-left font-sans">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-xs font-bold text-white font-heading">{data.subject}</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-cyan-300">
              {data.category}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 my-1.5">
            <span className="text-2xl font-black font-mono text-cyan-400">{data.score}%</span>
            <span className="text-[11px] text-slate-400 font-mono">/ 100</span>
          </div>

          {isWeak && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 text-amber-400 text-[11px] font-mono">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>Priority skill gap</span>
            </div>
          )}

          <div className="mt-2">
            <Link
              href={data.drillUrl}
              className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
            >
              <span>Launch Focus Drill →</span>
            </Link>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl hud-glass-card border border-white/10 p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Compass className="h-4 w-4 text-cyan-400" />
            <span>Multi-Axis Skill Telemetry</span>
          </div>
          <h2 className="text-xl font-extrabold font-heading text-white tracking-tight">
            Comprehensive Skill Radar
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Visualizing proficiency across 9 core engineering & placement dimensions.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'radar'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Radar Spider</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'matrix'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Matrix Grid</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-4 flex-1">
        {activeTab === 'radar' ? (
          <div className="relative w-full h-[340px] sm:h-[380px] flex items-center justify-center">
            {/* Weakest Axis HUD Callout */}
            {weakestAxis && weakestAxis.score < 75 && (
              <div className="absolute top-2 left-2 z-10 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-2 shadow-lg backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <span>Weakest Dimension: <strong className="text-white">{weakestAxis.subject} ({weakestAxis.score}%)</strong></span>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={rawData}>
                <defs>
                  <linearGradient id="radarFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.45} />
                    <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <PolarGrid stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="shortLabel"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="rgba(255, 255, 255, 0.15)"
                  tick={{ fill: '#64748B', fontSize: 9 }}
                />
                <Radar
                  name="Proficiency"
                  dataKey="score"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  fill="url(#radarFillGradient)"
                  dot={{ r: 4, fill: '#06B6D4', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 7, fill: '#38BDF8', stroke: '#070A12', strokeWidth: 2 }}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Matrix Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-2">
            {rawData.map((item) => {
              const isWeak = item.subject === weakestAxis?.subject && item.score < 75;
              const color =
                item.score >= 80 ? '#10B981' : item.score >= 60 ? '#38BDF8' : item.score > 0 ? '#F59E0B' : '#64748B';

              return (
                <div
                  key={item.subject}
                  className={`p-3.5 rounded-2xl bg-white/[0.03] border transition-all ${
                    isWeak
                      ? 'border-amber-500/40 bg-amber-500/[0.04]'
                      : 'border-white/10 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">{item.subject}</span>
                    <span
                      className="text-xs font-bold font-mono tabular-nums"
                      style={{ color }}
                    >
                      {item.score > 0 ? `${item.score}%` : 'Unassessed'}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${item.score}%`, backgroundColor: color }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400">
                    <span>{item.category}</span>
                    <Link href={item.drillUrl} className="text-cyan-400 hover:text-cyan-300 font-bold">
                      Drill →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Benchmark Note */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span>Calibrated against Tier-1 Product Engineering Benchmarks</span>
        </div>
        <Link href="/readiness" className="text-cyan-400 font-bold hover:underline">
          View Recommendations →
        </Link>
      </div>
    </div>
  );
}

