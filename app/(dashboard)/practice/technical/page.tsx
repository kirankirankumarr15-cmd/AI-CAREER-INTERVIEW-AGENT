'use client';

import { useState } from 'react';
import { Clock, Rocket, Lightbulb, SkipForward } from 'lucide-react';

export default function TechnicalPracticePage() {
  const [answer, setAnswer] = useState("");

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1000px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Technical Practice</h1>
          <p className="text-[13px] text-slate-500 font-medium max-w-3xl">
            Distraction-free questions and AI evaluation
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Info row above card */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-teal-700 uppercase tracking-widest">DBMS</span>
              <span className="text-[11px] text-slate-400 font-bold">Question 7 / 28</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-black uppercase tracking-wider">Hard</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold">
              <Clock className="h-3.5 w-3.5" /> Estimated 4 mins
          </div>
        </div>

        {/* The Main Question Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
          
          {/* Category Subtitle */}
          <p className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-4">Indexing & Performance</p>
          
          {/* Question Title */}
          <h2 className="text-2xl md:text-[26px] font-black text-slate-900 leading-snug mb-8 max-w-4xl tracking-tight">
            How does a B-Tree index differ from a Hash index in a relational database like PostgreSQL? Why are B-Trees almost always preferred as the default?
          </h2>

          {/* Answer Area Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black text-teal-700">Your Technical Explanation</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{answer.split(/\s+/).filter(w => w.length > 0).length} words</span>
          </div>

          {/* Textarea Area */}
          <div className="relative mb-8">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full min-h-[220px] p-5 rounded-2xl bg-white border border-slate-200 text-[13px] text-slate-800 font-medium leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 shadow-inner"
              placeholder="Type your structured answer here. Include edge cases, NULL handling, and production trade-offs..."
            />
          </div>

          {/* Bottom Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-[11px] font-bold flex items-center justify-center gap-2 transition-colors">
                  <Lightbulb className="h-3.5 w-3.5" /> Show Hint
                </button>
                <button className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-[11px] font-bold flex items-center justify-center gap-2 transition-colors">
                  <SkipForward className="h-3.5 w-3.5" /> Skip Question
                </button>
            </div>
            <button className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-teal-500/80 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
              <Rocket className="h-3.5 w-3.5" /> Submit Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
