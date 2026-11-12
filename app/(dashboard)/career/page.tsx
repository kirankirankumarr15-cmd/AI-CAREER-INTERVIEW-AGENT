'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { CareerAuditResult } from '@/types';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import Link from 'next/link';

const STANDARD_ROLES = [
  'Software Developer (SDE)',
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'AI/ML Engineer',
  'Cloud / DevOps Engineer',
  'Cybersecurity Analyst',
];

export default function CareerAuditPage() {
  const { profile, updateProfile } = useProfileStore();
  const [selectedRole, setSelectedRole] = useState<string>(profile.targetRole || 'Software Developer (SDE)');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [audit, setAudit] = useState<CareerAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [lastResearchedOn, setLastResearchedOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(async (roleToAudit: string, forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/career-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: roleToAudit,
          forceRefresh,
        }),
      });

      if (!res.ok) {
        throw new Error(`Audit service returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.audit) {
        setAudit(data.audit);
        setIsCached(Boolean(data.isCached));
        setLastResearchedOn(data.lastResearchedOn || data.audit.researchedAt);
      } else {
        throw new Error(data.error || 'No audit data received');
      }
    } catch (err) {
      console.error('[CareerAudit] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate career audit');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudit(selectedRole);
  }, [selectedRole, fetchAudit]);

  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    updateProfile({ targetRole: role });
  };

  const handleCustomRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRoleInput.trim()) {
      handleSelectRole(customRoleInput.trim());
      setCustomRoleInput('');
    }
  };

  // Format Radar Data from computed scores (0 decorative/hardcoded values)
  const radarData = audit
    ? [
        { subject: 'Skills Coverage', score: audit.radarScores.skillsCoverage, fullMark: 100 },
        { subject: 'Projects Readiness', score: audit.radarScores.projectsReadiness, fullMark: 100 },
        { subject: 'Academic Alignment', score: audit.radarScores.academicAlignment, fullMark: 100 },
        { subject: 'Practical Depth', score: audit.radarScores.practicalDepth, fullMark: 100 },
        { subject: 'Core Fundamentals', score: audit.radarScores.coreFundamentals, fullMark: 100 },
        { subject: 'Placement Readiness', score: audit.radarScores.placementPreparedness, fullMark: 100 },
      ]
    : [];

  const haveGaps = audit?.skillGaps.filter((g) => g.status === 'have') || [];
  const partialGaps = audit?.skillGaps.filter((g) => g.status === 'partial') || [];
  const missingGaps = audit?.skillGaps.filter((g) => g.status === 'missing') || [];

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              PRISM Module 3.1
            </span>
            <span className="text-xs font-semibold text-slate-500">Placement Readiness Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Career Audit & Industry Fit
          </h1>
          <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium mt-1">
            Deterministic sector alignment, verified skill gaps, cited salary benchmarks, and readiness radar.
          </p>
        </div>

        {lastResearchedOn && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] font-medium text-slate-500">
                {isCached ? 'Cached 14-day research' : 'Live synthesized research'}
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Researched: {new Date(lastResearchedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => fetchAudit(selectedRole, true)}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
              title="Force re-run audit"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Role Picker Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Target Track Selection
          </label>
          <span className="text-[11px] text-slate-500">College cohort: {profile.college || 'PESITM Shivamogga'}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {STANDARD_ROLES.map((role) => {
            const isSelected = selectedRole === role;
            return (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleCustomRoleSubmit} className="pt-2 flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Or enter custom role (e.g., Embedded Systems Engineer)..."
            value={customRoleInput}
            onChange={(e) => setCustomRoleInput(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-colors"
          >
            Audit Role
          </button>
        </form>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Synthesizing Verified Career Audit...</h3>
          <p className="text-xs text-slate-500 mt-1">Cross-referencing verified profile skills against industry recruitment benchmarks.</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-red-900 dark:text-red-200">Career Audit Error</h4>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Audit Content */}
      {audit && !isLoading && (
        <div className="space-y-8">
          {/* Top Metric Cards: Sector Alignment & Expected Salary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Sector Alignment */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sector Alignment</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {audit.sectorAlignment.alignmentPercentage}%
                </span>
                <span className="text-xs font-semibold text-emerald-600">Fit Index</span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {audit.sectorAlignment.sector}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2">
                {audit.sectorAlignment.demandOutlook}
              </p>
            </div>

            {/* Salary Benchmark (Strictly from cited, dated sources) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Salary Benchmark</span>
                <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <Award className="h-4 w-4" />
                </span>
              </div>
              {audit.expectedSalaryRange.hasReliableData ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      ₹{audit.expectedSalaryRange.minLpa} - {audit.expectedSalaryRange.maxLpa}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">LPA</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Median: ₹{audit.expectedSalaryRange.medianLpa} LPA ({audit.expectedSalaryRange.region})
                  </p>
                  <p className="text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1">
                    <Info className="h-3 w-3 inline shrink-0" />
                    Source: {audit.expectedSalaryRange.source} ({audit.expectedSalaryRange.sourceDate})
                  </p>
                </>
              ) : (
                <div className="py-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                    Not enough data
                  </span>
                  <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                    No verified, dated public benchmark available for this role title in Indian campus hiring databases.
                  </p>
                </div>
              )}
            </div>

            {/* Profile Competitiveness */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Readiness Score</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <BookOpen className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {audit.radarScores.placementPreparedness}/100
                </span>
                <span className="text-xs font-semibold text-indigo-600">Cohort Percentile</span>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Verified Skills: {haveGaps.length} • Missing: {missingGaps.length}
              </p>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
                <Link
                  href={`/roadmap?role=${encodeURIComponent(audit.targetRole)}`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Generate 90-Day Roadmap <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Radar Chart & Competitiveness Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Recharts Radar Chart */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">6-Pillar Competency Radar</h3>
                  <p className="text-[11px] text-slate-500">Deterministic values derived from student profile & project artifacts</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600">
                  Computed
                </span>
              </div>

              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: any) => [`${value}/100`, 'Score']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Radar
                      name="Candidate Profile"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.45}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Competitiveness Summary */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Competitiveness Summary
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Objective analysis computed from verified metrics</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {audit.competitivenessSummary}
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Preparation Bottleneck Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{haveGaps.length}</span>
                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 mt-0.5 uppercase tracking-wide">Verified</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    <span className="text-xl font-black text-amber-700 dark:text-amber-300">{partialGaps.length}</span>
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 mt-0.5 uppercase tracking-wide">Partial</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                    <span className="text-xl font-black text-red-700 dark:text-red-300">{missingGaps.length}</span>
                    <p className="text-[10px] font-bold text-red-800 dark:text-red-400 mt-0.5 uppercase tracking-wide">Missing</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/roadmap?role=${encodeURIComponent(audit.targetRole)}`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center transition-colors shadow-sm"
                >
                  Apply to 90-Day Roadmap
                </Link>
                <Link
                  href={`/interview?role=${encodeURIComponent(audit.targetRole)}`}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold text-center transition-colors"
                >
                  Mock Interview
                </Link>
              </div>
            </div>
          </div>

          {/* Skill Gaps Table: Required vs Verified */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Skill-Gap Analysis for {audit.targetRole}
              </h3>
              <p className="text-[11px] text-slate-500">
                Required industry competencies benchmarked against your verified profile items and project proof.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              {audit.skillGaps.map((item, idx) => {
                const isHave = item.status === 'have';
                const isPartial = item.status === 'partial';

                return (
                  <div
                    key={idx}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{item.skill}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                        {item.evidence}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isHave && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Have
                        </span>
                      )}
                      {isPartial && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="h-3.5 w-3.5" /> Partial
                        </span>
                      )}
                      {!isHave && !isPartial && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                          <XCircle className="h-3.5 w-3.5" /> Missing
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
