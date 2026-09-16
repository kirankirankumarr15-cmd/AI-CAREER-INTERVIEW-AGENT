'use client';

import { useState } from 'react';
import { useProgressStore } from '@/store/useProgressStore';
import { Dumbbell, CheckCircle2, Circle, Flame, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PracticePage() {
  const { progress } = useProgressStore();
  const [activeTab, setActiveTab] = useState<'Technical' | 'Coding' | 'Communication' | 'HR'>('Technical');

  const sampleQuestions = {
    Technical: [
      { id: 'q-t1', title: 'What is the difference between INNER JOIN vs LEFT JOIN in SQL?', hint: 'LEFT JOIN retains all left table rows regardless of matching right table rows.' },
      { id: 'q-t2', title: 'How does indexing speed up SELECT queries, and what is the trade-off for INSERTs?', hint: 'B-Tree indexes speed up lookups but require index updates on writes.' },
    ],
    Coding: [
      { id: 'q-c1', title: 'Given an array of integers, find the maximum sum of a contiguous subarray (Kadane Algorithm).', hint: 'Keep track of current max sum and reset if current sum drops below 0.' },
    ],
    Communication: [
      { id: 'q-cm1', title: 'Deliver a 60-second elevator pitch introducing yourself for a Full Stack Software Engineer role.', hint: 'Highlight degree, key stack (React/Node), top project impact, and enthusiasm.' },
    ],
    HR: [
      { id: 'q-h1', title: 'Describe a situation where a project deadline was at risk. How did you prioritize tasks?', hint: 'Use STAR format: Situation, Task, Action, Result.' },
    ],
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Header */}
      <div className="white-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Dumbbell className="h-4 w-4" /> Daily Placement Workout
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Daily Practice Missions</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Build interview muscle memory with 10–20 minute bite-sized technical, coding & communication drills.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold">
          <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
          <span>{progress.dailyStreak} Day Active Streak</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {['Technical', 'Coding', 'Communication', 'HR'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === cat
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {cat} Drills
          </button>
        ))}
      </div>

      {/* Practice Cards */}
      <div className="space-y-4">
        {sampleQuestions[activeTab].map((q) => (
          <div key={q.id} className="white-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {activeTab} Question
              </span>
              <span className="text-xs text-slate-500 font-mono font-bold">100 Points</span>
            </div>
            <h3 className="font-bold text-base text-slate-900">{q.title}</h3>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
              <strong className="text-indigo-600 block mb-1">AI Solution Hint:</strong>
              {q.hint}
            </div>
            <div className="flex justify-end pt-1">
              <Link
                href="/interview"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span>Practice Spoken Answer</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

