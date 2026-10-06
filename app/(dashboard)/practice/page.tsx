'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  Brain,
  Cpu,
  Database,
  Flame,
  GitBranch,
  Globe,
  Layers,
  MessageCircle,
  Network,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { useProgressStore } from '@/store/useProgressStore';

type CategoryId =
  | 'dbms'
  | 'dsa'
  | 'oop'
  | 'os'
  | 'cn'
  | 'web'
  | 'backend'
  | 'aptitude'
  | 'communication'
  | 'hr'
  | 'system-design';

const categories: {
  id: CategoryId;
  title: string;
  description: string;
  badge: string;
  badgeClass: string;
  icon: typeof Database;
  iconClass: string;
  done: number;
  total: number;
}[] = [
  {
    id: 'dbms',
    title: 'DBMS & SQL',
    description: 'Relational algebra, ACID, indexes, query plans, normalization, and joins.',
    badge: 'Priority 1',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Database,
    iconClass: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    done: 28,
    total: 40,
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    description: 'Arrays, Trees, Graphs, Dynamic Programming, and complexity analysis.',
    badge: 'Core',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: GitBranch,
    iconClass: 'bg-violet-50 text-violet-600 border-violet-100',
    done: 94,
    total: 150,
  },
  {
    id: 'oop',
    title: 'OOP & System Design',
    description: 'Design patterns, SOLID principles, microservices, and rate limiters.',
    badge: 'High Impact',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    icon: Layers,
    iconClass: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
    done: 22,
    total: 35,
  },
  {
    id: 'os',
    title: 'Operating Systems',
    description: 'Processes, threads, synchronization, memory management, and paging.',
    badge: 'Foundational',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Cpu,
    iconClass: 'bg-sky-50 text-sky-600 border-sky-100',
    done: 18,
    total: 30,
  },
  {
    id: 'cn',
    title: 'Computer Networks',
    description: 'OSI vs TCP/IP, HTTP, DNS, sockets, and common interview networking questions.',
    badge: 'Core',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: Network,
    iconClass: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    done: 12,
    total: 24,
  },
  {
    id: 'web',
    title: 'Frontend & Web',
    description: 'React, JavaScript, CSS layout, accessibility, and browser rendering.',
    badge: 'Role Fit',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Globe,
    iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    done: 31,
    total: 45,
  },
  {
    id: 'backend',
    title: 'Backend & APIs',
    description: 'REST, auth, databases, caching, and production debugging patterns.',
    badge: 'High Impact',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Boxes,
    iconClass: 'bg-blue-50 text-blue-600 border-blue-100',
    done: 19,
    total: 32,
  },
  {
    id: 'aptitude',
    title: 'Aptitude & Reasoning',
    description: 'Quantitative, logical, and verbal drills used in campus placement rounds.',
    badge: 'Screening',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Brain,
    iconClass: 'bg-amber-50 text-amber-600 border-amber-100',
    done: 40,
    total: 60,
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'Elevator pitches, clarity, filler-word control, and spoken technical answers.',
    badge: 'Soft Skill',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: MessageCircle,
    iconClass: 'bg-rose-50 text-rose-600 border-rose-100',
    done: 8,
    total: 20,
  },
  {
    id: 'hr',
    title: 'HR & Behavioral',
    description: 'STAR stories, strengths, conflict, and leadership interview questions.',
    badge: 'Must Do',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Users,
    iconClass: 'bg-orange-50 text-orange-600 border-orange-100',
    done: 6,
    total: 18,
  },
  {
    id: 'system-design',
    title: 'System Design Basics',
    description: 'Scalability, databases vs caches, load balancing, and trade-off reasoning.',
    badge: 'Advanced',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: ShieldCheck,
    iconClass: 'bg-slate-100 text-slate-600 border-slate-200',
    done: 4,
    total: 16,
  },
];

const sampleQuestions: Record<CategoryId, { id: string; title: string; hint: string }[]> = {
  dbms: [
    {
      id: 'q-dbms-1',
      title: 'Explain the difference between INNER JOIN and LEFT JOIN and optimize PostgreSQL index scans.',
      hint: 'LEFT JOIN keeps all left-table rows. Indexes help equality/range filters; avoid wrapping indexed columns in functions.',
    },
    {
      id: 'q-dbms-2',
      title: 'How does indexing speed up SELECT queries, and what is the write trade-off?',
      hint: 'B-Tree indexes speed lookups but add extra work on INSERT, UPDATE, and DELETE.',
    },
  ],
  dsa: [
    {
      id: 'q-dsa-1',
      title: 'Find the maximum sum of a contiguous subarray (Kadane’s algorithm).',
      hint: 'Track current sum and reset it when it drops below zero.',
    },
  ],
  oop: [
    {
      id: 'q-oop-1',
      title: 'When would you choose composition over inheritance in a production service?',
      hint: 'Prefer composition when behavior varies independently and you want looser coupling.',
    },
  ],
  os: [
    {
      id: 'q-os-1',
      title: 'Explain deadlock necessary conditions and one prevention strategy.',
      hint: 'Mutual exclusion, hold and wait, no preemption, circular wait. Break circular wait with a lock order.',
    },
  ],
  cn: [
    {
      id: 'q-cn-1',
      title: 'What happens when you type a URL in the browser?',
      hint: 'DNS lookup, TCP handshake, TLS, HTTP request, response, rendering.',
    },
  ],
  web: [
    {
      id: 'q-web-1',
      title: 'How does React re-render, and how do you avoid unnecessary updates?',
      hint: 'State/prop changes trigger renders. Memoize stable props, split state, and keep lists keyed.',
    },
  ],
  backend: [
    {
      id: 'q-be-1',
      title: 'How would you design pagination and rate limiting for a public API?',
      hint: 'Cursor pagination scales better than offset. Rate-limit by token bucket keyed on user/IP.',
    },
  ],
  aptitude: [
    {
      id: 'q-ap-1',
      title: 'A train 120 m long crosses a platform 180 m long in 20 seconds. Find its speed.',
      hint: 'Distance = 300 m in 20 s → 15 m/s = 54 km/h.',
    },
  ],
  communication: [
    {
      id: 'q-cm-1',
      title: 'Deliver a 60-second elevator pitch for a Full Stack Software Engineer role.',
      hint: 'Cover background, stack, one project with impact, and why this role.',
    },
  ],
  hr: [
    {
      id: 'q-hr-1',
      title: 'Describe a situation where a project deadline was at risk. How did you prioritize?',
      hint: 'Use STAR: Situation, Task, Action, Result with a measurable outcome.',
    },
  ],
  'system-design': [
    {
      id: 'q-sd-1',
      title: 'Design a URL shortener. Which data store and collision strategy would you use?',
      hint: 'Hash + unique ID, Redis cache for hot keys, and a relational/NoSQL store for mappings.',
    },
  ],
};

export default function PracticePage() {
  const { progress } = useProgressStore();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('dbms');

  const readinessLevel = Math.min(5, Math.max(1, Math.round(progress.readinessScore / 20)));
  const questions = sampleQuestions[activeCategory];
  const activeMeta = categories.find((c) => c.id === activeCategory)!;

  const totalSolved = useMemo(
    () => categories.reduce((sum, category) => sum + category.done, 0),
    []
  );
  const totalGoal = useMemo(
    () => categories.reduce((sum, category) => sum + category.total, 0),
    []
  );

  return (
    <div className="space-y-6 pb-16 animate-fade-in-up">
      <div>
        <p className="text-[11px] font-bold text-indigo-600 tracking-wide">
          Interactive Drill Hub
          <span className="mx-2 text-slate-300">·</span>
          <span className="text-slate-500 font-semibold">{categories.length} Specialized Categories</span>
        </p>
        <p className="mt-2 text-sm text-slate-500 max-w-3xl">
          Curated question banks evaluated by AI with instant scoring, rubric breakdowns, and model answers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">Practice Streak</p>
              <p className="mt-2 text-3xl font-black text-orange-500 tracking-tight">
                {progress.dailyStreak} Days
              </p>
            </div>
            <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
          </div>
          <p className="mt-3 text-xs font-medium text-slate-400">Keep it up today!</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Solved</p>
              <p className="mt-2 text-3xl font-black text-indigo-600 tracking-tight">
                {totalSolved || progress.questionsSolved} Questions
              </p>
            </div>
            <Target className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-3 text-xs font-medium text-slate-400">Goal: {totalGoal}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">Placement Readiness</p>
              <p className="mt-2 text-3xl font-black text-emerald-600 tracking-tight">
                Level {readinessLevel} / 5
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 text-xs font-medium text-slate-400">
            {readinessLevel >= 4 ? 'Advanced Tier' : 'Building Tier'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-500">
            Today’s Recommended Drill
          </p>
          <h2 className="mt-1.5 text-lg font-extrabold text-slate-900">
            DBMS & SQL Execution Plans (Question 7 of 20)
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Explain the difference between INNER JOIN and LEFT JOIN and optimize PostgreSQL index scans.
          </p>
        </div>
        <Link
          href="/interview"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
        >
          Start Practice Drill
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const percent = Math.round((category.done / category.total) * 100);
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`text-left bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                isActive
                  ? 'border-indigo-300 ring-2 ring-indigo-100'
                  : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${category.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${category.badgeClass}`}>
                  {category.badge}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-extrabold text-slate-900">{category.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{category.description}</p>
              <div className="mt-4">
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500">
                    {category.done} / {category.total} Done
                  </span>
                  <span className="text-slate-900">{percent}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">{activeMeta.title} drills</h3>
          <span className="text-xs font-semibold text-slate-500">
            {questions.length} question{questions.length === 1 ? '' : 's'}
          </span>
        </div>
        {questions.map((question) => (
          <div key={question.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {activeMeta.title}
              </span>
              <span className="text-xs text-slate-500 font-mono font-bold">100 Points</span>
            </div>
            <h4 className="font-bold text-base text-slate-900">{question.title}</h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
              <strong className="text-indigo-600 block mb-1">AI Solution Hint:</strong>
              {question.hint}
            </div>
            <div className="flex justify-end pt-1">
              <Link
                href="/interview"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                Practice Spoken Answer
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
