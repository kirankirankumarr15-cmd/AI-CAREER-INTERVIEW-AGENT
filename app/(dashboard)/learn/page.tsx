'use client';

import { useState } from 'react';
import { Check, CheckCircle2, ArrowRight, XCircle, Lightbulb, Lock, ChevronRight, ChevronLeft, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Quiz data per milestone ───────────────────────────────────────────────────
const MILESTONE_QUIZZES: Record<number, { question: string; options: string[]; answer: string; explanation: string }[]> = {
  1: [
    {
      question: 'Which normal form eliminates partial dependencies on a composite primary key?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      answer: '2NF',
      explanation: '2NF removes partial dependencies — every non-key attribute must depend on the WHOLE primary key, not just part of it.',
    },
    {
      question: 'Which ACID property ensures that once a transaction commits, it remains committed even after a crash?',
      options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
      answer: 'Durability',
      explanation: 'Durability guarantees that committed transactions survive failures — typically via write-ahead logging (WAL).',
    },
    {
      question: 'A column that uniquely identifies each row and cannot be NULL is called a:',
      options: ['Foreign Key', 'Candidate Key', 'Primary Key', 'Composite Key'],
      answer: 'Primary Key',
      explanation: 'A Primary Key uniquely identifies each row, enforces NOT NULL, and has a clustered index in most databases.',
    },
  ],
  2: [
    {
      question: 'Which clause filters rows AFTER aggregation in SQL?',
      options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
      answer: 'HAVING',
      explanation: 'HAVING filters groups after GROUP BY aggregation. WHERE filters individual rows before grouping.',
    },
    {
      question: 'Which window function returns the rank of a row with no gaps for ties?',
      options: ['RANK()', 'DENSE_RANK()', 'ROW_NUMBER()', 'NTILE()'],
      answer: 'DENSE_RANK()',
      explanation: 'DENSE_RANK() assigns consecutive ranks (1,2,2,3), whereas RANK() leaves gaps (1,2,2,4) after ties.',
    },
    {
      question: 'A correlated subquery differs from a regular subquery because it:',
      options: [
        'Uses aggregate functions',
        'References columns from the outer query',
        'Returns multiple rows',
        'Is executed only once',
      ],
      answer: 'References columns from the outer query',
      explanation: 'A correlated subquery depends on the outer query row — it executes once per row of the outer query, making it slower but more flexible.',
    },
  ],
  3: [
    {
      question: 'Which join algorithm is typically chosen by the optimizer when one table is very small and fits in memory?',
      options: ['Hash Join', 'Sort Merge Join', 'Nested Loop with Index', 'Cartesian Product'],
      answer: 'Nested Loop with Index',
      explanation: 'When one table is tiny, Nested Loop with Index scan wins — it avoids the cost of hash table creation or sorting.',
    },
    {
      question: 'EXPLAIN ANALYZE in PostgreSQL shows "Seq Scan" — this means:',
      options: [
        'The index was used',
        'The table was read row-by-row without an index',
        'The query used a hash join',
        'The table is sorted',
      ],
      answer: 'The table was read row-by-row without an index',
      explanation: 'Sequential Scan (Seq Scan) reads every row in the table. It\'s fine for small tables but a red flag on large ones — add an index.',
    },
    {
      question: 'A LEFT JOIN returns:',
      options: [
        'Only matching rows from both tables',
        'All rows from the left table and matched rows from the right',
        'All rows from both tables',
        'Only unmatched rows from the left table',
      ],
      answer: 'All rows from the left table and matched rows from the right',
      explanation: 'LEFT JOIN keeps every row from the left table. If no match exists in the right table, NULLs fill the right-side columns.',
    },
  ],
  4: [
    {
      question: 'A covering index means the index:',
      options: [
        'Covers all tables in the database',
        'Contains all columns needed by a query, avoiding a table lookup',
        'Is built on all columns of a table',
        'Covers duplicate values',
      ],
      answer: 'Contains all columns needed by a query, avoiding a table lookup',
      explanation: 'A covering index satisfies the query entirely from the index pages — no "heap fetch" needed, giving maximum performance.',
    },
    {
      question: 'In a B-Tree index, a composite index on (A, B, C) will directly support queries filtering on:',
      options: ['Only column C', 'B and C only', 'A, or A+B, or A+B+C', 'Any column in any order'],
      answer: 'A, or A+B, or A+B+C',
      explanation: 'Composite indexes follow the leading-column rule. You must include the leftmost column(s) for the index to be used.',
    },
    {
      question: 'Clustered index differs from a non-clustered index in that:',
      options: [
        'Only clustered indexes can be unique',
        'A clustered index physically orders table rows by the index key',
        'Non-clustered indexes are always faster',
        'Clustered indexes cannot be on primary keys',
      ],
      answer: 'A clustered index physically orders table rows by the index key',
      explanation: 'A table can only have ONE clustered index because rows can only be physically sorted one way. It defines the actual storage order.',
    },
  ],
  5: [
    {
      question: 'The Cache-Aside pattern means:',
      options: [
        'The application reads/writes only through the cache',
        'The application checks the cache, falls back to DB on miss, and populates cache',
        'The cache is written synchronously with the DB',
        'Data is never evicted from cache',
      ],
      answer: 'The application checks the cache, falls back to DB on miss, and populates cache',
      explanation: 'Cache-Aside (Lazy Loading): read from cache → miss → read DB → write to cache. Application owns cache population.',
    },
    {
      question: 'A cache stampede occurs when:',
      options: [
        'The cache is too large',
        'Many clients simultaneously request the same expired cache key, flooding the database',
        'The database runs out of connections',
        'TTL is set too high',
      ],
      answer: 'Many clients simultaneously request the same expired cache key, flooding the database',
      explanation: 'Cache stampede (dogpile effect): on key expiry, many requests all miss and hammer the DB. Fix: probabilistic early expiration or locks.',
    },
  ],
  6: [
    {
      question: 'In a high-concurrency system, the primary purpose of a connection pool is to:',
      options: [
        'Encrypt database connections',
        'Reuse existing DB connections instead of creating new ones per request',
        'Route queries to different databases',
        'Cache query results',
      ],
      answer: 'Reuse existing DB connections instead of creating new ones per request',
      explanation: 'Creating a DB connection is expensive (~5–50ms). Connection pools pre-create and reuse connections, keeping latency low under load.',
    },
    {
      question: 'What does a circuit breaker pattern prevent?',
      options: [
        'SQL injection attacks',
        'Cascading failures when a downstream service is slow or unavailable',
        'Memory leaks',
        'Race conditions in threads',
      ],
      answer: 'Cascading failures when a downstream service is slow or unavailable',
      explanation: 'A circuit breaker trips open after N failures, fast-failing requests instead of waiting for a timeout — preventing system-wide meltdown.',
    },
  ],
};

const milestoneData = [
  { id: 1, title: 'SQL & Relational Fundamentals', desc: 'ACID properties, normal forms 1NF to 3NF, keys, and table constraints.', duration: '5h', why: 'SQL is the foundation of every backend system. Mastering normalization and constraints prevents data anomalies and ensures data integrity at scale.', concepts: ['ACID properties (Atomicity, Consistency, Isolation, Durability)', 'Normal forms: 1NF → 2NF → 3NF', 'Primary keys, foreign keys, unique constraints'] },
  { id: 2, title: 'SELECT Queries & Aggregations', desc: 'GROUP BY, HAVING, subqueries, and window functions fundamentals.', duration: '8h', why: 'Advanced SQL querying is tested in nearly every backend interview. Window functions and correlated subqueries separate junior from senior engineers.', concepts: ['GROUP BY, HAVING vs WHERE', 'Window functions: RANK(), DENSE_RANK(), ROW_NUMBER()', 'Correlated vs regular subqueries'] },
  { id: 3, title: 'Database Joins & Execution Plans', desc: 'INNER, LEFT, RIGHT, FULL OUTER joins, Hash Joins, and EXPLAIN ANALYZE.', duration: '14h', why: 'Understanding how the query optimizer selects join algorithms based on table cardinality prevents production outages from accidental full table scans.', concepts: ['Join semantics and NULL handling', 'Hash Join vs Merge Join vs Nested Loop', 'Interpreting PostgreSQL EXPLAIN ANALYZE'] },
  { id: 4, title: 'Indexing & B-Tree Optimization', desc: 'Clustered vs non-clustered indexes, composite index order, and covering indexes.', duration: '12h', why: 'Bad indexing is the #1 cause of slow queries in production. Understanding B-Tree internals lets you write queries that run in milliseconds instead of minutes.', concepts: ['Clustered vs non-clustered indexes', 'Composite index leading-column rule', 'Covering indexes to avoid heap fetches'] },
  { id: 5, title: 'Distributed Caching with Redis', desc: 'Cache-Aside, Write-Through, cache stampede, and TTL eviction policies.', duration: '16h', why: 'Redis is in the stack of nearly every high-traffic system. Knowing caching patterns prevents cache stampedes and stale data bugs in production.', concepts: ['Cache-Aside vs Write-Through patterns', 'TTL eviction and memory policies', 'Cache stampede and probabilistic expiry'] },
  { id: 6, title: 'High-Concurrency Interview Simulation', desc: 'Real-time mock interview simulating an engineering manager and principal.', duration: '1h', why: 'Simulating high-pressure engineering interviews builds the mental muscle to answer complex distributed systems questions fluently under stress.', concepts: ['Connection pooling and database timeouts', 'Circuit breaker and retry patterns', 'Rate limiting and backpressure strategies'] },
];

export default function LearnPage() {
  const router = useRouter();

  // Milestone state
  const [completedIds, setCompletedIds] = useState<number[]>([1, 2, 4]);
  const [activeId, setActiveId] = useState(3);

  // Quiz state
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [score, setScore] = useState(0);

  const milestone = milestoneData.find((m) => m.id === activeId)!;
  const questions = MILESTONE_QUIZZES[activeId] ?? [];
  const currentQ = questions[questionIdx];
  const isCompleted = completedIds.includes(activeId);
  const completedCount = completedIds.length;
  const progressPct = Math.round((completedCount / milestoneData.length) * 100);
  const isCorrect = selectedOption === currentQ?.answer;

  const switchMilestone = (id: number, locked: boolean) => {
    if (locked) return;
    setActiveId(id);
    resetQuiz();
  };

  const resetQuiz = () => {
    setQuestionIdx(0);
    setSelectedOption(null);
    setVerified(false);
    setQuizDone(false);
    setScore(0);
  };

  const handleMarkCompleted = () => {
    if (!completedIds.includes(activeId)) {
      setCompletedIds((prev) => [...prev, activeId]);
    }
  };

  const handleNext = () => {
    if (questionIdx < questions.length - 1) {
      setQuestionIdx((i) => i + 1);
      setSelectedOption(null);
      setVerified(false);
    } else {
      setQuizDone(true);
    }
  };

  const handleSkip = () => {
    // Skip without answering — no score added
    setQuestionIdx((i) => {
      const next = i + 1;
      if (next < questions.length) {
        setSelectedOption(null);
        setVerified(false);
        return next;
      } else {
        setQuizDone(true);
        return i;
      }
    });
  };

  // Called immediately when user clicks an option — auto-advances on correct
  const handleSelectOption = (opt: string) => {
    if (verified) return;
    setSelectedOption(opt);
    setVerified(true);
    if (opt === currentQ.answer) {
      setScore((s) => s + 1);
      // Auto-advance after 1.1s when answer is correct
      setTimeout(() => {
        setQuestionIdx((i) => {
          const next = i + 1;
          if (next < questions.length) {
            setSelectedOption(null);
            setVerified(false);
            return next;
          } else {
            setQuizDone(true);
            return i;
          }
        });
      }, 1100);
    }
    // Wrong answer: user sees explanation and clicks Next manually
  };

  const handlePrev = () => {
    if (questionIdx > 0) {
      setQuestionIdx((i) => i - 1);
      setSelectedOption(null);
      setVerified(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-16 font-sans animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col border-b border-slate-200 pb-5">
        <p className="text-[11px] font-extrabold text-teal-700 uppercase tracking-widest mb-1">
          Personalized Curriculum • {completedCount} of {milestoneData.length} Milestones Completed
        </p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Learning Roadmap: Backend Mastery & Systems Architecture
        </h1>
        <p className="text-[13px] text-slate-500 font-medium max-w-4xl mt-1">
          Step-by-step master plan bridging identified profile gaps to ensure ready hireability for Software Developer (SDE 1).
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Curriculum Progress</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-700">{progressPct}%</span>
            <span className="text-[11px] text-slate-500 font-bold">~{(milestoneData.length - completedCount) * 6}h remaining</span>
          </div>
        </div>
        <div className="w-full md:w-[420px]">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
            {milestoneData.map((m) => (
              <span key={m.id} className={completedIds.includes(m.id) ? 'text-teal-600' : ''}>{m.id}</span>
            ))}
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Milestone List ── */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-5">MILESTONES SEQUENCE</h2>

          <div className="space-y-2 relative before:absolute before:inset-0 before:ml-[13px] before:w-[2px] before:bg-slate-100 before:z-0">
            {milestoneData.map((m) => {
              const done = completedIds.includes(m.id);
              const active = m.id === activeId;
              const locked = m.id >= 5 && !completedIds.includes(m.id - 1);

              return (
                <div key={m.id} className="relative z-10 flex items-start gap-3">
                  {/* Icon */}
                  <div className="shrink-0 mt-2.5 bg-white py-1">
                    {done ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-50" />
                    ) : locked ? (
                      <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                        <Lock className="h-3 w-3 text-slate-400" />
                      </div>
                    ) : active ? (
                      <div className="h-6 w-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-teal-600/25 ring-2 ring-teal-200 ring-offset-1">
                        {m.id}
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-black">
                        {m.id}
                      </div>
                    )}
                  </div>

                  {/* Card */}
                  <button
                    type="button"
                    onClick={() => switchMilestone(m.id, locked)}
                    disabled={locked}
                    className={`flex-1 p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                      active
                        ? 'bg-teal-50/70 border-teal-400 shadow-sm'
                        : locked
                        ? 'bg-white border-slate-100 opacity-40 cursor-not-allowed'
                        : 'bg-white border-slate-100 hover:border-teal-300 hover:bg-teal-50/30 hover:shadow-sm hover:-translate-y-px cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className={`text-[12px] font-black leading-tight ${locked ? 'text-slate-400' : 'text-slate-900'}`}>{m.title}</h3>
                      <span className="text-[9px] font-bold text-slate-400 shrink-0 mt-0.5">{m.duration}</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed">{m.desc}</p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Detail Panel ── */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden" key={activeId}>

          {/* Top */}
          <div className="p-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-teal-100 text-teal-800 border-teal-200'
                  }`}>
                    {isCompleted ? '✓ COMPLETED' : 'IN PROGRESS'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{milestone.duration} Estimated</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">{milestone.title}</h2>
              </div>

              <button
                type="button"
                onClick={handleMarkCompleted}
                disabled={isCompleted}
                className={`shrink-0 px-4 py-2 rounded-xl text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 shadow-emerald-500/20 cursor-default'
                    : 'bg-teal-700 hover:bg-teal-600 hover:scale-105 active:scale-95 shadow-teal-700/20 cursor-pointer'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                {isCompleted ? 'Completed ✓' : 'Mark Completed'}
              </button>
            </div>

            {/* Why + Concepts */}
            <div className="border-t border-slate-100 pt-5 space-y-5">
              <div>
                <h3 className="text-[11px] font-black text-slate-700 mb-1.5">Why this milestone matters</h3>
                <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{milestone.why}</p>
              </div>
              <div>
                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-2.5">Core Technical Concepts</h3>
                <ul className="space-y-1.5">
                  {milestone.concepts.map((c, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[12px] text-slate-600 font-semibold">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Knowledge Check ── */}
          <div className="mt-5 mx-6 mb-6 bg-slate-50 rounded-2xl border border-slate-200 p-5 flex-1">

            {/* Quiz header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-teal-100 flex items-center justify-center">
                  <span className="text-[11px] font-black text-teal-700">?</span>
                </div>
                <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Quick Knowledge Check</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {quizDone ? 'Complete' : `${questionIdx + 1} / ${questions.length}`}
              </span>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-5">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i < questionIdx ? 'bg-teal-500' : i === questionIdx ? 'bg-teal-300' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* ── Quiz Done screen ── */}
            {quizDone ? (
              <div className="flex flex-col items-center text-center py-6 gap-4" style={{ animation: 'fadeInUp 0.35s ease both' }}>
                <div className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg ${
                  score === questions.length ? 'bg-emerald-100 shadow-emerald-200' : score >= Math.ceil(questions.length / 2) ? 'bg-teal-100 shadow-teal-200' : 'bg-amber-100 shadow-amber-200'
                }`}>
                  <Trophy className={`h-8 w-8 ${score === questions.length ? 'text-emerald-600' : score >= Math.ceil(questions.length / 2) ? 'text-teal-600' : 'text-amber-500'}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{score} / {questions.length} Correct</p>
                  <p className="text-[12px] text-slate-500 font-medium mt-1">
                    {score === questions.length
                      ? '🎉 Perfect score! You\'ve mastered this section.'
                      : score >= Math.ceil(questions.length / 2)
                      ? '👍 Good job! Review the missed questions to solidify your understanding.'
                      : '📚 Keep practicing! Go through the concepts again and retry.'}
                  </p>
                </div>
                <div className="flex gap-3 mt-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={resetQuiz}
                    className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Retry Quiz
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkCompleted}
                    disabled={isCompleted}
                    className={`px-5 py-2.5 rounded-xl font-bold text-[11px] transition-all duration-200 hover:scale-105 active:scale-95 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-600 cursor-default'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20'
                    }`}
                  >
                    {isCompleted ? '✓ Completed' : 'Mark as Completed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/practice')}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Practice Questions <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : currentQ ? (
              <>
                {/* Question */}
                <p className="text-[13px] font-bold text-slate-900 mb-4 leading-snug">{currentQ.question}</p>

                {/* Options — click to instantly check answer */}
                <div className="space-y-2 mb-4">
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedOption === opt;
                    const isOptCorrect = opt === currentQ.answer;

                    // Style each option based on state
                    let cls = 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-sm hover:scale-[1.01] cursor-pointer';
                    if (verified && isOptCorrect) cls = 'bg-emerald-50 border-emerald-400 shadow-sm scale-[1.01] cursor-default';
                    else if (verified && isSelected && !isOptCorrect) cls = 'bg-red-50 border-red-400 shadow-sm cursor-default';
                    else if (!verified && isSelected) cls = 'bg-teal-50 border-teal-400 shadow-sm scale-[1.01] cursor-pointer';

                    let dotCls = 'border-slate-300 bg-white';
                    if (verified && isOptCorrect) dotCls = 'border-emerald-500 bg-emerald-500';
                    else if (verified && isSelected && !isOptCorrect) dotCls = 'border-red-400 bg-red-400';
                    else if (!verified && isSelected) dotCls = 'border-teal-500 bg-teal-500';

                    let textCls = 'text-slate-600';
                    if (verified && isOptCorrect) textCls = 'text-emerald-800 font-bold';
                    else if (verified && isSelected && !isOptCorrect) textCls = 'text-red-700 font-bold';
                    else if (!verified && isSelected) textCls = 'text-teal-900 font-bold';

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        disabled={verified}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${cls} ${!verified ? 'active:scale-[0.97]' : ''}`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${dotCls}`}>
                          {((!verified && isSelected) || (verified && isOptCorrect)) && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className={`text-[12px] font-semibold flex-1 transition-colors duration-200 ${textCls}`}>{opt}</span>
                        {verified && isOptCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                        {verified && isSelected && !isOptCorrect && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation — shown after answering */}
                {verified && (
                  <div
                    className={`flex items-start gap-3 p-3.5 rounded-xl mb-4 border ${
                      isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                    style={{ animation: 'fadeInUp 0.3s ease both' }}
                  >
                    <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold leading-relaxed">
                      {isCorrect ? '✅ ' : '❌ '}{currentQ.explanation}
                    </p>
                  </div>
                )}

                {/* ── Action Buttons (always visible) ── */}
                <div className="flex items-center justify-between gap-3 flex-wrap">

                  {/* Left: Previous */}
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={questionIdx === 0}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border font-bold text-[11px] transition-all duration-200 ${
                      questionIdx === 0
                        ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer'
                    }`}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </button>

                  {/* Right: Skip (always) + Next / Finish (after answering) */}
                  <div className="flex items-center gap-2">

                    {/* Skip button — always visible when not yet answered */}
                    {!verified && (
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 font-bold text-[11px] hover:bg-slate-100 hover:border-slate-300 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                      >
                        Skip <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Next / Finish — appears after answering */}
                    {verified && (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-md shadow-indigo-600/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                        style={{ animation: 'fadeInUp 0.25s ease both' }}
                      >
                        {questionIdx < questions.length - 1 ? (
                          <><span>Next Question</span><ChevronRight className="h-3.5 w-3.5" /></>
                        ) : (
                          <><Trophy className="h-3.5 w-3.5" /><span>Finish Quiz</span></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[12px] text-slate-400 font-medium">No questions available for this milestone.</p>
            )}
          </div>

          {/* Footer CTA */}
          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={() => router.push('/practice')}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white text-[12px] font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Practice Questions for this Node <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
