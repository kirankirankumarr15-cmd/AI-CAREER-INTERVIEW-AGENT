'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePracticeStore } from '@/store/usePracticeStore';
import { Question } from '@/lib/practice/questions';
import { Play, CheckCircle2, Circle, Flame, Building2, Hash, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';

interface ProblemListProps {
  questions: Question[];
  category?: string;
}

export function ProblemList({ questions }: ProblemListProps) {
  const { attempts, bookmarkedIds, toggleBookmark } = usePracticeStore();
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  // Extract unique topics for filtering
  const topics = Array.from(new Set(questions.map(q => q.topic))).sort();

  // Apply filters
  const filteredQuestions = questions.filter(q => {
    if (filterTopic !== 'all' && q.topic !== filterTopic) return false;
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
    
    if (filterStatus !== 'all') {
      const attempt = attempts[q.id];
      const isSolved = attempt?.status === 'solved' || attempt?.status === 'mastered';
      if (filterStatus === 'solved' && !isSolved) return false;
      if (filterStatus === 'unsolved' && isSolved) return false;
    }

    if (filterLanguage !== 'all' && q.type === 'sql' && filterLanguage !== 'sql') {
      return false;
    }
    
    return true;
  });

  const getDifficultyColor = (diff: string) => {
    switch(diff.toLowerCase()) {
      case 'easy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'hard': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getFrequencyIcon = (freq: string) => {
    if (freq === 'very-high') return <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />;
    if (freq === 'high') return <Flame className="h-3 w-3 text-orange-400" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters:</span>
        </div>
        
        <select 
          value={filterTopic} 
          onChange={(e) => setFilterTopic(e.target.value)}
          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 text-slate-700"
        >
          <option value="all">All Topics</option>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        
        <select 
          value={filterDifficulty} 
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 text-slate-700"
        >
          <option value="all">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 text-slate-700"
        >
          <option value="all">All Status</option>
          <option value="unsolved">Unsolved</option>
          <option value="solved">Solved</option>
        </select>

        <select 
          value={filterLanguage} 
          onChange={(e) => setFilterLanguage(e.target.value)}
          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 text-slate-700"
        >
          <option value="all">Languages: All</option>
          <option value="c">C (GCC)</option>
          <option value="java">Java (OpenJDK)</option>
          <option value="cpp">C++ (STL)</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>

        <div className="ml-auto text-xs font-bold text-slate-400">
          Showing {filteredQuestions.length} questions
        </div>
      </div>

      {/* Question List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredQuestions.map((q) => {
          const attempt = attempts[q.id];
          const isSolved = attempt?.status === 'solved' || attempt?.status === 'mastered';
          const isBookmarked = bookmarkedIds.includes(q.id);

          return (
            <div 
              key={q.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 group"
            >
              {/* Left: Status & Number */}
              <div className="flex items-center gap-4 sm:w-16 shrink-0">
                {isSolved ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-50 shrink-0" />
                ) : (
                  <Circle className="h-6 w-6 text-slate-200 shrink-0 group-hover:text-slate-300 transition-colors" />
                )}
                <span className="text-sm font-black text-slate-300 w-8 tabular-nums">#{q.number.toString().padStart(3, '0')}</span>
              </div>

              {/* Center: Details */}
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {q.title}
                  </h3>
                  {q.frequencyLevel.includes('high') && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-100 border border-orange-200 shrink-0">
                      {getFrequencyIcon(q.frequencyLevel)} {q.frequencyLevel.replace('-', ' ')}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 ${getDifficultyColor(q.difficulty)}`}>
                    {q.difficulty}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                    {q.topic} → {q.subtopic}
                  </span>
                  {q.companies.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {q.companies.slice(0, 2).join(', ')}
                      {q.companies.length > 2 && ' +'}
                    </span>
                  )}

                  {/* Languages Supported */}
                  <div className="flex items-center gap-1 pl-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                      C
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
                      Java
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                      C++
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Python
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 mt-2 sm:mt-0">
                <button 
                  onClick={() => toggleBookmark(q.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-blue-500" /> : <Bookmark className="h-5 w-5" />}
                </button>
                <Link
                  href={`/practice/solve/${q.id}`}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    isSolved 
                      ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSolved ? 'Solve Again' : 'Practice'}
                  {isSolved ? <ArrowRight className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white" />}
                </Link>
              </div>
            </div>
          );
        })}
        
        {filteredQuestions.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
            <p className="text-slate-500 font-bold mb-2">No problems found</p>
            <p className="text-slate-400 text-sm">Try adjusting your filters.</p>
            <button 
              onClick={() => { setFilterTopic('all'); setFilterDifficulty('all'); setFilterStatus('all'); }}
              className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
