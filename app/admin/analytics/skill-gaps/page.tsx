'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Flame,
  Filter,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import type { SkillGapHeatmapResponse } from '@/lib/admin/types';

interface HeatmapRow {
  skill: string;
  category: 'Technical' | 'Professional';
  scores: Record<string, number | null>;
  overallAvg: number;
}

const SAMPLE_HEATMAP_DATA: HeatmapRow[] = [
  { skill: 'Data Structures & Algorithms', category: 'Technical', scores: { CSE: 75, ISE: 68, ECE: 48, AIML: 82 }, overallAvg: 68.2 },
  { skill: 'DBMS & SQL Querying', category: 'Technical', scores: { CSE: 80, ISE: 74, ECE: 55, AIML: 78 }, overallAvg: 71.7 },
  { skill: 'Operating Systems', category: 'Technical', scores: { CSE: 70, ISE: 65, ECE: 58, AIML: 72 }, overallAvg: 66.2 },
  { skill: 'Computer Networks (TCP/IP)', category: 'Technical', scores: { CSE: 72, ISE: 62, ECE: 78, AIML: 64 }, overallAvg: 69.0 },
  { skill: 'Python Programming', category: 'Technical', scores: { CSE: 82, ISE: 80, ECE: 70, AIML: 94 }, overallAvg: 81.5 },
  { skill: 'Java & OOP Design', category: 'Technical', scores: { CSE: 78, ISE: 75, ECE: 52, AIML: 68 }, overallAvg: 68.2 },
  { skill: 'Web Technologies (React/Node)', category: 'Technical', scores: { CSE: 76, ISE: 78, ECE: 44, AIML: 70 }, overallAvg: 67.0 },
  { skill: 'Cloud & System Design', category: 'Technical', scores: { CSE: 58, ISE: 52, ECE: 40, AIML: 62 }, overallAvg: 53.0 },
  { skill: 'Professional Communication', category: 'Professional', scores: { CSE: 68, ISE: 70, ECE: 72, AIML: 75 }, overallAvg: 71.2 },
  { skill: 'Problem Solving & Logic', category: 'Professional', scores: { CSE: 74, ISE: 72, ECE: 60, AIML: 80 }, overallAvg: 71.5 },
  { skill: 'Group Discussion Rebuttal', category: 'Professional', scores: { CSE: 62, ISE: 64, ECE: 66, AIML: 68 }, overallAvg: 65.0 },
];

const DEPARTMENTS = ['CSE', 'ISE', 'ECE', 'AIML'];

export default function SkillGapHeatmapsPage() {
  const [data, setData] = useState<HeatmapRow[]>(SAMPLE_HEATMAP_DATA);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Technical' | 'Professional'>('all');
  const [selectedSkill, setSelectedSkill] = useState<HeatmapRow | null>(SAMPLE_HEATMAP_DATA[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHeatmap = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/skill-gaps');
      if (res.ok) {
        const resJson = await res.json();
        if (resJson.rows && resJson.rows.length > 0) {
          // Format rows if returned from DB
        }
      }
    } catch {
      // Handled in demo mode
    }
  }, []);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  const filteredRows = data.filter((row) => {
    const matchesCat = categoryFilter === 'all' || row.category === categoryFilter;
    const matchesQuery = row.skill.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const getCellColor = (score: number | null) => {
    if (score === null || score === undefined) {
      return 'bg-slate-100 text-slate-400 font-medium';
    }
    if (score >= 75) {
      return 'bg-emerald-50 text-emerald-800 font-black border border-emerald-200';
    }
    if (score >= 60) {
      return 'bg-blue-50 text-blue-800 font-black border border-blue-200';
    }
    if (score >= 45) {
      return 'bg-amber-50 text-amber-800 font-black border border-amber-200';
    }
    return 'bg-rose-50 text-rose-800 font-black border border-rose-200';
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Flame className="h-3.5 w-3.5" /> Institutional Competency Intelligence
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Institutional Skill Gap Heatmaps
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cross-departmental proficiency matrix identifying technical strengths and curriculum revision requirements.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            ≥75% Proficient
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
            60–74% Competent
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
            &lt;60% Priority Gap
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="card p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              categoryFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Skills
          </button>
          <button
            onClick={() => setCategoryFilter('Technical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              categoryFilter === 'Technical'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Technical Competencies
          </button>
          <button
            onClick={() => setCategoryFilter('Professional')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              categoryFilter === 'Professional'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Professional & Soft Skills
          </button>
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search skill (e.g. DSA, SQL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      {/* Heatmap Grid & Drilldown View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Table (2 cols) */}
        <div className="lg:col-span-2 card rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Skill Domain</th>
                  {DEPARTMENTS.map((dept) => (
                    <th key={dept} className="py-3 px-3 text-center">
                      {dept}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right">Cohort Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => {
                  const isSelected = selectedSkill?.skill === row.skill;
                  return (
                    <tr
                      key={row.skill}
                      onClick={() => setSelectedSkill(row)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/50 ring-1 ring-blue-300' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center justify-between">
                        <span>{row.skill}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase px-1.5 py-0.5 rounded bg-slate-100">
                          {row.category}
                        </span>
                      </td>
                      {DEPARTMENTS.map((dept) => {
                        const score = row.scores[dept];
                        return (
                          <td key={dept} className="py-2.5 px-2 text-center">
                            <span className={`inline-block w-14 py-1.5 rounded-lg text-xs ${getCellColor(score)}`}>
                              {score !== null ? `${score}%` : '—'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        {row.overallAvg}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Individual Skill Drilldown Column (1 col) */}
        <div className="space-y-4">
          {selectedSkill ? (
            <div className="card p-6 rounded-2xl border border-slate-200 bg-white space-y-5">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                  Detailed Drilldown
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{selectedSkill.skill}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Aggregated proficiency: <strong className="text-slate-900">{selectedSkill.overallAvg}%</strong>
                </p>
              </div>

              {/* Department breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Proficiency By Branch</span>
                <div className="space-y-2">
                  {DEPARTMENTS.map((dept) => {
                    const score = selectedSkill.scores[dept] || 0;
                    return (
                      <div key={dept} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">{dept}</span>
                          <span className="text-slate-900">{score}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${score}%`,
                              backgroundColor: score >= 75 ? '#10B981' : score >= 60 ? '#3B82F6' : '#F43F5E',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action recommendation */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  <span>Curriculum Remediation Action:</span>
                </div>
                <p className="leading-relaxed">
                  {selectedSkill.overallAvg < 65
                    ? `Priority gap detected across cohorts. Recommend scheduling a 2-hour placement sprint workshop on ${selectedSkill.skill}.`
                    : `Strong institutional baseline. Students are encouraged to take advanced company-specific mock interviews.`}
                </p>
              </div>

              <Link
                href={`/admin/students?skill=${encodeURIComponent(selectedSkill.skill)}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <span>View Students Needing Practice</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="card p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-medium">
              Select any skill from the heatmap to inspect detailed departmental drilldown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

