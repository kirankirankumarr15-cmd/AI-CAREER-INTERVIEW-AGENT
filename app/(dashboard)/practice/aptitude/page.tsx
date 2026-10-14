'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain, Clock, CheckCircle, XCircle, Flag, ChevronRight,
  ChevronLeft, AlertTriangle, BookOpen, Zap, TrendingUp,
} from 'lucide-react';

interface Option {
  label: string;
  text: string;
}

interface AptitudeQuestion {
  id: string;
  category: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question_text: string;
  options: Option[];
  correct_option: string;
  explanation: string;
}

interface UserAnswer {
  questionId:     string;
  selectedOption: string | null;
  isCorrect:      boolean;
  timeTakenSecs:  number;
  isMarkedReview: boolean;
}

const TOPICS: Record<string, string[]> = {
  Quantitative: ['Time & Work', 'Speed & Distance', 'Percentages', 'Profit & Loss', 'Simple & Compound Interest', 'Averages', 'Ratios & Proportions', 'Number System'],
  Logical:      ['Number Series', 'Letter & Symbol Series', 'Coding & Decoding', 'Blood Relations', 'Seating Arrangement', 'Direction Sense', 'Syllogisms', 'Analogy'],
  Verbal:       ['Synonyms & Antonyms', 'Sentence Correction', 'Fill in the Blanks', 'Reading Comprehension', 'Sentence Arrangement', 'Error Detection'],
};

const DIFFICULTY_COLORS = {
  Easy:   'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30',
  Medium: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30',
  Hard:   'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30',
};

type Stage = 'setup' | 'test' | 'result';

export default function AptitudePracticePage() {
  const router = useRouter();

  // Setup state
  const [stage, setStage]           = useState<Stage>('setup');
  const [category, setCategory]     = useState<'Quantitative' | 'Logical' | 'Verbal'>('Quantitative');
  const [topic, setTopic]           = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [testMode, setTestMode]     = useState<'drill' | 'full_test'>('drill');
  const [negMarking, setNegMarking] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);

  // Test state
  const [questions, setQuestions]     = useState<AptitudeQuestion[]>([]);
  const [answers, setAnswers]         = useState<UserAnswer[]>([]);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [timeLeft, setTimeLeft]       = useState(0);
  const [questionTime, setQTime]      = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [showExplanation, setShowExp] = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  // Result state
  const [result, setResult] = useState<{
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    scorePercent: number;
    weakTopics: string[];
    timeTakenSecs: number;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSecs = testMode === 'full_test' ? questionCount * 90 : 0; // 90s/q for full test

  const stopTimers = useCallback(() => {
    if (timerRef.current)  clearInterval(timerRef.current);
    if (qTimerRef.current) clearInterval(qTimerRef.current);
  }, []);

  // Section timer for full test
  useEffect(() => {
    if (stage !== 'test' || testMode !== 'full_test') return;
    setTimeLeft(totalSecs);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopTimers(); handleAutoSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => stopTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Per-question timer
  useEffect(() => {
    if (stage !== 'test') return;
    setQTime(0);
    if (qTimerRef.current) clearInterval(qTimerRef.current);
    qTimerRef.current = setInterval(() => setQTime((t) => t + 1), 1000);
    return () => { if (qTimerRef.current) clearInterval(qTimerRef.current); };
  }, [currentIdx, stage]);

  const currentQ = questions[currentIdx];
  const currentAnswer = answers.find((a) => a.questionId === currentQ?.id);

  const handleStartTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        category,
        difficulty,
        count: questionCount.toString(),
      });
      if (topic) params.set('topic', topic);

      const res = await fetch(`/api/practice/aptitude/questions?${params}`);
      if (!res.ok) throw new Error('Failed to load questions');

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        setError('No questions available for this selection. Try a different topic or difficulty.');
        return;
      }

      setQuestions(data.questions);
      setAnswers([]);
      setCurrentIdx(0);
      setStage('test');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (label: string) => {
    if (!currentQ) return;
    const isCorrect = label === currentQ.correct_option;

    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === currentQ.id);
      const entry: UserAnswer = {
        questionId:     currentQ.id,
        selectedOption: label,
        isCorrect,
        timeTakenSecs:  questionTime,
        isMarkedReview: existing >= 0 ? prev[existing].isMarkedReview : false,
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = entry;
        return updated;
      }
      return [...prev, entry];
    });
  };

  const toggleMarkReview = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === currentQ.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], isMarkedReview: !updated[existing].isMarkedReview };
        return updated;
      }
      return [...prev, {
        questionId: currentQ.id, selectedOption: null, isCorrect: false,
        timeTakenSecs: questionTime, isMarkedReview: true,
      }];
    });
  };

  const handleAutoSubmit = useCallback(() => {
    setSubmitted(true);
    submitTest([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const submitTest = async (overrideAnswers?: UserAnswer[]) => {
    stopTimers();
    const finalAnswers = overrideAnswers ?? answers;
    const timeTaken = totalSecs - timeLeft || answers.reduce((s, a) => s + a.timeTakenSecs, 0);

    setLoading(true);
    try {
      const res = await fetch('/api/practice/aptitude/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptType:     testMode,
          category,
          topic:           topic || undefined,
          negativeMarking: negMarking,
          timeTakenSecs:   timeTaken,
          answers:         finalAnswers.map((a) => ({
            questionId:     a.questionId,
            selectedOption: a.selectedOption,
            isCorrect:      a.isCorrect,
            timeTakenSecs:  a.timeTakenSecs,
            isMarkedReview: a.isMarkedReview,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setStage('result');
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ──────────────────────────────────────────────────────────────────────────
  // SETUP STAGE
  // ──────────────────────────────────────────────────────────────────────────
  if (stage === 'setup') {
    return (
      <div className="max-w-[900px] mx-auto space-y-8 pb-16 animate-fade-in-up">
        <div className="text-center space-y-2">
          <p className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            AI-Generated Practice • Not Real Exam Questions
          </p>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Aptitude & Reasoning Practice</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Timed drills for Quantitative, Logical and Verbal ability.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">1. Category</h2>
            <div className="space-y-2">
              {(['Quantitative', 'Logical', 'Verbal'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setTopic(''); }}
                  className={`w-full p-3 rounded-xl border text-left text-[13px] font-semibold transition-all ${
                    category === cat
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                  }`}
                >
                  {cat === 'Quantitative' && '🔢'} {cat === 'Logical' && '🧩'} {cat === 'Verbal' && '📝'} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">2. Topic (optional)</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTopic('')}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                  !topic ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                All Topics
              </button>
              {TOPICS[category].map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                    topic === t ? 'bg-blue-600 text-white border-transparent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">3. Difficulty</h2>
            <div className="flex gap-3">
              {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${
                    difficulty === d
                      ? d === 'Easy' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                        : d === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">4. Mode & Settings</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                {(['drill', 'full_test'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTestMode(m)}
                    className={`flex-1 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${
                      testMode === m
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-800 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m === 'drill' ? '⚡ Topic Drill' : '📋 Full Test'}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600 dark:text-slate-400 font-semibold">Questions: {questionCount}</span>
                <input
                  type="range" min={5} max={30} step={5}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-32 accent-blue-600"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={negMarking}
                  onChange={(e) => setNegMarking(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-[12px] text-slate-600 dark:text-slate-400 font-semibold">Negative marking (−0.25/wrong)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <p className="text-[13px] font-black text-slate-900 dark:text-white">
              {questionCount} {difficulty} {category} questions
              {topic ? ` — ${topic}` : ''}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {testMode === 'full_test' ? `Timed: ${Math.round(questionCount * 1.5)} min` : 'Untimed drill with explanations'}
              {negMarking ? ' • Negative marking on' : ''}
            </p>
          </div>
          <button
            onClick={handleStartTest}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
          >
            <Zap className="h-4 w-4" />
            {loading ? 'Loading Questions...' : 'Start Practice'}
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST STAGE
  // ──────────────────────────────────────────────────────────────────────────
  if (stage === 'test' && currentQ) {
    const answered = answers.findIndex((a) => a.questionId === currentQ.id) >= 0;
    const isReviewing = testMode === 'drill' && answered && showExplanation;

    return (
      <div className="max-w-[900px] mx-auto space-y-6 pb-16 animate-fade-in-up">
        {/* Progress header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-[12px] font-black text-slate-900 dark:text-white">
                Q{currentIdx + 1} of {questions.length}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${DIFFICULTY_COLORS[currentQ.difficulty]}`}>
                  {currentQ.difficulty}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{currentQ.topic}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="hidden sm:block w-48">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-[12px] font-bold text-slate-500 dark:text-slate-400">
            {testMode === 'full_test' && (
              <div className={`flex items-center gap-1 ${timeLeft < 60 ? 'text-rose-500' : ''}`}>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(questionTime)}
            </div>
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-white leading-relaxed mb-6">
            {currentQ.question_text}
          </p>

          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = currentAnswer?.selectedOption === opt.label;
              const isCorrect  = opt.label === currentQ.correct_option;
              const showResult = testMode === 'drill' && answered;

              let btnClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300';
              if (showResult && isCorrect)  btnClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200';
              if (showResult && isSelected && !isCorrect) btnClass = 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200';
              if (!showResult && isSelected) btnClass = 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-900 dark:text-blue-200';

              return (
                <button
                  key={opt.label}
                  onClick={() => !answered && selectAnswer(opt.label)}
                  disabled={answered && testMode === 'full_test'}
                  className={`w-full p-4 rounded-xl border text-left text-[13px] font-medium transition-all flex items-center gap-3 ${btnClass}`}
                >
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-black shrink-0">
                    {opt.label}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                  {showResult && isCorrect && <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation (drill mode after answering) */}
          {testMode === 'drill' && answered && (
            <div className="mt-6">
              <button
                onClick={() => setShowExp(!showExplanation)}
                className="flex items-center gap-2 text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <BookOpen className="h-4 w-4" />
                {showExplanation ? 'Hide' : 'Show'} Explanation
              </button>
              {showExplanation && (
                <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-[12px] text-blue-900 dark:text-blue-200 leading-relaxed">
                  {currentQ.explanation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCurrentIdx((i) => Math.max(0, i - 1)); setShowExp(false); }}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={toggleMarkReview}
              className={`px-4 py-2.5 rounded-xl border text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                currentAnswer?.isMarkedReview
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-amber-300'
              }`}
            >
              <Flag className="h-3.5 w-3.5" /> Mark
            </button>
          </div>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => { setCurrentIdx((i) => i + 1); setShowExp(false); }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => submitTest()}
              disabled={loading || submitted}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <CheckCircle className="h-4 w-4" />
              {loading ? 'Submitting...' : 'Submit Test'}
            </button>
          )}
        </div>

        {/* Question palette */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Question Palette</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const ans = answers.find((a) => a.questionId === q.id);
              const isMarked = ans?.isMarkedReview;
              const isAnswered = !!ans?.selectedOption;
              return (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIdx(idx); setShowExp(false); }}
                  className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                    idx === currentIdx ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  } ${
                    isMarked ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300'
                    : isAnswered ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Answered ({answers.filter(a => a.selectedOption).length})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Marked ({answers.filter(a => a.isMarkedReview).length})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-300 inline-block" /> Not visited ({questions.length - answers.length})</span>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RESULT STAGE
  // ──────────────────────────────────────────────────────────────────────────
  if (stage === 'result' && result) {
    const accuracy = result.totalQuestions > 0
      ? Math.round((result.correctCount / result.totalQuestions) * 100)
      : 0;

    return (
      <div className="max-w-[700px] mx-auto space-y-6 pb-16 animate-fade-in-up">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Test Results</h1>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">AI-generated practice — not a real exam result</p>
        </div>

        {/* Score card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center">
          <div className="text-6xl font-black text-blue-600 dark:text-blue-400 mb-2">
            {result.scorePercent.toFixed(1)}%
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6">Score</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{result.correctCount}</div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">Correct</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-4">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{result.wrongCount}</div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">Wrong</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
              <div className="text-2xl font-black text-slate-700 dark:text-slate-300">{accuracy}%</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Accuracy</p>
            </div>
          </div>
        </div>

        {/* Weak topics */}
        {result.weakTopics.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <h3 className="text-[13px] font-black text-amber-900 dark:text-amber-200">
                Topics Added to Your Learn Hub
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.weakTopics.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-[11px] font-bold rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setStage('setup')}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[13px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Practice Again
          </button>
          <button
            onClick={() => router.push('/learn')}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-all shadow-md"
          >
            Go to Learn Hub →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
}
