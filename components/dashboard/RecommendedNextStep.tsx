'use client';

import { useProgressStore } from '@/store/useProgressStore';
import { Lightbulb, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

export function RecommendedNextStep() {
  const { progress } = useProgressStore();
  const topWeakness = progress.weakAreas[0] || 'DBMS Joins';

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up border border-indigo-500/20"
      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.05) 100%)' }}>
      {/* Glow blob */}
      <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start gap-3.5 relative">
        <div className="h-11 w-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-amber-400 shrink-0">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
              AI Recommendation
            </span>
            <span className="text-[10px] text-[#71717A] flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" /> 20 min
            </span>
          </div>
          <h4 className="text-base font-bold text-[#FAFAFA] leading-snug">
            Practice "{topWeakness}" for 20 minutes
          </h4>
          <p className="text-xs text-[#A1A1AA] mt-1 max-w-lg">
            Focusing on this weak spot will increase your Interview Readiness from {progress.dbmsScore}% to ~75%.
          </p>
        </div>
      </div>

      <Link
        href="/learn"
        className="btn-shine px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-600/25 shrink-0 transition-all active:scale-95"
      >
        <span>Start Drills</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
