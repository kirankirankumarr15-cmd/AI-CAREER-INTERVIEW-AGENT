'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GDEvaluation, GDTurn } from '@/types';
import { createClient } from '@/utils/supabase/client';
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Printer,
  Sparkles,
  Users,
  Quote,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

export default function GroupDiscussionReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [topic, setTopic] = useState<string>('Placement Group Discussion');
  const [evaluation, setEvaluation] = useState<GDEvaluation | null>(null);
  const [turns, setTurns] = useState<GDTurn[]>([]);
  const [totalTurns, setTotalTurns] = useState<number>(0);
  const [studentTurnCount, setStudentTurnCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadReport() {
      // 1. Try reading from sessionStorage
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem(`prism_gd_eval_${sessionId}`);
        if (cached) {
          try {
            const data = JSON.parse(cached);
            if (data.evaluation) {
              setEvaluation(data.evaluation);
              if (data.topic) setTopic(data.topic);
              if (data.turns) setTurns(data.turns);
              if (data.totalTurns) setTotalTurns(data.totalTurns);
              if (data.studentTurnCount) setStudentTurnCount(data.studentTurnCount);
              setLoading(false);
              return;
            }
          } catch {
            // fallback
          }
        }
      }

      // 2. Fallback to Supabase
      const supabase = createClient();
      const { data: evalData } = await supabase
        .from('gd_evaluations')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      const { data: sessionData } = await supabase
        .from('gd_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (evalData) {
        setEvaluation({
          contentScore: evalData.content_score,
          clarityScore: evalData.clarity_score,
          initiativeScore: evalData.initiative_score,
          listeningScore: evalData.listening_score,
          overallScore: evalData.overall_score,
          evidenceQuotes: evalData.evidence_quotes || [],
          strengths: evalData.strengths || [],
          improvementTips: evalData.improvement_tips || [],
          modelContributions: evalData.model_contributions || [],
        });
      }
      if (sessionData) {
        setTopic(sessionData.topic);
      }
      setLoading(false);
    }

    loadReport();
  }, [sessionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        <p className="text-xs text-slate-500 font-medium">Synthesizing GD diagnostic scorecard...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="max-w-[1000px] mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <Users className="h-12 w-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">No evaluation found for this discussion</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Participate in a Group Discussion simulation round to generate your 4-pillar scorecard.
        </p>
        <Link
          href="/interview/gd"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          Start Group Discussion &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-[1100px] mx-auto font-sans px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              PRISM Module 3.3 Evaluation
            </span>
            <span className="text-xs font-semibold text-slate-500">Group Discussion Scorecard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            GD Assessment: {topic}
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-0.5">
            Evaluated on Content, Clarity, Initiative, and Listening • Feeds Readiness Index (15% GD weight)
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
            href="/interview/gd"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Practice Another Topic
          </Link>
        </div>
      </div>

      {/* Hero Scorecard */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 gap-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 shrink-0 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border-[3px] border-indigo-600 flex items-center justify-center shadow-inner">
              <span className="text-4xl font-black text-indigo-700 dark:text-indigo-300">{evaluation.overallScore}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">GD Readiness Index</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                  evaluation.overallScore >= 75
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}>
                  {evaluation.overallScore >= 75 ? 'Placement Round Pass' : 'Needs Practice'}
                </span>
              </div>
              <p className="text-[13px] text-slate-500 mt-1 max-w-xl">
                Synthesized across your arguments, peer acknowledgment, turn timing, and collaborative problem-solving.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-right min-w-[200px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Round Metrics
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
              {studentTurnCount > 0 ? `${studentTurnCount} Human Turns` : 'Active Participant'}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Total round exchanges: {totalTurns || turns.length}</p>
          </div>
        </div>

        {/* 4 PRISM Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Content */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Content</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{evaluation.contentScore}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${evaluation.contentScore}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">
              Depth of factual reasoning, real-world examples, and domain relevance.
            </p>
          </div>

          {/* 2. Clarity */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Clarity</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{evaluation.clarityScore}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${evaluation.clarityScore}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">
              Concise sentence structure, fluent articulation, and absence of jargon clutter.
            </p>
          </div>

          {/* 3. Initiative */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Initiative</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{evaluation.initiativeScore}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${evaluation.initiativeScore}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">
              Floor-taking timing, raising hand, steering discussion direction, and entering early.
            </p>
          </div>

          {/* 4. Listening */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Listening</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">{evaluation.listeningScore}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-amber-600 rounded-full" style={{ width: `${evaluation.listeningScore}%` }} />
            </div>
            <p className="text-[11px] text-slate-500">
              Referencing peer names and arguments, respectful synthesis, and zero talking over.
            </p>
          </div>
        </div>
      </div>

      {/* Transcript Evidence Quotes */}
      {evaluation.evidenceQuotes && evaluation.evidenceQuotes.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Transcript-Grounded Evidence
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Direct observations citing specific utterances from the discussion session.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {evaluation.evidenceQuotes.map((eq, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {eq.metric}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                  &quot;{eq.quote}&quot;
                </p>
                <p className="text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  {eq.analysis}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Contributions ("AI-Suggested Example") */}
      {evaluation.modelContributions && evaluation.modelContributions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Exemplary Contributions (AI-Suggested Examples)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Formulations demonstrating how to elevate the discussion with higher-order synthesis and quantitative examples.
          </p>

          <div className="space-y-3 pt-2">
            {evaluation.modelContributions.map((mc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-1.5"
              >
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  Phase: {mc.phase}
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic">
                  &quot;{mc.suggestedArgument}&quot;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths and Improvement Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Demonstrated Strengths
            </h3>
          </div>
          <div className="space-y-2.5">
            {evaluation.strengths.map((str, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-semibold text-emerald-950 dark:text-emerald-200 flex items-center gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {str}
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Tips */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              High-Impact GD Recommendations
            </h3>
          </div>
          <div className="space-y-2.5">
            {evaluation.improvementTips.map((tip, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-xs font-semibold text-amber-950 dark:text-amber-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  {tip}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation CTAs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ready for your 1-on-1 Interview?</h3>
          <p className="text-xs text-slate-500 mt-0.5">Translate your group discussion confidence to individual technical rounds.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/roadmap"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
          >
            Review Roadmap
          </Link>
          <Link
            href="/interview"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            Start 1-on-1 Interview <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

