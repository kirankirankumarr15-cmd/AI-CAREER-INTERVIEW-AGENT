'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';

export default function SolveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Solve page runtime error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center bg-[#0f172a] text-slate-200 rounded-2xl border border-slate-800 -m-6 sm:-m-8">
      <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-black text-white mb-2">Coding Environment Error</h2>
      <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
        An error occurred while loading this problem or editor environment. You can try reloading or return to the practice list.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reload Workspace
        </button>
        <Link
          href="/practice"
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Practice Hub
        </Link>
      </div>
    </div>
  );
}
