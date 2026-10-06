'use client';

import { BarChart3, Clock, Trophy, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function InterviewResultsPage() {
  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1000px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Interview Results</h1>
          <p className="text-[13px] text-slate-500 font-medium max-w-3xl">
            Detailed performance breakdown from your past AI mock interviews
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm text-center">
        <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-6">
          <BarChart3 className="h-8 w-8 text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">No results yet</h2>
        <p className="text-[13px] text-slate-500 font-medium max-w-md mx-auto mb-8">
          You haven't completed any mock interviews. Start a new interview session to receive your personalized performance breakdown.
        </p>
        <Link 
          href="/interview"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-bold shadow-md shadow-teal-600/20 transition-all active:scale-95"
        >
          Start New Interview <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
