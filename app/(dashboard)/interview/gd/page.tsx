'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/useProfileStore';
import {
  Users,
  Sparkles,
  Play,
  ShieldCheck,
  Clock,
  BookOpen,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

const PRESET_TOPICS = [
  {
    title: 'AI in Tech Recruitment: Efficient Scaling vs. Human Fairness',
    domain: 'Technology & Ethics',
    description: 'Examining whether automated candidate screening eliminates bias or inadvertently amplifies systemic exclusion.',
    bot1: 'Aarav (Data-driven Innovation Advocate)',
    bot2: 'Priya (Ethics & Context Specialist)',
  },
  {
    title: 'Remote Work vs. Office Collaboration for Junior Engineers',
    domain: 'Workplace Culture',
    description: 'Balancing deep-work flexibility against osmotic peer mentoring and whiteboard architecture problem-solving.',
    bot1: 'Rohan (Async Productivity Proponent)',
    bot2: 'Sneha (Collaborative Mentorship Advocate)',
  },
  {
    title: 'Open Source Software vs. Proprietary Cloud Ecosystems',
    domain: 'Enterprise Architecture',
    description: 'Debating codebase sovereignty and auditability against enterprise SLAs, zero-maintenance, and managed compliance.',
    bot1: 'Aditya (Open Source Security Auditor)',
    bot2: 'Ananya (Enterprise Cloud Architect)',
  },
  {
    title: 'Green Computing: Balancing LLM Scale with Environmental Caps',
    domain: 'Sustainability & AI',
    description: 'Assessing energy-intensive AI data centers against tangible economic value and productivity gains.',
    bot1: 'Vikram (Techno-Optimist)',
    bot2: 'Meera (Sustainability Analyst)',
  },
];

export default function GroupDiscussionSetupPage() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const [selectedTopicIdx, setSelectedTopicIdx] = useState<number>(0);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(10);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartGD = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch('/api/gd/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicIndex: selectedTopicIdx,
          customTopic: customTopic.trim() || undefined,
          studentName: profile.fullName || 'Student',
          durationMinutes,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to initialize session (${res.status})`);
      }

      const data = await res.json();
      if (data.sessionId) {
        // Save session setup in sessionStorage
        sessionStorage.setItem(`prism_gd_session_${data.sessionId}`, JSON.stringify(data));
        router.push(`/interview/gd/${data.sessionId}`);
      } else {
        throw new Error('No session ID returned');
      }
    } catch (err) {
      console.error('[GD Setup] Start error:', err);
      setError(err instanceof Error ? err.message : 'Failed to launch Group Discussion');
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-16 animate-fade-in font-sans px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              PRISM Module 3.3
            </span>
            <span className="text-xs font-semibold text-slate-500">Placement Group Discussion Room</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Group Discussion (GD) Practice
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-0.5">
            AI-moderated collegiate GD with opposing candidate bots, turn timers, voice speech-to-text, and 4-metric scoring.
          </p>
        </div>

        <Link
          href="/interview"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start md:self-auto"
        >
          &larr; Back to 1-on-1 Mock Interview
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 1. Topic Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Select Placement GD Topic
          </h2>
          <span className="text-xs text-slate-400">Neutral &amp; balanced placement themes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_TOPICS.map((topic, idx) => {
            const isSelected = selectedTopicIdx === idx && !customTopic.trim();
            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedTopicIdx(idx);
                  setCustomTopic('');
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600">
                      {topic.domain}
                    </span>
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedTopicIdx(idx);
                        setCustomTopic('');
                      }}
                      className="text-indigo-600"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  Opposing bot stances: <span className="font-semibold text-slate-600 dark:text-slate-300">{topic.bot1.split(' ')[0]} vs. {topic.bot2.split(' ')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Topic Input */}
        <div className="pt-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Or Propose Custom Discussion Topic:
          </label>
          <input
            type="text"
            placeholder="e.g. Electric Vehicles: Infrastructure Readiness vs Consumer Adoption in Tier-2 Indian Cities"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 2. Format & Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Round Duration */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Discussion Duration
          </h2>
          <div className="space-y-2.5">
            {[
              { mins: 8, label: '8 Minutes (Fast-Paced Drill)', turns: '~8-10 collective turns' },
              { mins: 12, label: '12 Minutes (Standard Campus GD)', turns: '~14-16 collective turns • Recommended' },
              { mins: 16, label: '16 Minutes (Full Depth Round)', turns: '~20 collective turns' },
            ].map((d) => (
              <div
                key={d.mins}
                onClick={() => setDurationMinutes(d.mins)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  durationMinutes === d.mins
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{d.label}</span>
                  <p className="text-[11px] text-slate-500">{d.turns}</p>
                </div>
                <input
                  type="radio"
                  checked={durationMinutes === d.mins}
                  onChange={() => setDurationMinutes(d.mins)}
                  className="text-indigo-600"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation Pillars Disclosed */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3. Objective Evaluation Rubric
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Content (25%):</strong>
                <p className="text-slate-500 text-[11px]">Substance, concrete examples, logical depth, no empty jargon.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Clarity (25%):</strong>
                <p className="text-slate-500 text-[11px]">Structured expression, concise delivery, avoiding run-on sentences.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Initiative (25%):</strong>
                <p className="text-slate-500 text-[11px]">Opening early, proposing fresh angles, steering direction constructively.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">4</span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Listening (25%):</strong>
                <p className="text-slate-500 text-[11px]">Referencing peer points, synthesizing differing views, zero interrupting.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Launch CTA */}
      <div className="text-center pt-2">
        <button
          onClick={handleStartGD}
          disabled={isStarting}
          className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-white" />
          {isStarting ? 'Launching Discussion Room...' : 'Enter Group Discussion Room'}
        </button>
      </div>
    </div>
  );
}
