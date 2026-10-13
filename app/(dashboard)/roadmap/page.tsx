'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Route,
  Sparkles,
  Compass,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Globe,
  Loader2,
  X,
  Target,
  FileText,
  Dumbbell,
  Mic,
} from 'lucide-react';
import Link from 'next/link';
import {
  StudentRoadmap,
  RoadmapPhase,
  SkillGapItem,
  TaskStatus,
} from '@/lib/roadmap/types';
import { useProfileStore } from '@/store/useProfileStore';

const POPULAR_ROLES = [
  'Backend Developer',
  'Full Stack Developer',
  'Software Developer (SDE)',
  'Data Analyst',
  'AI / Machine Learning Engineer',
  'DevOps & Cloud Engineer',
  'Frontend Specialist',
  'Cybersecurity Analyst',
];

const TIMELINE_OPTIONS = [
  { weeks: 4, label: '4 Weeks (Bootcamp Pace)' },
  { weeks: 8, label: '8 Weeks (Accelerated)' },
  { weeks: 12, label: '12 Weeks (Semester Standard)' },
  { weeks: 16, label: '16 Weeks (Comprehensive)' },
];

function RoadmapContent() {
  const searchParams = useSearchParams();
  const { profile } = useProfileStore();

  const queryRole = searchParams.get('role');
  const defaultInitial = queryRole || profile.targetRole || 'Backend Developer';

  const [selectedRole, setSelectedRole] = useState(defaultInitial);
  const [customRole, setCustomRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [timelineWeeks, setTimelineWeeks] = useState(8);

  const [roadmap, setRoadmap] = useState<StudentRoadmap | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
  const [gapFilter, setGapFilter] = useState<'all' | 'missing' | 'have'>('all');
  const [showSourcesDrawer, setShowSourcesDrawer] = useState(false);

  const fetchActiveRoadmap = async () => {
    try {
      const res = await fetch('/api/roadmap');
      const data = await res.json();
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap);
        setSelectedRole(data.roadmap.role);
        if (data.roadmap.targetCompany) setTargetCompany(data.roadmap.targetCompany);
        if (data.roadmap.timelineWeeks) setTimelineWeeks(data.roadmap.timelineWeeks);
        // Expand all phases by default so the student can immediately see all tasks
        const initExpand: Record<string, boolean> = {};
        data.roadmap.phases?.forEach((p: RoadmapPhase) => {
          initExpand[p.id] = true;
        });
        setExpandedPhases(initExpand);
      }
    } catch (err: unknown) {
      console.warn('Could not load existing roadmap:', err);
    }
  };

  // Fetch active roadmap on mount
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch('/api/roadmap');
        const data = await res.json();
        if (!ignore && data.success && data.roadmap) {
          setRoadmap(data.roadmap);
          setSelectedRole(data.roadmap.role);
          if (data.roadmap.targetCompany) setTargetCompany(data.roadmap.targetCompany);
          if (data.roadmap.timelineWeeks) setTimelineWeeks(data.roadmap.timelineWeeks);
          const initExpand: Record<string, boolean> = {};
          data.roadmap.phases?.forEach((p: RoadmapPhase) => {
            initExpand[p.id] = true;
          });
          setExpandedPhases(initExpand);
        }
      } catch (err: unknown) {
        console.warn('Could not load existing roadmap on mount:', err);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Update selected role if URL query changes
  useEffect(() => {
    const r = searchParams.get('role');
    if (r) {
      setTimeout(() => {
        setSelectedRole(r);
        setCustomRole('');
      }, 0);
    }
  }, [searchParams]);

  const handleGenerateRoadmap = async (refreshResearch = false) => {
    const roleToUse = customRole.trim() || selectedRole;
    if (!roleToUse) {
      setErrorMsg('Please select or specify a target career role.');
      return;
    }

    setGenerating(true);
    setErrorMsg('');
    setGeneratingStep(1);

    // Progress simulation steps
    const t1 = setTimeout(() => setGeneratingStep(2), 1400);
    const t2 = setTimeout(() => setGeneratingStep(3), 3200);

    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: roleToUse,
          targetCompany: targetCompany.trim() || null,
          timelineWeeks,
          refreshResearch,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate roadmap.');
      }

      setRoadmap(data.roadmap);
      const initExpand: Record<string, boolean> = {};
      data.roadmap.phases?.forEach((p: RoadmapPhase) => {
        initExpand[p.id] = true;
      });
      setExpandedPhases(initExpand);

      // Auto-scroll down to the generated roadmap curriculum
      setTimeout(() => {
        document.getElementById('roadmap-milestones')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate roadmap. Please retry.';
      setErrorMsg(msg);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setGenerating(false);
      setGeneratingStep(0);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: TaskStatus) => {
    if (!roadmap) return;
    const newStatus: TaskStatus = currentStatus === 'done' ? 'todo' : 'done';

    // Optimistic UI update
    setRoadmap((prev) => {
      if (!prev) return prev;
      let total = 0;
      let completed = 0;

      const updatedPhases = prev.phases.map((phase) => {
        const updatedTasks = phase.tasks.map((task) => {
          if (task.id === taskId) {
            const updated = {
              ...task,
              status: newStatus,
              completedAt: newStatus === 'done' ? new Date().toISOString() : null,
            };
            if (updated.status === 'done') completed++;
            total++;
            return updated;
          }
          if (task.status === 'done') completed++;
          total++;
          return task;
        });
        return { ...phase, tasks: updatedTasks };
      });

      const newPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...prev, phases: updatedPhases, progressPercent: newPercent };
    });

    try {
      const res = await fetch('/api/roadmap/task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          status: newStatus,
          roadmapId: roadmap.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update task.');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      // Refresh on failure
      fetchActiveRoadmap();
    }
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  // Stats calculation
  const totalTasks = roadmap?.phases.reduce((acc, p) => acc + p.tasks.length, 0) || 0;
  const completedTasks =
    roadmap?.phases.reduce((acc, p) => acc + p.tasks.filter((t) => t.status === 'done').length, 0) || 0;
  const remainingHours =
    roadmap?.phases.reduce((acc, p) => {
      return acc + p.tasks.filter((t) => t.status !== 'done').reduce((h, t) => h + (t.estHours || 3), 0);
    }, 0) || 0;

  const filteredSkillGaps = (roadmap?.skillGap?.items || []).filter((s: SkillGapItem) => {
    if (gapFilter === 'all') return true;
    if (gapFilter === 'missing') return s.status === 'missing' || s.status === 'partial';
    if (gapFilter === 'have') return s.status === 'have';
    return true;
  });

  return (
    <div className="space-y-8 pb-20 animate-fade-in-up font-sans">
      {/* ─── Hero Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <Route className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              Role-Based Roadmap Agent • Live 2026 Grounding
            </span>
            {roadmap?.basedOnCacheId && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold hidden sm:inline">
                • 14-day verified industry cache
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Personalized Career Roadmap
          </h1>
          <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium max-w-2xl mt-1.5 leading-relaxed">
            Grounded in live industry hiring requirements, dynamically calibrated against your verified skills, and phased into trackable milestones.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {roadmap?.sources && roadmap.sources.length > 0 && (
            <button
              onClick={() => setShowSourcesDrawer(true)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Globe className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              Cited Sources ({roadmap.sources.length})
            </button>
          )}

          <button
            onClick={() => handleGenerateRoadmap(true)}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[13px] font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Force refresh live web research from search engine"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-500 dark:text-emerald-400 ${generating ? 'animate-spin' : ''}`} />
            Refresh Research
          </button>
        </div>
      </div>

      {/* ─── Role & Config Selector Card ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-xl">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              1. Select Target Career Role
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Adapts dynamically to your verified skills & timeline
            </span>
          </div>

          {/* Preset Roles Pills */}
          <div className="flex flex-wrap gap-2.5">
            {POPULAR_ROLES.map((role) => {
              const isSelected = selectedRole === role && !customRole.trim();
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role);
                    setCustomRole('');
                  }}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20 scale-[1.02]'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>

          {/* Custom Role, Company & Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 pl-1 mb-1.5 block">
                Custom Role Name (Optional)
              </label>
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Or type custom role..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 pl-1 mb-1.5 block">
                Target Company (Optional)
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Amazon, Google, Razorpay..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 pl-1 mb-1.5 block">
                Timeline Pacing
              </label>
              <select
                value={timelineWeeks}
                onChange={(e) => setTimelineWeeks(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-semibold cursor-pointer"
              >
                {TIMELINE_OPTIONS.map((opt) => (
                  <option key={opt.weeks} value={opt.weeks} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-5">
            <p className="text-[12px] text-slate-500 font-medium">
              Generating performs live web research and skill-gap evaluation against your profile.
            </p>
            <button
              onClick={() => handleGenerateRoadmap(false)}
              disabled={generating}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-bold shadow-lg shadow-emerald-600/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-emerald-100" />
                  Generate Personalized Roadmap
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Animated Generating Stepper Banner ─── */}
      {generating && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-3xl p-6 shadow-xl backdrop-blur-md animate-pulse">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Loader2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
            </div>
            <div className="space-y-1.5 flex-1 text-center sm:text-left">
              <div className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                <span>Synthesizing Live Career Roadmap</span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                  ({generatingStep}/3)
                </span>
              </div>
              <p className="text-[12px] text-emerald-800 dark:text-emerald-200 font-medium">
                {generatingStep === 1 && 'Querying live 2026 industry job requirements & authoritative specifications...'}
                {generatingStep === 2 && 'Comparing requirements against your verified profile projects & skills...'}
                {generatingStep === 3 && 'Architecting calibrated 6-phase milestone curriculum with verified source links...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-600 dark:text-red-400 text-[13px] font-bold flex items-center gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── Roadmap Active View ─── */}
      {roadmap && (
        <div id="roadmap-milestones" className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Progress with Radial Ring */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-lg flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-700 ease-out"
                    strokeDasharray={`${roadmap.progressPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-black text-sm text-slate-900 dark:text-white">
                  {roadmap.progressPercent}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                  Curriculum Progress
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {completedTasks} / {totalTasks} <span className="text-xs text-slate-500 font-semibold">Tasks Done</span>
                </div>
              </div>
            </div>

            {/* Role Alignment Match Score */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-lg flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-7 w-7 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                  Verified Skill Match
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {roadmap.skillGap?.matchScore ?? 65}%
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
                    ({roadmap.skillGap?.haveCount ?? 0} verified)
                  </span>
                </div>
              </div>
            </div>

            {/* Remaining Estimated Hours */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-lg flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                  Estimated Study Effort
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  ~{Math.round(remainingHours)} hrs
                  <span className="text-xs text-slate-500 font-semibold block">
                    over {roadmap.timelineWeeks} weeks
                  </span>
                </div>
              </div>
            </div>

            {/* Target Role & Focus Badge */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-lg flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Briefcase className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">
                  Active Blueprint
                </span>
                <div className="text-base font-black text-slate-900 dark:text-white truncate" title={roadmap.role}>
                  {roadmap.role}
                </div>
                {roadmap.targetCompany && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                    @ {roadmap.targetCompany}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ─── Skill-Gap Summary Section ─── */}
          {roadmap.skillGap && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Verified Skill Gap Analysis
                  </h3>
                  <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium">
                    Strict comparison against your verified profile projects & certifications. Missing skills are prioritized into Phase 1 & 2.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setGapFilter('all')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      gapFilter === 'all'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All ({roadmap.skillGap.totalRequired})
                  </button>
                  <button
                    onClick={() => setGapFilter('missing')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      gapFilter === 'missing'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Gaps ({roadmap.skillGap.missingCount + roadmap.skillGap.partialCount})
                  </button>
                  <button
                    onClick={() => setGapFilter('have')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                      gapFilter === 'have'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Verified ({roadmap.skillGap.haveCount})
                  </button>
                </div>
              </div>

              {/* Skills Badge Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {filteredSkillGaps.map((item, idx) => {
                  const isHave = item.status === 'have';
                  const isPartial = item.status === 'partial';
                  return (
                    <div
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl border text-[12px] font-bold flex items-center gap-2 transition-all group ${
                        isHave
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                          : isPartial
                          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                      }`}
                      title={item.evidence || 'Identified industry requirement gap'}
                    >
                      {isHave && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      {isPartial && <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                      {!isHave && !isPartial && (
                        <Circle className="h-2.5 w-2.5 fill-rose-500 text-rose-500 shrink-0" />
                      )}

                      <span>{item.skill}</span>

                      {item.evidence && (
                        <span className="text-[10px] opacity-75 font-normal ml-1 hidden group-hover:inline">
                          ({item.evidence})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── 6-Phase Vertical Milestone Timeline ─── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Compass className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                6-Phase Milestone Curriculum
              </h2>
              <span className="text-[12px] text-slate-500 font-semibold">
                Click a task checkbox to mark completed
              </span>
            </div>

            <div className="space-y-4">
              {roadmap.phases.map((phase) => {
                const isExpanded = expandedPhases[phase.id] ?? true;
                const completedInPhase = phase.tasks.filter((t) => t.status === 'done').length;
                const phaseDone = completedInPhase === phase.tasks.length && phase.tasks.length > 0;

                return (
                  <div
                    key={phase.id}
                    className={`bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-sm dark:shadow-lg transition-all ${
                      phaseDone
                        ? 'border-emerald-500/50'
                        : 'border-slate-200/90 dark:border-slate-800'
                    }`}
                  >
                    {/* Phase Header Accordion */}
                    <button
                      type="button"
                      onClick={() => togglePhase(phase.id)}
                      className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            phaseDone
                              ? 'bg-emerald-500 text-white font-black'
                              : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {phaseDone ? <Check className="h-5 w-5 stroke-[3]" /> : phase.orderIndex}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                              {phase.title}
                            </h3>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                              {completedInPhase}/{phase.tasks.length} Done
                            </span>
                          </div>
                          <p className="text-[12px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                            {phase.summary}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </button>

                    {/* Phase Tasks Body */}
                    {isExpanded && (
                      <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {phase.tasks.map((task) => {
                          const isDone = task.status === 'done';
                          const isInternal = task.resourceUrl?.startsWith('/');

                          return (
                            <div
                              key={task.id}
                              className={`py-4 flex flex-col sm:flex-row items-start justify-between gap-4 transition-all ${
                                isDone ? 'opacity-60' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3.5 flex-1">
                                {/* Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleTaskStatus(task.id, task.status)}
                                  className="mt-1 shrink-0 cursor-pointer focus:outline-none"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-500/20" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 hover:text-emerald-500 transition-colors" />
                                  )}
                                </button>

                                {/* Task Details */}
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4
                                      className={`text-[14px] font-extrabold ${
                                        isDone
                                          ? 'line-through text-slate-400 dark:text-slate-500'
                                          : 'text-slate-900 dark:text-white'
                                      }`}
                                    >
                                      {task.title}
                                    </h4>

                                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                      Week {task.dueWeek}
                                    </span>

                                    <span
                                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                                        task.priority === 'high'
                                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                                          : task.priority === 'medium'
                                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      {task.priority}
                                    </span>

                                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      ~{task.estHours}h
                                    </span>
                                  </div>

                                  <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                                    {task.description}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-mono">
                                      {task.linkedSkill}
                                    </span>

                                    {task.sourceType === 'from sources' ? (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold">
                                        Source Verified
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
                                        AI-Suggested
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Task Resource Link Action */}
                              {task.resourceUrl && (
                                <div className="self-end sm:self-center shrink-0">
                                  {isInternal ? (
                                    <Link
                                      href={task.resourceUrl}
                                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                      {task.resourceUrl.includes('practice') && <Dumbbell className="h-3.5 w-3.5" />}
                                      {task.resourceUrl.includes('interview') && <Mic className="h-3.5 w-3.5" />}
                                      {task.resourceUrl.includes('resume') && <FileText className="h-3.5 w-3.5" />}
                                      Practice Now
                                      <ArrowRight className="h-3 w-3" />
                                    </Link>
                                  ) : (
                                    <a
                                      href={task.resourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                      Official Resource
                                      <ExternalLink className="h-3 w-3 text-slate-400" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Cited Sources Drawer Modal ─── */}
      {showSourcesDrawer && roadmap?.sources && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-slide-in-right"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Verified Industry Sources
                  </h3>
                  <p className="text-[12px] text-slate-500 font-medium">
                    Fetched and cached for {roadmap.role} (14-day validity)
                  </p>
                </div>
                <button
                  onClick={() => setShowSourcesDrawer(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                {roadmap.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                        {src.title || src.url}
                      </h4>
                      <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate mt-1">
                      {src.url}
                    </p>
                    <div className="text-[10px] text-slate-500 font-medium mt-2 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Cached: {new Date(src.fetchedAt).toLocaleDateString()}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowSourcesDrawer(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading career roadmap...</p>
        </div>
      }
    >
      <RoadmapContent />
    </Suspense>
  );
}
