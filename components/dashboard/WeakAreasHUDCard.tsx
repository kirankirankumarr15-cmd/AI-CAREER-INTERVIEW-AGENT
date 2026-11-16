'use client';

import React from 'react';
import { useProgressStore } from '@/store/useProgressStore';
import { AlertTriangle, ArrowRight, Zap, Target, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export function WeakAreasHUDCard() {
  const { progress } = useProgressStore();
  const weakAreas = progress.weakAreas || [];

  const getSeverity = (index: number) => {
    if (index === 0) return { label: 'Critical Gap', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    if (index === 1) return { label: 'High Priority', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { label: 'Moderate', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
  };

  return (
    <div className="rounded-3xl hud-glass-card border border-white/10 p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold font-heading text-lg text-white">
                  Identified Weak Areas
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase">
                  Auto-Diagnosed
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Algorithmic detection of knowledge gaps from assessment attempts.
              </p>
            </div>
          </div>
        </div>

        {/* List of Weak Areas */}
        <div className="space-y-3">
          {weakAreas.length > 0 ? (
            weakAreas.map((weakness, i) => {
              const severity = getSeverity(i);

              return (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="h-6 w-6 rounded-lg bg-white/10 text-amber-400 text-xs font-mono font-bold flex items-center justify-center border border-white/10 shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white font-sans group-hover:text-amber-300 transition-colors">
                        {weakness}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${severity.color}`}
                        >
                          {severity.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Estimated ~15 min drill
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/practice?topic=${encodeURIComponent(weakness)}`}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 hover:scale-105 active:scale-95"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>Fix in 15 min</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-2">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-white font-heading">
                No Critical Weak Areas Detected
              </h4>
              <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
                Complete a Mock Technical Interview or coding drill to stress-test your profile and diagnose blindspots.
              </p>
              <Link
                href="/interview"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 pt-2 hover:underline"
              >
                <span>Start Diagnostic Interview</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-amber-400" />
          <span>AI converts weaknesses into targeted micro-drills</span>
        </div>
        <Link href="/learn" className="text-cyan-400 font-bold hover:underline">
          View Learning Roadmap →
        </Link>
      </div>
    </div>
  );
}

