'use client';

import { useProgressStore } from '@/store/useProgressStore';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function WeakAreasCard() {
  const { progress } = useProgressStore();

  return (
    <div className="card p-5 flex flex-col justify-between animate-fade-in-up">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#FAFAFA] flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            Identified Weak Areas
          </h3>
          <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 uppercase tracking-wider">
            Auto-Detected
          </span>
        </div>

        <div className="space-y-2">
          {progress.weakAreas.map((weakness, i) => (
            <div
              key={i}
              className="group p-3 rounded-xl bg-white/3 border border-[#27272F] flex items-center justify-between hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-md bg-amber-500/15 text-amber-400 text-xs font-bold flex items-center justify-center border border-amber-500/25">
                  {i + 1}
                </span>
                <span className="text-xs font-bold text-[#FAFAFA]">{weakness}</span>
              </div>
              <Link
                href="/learn"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Fix <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1F1F27] text-xs text-[#71717A] flex items-center justify-between">
        <span>AI converts weaknesses into 15-min drills</span>
        <Link href="/learn" className="text-indigo-400 font-bold hover:text-indigo-300">
          View Roadmap →
        </Link>
      </div>
    </div>
  );
}
