'use client';

import { useState } from 'react';
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
  Clock,
  Sparkles,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { SEED_ASSESSMENTS } from '@/lib/assessment/assessment-bank';

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
    title: 'OOP & Architecture',
    description: 'Inheritance, polymorphism, encapsulation, SOLID principles, and design patterns.',
    badge: 'Fundamental',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Layers,
    iconClass: 'bg-sky-50 text-sky-600 border-sky-100',
    done: 18,
    total: 30,
  },
  {
    id: 'os',
    title: 'Operating Systems',
    description: 'Processes, threads, CPU scheduling, deadlock handling, and virtual memory.',
    badge: 'System',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Cpu,
    iconClass: 'bg-amber-50 text-amber-600 border-amber-100',
    done: 22,
    total: 35,
  },
  {
    id: 'cn',
    title: 'Computer Networks',
    description: 'OSI/TCP-IP models, routing protocols, TCP handshake, DNS, and HTTP/HTTPS.',
    badge: 'Networking',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Network,
    iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    done: 15,
    total: 25,
  },
  {
    id: 'web',
    title: 'Web Technologies & Frontend',
    description: 'DOM manipulation, React lifecycle, rendering pipelines, CSS layout, and bundle size.',
    badge: 'Full-Stack',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Globe,
    iconClass: 'bg-rose-50 text-rose-600 border-rose-100',
    done: 34,
    total: 50,
  },
  {
    id: 'backend',
    title: 'Backend & System Design',
    description: 'REST APIs, caching with Redis, message queues, rate limiting, and sharding.',
    badge: 'Advanced',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Boxes,
    iconClass: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    done: 12,
    total: 20,
  },
  {
    id: 'aptitude',
    title: 'Aptitude & Reasoning',
    description: 'Quantitative aptitude, logical deductions, data sufficiency, and analytical reasoning.',
    badge: 'Screening',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: Brain,
    iconClass: 'bg-teal-50 text-teal-600 border-teal-100',
    done: 45,
    total: 60,
  },
];

export default function PracticePage() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'previewing' | 'committing' | 'done'>('idle');
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const sampleCSV = `Question,OptionA,OptionB,OptionC,OptionD,CorrectOption,Explanation,Topic,Difficulty,Marks
"What is the average of first 50 natural numbers?","25","25.5","26","24.5","B","Formula: (n + 1)/2 = 51/2 = 25.5","Averages","Easy","1.0"
"In DBMS, what does the 'A' in ACID stand for?","Availability","Atomicity","Authorization","Authenticity","B","Atomicity ensures all-or-nothing transaction execution.","DBMS","Easy","1.0"`;

  const handlePreviewCSV = async () => {
    if (!csvContent.trim()) {
      setImportError('Please paste or upload CSV content.');
      return;
    }
    setImportStatus('previewing');
    setImportError(null);
    try {
      const res = await fetch('/api/practice/assessments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: 'asmt-tcs-nqt-full',
          csvContent,
          mode: 'preview',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');
      setImportPreview(data);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error previewing CSV');
    } finally {
      setImportStatus('idle');
    }
  };

  const handleCommitCSV = async () => {
    setImportStatus('committing');
    setImportError(null);
    try {
      const res = await fetch('/api/practice/assessments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: 'asmt-tcs-nqt-full',
          csvContent,
          mode: 'commit',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportStatus('done');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error committing CSV');
      setImportStatus('idle');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Target className="h-3.5 w-3.5" /> Assessment & Practice Hub
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Timed Assessments & Topic Drills
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Standard collegiate placement mock tests with server-authoritative timer and tab-switch proctoring.
          </p>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start md:self-auto"
        >
          <Upload className="h-3.5 w-3.5 text-blue-600" />
          <span>Admin CSV Import</span>
        </button>
      </div>

      {/* Featured: Timed Placement Assessments (Phase 4.1) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              PRISM Placement Examination Engine
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Timed mock examinations with 4-state question palette, server-side scoring, and review mode.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SEED_ASSESSMENTS.map((asmt) => (
            <div
              key={asmt.id}
              className="card p-6 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    {asmt.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>{asmt.durationMinutes} Min</span>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {asmt.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                  {asmt.description}
                </p>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Questions</span>
                    <p className="text-xs font-black text-slate-800">{asmt.questionCount}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Marks</span>
                    <p className="text-xs font-black text-slate-800">{asmt.totalMarks}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Neg Mark</span>
                    <p className={`text-xs font-black ${asmt.negativeMarking ? 'text-rose-600' : 'text-slate-400'}`}>
                      {asmt.negativeMarking ? 'Yes (-0.5)' : 'No'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href={`/practice/exam/${asmt.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <span>Start Examination</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories & Drills */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Technical & Aptitude Practice Arena
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const percent = Math.round((category.done / category.total) * 100);

            return (
              <Link
                key={category.id}
                href={`/practice/${category.id}`}
                className="block text-left bg-white border rounded-2xl p-5 shadow-sm transition-all border-slate-200 hover:border-blue-200 hover:shadow-md hover:ring-2 hover:ring-blue-50"
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
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
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

      {/* Admin CSV Question Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="card max-w-2xl w-full p-6 rounded-2xl border border-slate-200 space-y-5 bg-white shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-extrabold text-xs uppercase tracking-wider">
                <FileSpreadsheet className="h-4 w-4" /> Admin CSV Question Import
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">
                Upload or paste CSV questions. Formula injection protection automatically escapes leading <code className="bg-slate-100 px-1 py-0.5 rounded">=</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">+</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">-</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded">@</code> characters.
              </p>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={sampleCSV}
                rows={7}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setCsvContent(sampleCSV)}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Insert Sample Question CSV Template
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {importError}
              </div>
            )}

            {importPreview && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Dry Run Preview:</span>
                  <span className="text-emerald-600">{importPreview.validCount} Valid Rows</span>
                </div>
                {importPreview.invalidCount > 0 && (
                  <p className="text-rose-600 font-medium">
                    {importPreview.invalidCount} invalid rows detected (check logs).
                  </p>
                )}
              </div>
            )}

            {importStatus === 'done' && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Successfully committed questions to assessment question bank!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              {importPreview ? (
                <button
                  onClick={handleCommitCSV}
                  disabled={importStatus === 'committing' || importStatus === 'done'}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{importStatus === 'committing' ? 'Inserting...' : 'Confirm & Insert Questions'}</span>
                </button>
              ) : (
                <button
                  onClick={handlePreviewCSV}
                  disabled={importStatus === 'previewing'}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  <span>{importStatus === 'previewing' ? 'Analyzing...' : 'Preview Validation →'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
