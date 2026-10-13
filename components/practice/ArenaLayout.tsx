'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePracticeStore } from '@/store/usePracticeStore';
import { getQuestionsByCategory } from '@/lib/practice/questions';
import { CheckCircle2, Lock, BookOpen, Clock, Activity, Award, ArrowLeft } from 'lucide-react';

interface ArenaLayoutProps {
  categoryId: string;
  categoryTitle: string;
  description: string;
  colorTheme: string;
  children: React.ReactNode;
}

export function ArenaLayout({ categoryId, categoryTitle, description, colorTheme, children }: ArenaLayoutProps) {
  const { categoryStats } = usePracticeStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'problems' | 'study-plan' | 'submissions'>('problems');

  const stats = categoryStats[categoryId] || { totalSolved: 0, totalQuestions: 0, accuracy: 0, skillScore: 0 };
  const allQuestions = getQuestionsByCategory(categoryId);

  const getThemeClasses = () => {
    switch (colorTheme) {
      case 'indigo': return { bg: 'bg-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-50', border: 'border-indigo-200' };
      case 'violet': return { bg: 'bg-violet-600', text: 'text-violet-600', lightBg: 'bg-violet-50', border: 'border-violet-200' };
      case 'fuchsia': return { bg: 'bg-fuchsia-600', text: 'text-fuchsia-600', lightBg: 'bg-fuchsia-50', border: 'border-fuchsia-200' };
      case 'sky': return { bg: 'bg-sky-600', text: 'text-sky-600', lightBg: 'bg-sky-50', border: 'border-sky-200' };
      case 'cyan': return { bg: 'bg-cyan-600', text: 'text-cyan-600', lightBg: 'bg-cyan-50', border: 'border-cyan-200' };
      case 'orange': return { bg: 'bg-orange-600', text: 'text-orange-600', lightBg: 'bg-orange-50', border: 'border-orange-200' };
      case 'amber': return { bg: 'bg-amber-600', text: 'text-amber-600', lightBg: 'bg-amber-50', border: 'border-amber-200' };
      case 'rose': return { bg: 'bg-rose-600', text: 'text-rose-600', lightBg: 'bg-rose-50', border: 'border-rose-200' };
      default: return { bg: 'bg-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-50', border: 'border-indigo-200' };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-20 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <Link href="/practice" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors mb-5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Practice Hub
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${theme.lightBg} ${theme.text} ${theme.border} border`}>
              Practice Arena
            </span>
            <span className="text-sm font-bold text-slate-400">CareerPilot</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{categoryTitle}</h1>
          <p className="mt-2 text-slate-500 font-medium max-w-2xl text-sm md:text-base leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Skill Score</span>
            <span className={`text-2xl font-black ${theme.text}`}>{stats.skillScore}/100</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Solved</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalSolved}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 mb-8 overflow-x-auto custom-scrollbar">
        {([
          { id: 'overview' as const, label: 'Overview', icon: Activity },
          { id: 'problems' as const, label: 'Problems', icon: BookOpen },
          { id: 'study-plan' as const, label: 'Study Plan', icon: Clock },
          { id: 'submissions' as const, label: 'Submissions', icon: CheckCircle2 },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold transition-all relative whitespace-nowrap ${
                isActive ? `${theme.text}` : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? '' : 'opacity-70'}`} />
              {tab.label}
              {isActive && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full ${theme.bg}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'problems' && children}
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className={`h-5 w-5 ${theme.text}`} /> 
                Readiness Analytics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-500">Overall Accuracy</span>
                    <span className="text-slate-900">{stats.accuracy}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${theme.bg}`} style={{ width: `${stats.accuracy}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-500">Completion</span>
                    <span className="text-slate-900">{stats.totalSolved} / {allQuestions.length}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${theme.bg} opacity-50`} style={{ width: `${Math.min(100, (stats.totalSolved / Math.max(1, allQuestions.length)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'study-plan' || activeTab === 'submissions') && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
            <Lock className="h-10 w-10 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Coming Soon</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              We are working on bringing personalized study plans and submission history to this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
