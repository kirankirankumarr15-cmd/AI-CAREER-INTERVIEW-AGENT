'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/useInterviewStore';
import { useProfileStore } from '@/store/useProfileStore';
import { InterviewType, InterviewDifficulty, InterviewMode } from '@/types';
import { Play } from 'lucide-react';

export default function InterviewSetupPage() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const { startInterview } = useInterviewStore();

  const [targetRole, setTargetRole] = useState(profile.targetRole || 'Software Developer (SDE)');
  const [interviewType, setInterviewType] = useState<InterviewType>('Technical');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('Intermediate');
  const [mode, setMode] = useState<InterviewMode>('Professional');

  const handleLaunch = () => {
    startInterview({
      targetRole,
      interviewType,
      difficulty,
      mode,
    });
    router.push('/interview/room');
  };

  const targetRoles = [
    'Backend Developer',
    'Software Developer (SDE)',
    'Frontend Developer',
    'Full Stack Developer'
  ];

  const tracks = [
    { id: 'Technical', label: 'Technical', desc: 'Core CS fundamentals, databases, systems, and code logic', questions: 5 },
    { id: 'HR', label: 'HR', desc: 'Culture fit, career trajectory, motivation and salary expectations', questions: 4 },
    { id: 'Behavioral', label: 'Behavioral', desc: 'Conflict resolution, leadership, and STAR framework responses', questions: 5 },
    { id: 'DSA', label: 'DSA', desc: 'Algorithms, complexity, tree traversals, and dynamic programming', questions: 3 },
    { id: 'Project', label: 'Project', desc: 'In-depth architectural defense, trade-offs, and metrics', questions: 4 },
    { id: 'Full Interview', label: 'Full Interview', desc: 'Comprehensive round simulating technical, project, and behavioral rounds', questions: 8 },
    { id: 'Company', label: 'Company Simulation', desc: 'Replicates specific hiring bar of companies like Stripe, Google, or Razorpay', questions: 6 },
  ];

  const difficulties = [
    { id: 'Beginner', label: 'Beginner', desc: 'Foundational concepts and textbook definitions' },
    { id: 'Intermediate', label: 'Intermediate', desc: 'Standard campus placement & junior engineer hiring bar' },
    { id: 'Advanced', label: 'Advanced', desc: 'High-concurrency systems, edge cases, and architecture pressure' },
  ];

  const personas = [
    { id: 'Friendly', label: 'Friendly', icon: '🙂', desc: 'Encouraging tone with helpful hints when you hesitate' },
    { id: 'Professional', label: 'Professional', icon: '👔', desc: 'Neutral, realistic corporate engineering hiring bar' },
    { id: 'Strict', label: 'Strict', icon: '🤨', desc: 'Demands precise terminology, no hand-waving or vague answers' },
    { id: 'Pressure', label: 'Pressure', icon: '⚡', desc: 'Fast follow-up questions, interrupt on drift, and stress scenarios' },
  ];

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-16 animate-fade-in-up font-sans">
      
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center justify-center gap-2">
          Cinematic AI Simulation • Dynamic Voice Avatar
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Prepare for your interview
        </h1>
        <p className="text-[13px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Configure your mock interview parameters. You will enter a distraction-free audio-visual simulation with dynamic follow-up questioning.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* 1. Target Role */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-5">
            1. Select Interview Target Role
          </h2>
          <div className="flex flex-wrap gap-3">
            {targetRoles.map((role) => (
              <button
                key={role}
                onClick={() => setTargetRole(role)}
                className={`px-4 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${
                  targetRole === role
                    ? 'bg-teal-50 border-teal-200 text-teal-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Choose Track */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-5">
            2. Choose Interview Track
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((t) => (
              <button
                key={t.id}
                onClick={() => setInterviewType(t.id as any)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  interviewType === t.id
                    ? 'bg-teal-50 border-teal-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-teal-200 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-[13px] font-black ${interviewType === t.id ? 'text-teal-900' : 'text-slate-900'}`}>
                    {t.label}
                  </h3>
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest ${interviewType === t.id ? 'text-teal-600' : 'text-slate-400'}`}>
                    10M • {t.questions} Qs
                  </span>
                </div>
                <p className={`text-[11px] font-medium leading-relaxed ${interviewType === t.id ? 'text-teal-700/80' : 'text-slate-500'}`}>
                  {t.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 3. Difficulty Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-5">
              3. Difficulty Bar
            </h2>
            <div className="space-y-3">
              {difficulties.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id as any)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    difficulty === d.id
                      ? 'bg-teal-50 border-teal-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-teal-200 hover:bg-slate-50/50'
                  }`}
                >
                  <h3 className={`text-[13px] font-black mb-1.5 ${difficulty === d.id ? 'text-teal-900' : 'text-slate-900'}`}>
                    {d.label}
                  </h3>
                  <p className={`text-[11px] font-medium ${difficulty === d.id ? 'text-teal-700/80' : 'text-slate-500'}`}>
                    {d.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Interviewer Persona */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-5">
              4. Interviewer Persona
            </h2>
            <div className="space-y-3">
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setMode(p.id as any)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    mode === p.id
                      ? 'bg-teal-50 border-teal-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-teal-200 hover:bg-slate-50/50'
                  }`}
                >
                  <h3 className={`text-[13px] font-black mb-1.5 flex items-center gap-2 ${mode === p.id ? 'text-teal-900' : 'text-slate-900'}`}>
                    <span className="text-sm">{p.icon}</span> {p.label}
                  </h3>
                  <p className={`text-[11px] font-medium ${mode === p.id ? 'text-teal-700/80' : 'text-slate-500'}`}>
                    {p.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <div>
            <h4 className="text-[12px] font-black text-slate-900 mb-1">Ready to enter the Interview Room?</h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Estimated duration: 15 minutes • Video & microphone enabled
            </p>
          </div>
          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 transition-all active:scale-95 shrink-0"
          >
            <Play className="h-4 w-4 fill-white" /> Start Interview
          </button>
        </div>

      </div>
    </div>
  );
}
