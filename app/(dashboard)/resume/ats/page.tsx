'use client';

import { Sparkles } from 'lucide-react';

export default function AtsAnalyzerPage() {
  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            Automated Scanner Engine • Workday, Taleo & Greenhouse Parser Benchmark
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ATS Resume Analyzer</h1>
          <p className="text-[13px] text-slate-500 font-medium max-w-3xl">
            Simulated parser audit evaluating keyword densities, section headers, and semantic relevance for backend roles.
          </p>
        </div>
      </div>

      {/* Top Main Score Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:border-indigo-200 transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-6">
           <div className="flex items-center gap-6">
              <div className="h-20 w-20 shrink-0 rounded-2xl bg-indigo-50 border-[3px] border-indigo-500 flex items-center justify-center shadow-inner">
                 <span className="text-3xl font-black text-indigo-700">91</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex flex-wrap items-center gap-3">
                  Resume ATS Health: Excellent
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest border border-emerald-200 shadow-sm">Top 4% of applicants</span>
                </h2>
                <p className="text-[13px] text-slate-500 font-medium mt-1.5 max-w-xl leading-relaxed">
                  Your resume parses cleanly across major enterprise Applicant Tracking Systems without dropped tables or mangled fonts.
                </p>
              </div>
           </div>
           <button className="shrink-0 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-colors active:scale-95">
             Edit in Builder &rarr;
           </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
           {[
             { label: 'ATS Compatibility', score: 94 },
             { label: 'Keyword Match', score: 88 },
             { label: 'Formatting & Layout', score: 96 },
             { label: 'Skills Match', score: 91 },
             { label: 'Project Relevance', score: 87 },
             { label: 'Readability & Husch-Kincaid', score: 93 },
           ].map((metric) => (
             <div key={metric.label} className="space-y-3">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-8">{metric.label}</h4>
               <div className="text-2xl font-black text-slate-900">{metric.score}%</div>
               <div className="h-1.5 rounded-full bg-slate-100 w-full overflow-hidden">
                 <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${metric.score}%` }}></div>
               </div>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing High-Yield Keywords */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:border-indigo-200 transition-colors flex flex-col">
           <div className="mb-6">
             <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-1">Missing High-Yield Keywords</h3>
             <p className="text-[11px] text-slate-500 font-medium">Click to quickly inject verified keywords into your tailored resume bullets.</p>
           </div>
           <div className="space-y-3 flex-1">
             {['Spring Boot', 'REST API', 'Docker', 'AWS Cloud'].map((kw) => (
               <div key={kw} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all group cursor-pointer">
                 <span className="text-xs font-bold text-slate-700 font-mono group-hover:text-indigo-700 transition-colors">{kw}</span>
                 <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 group-hover:text-indigo-600 group-hover:border-indigo-200 group-hover:bg-indigo-50 text-[11px] font-bold flex items-center gap-1.5 transition-colors">
                   <span className="text-indigo-400 text-sm leading-none">+</span> Insert
                 </button>
               </div>
             ))}
           </div>
        </div>

        {/* Actionable Parser Recommendations */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:border-indigo-200 transition-colors flex flex-col">
           <div className="mb-6">
             <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-1">Actionable Parser Recommendations</h3>
             <p className="text-[11px] text-slate-500 font-medium">Targeted improvements to maximize automated parsing accuracy across enterprise ATS systems.</p>
           </div>
           <div className="space-y-6 flex-1">
             
             <div className="pb-5 border-b border-slate-100">
               <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                 <div className="flex-1">
                   <h4 className="text-[12px] font-bold text-slate-900 mb-1.5">Missing AWS Cloud Infrastructure Keyword</h4>
                   <p className="text-[11px] text-slate-500 leading-relaxed font-medium">You hold an AWS Cloud Practitioner certificate, but your project descriptions do not explicitly specify AWS deployment or S3 bucket usage.</p>
                 </div>
                 <button className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95">
                   <Sparkles className="h-3.5 w-3.5" /> Insert AWS S3 bullet
                 </button>
               </div>
             </div>

             <div className="pb-5 border-b border-slate-100">
               <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                 <div className="flex-1">
                   <h4 className="text-[12px] font-bold text-slate-900 mb-1.5">Action Verbs Lack Concurrency Metrics</h4>
                   <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Your second project bullet describes "sliding window rate limiting", but omitting requests/sec limits lowers technical ATS match scores for SDE roles.</p>
                 </div>
                 <button className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95">
                   <Sparkles className="h-3.5 w-3.5" /> Add "10,000 req/sec" metric
                 </button>
               </div>
             </div>

             <div>
               <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                 <div className="flex-1">
                   <h4 className="text-[12px] font-bold text-slate-900 mb-1.5">Date Formatting Consistency</h4>
                   <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Two dates are abbreviated "Aug 2025" while one uses "05/2025". Standardizing to "MMM YYYY" ensures 100% regex parser extraction.</p>
                 </div>
                 <button className="shrink-0 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors">
                   <Sparkles className="h-3.5 w-3.5" /> Standardize Date Formats
                 </button>
               </div>
             </div>

           </div>
        </div>
      </div>
    </div>
  );
}
