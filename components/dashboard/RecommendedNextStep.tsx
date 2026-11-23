'use client';

import { useProgressStore } from '@/store/useProgressStore';
import { Lightbulb, ArrowRight, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function RecommendedNextStep() {
  const { progress } = useProgressStore();
  const topWeakness = progress.weakAreas[0] || 'DBMS Joins & Normalization';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-950/40 dark:via-blue-900/20 dark:to-slate-900 shadow-sm"
    >
      {/* Subtle ambient light glow */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-600/15 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start gap-4 relative z-10 min-w-0">
        <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
          <Lightbulb className="h-6 w-6 text-amber-300" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/60 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> High-Impact Recommended Step
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" /> ~20 min drill
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
            Practice &quot;{topWeakness}&quot; Focused Workout
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl font-medium leading-relaxed">
            AI diagnosed this topic as your primary score limiter. A 20-minute practice session will increase your placement readiness score toward ~75%.
          </p>
        </div>
      </div>

      <Link
        href="/learn"
        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-blue-600/25 shrink-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative z-10"
      >
        <span>Start Recommended Drills</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
