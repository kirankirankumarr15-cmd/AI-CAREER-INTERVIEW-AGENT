'use client';

import React from 'react';
import { useProgressStore } from '@/store/useProgressStore';
import { CheckCircle2, Circle, Dumbbell, Sparkles, Trophy, ArrowRight, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

export function MissionQuestCard() {
  const { progress, toggleMissionTask } = useProgressStore();
  const { completed, total, tasks } = progress.todaysMission;
  const pct = Math.round((completed / (total || 1)) * 100);

  // Assign XP to each task
  const xpPerTask: Record<string, number> = {
    'm-1': 50,
    'm-2': 100,
    'm-3': 75,
    'm-4': 50,
    'm-5': 125,
  };

  const totalEarnedXP = tasks
    .filter((t) => t.done)
    .reduce((acc, t) => acc + (xpPerTask[t.id] || 50), 0);

  const totalPotentialXP = tasks.reduce(
    (acc, t) => acc + (xpPerTask[t.id] || 50),
    0
  );

  const handleTaskClick = (taskId: string, wasDone: boolean) => {
    toggleMissionTask(taskId);

    // If marking as done, trigger particle confetti!
    if (!wasDone) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#06B6D4', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'],
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  };

  return (
    <div className="rounded-3xl hud-glass-card border border-white/10 p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold font-heading text-lg text-white">
                  Today&apos;s Quest Workout
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase">
                  Daily Reset
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Complete quests to earn XP and boost placement readiness.
              </p>
            </div>
          </div>

          {/* XP & Progress Gauge */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-extrabold text-cyan-400">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              <span>{totalEarnedXP} / {totalPotentialXP} XP</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {completed} of {total} completed ({pct}%)
            </span>
          </div>
        </div>

        {/* Quest Level Progress Bar */}
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Quest List */}
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const xp = xpPerTask[task.id] || 50;

            return (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task.id, task.done)}
                className={`w-full text-left p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all group ${
                  task.done
                    ? 'bg-cyan-500/[0.08] border-cyan-500/30 text-slate-400 line-through opacity-85'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-cyan-500/40 text-slate-200 hover:text-white shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  {task.done ? (
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                  )}
                  <span className="font-semibold truncate font-sans text-xs sm:text-sm">
                    {task.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
                    +{xp} XP
                  </span>
                  <span className="hidden sm:inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 uppercase tracking-wider">
                    {task.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Glowing CTA */}
      <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <span>Consistent workouts boost interview conversion rate by 2.4x</span>
        </div>

        <Link
          href="/practice"
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 active:scale-95 border border-cyan-300/30"
        >
          <span>Start Daily Workout</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

