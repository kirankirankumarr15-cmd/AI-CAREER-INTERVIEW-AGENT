'use client';

import { useProgressStore } from '@/store/useProgressStore';
import { CheckCircle2, Circle, Dumbbell, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SPRINGS } from '@/lib/motion';

export function TodayMissionCard() {
  const { progress, toggleMissionTask } = useProgressStore();
  const { completed, total, tasks } = progress.todaysMission;
  const pct = Math.round((completed / Math.max(1, total)) * 100);
  const isAllComplete = completed === total && total > 0;

  return (
    <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between transition-colors duration-200">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/25 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                Today&apos;s Mission
                {isAllComplete && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-extrabold flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Done
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">10–20 min targeted workout</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 tabular-nums">
              {completed}/{total}
            </span>
            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {tasks.map((task) => (
            <motion.button
              key={task.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleMissionTask(task.id)}
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                task.done
                  ? 'bg-blue-500/8 dark:bg-blue-950/30 border-blue-500/20 text-slate-500 dark:text-slate-400 line-through'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {task.done ? (
                  <motion.div
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={SPRINGS.snappy}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                ) : (
                  <Circle className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                )}
                <span className="font-medium truncate">{task.text}</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 shrink-0 uppercase tracking-wider">
                {task.category}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400 text-[11px]">Consistent daily practice boosts hire rate 2.4×</span>
        <Link
          href="/practice"
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Start Practice →
        </Link>
      </div>
    </div>
  );
}
