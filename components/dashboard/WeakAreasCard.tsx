'use client';

import { useProgressStore } from '@/store/useProgressStore';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function WeakAreasCard() {
  const { progress } = useProgressStore();

  return (
    <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between transition-colors duration-200">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            Identified Skill Gaps
          </h3>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 uppercase tracking-wider">
            Diagnostic
          </span>
        </div>

        <div className="space-y-2">
          {progress.weakAreas && progress.weakAreas.length > 0 ? (
            progress.weakAreas.map((weakness, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 2 }}
                className="group p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between hover:border-blue-400/80 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="h-6 w-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center border border-amber-500/25 shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{weakness}</span>
                </div>
                <Link
                  href="/learn"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  Fix Gap <ArrowRight className="h-3 w-3" />
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1.5">
              <div className="flex justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No critical skill gaps detected</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Complete a Mock Interview or Skill Assessment to diagnose topic-level readiness.
              </p>
              <Link
                href="/interview"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
              >
                Launch Mock Interview <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span className="text-[11px]">AI builds 15-minute drills for each gap</span>
        <Link href="/learn" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
          View Roadmap →
        </Link>
      </div>
    </div>
  );
}
