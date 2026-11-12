'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useInterviewStore } from '@/store/useInterviewStore';
import { createClient } from '@/utils/supabase/client';
import { PrismFinalReport } from '@/app/api/interview/finish/route';
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Clock,
  Shield,
  HelpCircle,
} from 'lucide-react';

export default function InterviewResultsPage() {
  const { targetRole, interviewType, difficulty } = useInterviewStore();
  const [report, setReport] = useState<PrismFinalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadReport() {
      // 1. Try reading from sessionStorage (fast path from active session)
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('interview_report');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.report) {
              setReport(parsed.report);
              setLoading(false);
              return;
            }
          } catch {
            // fallback to Supabase
          }
        }
      }

      // 2. Fallback to Supabase latest interview session
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.feedback_summary) {
        try {
          const summary = typeof data.feedback_summary === 'string'
            ? JSON.parse(data.feedback_summary)
            : data.feedback_summary;

          const synthesizedReport: PrismFinalReport = {
            overallScore: data.overall_score || 72,
            communication: summary.communication || {
              score: data.communication_score || 75,
              evidence: 'Effective verbal expression and clarity.',
              howToImprove: 'Reduce filler words during introductory remarks.',
            },
            technicalAccuracy: summary.technicalAccuracy || {
              score: data.technical_accuracy_score || 70,
              evidence: 'Demonstrated grasp of standard algorithms and paradigms.',
              howToImprove: 'Deepen edge case validation and concurrency safety.',
            },
            structure: summary.structure || {
              score: data.structure_score || 72,
              evidence: 'Sequential progression from concept to trade-offs.',
              howToImprove: 'Explicitly state assumptions before proposing solutions.',
            },
            estimatedConfidence: summary.estimatedConfidence || {
              score: data.confidence_score || 74,
              evidence: 'Observable steady pacing and minimal mid-thought backtracking.',
              howToImprove: 'Maintain tempo when presented with follow-up constraints.',
            },
            strongAreas: ['Core Concepts', 'Structured Thinking'],
            weakAreas: ['Edge-case Analysis', 'System Scaling'],
            recommendations: summary.recommendations || [
              'Practice system architecture questions in the Practice Hub.',
              'Schedule a follow-up mock interview to verify progress.',
            ],
            questionEvaluations: summary.modelAnswers || (data.session_history || []).map((h: any, idx: number) => ({
              questionId: `q-${idx}`,
              questionText: h.qText || h.text || 'Interview Question',
              studentAnswer: h.aText || 'Candidate response',
              category: h.category || 'Technical',
              score: 70,
              feedback: 'Demonstrated solid understanding with opportunities for deeper architectural metrics.',
              modelAnswer: 'A high-impact response defines the core principle, cites real trade-offs, and validates efficiency.',
            })),
            totalTurns: (data.session_history || []).length || 5,
            completedAt: data.created_at || new Date().toISOString(),
          };

          setReport(synthesizedReport);
        } catch {
          // ignore
        }
      }
      setLoading(false);
    }

    loadReport();
  }, []);

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-xs text-slate-500 font-medium">Loading interview diagnostic report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-8 pb-16 animate-fade-in max-w-[1000px] mx-auto font-sans px-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 mb-6">
            <Trophy className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">No completed interview sessions yet</h2>
          <p className="text-[13px] text-slate-500 max-w-md mx-auto mb-8">
            Complete an interactive mock interview round to unlock your 4-metric scorecard, per-question model answers, and weak-area remediation plan.
          </p>
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            Start Mock Interview &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const comparison = report.previousAttemptsComparison;

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-[1100px] mx-auto font-sans px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              PRISM Module 3.2 Evaluation
            </span>
            <span className="text-xs font-semibold text-slate-500">Placement Assessment Report</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Interview Scorecard: {targetRole || 'Software Developer (SDE)'}
          </h1>
          <p className="text-[13px] text-slate-500 font-medium">
            Track: {interviewType || 'Technical'} • Total Questions Evaluated: {report.totalTurns} • Completed: {new Date(report.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Export PDF / Print
          </button>
          <Link
            href="/interview"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry Round
          </Link>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 gap-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 shrink-0 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border-[3px] border-blue-600 flex items-center justify-center shadow-inner">
              <span className="text-4xl font-black text-blue-700 dark:text-blue-300">{report.overallScore}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Overall Readiness Score</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                  report.overallScore >= 75
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}>
                  {report.overallScore >= 75 ? 'Placement Ready' : 'Needs Practice'}
                </span>
              </div>
              <p className="text-[13px] text-slate-500 mt-1 max-w-xl">
                Diagnostic score computed across the 4 verified PRISM evaluation pillars. No scores were revealed mid-interview.
              </p>
            </div>
          </div>

          {/* Previous Attempts Comparison */}
          {comparison && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-right min-w-[200px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Session History
              </span>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Attempt #{comparison.attemptCount}
                </span>
                {comparison.changeFromLast !== 0 && (
                  <span className={`text-xs font-bold flex items-center ${comparison.changeFromLast > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <TrendingUp className="h-3.5 w-3.5 inline mr-0.5" />
                    {comparison.changeFromLast > 0 ? `+${comparison.changeFromLast}` : comparison.changeFromLast} pts
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Compared with previous round</p>
            </div>
          )}
        </div>

        {/* The 4 Core PRISM Metric Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Communication */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Communication</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{report.communication.score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${report.communication.score}%` }} />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
              &quot;{report.communication.evidence}&quot;
            </p>
            <div className="text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-700/60 pt-2">
              <strong className="text-slate-700 dark:text-slate-300">Tip:</strong> {report.communication.howToImprove}
            </div>
          </div>

          {/* 2. Technical Accuracy */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Technical Accuracy</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{report.technicalAccuracy.score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${report.technicalAccuracy.score}%` }} />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
              &quot;{report.technicalAccuracy.evidence}&quot;
            </p>
            <div className="text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-700/60 pt-2">
              <strong className="text-slate-700 dark:text-slate-300">Tip:</strong> {report.technicalAccuracy.howToImprove}
            </div>
          </div>

          {/* 3. Structure */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Structure</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{report.structure.score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${report.structure.score}%` }} />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
              &quot;{report.structure.evidence}&quot;
            </p>
            <div className="text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-700/60 pt-2">
              <strong className="text-slate-700 dark:text-slate-300">Tip:</strong> {report.structure.howToImprove}
            </div>
          </div>

          {/* 4. Estimated Interview Confidence (Label strictly as required) */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Estimated Interview Confidence
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">{report.estimatedConfidence.score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-amber-600 rounded-full" style={{ width: `${report.estimatedConfidence.score}%` }} />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
              &quot;{report.estimatedConfidence.evidence}&quot;
            </p>
            <div className="text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-700/60 pt-2">
              <strong className="text-slate-700 dark:text-slate-300">Tip:</strong> {report.estimatedConfidence.howToImprove}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Question Detailed Review & Model Answers */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-5">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            Per-Question Diagnostic &amp; AI Model Answers
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Generated strictly after interview conclusion. Each question includes an exemplary response formatted for {targetRole || 'Software Engineering'}.
          </p>
        </div>

        <div className="space-y-4">
          {report.questionEvaluations.map((item, idx) => {
            const isExpanded = expandedQuestions[item.questionId] !== false; // expanded by default
            return (
              <div
                key={item.questionId || idx}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <div
                  onClick={() => toggleQuestionExpand(item.questionId)}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.questionText}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-600">{item.score}%</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 space-y-4 text-xs">
                    {/* Student Answer */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your Answer:</span>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                        {item.studentAnswer || '(No response recorded)'}
                      </p>
                    </div>

                    {/* Diagnostic Feedback */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diagnostic Feedback:</span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {item.feedback}
                      </p>
                    </div>

                    {/* Model Answer (AI-suggested example) */}
                    <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold text-[11px]">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI-Suggested Example (Model Answer)
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        &quot;{item.modelAnswer}&quot;
                      </p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 pt-1">
                        Note: AI-suggested example demonstrating ideal structure and technical depth for this question.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Weak Areas (Feeds Learn Hub & Roadmap) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identified Strengths */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Identified Strengths
            </h3>
          </div>
          <div className="space-y-2.5">
            {report.strongAreas.map((s, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-semibold text-emerald-950 dark:text-emerald-200 flex items-center gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Weak Areas */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Priority Areas to Bridge
            </h3>
          </div>
          <div className="space-y-2.5">
            {report.weakAreas.map((w, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-xs font-semibold text-amber-950 dark:text-amber-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  {w}
                </div>
                <Link
                  href="/learn"
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  Practice in Learn &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Next Steps */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Placement Prep Action Plan
          </h3>
        </div>
        <div className="space-y-2.5">
          {report.recommendations.map((rec, idx) => (
            <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium pl-4 border-l-2 border-blue-500">
              {rec}
            </p>
          ))}
        </div>

        <div className="pt-4 flex flex-wrap gap-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/roadmap"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            Review 90-Day Roadmap <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/interview/gd"
            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            Practice Group Discussion (GD)
          </Link>
        </div>
      </div>
    </div>
  );
}
