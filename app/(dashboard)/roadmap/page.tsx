'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Route,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowRight,
  ShieldCheck,
  Dumbbell,
  BookOpen,
  Calendar,
  AlertTriangle,
  Flame,
  Award,
} from 'lucide-react';
import { DynamicRoadmapPlan, RoadmapTaskItem, RoadmapWeekItem } from '@/types';
import { useProgressStore } from '@/store/useProgressStore';
import { useProfileStore } from '@/store/useProfileStore';

export default function DynamicRoadmapPage() {
  const { profile } = useProfileStore();
  const { toggleMissionTask } = useProgressStore();

  const [plan, setPlan] = useState<DynamicRoadmapPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ 1: true, 2: true });
  const [isReplanning, setIsReplanning] = useState(false);
  const [replanToast, setReplanToast] = useState<string | null>(null);

  // Fetch dynamic roadmap
  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roadmap');
      if (res.ok) {
        const data = await res.json();
        if (data.dynamicPlan) {
          setPlan(data.dynamicPlan);
        }
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  // Toggle Task Completion
  const handleToggleTask = async (task: RoadmapTaskItem) => {
    if (!plan) return;

    // Optimistic UI update
    const updatedWeeks = plan.weeks.map((w) => {
      if (w.id === task.weekId) {
        const updatedTasks = w.tasks.map((t) =>
          t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t
        );
        const comp = updatedTasks.filter((t) => t.isCompleted).length;
        const status: 'pending' | 'in_progress' | 'completed' =
          comp === updatedTasks.length ? 'completed' : comp > 0 ? 'in_progress' : 'pending';
        return { ...w, tasks: updatedTasks, status };
      }
      return w;
    });

    setPlan({ ...plan, weeks: updatedWeeks });

    // Sync to backend
    try {
      await fetch('/api/roadmap/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      });
      // Also update Today's Mission in local store
      toggleMissionTask(task.id);
    } catch {
      // Revert if error
    }
  };

  // Toggle Week Accordion
  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  // Run Weekly Re-Plan
  const handleReplan = async () => {
    setIsReplanning(true);
    setReplanToast(null);
    try {
      const res = await fetch('/api/roadmap/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedReadiness: plan?.currentReadiness || 72,
          weakTopics: ['Time & Work', 'DBMS Indexing', 'Graph Traversal'],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
        setReplanToast(data.replanSummary || 'Weekly plan adapted to latest readiness gaps.');
      }
    } catch {
      // Handled
    } finally {
      setIsReplanning(false);
    }
  };

  if (loading || !plan) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-pulse">
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Filter Today's Tasks from current week
  const currentWeekObj = plan.weeks.find((w) => w.weekNumber === plan.currentWeek) || plan.weeks[0];
  const todayTasks = currentWeekObj.tasks.slice(0, 3);
  const totalCompleted = plan.weeks.reduce(
    (acc, w) => acc + w.tasks.filter((t) => t.isCompleted).length,
    0
  );
  const totalTasksCount = plan.weeks.reduce((acc, w) => acc + w.tasks.length, 0);
  const overallRoadmapProgress = Math.round((totalCompleted / Math.max(1, totalTasksCount)) * 100);

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Route className="h-3.5 w-3.5" /> PRISM 12-Week Dynamic Roadmap
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Personalized Placement Roadmap
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Target Role: <strong className="text-slate-900">{plan.targetRole}</strong> • Current Week: <strong>Week {plan.currentWeek} of 12</strong> • Readiness Baseline: <strong>{plan.currentReadiness}%</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReplan}
            disabled={isReplanning}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isReplanning ? 'animate-spin' : ''}`} />
            <span>{isReplanning ? 'Re-planning...' : 'Re-plan with Latest Scores'}</span>
          </button>
        </div>
      </div>

      {/* Replan Toast Notice */}
      {replanToast && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs font-bold text-blue-900 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>{replanToast}</span>
          </div>
          <button onClick={() => setReplanToast(null)} className="text-blue-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner: Today's Mission Synchronization */}
      <div className="card p-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50/50 via-white to-slate-50 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Today’s Assigned Missions</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Week {plan.currentWeek} Daily Workouts — Syncs automatically with Dashboard
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-blue-600">
              {todayTasks.filter((t) => t.isCompleted).length} / {todayTasks.length} Completed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {todayTasks.map((t) => (
            <div
              key={t.id}
              onClick={() => handleToggleTask(t)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                t.isCompleted
                  ? 'bg-blue-50/70 border-blue-300 text-slate-500 line-through'
                  : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm'
              }`}
            >
              <button className="mt-0.5 shrink-0">
                {t.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300 hover:text-blue-500" />
                )}
              </button>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                  {t.category}
                </span>
                <p className="text-xs font-bold text-slate-900 leading-snug">{t.title}</p>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {t.estimatedMinutes} min
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 12-Week Roadmap Accordion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            12-Week Structured Milestones
          </h2>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Overall Roadmap:</span>
            <span className="text-blue-600 font-black">{overallRoadmapProgress}% Completed</span>
          </div>
        </div>

        <div className="space-y-3">
          {plan.weeks.map((week) => {
            const isExpanded = Boolean(expandedWeeks[week.weekNumber]);
            const completedCount = week.tasks.filter((t) => t.isCompleted).length;
            const weekPct = Math.round((completedCount / Math.max(1, week.tasks.length)) * 100);

            return (
              <div
                key={week.id}
                className={`card rounded-2xl border transition-all ${
                  week.status === 'in_progress'
                    ? 'border-blue-300 bg-white ring-1 ring-blue-100'
                    : week.status === 'completed'
                    ? 'border-emerald-200 bg-white'
                    : 'border-slate-200 bg-white opacity-90'
                }`}
              >
                {/* Week Header Banner */}
                <div
                  onClick={() => toggleWeek(week.weekNumber)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black border ${
                        week.status === 'completed'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : week.status === 'in_progress'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      W{week.weekNumber}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900">{week.milestoneName}</h3>
                        {week.status === 'in_progress' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">
                            Active Week
                          </span>
                        )}
                        {week.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{week.objective}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-black text-slate-700">{completedCount}/{week.tasks.length} Tasks</span>
                      <div className="w-24 h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${weekPct}%` }}
                        />
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Week Tasks List */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-2.5">
                    {week.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          task.isCompleted
                            ? 'bg-slate-50/80 border-slate-200 text-slate-500'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="shrink-0 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            {task.isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-300" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                  task.priority === 'high'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {task.priority}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {task.category}
                              </span>
                            </div>
                            <p
                              className={`text-xs font-bold mt-1 ${
                                task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {task.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                            {task.estimatedMinutes} min
                          </span>
                          {task.resources && task.resources.length > 0 && task.resources[0].url && (
                            <Link
                              href={task.resources[0].url}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold transition-colors"
                            >
                              Launch Activity →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
