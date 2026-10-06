'use client';

import { useState } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { Briefcase, CheckCircle2, AlertTriangle, ArrowRight, Check, XCircle, CircleDashed } from 'lucide-react';
import Link from 'next/link';

const companies = [
  { id: 'stripe', name: 'Stripe', score: 94 },
  { id: 'atlassian', name: 'Atlassian', score: 85 },
  { id: 'razorpay', name: 'Razorpay', score: 82 },
  { id: 'swiggy', name: 'Swiggy', score: 72 },
];

export default function JobsPage() {
  const { profile } = useProfileStore();
  const [activeCompany, setActiveCompany] = useState('stripe');

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Job Matching</h1>
        <p className="text-[13px] text-slate-500 font-medium mt-1">Skill gap analysis for target job descriptions</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
             Semantic Job Matcher • Skill Gap Analyzer
          </p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Job Matching & Skill Alignment</h2>
          <p className="text-[13px] text-slate-500 font-medium max-w-3xl">
            Evaluate how your verified profile stacks up against real industry job descriptions. Identify missing keywords before applying.
          </p>
        </div>

        {/* Company Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCompany(c.id)}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                activeCompany === c.id
                  ? 'bg-emerald-700 text-white border-emerald-900 shadow-sm'
                  : 'bg-white border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {c.name} <span className={`ml-1 ${activeCompany === c.id ? 'text-emerald-200' : 'text-slate-400'}`}>({c.score}%)</span>
            </button>
          ))}
          <button className="px-4 py-2 rounded-t-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-b-2 border-transparent transition-colors flex items-center gap-1.5 ml-2">
            <Briefcase className="h-3.5 w-3.5" /> + Paste Custom JD
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Job Description */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:border-emerald-200 transition-colors">
             <div className="flex items-start justify-between border-b border-slate-100 pb-6 mb-6">
               <div>
                 <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 block">Stripe</span>
                 <h3 className="text-2xl font-black text-slate-900">Backend Software Engineer (Early Career)</h3>
                 <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                   <span>📍 Bengaluru, India (Hybrid)</span>
                   <span>•</span>
                   <span className="font-bold text-slate-700">₹18,00,000 - ₹24,00,000</span>
                 </p>
               </div>
               <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0">
                 Company Prep <ArrowRight className="h-3.5 w-3.5" />
               </button>
             </div>

             <div className="space-y-6 text-[13px] text-slate-600 font-medium leading-relaxed">
               <div>
                 <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">About the Opportunity</h4>
                 <p>
                   We are looking for an ambitious Backend Engineer to join our Payment Processing & Settlement team. You will build high-reliability services that process billions of dollars with zero downtime. You will work closely with distributed databases, transactional guarantees, and secure RESTful APIs.
                 </p>
               </div>

               <div>
                 <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">Core Responsibilities</h4>
                 <ul className="list-disc list-inside space-y-1.5 marker:text-emerald-500">
                   <li>Design, build, and maintain fault-tolerant backend microservices and public APIs.</li>
                   <li>Improve PostgreSQL query execution paths and database transaction boundaries.</li>
                   <li>Write comprehensive unit, integration, and load tests to safeguard high financial throughput.</li>
                   <li>Participate in on-call rotations, code reviews, and architecture discussions.</li>
                 </ul>
               </div>

               <div>
                 <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">Candidate Requirements</h4>
                 <ul className="list-disc list-inside space-y-1.5 marker:text-emerald-500">
                   <li>Bachelor's degree in Computer Science, Software Engineering, or related technical field.</li>
                   <li>Strong programming proficiency in Java, Go, or Python with solid knowledge of data structures.</li>
                   <li>Demonstrated experience with relational databases (PostgreSQL/MySQL) and ACID properties.</li>
                   <li>Familiarity with distributed caching (Redis/Memcached) and API versioning.</li>
                 </ul>
               </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
               <span className="text-[11px] text-slate-400 font-medium italic">Analysis calibrated for 2024 early-career backend hiring bars</span>
               <button className="px-5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors">
                 Tailor Resume for this Role
               </button>
             </div>
          </div>

          {/* Right Column: Profile Match Index */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col hover:border-emerald-200 transition-colors">
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
               <h4 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Profile Match Index</h4>
               <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Strong Competitiveness</span>
             </div>

             <div className="flex gap-5 mb-8">
               <div className="h-16 w-16 shrink-0 rounded-full bg-emerald-50 border-4 border-emerald-500 flex items-center justify-center">
                 <span className="text-xl font-black text-emerald-700">94%</span>
               </div>
               <div>
                 <h4 className="text-sm font-extrabold text-slate-900 mb-1">Job Match Score</h4>
                 <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                   Your credentials and projects match most requirements. Fulfilling the missing skills can push your interview shortlist odds to 98%.
                 </p>
               </div>
             </div>

             <div className="space-y-6 flex-1">
               {/* Strong Matches */}
               <div>
                 <h5 className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 mb-2.5">
                   <CheckCircle2 className="h-3.5 w-3.5" /> Strong Matches (5)
                 </h5>
                 <div className="flex flex-wrap gap-2">
                   {['Java', 'SQL', 'REST APIs', 'DSA', 'Git'].map(s => (
                     <span key={s} className="px-2 py-1 rounded bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                       <Check className="h-3 w-3" /> {s}
                     </span>
                   ))}
                 </div>
               </div>

               {/* Partial Matches */}
               <div>
                 <h5 className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5 mb-2.5">
                   <AlertTriangle className="h-3.5 w-3.5" /> Partial Matches (2)
                 </h5>
                 <div className="flex flex-wrap gap-2">
                   {['Spring Boot', 'Redis Caching'].map(s => (
                     <span key={s} className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                       <AlertTriangle className="h-2.5 w-2.5" /> {s}
                     </span>
                   ))}
                 </div>
               </div>

               {/* Missing Skills */}
               <div>
                 <h5 className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 mb-2.5">
                   <CircleDashed className="h-3.5 w-3.5" /> Missing Skills (2)
                 </h5>
                 <div className="flex flex-wrap gap-2">
                   {['AWS', 'Distributed Consensus'].map(s => (
                     <span key={s} className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                       <CircleDashed className="h-2.5 w-2.5" /> {s}
                     </span>
                   ))}
                 </div>
               </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100">
               <button className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                 Start Preparation Blueprint <ArrowRight className="h-4 w-4" />
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
