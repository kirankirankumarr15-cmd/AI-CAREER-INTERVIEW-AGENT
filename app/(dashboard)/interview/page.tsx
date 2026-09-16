'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/useInterviewStore';
import { useProfileStore } from '@/store/useProfileStore';
import { InterviewType, InterviewDifficulty, InterviewMode } from '@/types';
import { Mic, Bot, ArrowRight, Shield } from 'lucide-react';

export default function InterviewSetupPage() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const { startInterview } = useInterviewStore();

  const [targetRole, setTargetRole] = useState(profile.targetRole || 'Full Stack Developer');
  const [interviewType, setInterviewType] = useState<InterviewType>('Technical');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('Intermediate');
  const [mode, setMode] = useState<InterviewMode>('Professional');
  const [companyName, setCompanyName] = useState('');

  const handleLaunch = () => {
    startInterview({
      targetRole,
      interviewType,
      difficulty,
      mode,
      companyName: companyName.trim() || undefined,
    });
    router.push('/interview/room');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold">
          <Bot className="h-4 w-4 animate-pulse" />
          <span>Realistic Human-like Voice AI Interviewer</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#FAFAFA] tracking-tight">
          Configure AI Mock Interview Room
        </h1>
        <p className="text-sm text-[#71717A] max-w-xl mx-auto font-medium">
          The AI interviewer reads your <span className="text-emerald-400 font-bold">verified</span> profile, resume, and target role to conduct realistic dynamic voice interviews.
        </p>
      </div>

      {/* Setup Form */}
      <div className="card p-8 space-y-8">
        {/* 1. Target Role & Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-[#A1A1AA] mb-2">Target Interview Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3.5 py-3 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#A1A1AA] mb-2">
              Target Company Simulation
              <span className="ml-1 text-[#52525B] font-medium">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Google, Microsoft, Amazon..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-3 text-xs font-semibold"
            />
            {companyName && (
              <p className="text-[10px] text-amber-400/70 mt-1 font-medium">
                ⓘ Company simulation is AI-generated and not affiliated with {companyName}.
              </p>
            )}
          </div>
        </div>

        {/* 2. Interview Type */}
        <div>
          <label className="block text-xs font-bold text-[#A1A1AA] mb-2.5">Interview Type & Focus</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'Technical', label: 'Technical Depth', desc: 'DSA, DBMS, OS, Systems' },
              { id: 'HR', label: 'HR & Behavioral', desc: 'STAR method, Culture fit' },
              { id: 'Project', label: 'Project Deep-Dive', desc: 'Resume project challenges' },
              { id: 'Full Interview', label: 'Full 360° Simulation', desc: 'Comprehensive round' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInterviewType(t.id as any)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  interviewType === t.id
                    ? 'bg-indigo-500/15 border-indigo-500/50 text-[#FAFAFA] shadow-lg shadow-indigo-500/10'
                    : 'bg-white/3 border-[#27272F] text-[#A1A1AA] hover:border-[#3A3A45] hover:bg-white/5'
                }`}
              >
                <p className={`text-xs font-bold ${interviewType === t.id ? 'text-indigo-300' : 'text-[#FAFAFA]'}`}>
                  {t.label}
                </p>
                <p className="text-[10.5px] text-[#71717A] font-medium mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Difficulty & Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-[#A1A1AA] mb-2">Difficulty Level</label>
            <div className="flex gap-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d as any)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    difficulty === d
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                      : 'bg-white/3 border-[#27272F] text-[#A1A1AA] hover:border-[#3A3A45]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A1A1AA] mb-2">Interviewer Persona</label>
            <div className="flex gap-2">
              {['Friendly', 'Professional', 'Strict', 'Pressure'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m as any)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    mode === m
                      ? 'bg-[#FAFAFA] text-[#0A0A0B] border-[#FAFAFA]'
                      : 'bg-white/3 border-[#27272F] text-[#A1A1AA] hover:border-[#3A3A45]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Launch CTA */}
        <div className="pt-4 border-t border-[#1F1F27] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#71717A] font-medium flex items-center gap-2">
            <Mic className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Microphone & Audio permissions will be requested in the Interview Room.</span>
          </div>

          <button
            onClick={handleLaunch}
            className="btn-shine w-full md:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>Enter AI Interview Room</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="flex items-center gap-2 text-[10px] text-[#52525B] font-medium justify-center">
        <Shield className="h-3.5 w-3.5" />
        <span>AI-generated simulation. Company names are for training context only and not endorsed by those companies.</span>
      </div>
    </div>
  );
}
