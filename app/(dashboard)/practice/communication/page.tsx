'use client';

import { Mic, Clock, Sparkles, Volume2, Target, AlertCircle } from 'lucide-react';

export default function CommunicationCoachPage() {
  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto">
      {/* Page Title */}
      <div className="flex flex-col border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
            Acoustic & Speech Intelligence • Biometric Vocal Analysis
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Communication Coach</h1>
          <p className="text-[13px] text-slate-500 font-medium max-w-3xl">
            Real-time speech analytics measuring pacing, articulation, structured answer coherence, and filler-word elimination
          </p>
        </div>
      </div>

      {/* Main Score Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-8 mb-8 gap-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shadow-inner">
               <span className="text-3xl font-black text-emerald-600">76</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                Communication Score: 76 / 100
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest border border-emerald-200">Competent</span>
              </h2>
              <p className="text-[13px] text-slate-500 font-medium mt-1.5 max-w-xl leading-relaxed">
                Your answers were generally clear and audible, but you frequently hesitated before technical answers.
              </p>
            </div>
          </div>
          <div className="flex gap-4 shrink-0 border-l border-slate-100 pl-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Optimal Cadence</p>
              <p className="text-lg font-black text-slate-900">130-150 <span className="text-xs text-slate-500 font-bold">wpm</span></p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Speed</p>
              <p className="text-lg font-black text-emerald-600 flex items-baseline gap-1.5">
                142 <span className="text-xs text-slate-500 font-bold">wpm</span> 
                <span className="text-[10px] font-bold text-emerald-500">(Perfect)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { label: 'Clarity', score: 89, color: 'bg-emerald-500' },
            { label: 'Fluency', score: 74, color: 'bg-emerald-500' },
            { label: 'Grammar', score: 88, color: 'bg-emerald-500' },
            { label: 'Vocabulary', score: 78, color: 'bg-emerald-500' },
            { label: 'Pronunciation', score: 94, color: 'bg-emerald-500' },
            { label: 'Speaking Speed', score: 75, color: 'bg-emerald-500' },
            { label: 'Filler Words', score: 43, color: 'bg-amber-500', alert: '12 detected' },
            { label: 'Answer Structure (STAR)', score: 72, color: 'bg-emerald-500' },
            { label: 'Professional Tone', score: 92, color: 'bg-emerald-500' }
          ].map((metric) => (
            <div key={metric.label} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[11px] font-bold text-slate-600">{metric.label}</h4>
                <span className="text-[11px] font-black text-slate-900">{metric.score}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 w-full overflow-hidden mb-1.5">
                <div className={`h-full rounded-full ${metric.color}`} style={{ width: `${metric.score}%` }}></div>
              </div>
              {metric.alert && (
                <span className="text-[9px] font-bold text-amber-600">{metric.alert}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Drill Section */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Mic className="h-4 w-4 text-emerald-600" /> 60-Second Speaking Drill
            </h3>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <Clock className="h-3.5 w-3.5" /> 0S / 60S
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 mb-6">
            <h4 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Prompt of the Day:
            </h4>
            <p className="text-[15px] font-bold text-slate-900 leading-relaxed mb-4">
              "Tell me about a technical trade-off you made in your Campus Placement Hub project."
            </p>
            <p className="text-[12px] text-slate-600 font-medium">
              <strong className="text-emerald-800">Challenge:</strong> Rehearse without saying "um", "like", or "actually". Please deliberately pause for 2 seconds when collecting your thoughts.
            </p>
          </div>

          <p className="text-[12px] text-slate-500 font-medium italic mb-8 flex-1">
            Press "Start Voice Drill" below to begin recording. The AI coach will analyze your pacing, filler words, and sentence conciseness.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-5 border-t border-slate-100 gap-4">
            <p className="text-[11px] text-slate-400 font-medium">
              Microphone access required. Fallback to text supported.
            </p>
            <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95">
              <Mic className="h-4 w-4" /> Start Voice Drill
            </button>
          </div>
        </div>

        {/* Filler Word Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-1">Filler Word Breakdown</h3>
            <p className="text-[11px] text-slate-500 font-medium">Detected occurrences from your last 10-minute mock interview session.</p>
          </div>

          <div className="space-y-4 flex-1">
            {[
              { word: 'um', count: 5, context: 'Hesitated before explaining Redis Cache-Aside' },
              { word: 'uh', count: 3, context: 'Mid-sentence during concurrency locks' },
              { word: 'actually', count: 2, context: 'Filler transition between ideas' },
              { word: 'basically', count: 2, context: 'Overused when describing Spring Boot' },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-black text-slate-900 font-mono tracking-tight">"{item.word}"</span>
                  <span className="text-[11px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{item.count} times</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">{item.context}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
            <h4 className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1.5 mb-2">
              <AlertCircle className="h-3.5 w-3.5" /> Pro Tip: The Power of Silence
            </h4>
            <p className="text-[11px] text-emerald-700/90 font-medium leading-relaxed">
              Replacing filler words with silence makes candidates appear more confident and thoughtful. When a question is asked, take a deep breath before speaking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
