'use client';

import { useState } from 'react';
import { Plus, ChevronDown, Clock } from 'lucide-react';

const initialColumns = [
  {
    id: 'saved',
    title: 'Saved',
    count: 1,
    cards: [
      {
        id: 1,
        company: 'Uber Technologies',
        role: 'Software Engineer 1 - Mobility',
        type: 'SDE',
        salary: '₹22 - 28 LPA',
        date: '30 Sep 2026',
        status: 'Saved',
      }
    ]
  },
  {
    id: 'ready',
    title: 'Ready to Apply',
    count: 1,
    cards: [
      {
        id: 2,
        company: 'Swiggy',
        role: 'Junior Backend Developer',
        type: 'SDE',
        salary: '₹14 - 18 LPA',
        date: '28 Sep 2026',
        status: 'Ready to Apply',
      }
    ]
  },
  {
    id: 'applied',
    title: 'Applied',
    count: 1,
    cards: [
      {
        id: 3,
        company: 'Atlassian',
        role: 'Associate Software Engineer (Platform)',
        type: 'SDE',
        salary: '₹16 - 22 LPA',
        date: '24 Sep 2026',
        status: 'Applied',
      }
    ]
  },
  {
    id: 'assessment',
    title: 'Assessment',
    count: 1,
    cards: [
      {
        id: 4,
        company: 'Razorpay',
        role: 'Software Development Engineer - I',
        type: 'SDE',
        salary: '₹15 - 20 LPA',
        date: '19 Sep 2026',
        status: 'Assessment',
        alert: 'Interview: OA in 3 days'
      }
    ]
  }
];

export default function ApplicationsPage() {
  const [columns] = useState(initialColumns);

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto">
      {/* Top Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Job Applications</h1>
        <p className="text-[13px] text-slate-500 font-medium mt-1">Active application pipeline and interview schedule</p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
               Pipeline Management • 4 Active Opportunities
            </p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Job Application Tracker</h2>
          </div>
          <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Add Opportunity
          </button>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x">
          {columns.map((col) => (
            <div key={col.id} className="w-[320px] shrink-0 snap-start flex flex-col max-h-[75vh]">
              
              {/* Column Header */}
              <div className="flex items-center justify-between p-3.5 mb-3 rounded-2xl bg-slate-100 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-2 text-slate-700 font-extrabold text-[13px]">
                   <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                   {col.title}
                </div>
                <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-black">
                  {col.count}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {col.cards.map((card) => (
                  <div key={card.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
                    
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-[15px] font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {card.company}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-bold mt-0.5 max-w-[200px] truncate">
                          {card.role}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                        {card.type}
                      </span>
                    </div>

                    <p className="text-[12px] font-bold text-slate-700 mb-4">
                      {card.salary}
                    </p>

                    {(card as any).alert && (
                      <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-[11px] font-extrabold text-amber-800">{(card as any).alert}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400">
                        {card.date}
                      </span>
                      
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors">
                        <span className="text-[11px] font-extrabold">{card.status}</span>
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Empty Drop Zone Style */}
                <div className="h-24 rounded-2xl border-2 border-dashed border-slate-200/70 bg-slate-50/50 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-slate-400">Drop application here</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
