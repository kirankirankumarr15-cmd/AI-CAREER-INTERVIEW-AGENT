'use client';

import { useProgressStore } from '@/store/useProgressStore';
import { CheckCircle2, Circle, Dumbbell } from 'lucide-react';
import Link from 'next/link';

export function TodayMissionCard() {
  const { progress, toggleMissionTask } = useProgressStore();
  const { completed, total, tasks } = progress.todaysMission;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="card p-5 flex flex-col justify-between animate-fade-in-up">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#FAFAFA]">Today's Mission</h3>
              <p className="text-[10px] text-[#71717A] font-medium">10–20 min daily workout</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-indigo-400 tabular-nums">{completed}/{total}</span>
            <div className="w-16 h-1.5 bg-[#27272F] rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggleMissionTask(task.id)}
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                task.done
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 line-through opacity-70'
                  : 'bg-white/3 border-[#27272F] text-[#FAFAFA] hover:border-indigo-500/40 hover:bg-indigo-500/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {task.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-[#52525B] shrink-0" />
                )}
                <span className="font-semibold">{task.text}</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/8 text-[#71717A] shrink-0 uppercase tracking-wider">
                {task.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1F1F27] flex items-center justify-between text-xs">
        <span className="text-[#71717A]">Streaks boost placement rate by 2.4×</span>
        <Link href="/practice" className="font-bold text-indigo-400 hover:text-indigo-300">
          Start Workout →
        </Link>
      </div>
    </div>
  );
}
