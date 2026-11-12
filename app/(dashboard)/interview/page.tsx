'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/useInterviewStore';
import { useProfileStore } from '@/store/useProfileStore';
import { InterviewType, InterviewDifficulty, InterviewMode } from '@/types';
import {
  Play,
  Code2,
  UserCheck,
  FileText,
  Shield,
  Clock,
  VideoOff,
  Users,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import Link from 'next/link';

const TECHNICAL_SUBJECTS = [
  'Data Structures & Algorithms (DSA)',
  'Database Management Systems (DBMS)',
  'Operating Systems & Concurrency',
  'Computer Networks (TCP/IP, HTTP)',
  'Object-Oriented Programming (OOP)',
  'Web Engineering & System Design',
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const { startInterview } = useInterviewStore();

  const [targetRole, setTargetRole] = useState(profile.targetRole || 'Software Developer (SDE)');
  const [interviewType, setInterviewType] = useState<InterviewType>('Technical');
  const [technicalSubject, setTechnicalSubject] = useState(TECHNICAL_SUBJECTS[0]);
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('Intermediate');
  const [mode, setMode] = useState<InterviewMode>('Professional');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);

  const handleLaunch = () => {
    startInterview({
      targetRole,
      interviewType,
      difficulty,
      mode,
      technicalSubject: interviewType === 'Technical' ? technicalSubject : undefined,
      durationMinutes,
    });
    router.push('/interview/room');
  };

  const targetRoles = [
    'Software Developer (SDE)',
    'Backend Developer',
    'Frontend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'AI/ML Engineer',
  ];

  const interviewTypes = [
    {
      id: 'Technical' as InterviewType,
      title: 'Technical Interview',
      icon: Code2,
      badge: 'Subject Focus',
      description: 'Deep dive into computer science fundamentals, code reasoning, and algorithms.',
    },
    {
      id: 'HR' as InterviewType,
      title: 'HR & Behavioral',
      icon: UserCheck,
      badge: 'Culture & Fit',
      description: 'Situational leadership, conflict resolution, career aspirations, and STAR framework.',
    },
    {
      id: 'Resume-based' as InterviewType,
      title: 'Resume-Grounded',
      icon: FileText,
      badge: 'Verified Data Only',
      description: 'Questions asked strictly and only from your verified projects, skills, and coursework.',
    },
  ];

  const difficulties = [
    { id: 'Beginner' as InterviewDifficulty, label: 'Beginner', desc: 'Core textbook principles & direct definitions' },
    { id: 'Intermediate' as InterviewDifficulty, label: 'Intermediate', desc: 'Standard Tier-1/Tier-2 campus hiring bar' },
    { id: 'Advanced' as InterviewDifficulty, label: 'Advanced', desc: 'Edge cases, scale bottlenecks, and architectural pressure' },
  ];

  const personas = [
    { id: 'Professional' as InterviewMode, label: 'Professional', icon: '👔', desc: 'Objective, neutral corporate hiring bar' },
    { id: 'Friendly' as InterviewMode, label: 'Friendly', icon: '🙂', desc: 'Supportive tone with gentle hints if you hesitate' },
    { id: 'Strict' as InterviewMode, label: 'Strict', icon: '🧐', desc: 'Demands precise terminology; probes vague assertions' },
    { id: 'Pressure' as InterviewMode, label: 'Pressure', icon: '⚡', desc: 'Fast-paced follow-ups and time-budget challenges' },
  ];

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-16 animate-fade-in font-sans px-4 sm:px-6">
      {/* Top Banner for Group Discussion */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                New: AI-Moderated Group Discussion (GD)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200">
                Module 3.3
              </span>
            </div>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-0.5">
              Practice placement GD rounds with an AI moderator and opposing AI candidate bots.
            </p>
          </div>
        </div>
        <Link
          href="/interview/gd"
          className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          Explore GD Practice <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="flex items-center justify-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            PRISM Module 3.2
          </span>
          <span className="text-xs font-semibold text-slate-500">InterviewAI Simulation Room</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Configure Your Mock Interview
        </h1>
        <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
          Interactive voice and typed mock interview with AI follow-ups. No mid-session scores. Server-authoritative timer.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Target Role */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            1. Target Placement Track
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {targetRoles.map((role) => (
              <button
                key={role}
                onClick={() => setTargetRole(role)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                  targetRole === role
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Three PRISM Core Interview Types */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Select Interview Round Type
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {interviewTypes.map((type) => {
              const isSelected = interviewType === type.id;
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  onClick={() => setInterviewType(type.id)}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {type.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{type.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{type.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subject Dropdown if Technical is Selected */}
          {interviewType === 'Technical' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Select Technical Subject Focus
              </label>
              <select
                value={technicalSubject}
                onChange={(e) => setTechnicalSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {TECHNICAL_SUBJECTS.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Resume-Grounded Notice if selected */}
          {interviewType === 'Resume-based' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5 animate-fade-in">
              <Shield className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-bold">Strict Verification Guard Active</p>
                <p className="mt-0.5 leading-relaxed text-[11px]">
                  All questions will be grounded strictly in your verified profile skills and documented projects from {profile.college || 'PESITM Shivamogga'}. The interviewer will never reference facts outside your verified submissions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. Duration & Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Difficulty */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Difficulty Bar
            </h2>
            <div className="space-y-2">
              {difficulties.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    difficulty === d.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{d.label}</span>
                    <p className="text-[11px] text-slate-500">{d.desc}</p>
                  </div>
                  <input
                    type="radio"
                    checked={difficulty === d.id}
                    onChange={() => setDifficulty(d.id)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              4. Session Duration
            </h2>
            <div className="space-y-2">
              {[
                { mins: 10, label: '10 Minutes (Express Drill)', desc: '4 adaptive questions • Fast pace' },
                { mins: 15, label: '15 Minutes (Standard Campus Round)', desc: '6 adaptive questions • Recommended' },
                { mins: 20, label: '20 Minutes (Comprehensive Defense)', desc: '8 adaptive questions • In-depth architecture' },
              ].map((dur) => (
                <div
                  key={dur.mins}
                  onClick={() => setDurationMinutes(dur.mins)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    durationMinutes === dur.mins
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{dur.label}</span>
                    <p className="text-[11px] text-slate-500">{dur.desc}</p>
                  </div>
                  <input
                    type="radio"
                    checked={durationMinutes === dur.mins}
                    onChange={() => setDurationMinutes(dur.mins)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Interviewer Persona */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            5. Interviewer Demeanor & Persona
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {personas.map((p) => {
              const isSelected = mode === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setMode(p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-1.5">{p.icon}</div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.label}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy & Engine Guarantees Notice */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              PRISM Simulation Guarantees
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>Webcam is <strong>OFF by default</strong> and optional. Video stream is strictly client-side and never saved or uploaded.</li>
              <li>Countdown timer is server-authoritative and resumes gracefully if page is refreshed.</li>
              <li>Detailed 4-metric score (Communication, Technical Accuracy, Structure, Estimated Interview Confidence) and per-question model answers are produced after completion.</li>
            </ul>
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-2 text-center">
          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
          >
            <Play className="h-4 w-4 fill-white" />
            Enter Interview Simulation Room
          </button>
        </div>
      </div>
    </div>
  );
}
