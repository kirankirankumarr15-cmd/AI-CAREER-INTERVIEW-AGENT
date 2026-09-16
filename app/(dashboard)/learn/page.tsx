'use client';

import { useProgressStore } from '@/store/useProgressStore';
import { BookOpen, CheckCircle2, Circle, Clock, Sparkles, ExternalLink } from 'lucide-react';

export default function LearnPage() {
  const { roadmaps, markTopicMastered } = useProgressStore();

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Header */}
      <div className="white-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <BookOpen className="h-4 w-4" /> AI Personalized Learning Engine
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Adaptive Skill Roadmaps</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Weaknesses identified during voice interviews are automatically converted into targeted 15–25 minute learning modules.
          </p>
        </div>
      </div>

      {/* Roadmap List */}
      <div className="space-y-6">
        {roadmaps.map((item) => (
          <div
            key={item.id}
            className="white-card p-6 space-y-4"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{item.topic}</h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                    <span>Category: {item.category}</span> •
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.estimatedMinutes} Mins</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  item.status === 'Mastered'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {item.status}
                </span>
                {item.status !== 'Mastered' && (
                  <button
                    onClick={() => markTopicMastered(item.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                  >
                    Mark Mastered
                  </button>
                )}
              </div>
            </div>

            {/* Micro Learning Steps */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Targeted Learning Resources & Drills:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {item.resources.map((res, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 block">{res.type}</span>
                      <p className="font-bold text-slate-800 mt-0.5">{res.title}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

