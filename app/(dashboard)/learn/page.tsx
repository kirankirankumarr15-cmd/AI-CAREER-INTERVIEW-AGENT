'use client';

import { useState } from 'react';
import { Check, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export default function LearnPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const milestones = [
    { id: 1, title: 'SQL & Relational Fundamentals', desc: 'ACID properties, normal forms 1NF to 3NF, keys, and table constraints.', status: 'completed', duration: '5h' },
    { id: 2, title: 'SELECT Queries & Aggregations', desc: 'GROUP BY, HAVING, subqueries, and window functions fundamentals.', status: 'completed', duration: '8h' },
    { id: 3, title: 'Database Joins & Execution Plans', desc: 'INNER, LEFT, RIGHT, FULL OUTER joins, Hash Joins, and EXPLAIN ANALYZE.', status: 'active', duration: '14h' },
    { id: 4, title: 'Indexing & B-Tree Optimization', desc: 'Clustered vs non-clustered indexes, composite index order, and covering...', status: 'completed', duration: '12h' },
    { id: 5, title: 'Distributed Caching with Redis', desc: 'Cache-Aside, Write-Through, cache stampede, and TTL eviction policies.', status: 'locked', duration: '16h' },
    { id: 6, title: 'High-Concurrency Interview Simulation', desc: 'Real-time mock interview simulating an engineering manager and principal...', status: 'locked', duration: '1h' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-16 animate-fade-in-up font-sans">
      
      {/* Header */}
      <div className="flex flex-col border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold text-teal-700 uppercase tracking-widest flex items-center gap-2">
            Personalized Curriculum • 4 of 6 Milestones Completed
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Learning Roadmap: Backend Mastery & Systems Architecture
          </h1>
          <p className="text-[13px] text-slate-500 font-medium max-w-4xl">
            Step-by-step master plan bridging identified profile gaps to ensure ready hireability for Software Developer (SDE 1).
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">
            Curriculum Progress
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-700">68%</span>
            <span className="text-[11px] text-slate-500 font-bold">Estimated remaining effort: ~24 hours</span>
          </div>
        </div>
        <div className="w-full md:w-[400px]">
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-700 rounded-full" style={{ width: '68%' }} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Milestones */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6">
            MILESTONES SEQUENCE
          </h2>
          
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[13px] before:w-[2px] before:bg-slate-100 before:z-0">
            {milestones.map((m) => (
              <div key={m.id} className="relative z-10 flex items-start gap-4">
                <div className="shrink-0 mt-2 bg-white pt-1 pb-1">
                  {m.status === 'completed' && (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-50" />
                  )}
                  {m.status === 'active' && (
                    <div className="h-6 w-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-teal-600/20">
                      {m.id}
                    </div>
                  )}
                  {m.status === 'locked' && (
                    <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-black">
                      {m.id}
                    </div>
                  )}
                </div>
                
                <div className={`flex-1 p-4 rounded-2xl border transition-all ${
                  m.status === 'active'
                    ? 'bg-teal-50/50 border-teal-500 shadow-sm'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                }`}>
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className={`text-[12px] font-black ${m.status === 'locked' ? 'text-slate-600' : 'text-slate-900'}`}>
                      {m.title}
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400 shrink-0">{m.duration}</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Node Details */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 text-[9px] font-black uppercase tracking-widest">
                  IN PROGRESS
                </span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  14 Hours Required
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Database Joins & Execution Plans</h2>
            </div>
            <button className="shrink-0 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-700/20 transition-all active:scale-95">
              <Check className="h-3.5 w-3.5" /> Mark Completed
            </button>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-8 flex-1">
            <div>
              <h3 className="text-[12px] font-black text-slate-900 mb-1.5">Why this milestone matters:</h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                Understanding how the query optimizer selects Nested Loop, Hash Join, or Merge Join based on table cardinality prevents production outages caused by accidental full table scans or exploding Cartesian products.
              </p>
            </div>

            <div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3">CORE TECHNICAL CONCEPTS</h3>
              <ul className="space-y-2">
                {[
                  'Join semantics and NULL handling',
                  'Hash Join vs Merge Join vs Nested Loop',
                  'Interpreting PostgreSQL EXPLAIN ANALYZE'
                ].map((concept, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-[13px] text-slate-600 font-semibold">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    {concept}
                  </li>
                ))}
              </ul>
            </div>

            {/* Knowledge Check */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-4 w-4 rounded bg-teal-100 flex items-center justify-center text-teal-700">
                  <span className="text-[10px] font-black">?</span>
                </div>
                <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">
                  QUICK KNOWLEDGE CHECK
                </span>
              </div>
              <p className="text-[13px] font-bold text-slate-900 mb-4">
                Which join algorithm is typically chosen by the optimizer when one table is very small and fits in memory?
              </p>
              
              <div className="space-y-2 mb-5">
                {[
                  'Hash Join',
                  'Sort Merge Join',
                  'Nested Loop with Index',
                  'Cartesian Product'
                ].map((opt) => (
                  <label key={opt} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedOption === opt
                      ? 'bg-white border-teal-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedOption === opt ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                    }`}>
                      {selectedOption === opt && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-[13px] font-semibold ${selectedOption === opt ? 'text-slate-900' : 'text-slate-600'}`}>
                      {opt}
                    </span>
                  </label>
                ))}
              </div>

              <button className="px-5 py-2.5 rounded-xl bg-teal-600/20 text-teal-700 hover:bg-teal-600/30 font-bold text-[11px] transition-colors">
                Verify Answer
              </button>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-start">
            <button className="px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[12px] font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 transition-all active:scale-95">
              Practice Questions for this Node <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

