'use client';

import React from 'react';
import { useProgressStore } from '@/store/useProgressStore';
import { Flame, Shield, Award, Calendar, Zap, Check } from 'lucide-react';

export function StreakXPCard() {
  const { progress } = useProgressStore();
  const streak = progress.dailyStreak || 1;
  const questionsSolved = progress.questionsSolved || 0;
  const interviewsCompleted = progress.interviewsCompleted || 0;

  // Calculate dynamic XP and Level
  const totalXP = questionsSolved * 50 + interviewsCompleted * 200 + streak * 100;
  const level = Math.floor(totalXP / 500) + 1;
  const currentLevelXP = totalXP % 500;
  const nextLevelXP = 500;
  const levelPct = Math.round((currentLevelXP / nextLevelXP) * 100);

  // 7-day activity heatmap mock days (Mon - Sun)
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6

  return (
    <div className="rounded-3xl hud-glass-card border border-white/10 p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold font-heading text-lg text-white">
                  Streak & Mastery XP
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold uppercase">
                  Level {level}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Accumulate experience by solving algorithmic and system challenges.
              </p>
            </div>
          </div>
        </div>

        {/* Level and XP Bar */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-mono font-black text-white">
                L{level}
              </span>
              <span className="text-xs font-bold text-white font-heading">
                {level >= 5 ? 'Senior Placement Candidate' : 'Aspiring Engineer'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {currentLevelXP} / {nextLevelXP} XP
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-700"
              style={{ width: `${levelPct}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1.5 text-right">
            {nextLevelXP - currentLevelXP} XP remaining to Level {level + 1}
          </p>
        </div>

        {/* 7-Day Activity Heatmap */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              7-Day Activity Matrix
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {streak} Days Active
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {days.map((day, idx) => {
              const isPastOrToday = idx <= todayIndex;
              const isActive = isPastOrToday && (streak >= todayIndex - idx + 1);

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/20'
                        : idx === todayIndex
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-400/40 animate-pulse'
                        : 'bg-white/5 text-slate-500 border border-white/5'
                    }`}
                  >
                    {isActive ? <Check className="h-4 w-4 text-cyan-300" /> : day}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-lg font-black font-mono text-white block">
            {questionsSolved}
          </span>
          <span className="text-[10px] font-mono uppercase text-slate-400">
            Drills Mastered
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-lg font-black font-mono text-cyan-400 block">
            {interviewsCompleted}
          </span>
          <span className="text-[10px] font-mono uppercase text-slate-400">
            Interviews Cleared
          </span>
        </div>
      </div>
    </div>
  );
}

