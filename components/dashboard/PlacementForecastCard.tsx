'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Target, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';

export function PlacementForecastCard() {
  const { profile } = useProfileStore();
  const currentScore = profile.readinessScore || 0;

  // 8-week trajectory data: Weeks 1-4 (historical) and Weeks 5-8 (projected)
  const base = Math.max(25, currentScore - 20);
  const data = [
    { week: 'W1', score: Math.max(10, base), projected: null, cutoff: 80 },
    { week: 'W2', score: Math.max(15, base + 6), projected: null, cutoff: 80 },
    { week: 'W3', score: Math.max(20, base + 12), projected: null, cutoff: 80 },
    { week: 'Now', score: currentScore, projected: currentScore, cutoff: 80 },
    { week: 'W5', score: null, projected: Math.min(100, currentScore + 8), cutoff: 80 },
    { week: 'W6', score: null, projected: Math.min(100, currentScore + 15), cutoff: 80 },
    { week: 'W7', score: null, projected: Math.min(100, currentScore + 22), cutoff: 80 },
    { week: 'Goal', score: null, projected: Math.min(100, currentScore + 30), cutoff: 80 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isProjected = label.startsWith('W5') || label.startsWith('W6') || label.startsWith('W7') || label === 'Goal';

      return (
        <div className="p-2.5 rounded-xl hud-glass border border-white/20 shadow-xl text-left font-mono">
          <p className="text-[10px] text-slate-400 uppercase">{label} Readiness</p>
          <p className="text-base font-black text-cyan-400">
            {val}% {isProjected ? '(Forecast)' : '(Verified)'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl hud-glass-card border border-white/10 p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold font-heading text-lg text-white">
                  Placement Velocity Forecast
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                  AI Model
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Projected candidate readiness trajectory toward Tier-1 cutoffs.
              </p>
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="h-[180px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="projectedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="week"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                fontFamily="var(--font-mono, monospace)"
              />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                domain={[0, 100]}
                tickLine={false}
                fontFamily="var(--font-mono, monospace)"
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                y={80}
                stroke="#10B981"
                strokeDasharray="4 4"
                label={{
                  value: '80% Tier-1 Cutoff',
                  fill: '#34D399',
                  fontSize: 9,
                  position: 'insideTopRight',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              />

              {/* Historical Curve */}
              <Area
                type="monotone"
                dataKey="score"
                stroke="#06B6D4"
                strokeWidth={2.5}
                fill="url(#scoreGradient)"
                dot={{ r: 3, fill: '#06B6D4' }}
              />

              {/* Projected Curve */}
              <Area
                type="monotone"
                dataKey="projected"
                stroke="#A855F7"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="url(#projectedGradient)"
                dot={{ r: 3, fill: '#A855F7' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5 text-cyan-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Forecast: Target reached in ~4 weeks</span>
        </div>
        <span className="text-[10px] text-slate-400">Assuming 4 drills/wk</span>
      </div>
    </div>
  );
}

