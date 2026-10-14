'use client';

import { useMemo } from 'react';
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
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Database,
    iconClass: 'bg-blue-50 text-blue-600 border-blue-100',
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

export default function PracticePage() {
  const { progress } = useProgressStore();

  const readinessLevel = Math.min(5, Math.max(1, Math.round(progress.readinessScore / 20)));

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
        <p className="text-[11px] font-bold text-blue-600 tracking-wide">
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
              <p className="mt-2 text-3xl font-black text-blue-600 tracking-tight">
                {totalSolved || progress.questionsSolved} Questions
              </p>
            </div>
            <Target className="h-5 w-5 text-blue-500" />
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
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-500">
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
          href="/practice/technical"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
        >
          Start Practice Drill
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const percent = Math.round((category.done / category.total) * 100);

          return (
            <Link
              key={category.id}
              href={`/practice/${category.id}`}
              className={`block text-left bg-white border rounded-2xl p-5 shadow-sm transition-all border-slate-200 hover:border-blue-200 hover:shadow-md hover:ring-2 hover:ring-blue-50`}
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
                    className="h-full rounded-full bg-blue-500"
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
            </Link>
          );
        })}
      </div>

    </div>
  );
}
