'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Flag,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Send,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
  BarChart3,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import {
  AssessmentQuestionPublic,
  AssessmentSection,
  AssessmentSummary,
  AssessmentAttemptResult,
  QuestionPaletteState,
} from '@/types';
import Link from 'next/link';

export default function AssessmentExamRoomPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = (params?.id as string) || 'asmt-tcs-nqt-full';

  // Exam state
  const [stage, setStage] = useState<'instructions' | 'exam' | 'review'>('instructions');
  const [attemptId, setAttemptId] = useState<string>('');
  const [assessment, setAssessment] = useState<AssessmentSummary | null>(null);
  const [sections, setSections] = useState<AssessmentSection[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestionPublic[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Answers & question status maps
  const [userAnswers, setUserAnswers] = useState<Record<string, string | null>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [visitedMap, setVisitedMap] = useState<Record<string, boolean>>({});

  // Server-Authoritative Timer
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null);
  const [remainingSecs, setRemainingSecs] = useState<number>(1800);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Proctoring
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showProctorWarning, setShowProctorWarning] = useState<boolean>(false);
  const [proctorMessage, setProctorMessage] = useState<string>('');

  // Submit confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Review mode result
  const [evaluation, setEvaluation] = useState<AssessmentAttemptResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Start exam session
  const startExam = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/practice/assessments/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId }),
      });

      if (!res.ok) {
        throw new Error('Failed to start assessment session.');
      }

      const data = await res.json();
      setAttemptId(data.attemptId);
      setAssessment(data.assessment);
      setSections(data.sections || []);
      setQuestions(data.questions || []);
      setDeadlineAt(data.deadlineAt);
      setRemainingSecs(data.remainingSeconds);
      setTabSwitchCount(data.tabSwitchCount || 0);

      // Hydrate existing answers if resumed
      if (data.savedAnswers) {
        const answers: Record<string, string | null> = {};
        const flags: Record<string, boolean> = {};
        Object.entries(data.savedAnswers).forEach(([qId, val]: [string, any]) => {
          answers[qId] = val.selectedOption;
          flags[qId] = val.isMarkedReview;
        });
        setUserAnswers(answers);
        setReviewFlags(flags);
      }

      // Mark first question visited
      if (data.questions && data.questions.length > 0) {
        setVisitedMap({ [data.questions[0].id]: true });
      }

      setStage('exam');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error starting assessment');
    } finally {
      setLoading(false);
    }
  };

  // Log Proctor event
  const handleProctorEvent = useCallback(
    async (eventType: 'tab_hidden' | 'window_blur') => {
      if (stage !== 'exam' || !attemptId) return;

      try {
        const res = await fetch('/api/practice/assessments/proctor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            eventType,
            details: { timestamp: new Date().toISOString() },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setTabSwitchCount(data.currentTabSwitches);
          if (data.warningMessage) {
            setProctorMessage(data.warningMessage);
            setShowProctorWarning(true);
          }
          if (data.shouldAutoSubmit) {
            handleFinalSubmit(true);
          }
        }
      } catch {
        // Continue exam without crashing
      }
    },
    [stage, attemptId]
  );

  // Tab-switch and window blur listener
  useEffect(() => {
    if (stage !== 'exam') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleProctorEvent('tab_hidden');
      }
    };

    const handleBlur = () => {
      handleProctorEvent('window_blur');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [stage, handleProctorEvent]);

  // Server-authoritative timer countdown
  useEffect(() => {
    if (stage !== 'exam' || !deadlineAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const deadline = new Date(deadlineAt).getTime();
      const diff = Math.max(0, Math.floor((deadline - now) / 1000));

      setRemainingSecs(diff);

      if (diff <= 0) {
        clearInterval(interval);
        handleFinalSubmit(true); // Auto-submit when time expires!
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, deadlineAt]);

  // Select an option & auto-save to server
  const handleSelectOption = async (optionId: string) => {
    if (stage !== 'exam' || !questions[currentIndex]) return;
    const qId = questions[currentIndex].id;

    const updated = { ...userAnswers, [qId]: optionId };
    setUserAnswers(updated);

    // Asynchronously save to server
    try {
      await fetch('/api/practice/assessments/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId: qId,
          selectedOption: optionId,
          isMarkedReview: reviewFlags[qId] || false,
          timeSpentSecs: 5,
        }),
      });
    } catch {
      // Continue offline
    }
  };

  // Toggle Marked for Review
  const toggleMarkReview = async () => {
    if (stage !== 'exam' || !questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    const newFlag = !reviewFlags[qId];

    setReviewFlags({ ...reviewFlags, [qId]: newFlag });

    try {
      await fetch('/api/practice/assessments/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId: qId,
          selectedOption: userAnswers[qId] || null,
          isMarkedReview: newFlag,
          timeSpentSecs: 2,
        }),
      });
    } catch {
      // Handled
    }
  };

  // Navigate question
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      setVisitedMap((prev) => ({ ...prev, [questions[index].id]: true }));
    }
  };

  // Final Submit
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/practice/assessments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          isAutoSubmit,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to evaluate assessment.');
      }

      const data = await res.json();
      setEvaluation(data.evaluation);
      setStage('review');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error submitting assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute Question Palette State
  const getPaletteState = (qId: string): QuestionPaletteState => {
    const isAnswered = Boolean(userAnswers[qId]);
    const isFlagged = Boolean(reviewFlags[qId]);
    const isVisited = Boolean(visitedMap[qId]);

    if (isFlagged) return 'review';
    if (isAnswered) return 'answered';
    if (isVisited) return 'unanswered';
    return 'not_visited';
  };

  // Palette State Styles
  const getPaletteStyle = (state: QuestionPaletteState, isCurrent: boolean) => {
    const ring = isCurrent ? 'ring-2 ring-blue-600 ring-offset-2' : '';
    switch (state) {
      case 'answered':
        return `bg-blue-600 text-white font-bold border-blue-600 ${ring}`;
      case 'review':
        return `bg-purple-600 text-white font-bold border-purple-600 ${ring}`;
      case 'unanswered':
        return `bg-amber-50 text-amber-700 font-bold border-amber-400 ${ring}`;
      case 'not_visited':
      default:
        return `bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 ${ring}`;
    }
  };

  // Counts for summary
  const answeredCount = Object.values(userAnswers).filter(Boolean).length;
  const reviewCount = Object.values(reviewFlags).filter(Boolean).length;
  const totalCount = questions.length;
  const unansweredCount = totalCount - answeredCount;

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // VIEW 1: INSTRUCTIONS STAGE
  // =========================================================================
  if (stage === 'instructions') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in-up">
        <div className="card p-8 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest">
            <ShieldAlert className="h-4 w-4" /> PRISM Timed Assessment Examination
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              TCS NQT & Collegiate Placement Screening Assessment
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Standard 30-minute timed evaluation across Quantitative Aptitude, Logical Reasoning, and Core CS Fundamentals.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Duration</span>
              <p className="text-lg font-black text-slate-900">30 Min</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Questions</span>
              <p className="text-lg font-black text-slate-900">15 MCQs</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Marks</span>
              <p className="text-lg font-black text-slate-900">30.0</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Negative Mark</span>
              <p className="text-lg font-black text-rose-600">-0.5</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Examination Integrity Rules</h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
              <li>
                <strong>Server-Authoritative Timer:</strong> Countdown runs from the server timestamp. Closing or refreshing the page will <em>not</em> reset your time.
              </li>
              <li>
                <strong>Tab-Switch Proctoring:</strong> Leaving this browser tab or switching windows triggers an event logged in your permanent assessment report.
              </li>
              <li>
                <strong>Negative Marking:</strong> Each correct answer awards +2.0 marks; incorrect answers deduct -0.5 marks. Unanswered questions carry 0 penalty.
              </li>
              <li>
                <strong>4-State Question Palette:</strong> Use the palette to mark questions for review and jump across sections freely.
              </li>
            </ul>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-5">
            <Link
              href="/practice"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back to Practice Hub
            </Link>
            <button
              onClick={startExam}
              disabled={loading}
              className="btn-shine px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Initializing Exam Room...' : 'I Agree & Start Assessment →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE EXAMINATION ROOM
  // =========================================================================
  if (stage === 'exam' && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const isCurrentMarkedReview = Boolean(reviewFlags[currentQ.id]);
    const currentSelectedOption = userAnswers[currentQ.id] || null;

    return (
      <div className="max-w-[1400px] mx-auto space-y-4 pb-12 animate-fade-in-up">
        {/* Proctor Alert Toast */}
        {showProctorWarning && (
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-center justify-between shadow-sm animate-bounce">
            <div className="flex items-center gap-2.5 text-xs font-bold text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>{proctorMessage}</span>
            </div>
            <button
              onClick={() => setShowProctorWarning(false)}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="card p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 border border-slate-200">
          <div>
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="h-3 w-3" /> Live Assessment Session
            </span>
            <h2 className="text-base font-extrabold text-slate-900">{assessment?.title || 'Placement Exam'}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Tab switch tracker */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Focus changes: <strong>{tabSwitchCount}</strong></span>
            </div>

            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black tabular-nums transition-colors ${
                remainingSecs <= 300
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTime(remainingSecs)}</span>
            </div>

            {/* Final Submit Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Test</span>
            </button>
          </div>
        </div>

        {/* Main Exam Area Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Viewer Column (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="card p-6 rounded-2xl border border-slate-200 space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-400 uppercase">Question {currentIndex + 1} of {questions.length}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {currentQ.topic}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    +{currentQ.marks} Marks
                  </span>
                  {currentQ.negativeMarks > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      -{currentQ.negativeMarks} Neg
                    </span>
                  )}
                </div>

                <button
                  onClick={toggleMarkReview}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    isCurrentMarkedReview
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isCurrentMarkedReview ? 'fill-purple-600' : ''}`} />
                  <span>{isCurrentMarkedReview ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base font-semibold text-slate-900 leading-relaxed">
                {currentQ.questionText}
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt) => {
                  const isSelected = currentSelectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-sm ring-1 ring-blue-600'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <span
                        className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span className="text-sm font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <button
                  onClick={() => goToQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectOption('')}
                    className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
                  >
                    Clear Response
                  </button>
                  <button
                    onClick={() => goToQuestion(currentIndex + 1)}
                    disabled={currentIndex === questions.length - 1}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Palette Column (1 col) */}
          <div className="space-y-4">
            <div className="card p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Question Palette
              </h3>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded bg-blue-600 text-white flex items-center justify-center text-[9px]">●</span>
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded bg-purple-600 text-white flex items-center justify-center text-[9px]">●</span>
                  <span>Review ({reviewCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded bg-amber-50 border border-amber-400 text-amber-700 flex items-center justify-center text-[9px]">●</span>
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-[9px]">●</span>
                  <span>Not Visited</span>
                </div>
              </div>

              {/* Question Buttons Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const state = getPaletteState(q.id);
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center text-xs transition-all ${getPaletteStyle(
                        state,
                        isCurrent
                      )}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Completion</span>
                  <span>{Math.round((answeredCount / totalCount) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${(answeredCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="card max-w-md w-full p-6 rounded-2xl border border-slate-200 space-y-5 bg-white shadow-2xl animate-scale-in">
              <div className="flex items-center gap-2 text-blue-600 font-extrabold text-xs uppercase tracking-wider">
                <Send className="h-4 w-4" /> Confirm Submission
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Are you ready to submit your assessment?</h3>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Answered</span>
                  <p className="text-base font-black text-blue-600">{answeredCount}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Review</span>
                  <p className="text-base font-black text-purple-600">{reviewCount}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Unanswered</span>
                  <p className="text-base font-black text-amber-600">{unansweredCount}</p>
                </div>
              </div>

              {unansweredCount > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  Notice: You have <strong>{unansweredCount} unanswered questions</strong>. You will receive 0 marks for skipped questions.
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel & Continue Test
                </button>
                <button
                  onClick={() => handleFinalSubmit(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                >
                  {isSubmitting ? 'Evaluating...' : 'Confirm & Finalize →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: POST-SUBMISSION REVIEW MODE
  // =========================================================================
  if (stage === 'review' && evaluation) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6 pb-16 animate-fade-in-up">
        {/* Results Banner */}
        <div className="card p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Assessment Evaluation Complete
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                {evaluation.assessmentTitle}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Submitted at {new Date(evaluation.submittedAt).toLocaleTimeString()} • Time Taken: {Math.round(evaluation.timeTakenSecs / 60)} min
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/readiness"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>View Readiness Impact</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/roadmap"
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                View 12-Week Roadmap
              </Link>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="card p-4 rounded-xl bg-blue-50/50 border-blue-200">
              <span className="text-[11px] font-bold text-blue-700 uppercase">Score Obtained</span>
              <p className="text-2xl font-black text-blue-900 mt-1">
                {evaluation.score} <span className="text-xs font-bold text-blue-600">/ {evaluation.totalMarks}</span>
              </p>
            </div>
            <div className="card p-4 rounded-xl bg-slate-50 border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Percentage</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{evaluation.percentage}%</p>
            </div>
            <div className="card p-4 rounded-xl bg-emerald-50/50 border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Correct</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{evaluation.correctCount}</p>
            </div>
            <div className="card p-4 rounded-xl bg-rose-50/50 border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 uppercase">Incorrect</span>
              <p className="text-2xl font-black text-rose-700 mt-1">{evaluation.incorrectCount}</p>
            </div>
            <div className="card p-4 rounded-xl bg-slate-50 border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Focus Changes</span>
              <p className="text-2xl font-black text-slate-700 mt-1">{evaluation.tabSwitchCount}</p>
            </div>
          </div>

          {/* Weak Topics & Recommendations */}
          {evaluation.weakTopics.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 uppercase">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Targeted Improvement Priority
              </div>
              <p className="text-xs text-amber-800">
                You showed under 60% accuracy in: <strong>{evaluation.weakTopics.join(', ')}</strong>. These topics are automatically added to your 12-week roadmap milestones.
              </p>
            </div>
          )}
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Verified Question Solutions & Explanations
          </h2>

          <div className="space-y-4">
            {evaluation.answers.map((ans, idx) => {
              const q = questions.find((item) => item.id === ans.questionId);
              if (!q) return null;

              return (
                <div
                  key={ans.questionId}
                  className={`card p-6 rounded-2xl border transition-all ${
                    ans.isCorrect
                      ? 'border-emerald-200 bg-white'
                      : ans.selectedOption
                      ? 'border-rose-200 bg-white'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Q{idx + 1}.</span>
                      <span className="text-xs font-bold text-slate-700">{ans.topic}</span>
                      {ans.isCorrect ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          +{ans.marksAwarded} Marks
                        </span>
                      ) : ans.selectedOption ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          {ans.marksAwarded} Marks
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                          Skipped (0 Marks)
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mt-3">{q.questionText}</p>

                  {/* Options Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                    {q.options.map((opt) => {
                      const isCorrect = opt.id === ans.correctOption;
                      const isUserChoice = opt.id === ans.selectedOption;

                      let optStyle = 'bg-white border-slate-200 text-slate-700';
                      if (isCorrect) {
                        optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                      } else if (isUserChoice && !isCorrect) {
                        optStyle = 'bg-rose-50 border-rose-300 text-rose-800 line-through';
                      }

                      return (
                        <div key={opt.id} className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optStyle}`}>
                          <span>
                            <strong>{opt.id}.</strong> {opt.text}
                          </span>
                          {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                          {isUserChoice && !isCorrect && <XCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Verified Explanation */}
                  {ans.explanation && (
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-blue-600" /> Solution Explanation:
                      </span>
                      <p className="text-slate-600 leading-relaxed">{ans.explanation}</p>
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

  return (
    <div className="p-12 text-center text-slate-500 font-medium">
      Loading examination room...
    </div>
  );
}
