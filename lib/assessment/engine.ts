/**
 * lib/assessment/engine.ts
 *
 * Core Execution Engine for PRISM Timed Assessment Platform:
 * - Server-authoritative timer logic (started_at, deadline_at)
 * - Safe question delivery (correct answers & explanations strictly stripped before submit)
 * - Answer scoring with negative marking support
 * - Tab-switch and focus proctoring event tracker
 * - 4-state Question Palette evaluator
 * - Weak topic identification and recommendation generator
 * - Duplicate finalization prevention
 * - Admin CSV question parser with spreadsheet formula injection protection
 */

import {
  AssessmentQuestionFull,
  AssessmentQuestionPublic,
  AssessmentAttemptResult,
  AttemptAnswerResult,
  ProctorEventType,
  ProctorSeverity,
  QuestionPaletteState,
} from '@/types';
import { SEED_ASSESSMENTS, SEED_SECTIONS, SEED_QUESTIONS } from './assessment-bank';

/** In-memory store for fallback mode when database is uninitialized/offline */
interface InMemAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  startedAt: string;
  deadlineAt: string;
  submittedAt?: string;
  status: 'in_progress' | 'completed' | 'expired' | 'abandoned';
  resultStatus?: 'passed' | 'failed' | 'pending';
  tabSwitchCount: number;
  answers: Record<string, { selectedOption: string | null; isMarkedReview: boolean; timeSpentSecs: number }>;
  proctorEvents: Array<{
    eventType: ProctorEventType;
    timestamp: string;
    severity?: ProctorSeverity;
    details?: Record<string, unknown>;
  }>;
  cachedResult?: AssessmentAttemptResult;
}

const globalStore = globalThis as unknown as { __prismAttemptsStore?: Map<string, InMemAttempt> };
const localAttemptsStore = globalStore.__prismAttemptsStore || new Map<string, InMemAttempt>();
if (!globalStore.__prismAttemptsStore) {
  globalStore.__prismAttemptsStore = localAttemptsStore;
}

/**
 * 1. Safe Question Delivery: Strips answer keys and explanations strictly server-side
 */
export function sanitizeQuestionsForClient(questions: AssessmentQuestionFull[]): AssessmentQuestionPublic[] {
  return questions.map((q) => ({
    id: q.id,
    assessmentId: q.assessmentId,
    sectionId: q.sectionId,
    questionText: q.questionText,
    questionType: q.questionType,
    options: q.options,
    topic: q.topic,
    difficulty: q.difficulty,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    orderIndex: q.orderIndex,
  }));
}

/**
 * 2. Question Palette Evaluator (4 states according to Module 4.1 specification)
 * - Answered
 * - Unanswered
 * - Marked for Review
 * - Answered and Marked for Review
 */
export function evaluatePaletteState(
  selectedOption: string | null | undefined,
  isMarkedReview: boolean | undefined,
  isVisited: boolean = false
): QuestionPaletteState {
  const hasAnswer = Boolean(selectedOption && selectedOption.trim().length > 0);
  const isFlagged = Boolean(isMarkedReview);

  if (hasAnswer && isFlagged) {
    return 'answered_and_marked_for_review';
  }
  if (!hasAnswer && isFlagged) {
    return 'marked_for_review';
  }
  if (hasAnswer && !isFlagged) {
    return 'answered';
  }
  if (isVisited) {
    return 'unanswered';
  }
  return 'not_visited';
}

/**
 * 3. Start Assessment Session with Server-Authoritative Timer
 */
export function startAssessmentSession(
  assessmentId: string,
  userId: string
): {
  attemptId: string;
  assessment: typeof SEED_ASSESSMENTS[0];
  sections: typeof SEED_SECTIONS[string];
  questions: AssessmentQuestionPublic[];
  startedAt: string;
  deadlineAt: string;
  remainingSeconds: number;
  tabSwitchCount: number;
  savedAnswers: Record<string, { selectedOption: string | null; isMarkedReview: boolean }>;
} {
  const assessment = SEED_ASSESSMENTS.find((a) => a.id === assessmentId) || SEED_ASSESSMENTS[0];
  const fullQuestions = SEED_QUESTIONS[assessment.id] || SEED_QUESTIONS['asmt-tcs-nqt-full'] || [];
  const sections = SEED_SECTIONS[assessment.id] || [];

  const now = new Date();

  // Check if an existing in_progress session exists for this user and assessment
  let attempt = Array.from(localAttemptsStore.values()).find(
    (a) => a.userId === userId && a.assessmentId === assessment.id && a.status === 'in_progress'
  );

  if (attempt) {
    const deadline = new Date(attempt.deadlineAt);
    if (now.getTime() > deadline.getTime()) {
      // Server deadline has passed! Auto-finalize expired attempt
      attempt.status = 'expired';
      attempt.submittedAt = deadline.toISOString();
    } else {
      // Active attempt resumed! Time remaining is strictly based on server deadline
      const remainingSecs = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
      return {
        attemptId: attempt.id,
        assessment,
        sections,
        questions: sanitizeQuestionsForClient(fullQuestions),
        startedAt: attempt.startedAt,
        deadlineAt: attempt.deadlineAt,
        remainingSeconds: remainingSecs,
        tabSwitchCount: attempt.tabSwitchCount,
        savedAnswers: attempt.answers,
      };
    }
  }

  // Create fresh server-authoritative attempt
  const durationMinutes = assessment.durationMinutes;
  const deadlineAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  attempt = {
    id: attemptId,
    assessmentId: assessment.id,
    userId,
    startedAt: now.toISOString(),
    deadlineAt: deadlineAt.toISOString(),
    status: 'in_progress',
    tabSwitchCount: 0,
    answers: {},
    proctorEvents: [],
  };

  localAttemptsStore.set(attemptId, attempt);

  return {
    attemptId,
    assessment,
    sections,
    questions: sanitizeQuestionsForClient(fullQuestions),
    startedAt: attempt.startedAt,
    deadlineAt: attempt.deadlineAt,
    remainingSeconds: durationMinutes * 60,
    tabSwitchCount: 0,
    savedAnswers: {},
  };
}

/**
 * 4. Save Question Answer (enforces server-authoritative deadline)
 * Supports answer updates, clearing response (selectedOption = null), and review toggles.
 */
export function recordQuestionAnswer(
  attemptId: string,
  userId: string,
  questionId: string,
  selectedOption: string | null,
  isMarkedReview: boolean,
  timeSpentSecs: number = 0
): { success: boolean; isExpired: boolean; error?: string } {
  const attempt = localAttemptsStore.get(attemptId);
  if (!attempt || attempt.userId !== userId) {
    return { success: false, isExpired: false, error: 'Attempt not found or unauthorized' };
  }

  if (attempt.status !== 'in_progress') {
    return { success: false, isExpired: true, error: 'Attempt is already submitted or expired' };
  }

  const now = new Date();
  const deadline = new Date(attempt.deadlineAt);

  if (now.getTime() > deadline.getTime()) {
    attempt.status = 'expired';
    attempt.submittedAt = deadline.toISOString();
    return { success: false, isExpired: true, error: 'Server deadline has passed' };
  }

  attempt.answers[questionId] = {
    selectedOption: selectedOption ? selectedOption.trim() : null,
    isMarkedReview,
    timeSpentSecs: (attempt.answers[questionId]?.timeSpentSecs || 0) + Math.max(0, timeSpentSecs),
  };

  return { success: true, isExpired: false };
}

/**
 * 5. Record Proctoring Event
 * Tracks browser visibility, focus, fullscreen exits, copy/paste, navigation, and repeated actions.
 */
export function logProctoringEvent(
  attemptId: string,
  userId: string,
  eventType: ProctorEventType,
  details?: Record<string, unknown>
): {
  logged: boolean;
  currentTabSwitches: number;
  severity: ProctorSeverity;
  warningMessage?: string;
} {
  const attempt = localAttemptsStore.get(attemptId);
  if (!attempt || attempt.userId !== userId) {
    return { logged: false, currentTabSwitches: 0, severity: 'low' };
  }

  // Assess event severity
  let severity: ProctorSeverity = 'low';
  if (eventType === 'tab_hidden' || eventType === 'fullscreen_exit') {
    severity = 'medium';
    attempt.tabSwitchCount += 1;
  } else if (eventType === 'window_blur') {
    severity = 'low';
    attempt.tabSwitchCount += 1;
  } else if (eventType === 'paste_attempt' || eventType === 'copy_attempt') {
    severity = 'medium';
  } else if (eventType === 'repeated_activity' || eventType === 'suspicious_shortcut') {
    severity = 'high';
  }

  attempt.proctorEvents.push({
    eventType,
    timestamp: new Date().toISOString(),
    severity,
    details,
  });

  let warningMessage: string | undefined;
  if (attempt.tabSwitchCount === 1) {
    warningMessage = 'Notice: Window blur or tab switch recorded. Assessment events are monitored.';
  } else if (attempt.tabSwitchCount >= 3) {
    warningMessage = `Integrity advisory: ${attempt.tabSwitchCount} browser window focus changes recorded.`;
  }

  return {
    logged: true,
    currentTabSwitches: attempt.tabSwitchCount,
    severity,
    warningMessage,
  };
}

/**
 * 6. Finalize Assessment Attempt & Server-Authoritative Scoring
 * Safe against duplicate submissions: returns cached result if already completed.
 */
export function finalizeAssessmentAttempt(
  attemptId: string,
  userId: string,
  isAutoSubmit: boolean = false
): AssessmentAttemptResult {
  const attempt = localAttemptsStore.get(attemptId);
  if (attempt && attempt.cachedResult) {
    // Prevent duplicate calculation / replay
    return attempt.cachedResult;
  }

  const assessment = SEED_ASSESSMENTS.find((a) => a.id === attempt?.assessmentId) || SEED_ASSESSMENTS[0];
  const fullQuestions = SEED_QUESTIONS[assessment.id] || SEED_QUESTIONS['asmt-tcs-nqt-full'] || [];
  const sections = SEED_SECTIONS[assessment.id] || [];

  const now = new Date();
  const started = attempt ? new Date(attempt.startedAt) : now;
  const timeTakenSecs = Math.max(1, Math.round((now.getTime() - started.getTime()) / 1000));

  let totalScore = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const topicStats: Record<string, { total: number; correct: number }> = {};
  const sectionStats: Record<string, { title: string; score: number; totalMarks: number }> = {};

  sections.forEach((s) => {
    sectionStats[s.id] = { title: s.title, score: 0, totalMarks: 0 };
  });

  const answersResult: AttemptAnswerResult[] = [];

  fullQuestions.forEach((q) => {
    const marks = q.marks || 1.0;
    const negativeMarks = assessment.negativeMarking ? (q.negativeMarks || 0.25) : 0.0;
    totalMarks += marks;

    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { total: 0, correct: 0 };
    }
    topicStats[q.topic].total += 1;

    if (q.sectionId && sectionStats[q.sectionId]) {
      sectionStats[q.sectionId].totalMarks += marks;
    }

    const saved = attempt?.answers[q.id];
    const selectedOption = saved?.selectedOption || null;
    const isMarkedReview = saved?.isMarkedReview || false;
    const timeSpent = saved?.timeSpentSecs || 0;

    let isCorrect = false;
    let marksAwarded = 0;

    if (!selectedOption) {
      unansweredCount += 1;
      marksAwarded = 0;
    } else if (selectedOption.toUpperCase() === q.correctOption.toUpperCase()) {
      correctCount += 1;
      isCorrect = true;
      marksAwarded = marks;
      totalScore += marks;
      topicStats[q.topic].correct += 1;

      if (q.sectionId && sectionStats[q.sectionId]) {
        sectionStats[q.sectionId].score += marks;
      }
    } else {
      incorrectCount += 1;
      isCorrect = false;
      marksAwarded = -negativeMarks;
      totalScore -= negativeMarks;

      if (q.sectionId && sectionStats[q.sectionId]) {
        sectionStats[q.sectionId].score -= negativeMarks;
      }
    }

    answersResult.push({
      questionId: q.id,
      selectedOption,
      isCorrect,
      marksAwarded: Number(marksAwarded.toFixed(2)),
      correctOption: q.correctOption,
      explanation: q.explanation,
      isMarkedReview,
      timeSpentSecs: timeSpent,
      topic: q.topic,
    });
  });

  totalScore = Math.max(0, Number(totalScore.toFixed(2)));
  const percentage = totalMarks > 0 ? Number(((totalScore / totalMarks) * 100).toFixed(1)) : 0;
  const resultStatus: 'passed' | 'failed' = totalScore >= assessment.passMarks ? 'passed' : 'failed';

  // Weak topics detection: topics where accuracy is under 60%
  const weakTopics = Object.entries(topicStats)
    .filter(([_, stats]) => stats.total > 0 && stats.correct / stats.total < 0.6)
    .map(([topic]) => topic);

  // Recommendations generator based on actual results
  const recommendations: string[] = [];
  if (weakTopics.length > 0) {
    recommendations.push(`Prioritize targeted revision in weak areas: ${weakTopics.join(', ')}.`);
  }
  if (assessment.negativeMarking && incorrectCount > 3) {
    recommendations.push(`High negative marking penalty observed (${incorrectCount} incorrect answers). Skip uncertain questions to protect your score.`);
  }
  if (percentage >= 80) {
    recommendations.push('Strong performance! Ready for enterprise-level technical rounds.');
  } else if (percentage >= 60) {
    recommendations.push('Good foundation. Strengthen speed and accuracy under timed conditions.');
  } else {
    recommendations.push('Core gaps identified. Complete targeted practice drills before company placement drives.');
  }

  const result: AssessmentAttemptResult = {
    id: attempt?.id || `att_eval_${Date.now()}`,
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    startedAt: attempt?.startedAt || now.toISOString(),
    deadlineAt: attempt?.deadlineAt || now.toISOString(),
    submittedAt: now.toISOString(),
    status: isAutoSubmit ? 'expired' : 'completed',
    resultStatus,
    timeTakenSecs,
    score: totalScore,
    totalMarks,
    passMarks: assessment.passMarks,
    percentage,
    tabSwitchCount: attempt?.tabSwitchCount || 0,
    totalQuestions: fullQuestions.length,
    correctCount,
    incorrectCount,
    unansweredCount,
    sectionBreakdown: Object.values(sectionStats).map((s) => ({
      sectionTitle: s.title,
      score: Number(Math.max(0, s.score).toFixed(2)),
      totalMarks: s.totalMarks,
      percentage: s.totalMarks > 0 ? Number(((Math.max(0, s.score) / s.totalMarks) * 100).toFixed(1)) : 0,
    })),
    topicBreakdown: Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      total: stats.total,
      correct: stats.correct,
      percentage: stats.total > 0 ? Number(((stats.correct / stats.total) * 100).toFixed(1)) : 0,
    })),
    weakTopics,
    recommendations,
    proctorEvents: attempt?.proctorEvents.map((e) => ({
      attemptId: attempt.id,
      eventType: e.eventType,
      timestamp: e.timestamp,
      severity: e.severity || 'low',
      details: e.details,
    })) || [],
    answers: answersResult,
  };

  // Cache result to prevent duplicate re-calculation
  if (attempt) {
    attempt.status = isAutoSubmit ? 'expired' : 'completed';
    attempt.resultStatus = resultStatus;
    attempt.submittedAt = now.toISOString();
    attempt.cachedResult = result;
  }

  return result;
}

/**
 * 7. Retrieve Attempt Result by Attempt ID
 */
export function getAttemptEvaluation(attemptId: string, userId: string): AssessmentAttemptResult | null {
  const attempt = localAttemptsStore.get(attemptId);
  if (!attempt || attempt.userId !== userId) {
    return null;
  }
  if (attempt.cachedResult) {
    return attempt.cachedResult;
  }
  if (attempt.status === 'completed' || attempt.status === 'expired') {
    return finalizeAssessmentAttempt(attemptId, userId, attempt.status === 'expired');
  }
  return null;
}

/**
 * 8. Retrieve Previous Attempts History for a User
 */
export function getUserAssessmentHistory(userId: string): Record<string, { count: number; latestScore: number; latestPercentage: number; latestResultStatus: 'passed' | 'failed' | 'pending' }> {
  const history: Record<string, { count: number; latestScore: number; latestPercentage: number; latestResultStatus: 'passed' | 'failed' | 'pending' }> = {};

  Array.from(localAttemptsStore.values()).forEach((att) => {
    if (att.userId === userId && (att.status === 'completed' || att.status === 'expired')) {
      const existing = history[att.assessmentId] || { count: 0, latestScore: 0, latestPercentage: 0, latestResultStatus: 'pending' };
      existing.count += 1;
      if (att.cachedResult) {
        existing.latestScore = att.cachedResult.score;
        existing.latestPercentage = att.cachedResult.percentage;
        existing.latestResultStatus = att.cachedResult.resultStatus;
      }
      history[att.assessmentId] = existing;
    }
  });

  return history;
}

/**
 * 9. Admin CSV Import Parser with Spreadsheet Formula Injection Prevention
 * Strips formula execution characters: '=', '+', '-', '@', '\t', '\r'
 */
export function sanitizeCSVCell(value: string): string {
  if (!value) return '';
  let cleaned = value.trim();
  // Formula injection defense: escape leading dangerous characters
  if (/^[=+\-@\t\r]/.test(cleaned)) {
    cleaned = `'${cleaned}`;
  }
  // Strip HTML / script tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  return cleaned;
}

export interface CSVParseResult {
  validQuestions: AssessmentQuestionFull[];
  invalidRows: Array<{ row: number; error: string; raw: string }>;
  totalRows: number;
}

export function parseQuestionCSV(csvText: string, assessmentId: string): CSVParseResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const validQuestions: AssessmentQuestionFull[] = [];
  const invalidRows: Array<{ row: number; error: string; raw: string }> = [];

  if (lines.length <= 1) {
    return { validQuestions, invalidRows, totalRows: 0 };
  }

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cells = rawLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawLine.split(',');
    const sanitizedCells = cells.map((c) => sanitizeCSVCell(c.replace(/^"|"$/g, '')));

    if (sanitizedCells.length < 7) {
      invalidRows.push({
        row: i + 1,
        error: 'Insufficient columns (minimum Question, 4 options, CorrectOption, Explanation required)',
        raw: rawLine,
      });
      continue;
    }

    const questionText = sanitizedCells[0];
    const optA = sanitizedCells[1];
    const optB = sanitizedCells[2];
    const optC = sanitizedCells[3];
    const optD = sanitizedCells[4];
    const correctOption = sanitizedCells[5]?.toUpperCase().trim();
    const explanation = sanitizedCells[6];
    const topic = sanitizedCells[7] || 'General';
    const difficultyRaw = (sanitizedCells[8] || 'Medium').trim();
    const difficulty: 'Easy' | 'Medium' | 'Hard' =
      difficultyRaw === 'Easy' || difficultyRaw === 'Hard' ? difficultyRaw : 'Medium';
    const marks = parseFloat(sanitizedCells[9] || '1.0') || 1.0;

    if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
      invalidRows.push({
        row: i + 1,
        error: `Invalid CorrectOption "${correctOption}". Must be one of: A, B, C, D`,
        raw: rawLine,
      });
      continue;
    }

    validQuestions.push({
      id: `q_imp_${Date.now()}_${i}`,
      assessmentId,
      questionText,
      questionType: 'mcq',
      options: [
        { id: 'A', text: optA },
        { id: 'B', text: optB },
        { id: 'C', text: optC },
        { id: 'D', text: optD },
      ],
      correctOption,
      explanation,
      topic,
      difficulty,
      marks,
      negativeMarks: 0.25,
      orderIndex: i,
    });
  }

  return {
    validQuestions,
    invalidRows,
    totalRows: lines.length - 1,
  };
}
