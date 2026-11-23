import { create } from 'zustand';

export interface QuestionAttempt {
  questionId: string;
  subjectId: string;
  status: 'solved' | 'attempted';
  isCorrect: boolean;
  selectedAnswer: string | null;
  attemptsCount: number;
  attemptedAt: string;
}

export interface SubjectProgressStat {
  subjectId: string;
  name: string;
  solved: number;
  attempted: number;
  total: number;
  accuracy: number;
}

export interface RecentActivityItem {
  questionId: string;
  questionTitle: string;
  subjectId: string;
  subjectName: string;
  isCorrect: boolean;
  attemptedAt: string;
}

interface PracticeState {
  isLoading: boolean;
  userId: string | null;
  totalSolved: number;
  totalAttempted: number;
  totalQuestions: number;
  accuracy: number;
  streak: number;
  subjectStats: Record<string, SubjectProgressStat>;
  recentActivity: RecentActivityItem[];
  attempts: Record<string, QuestionAttempt>;
  bookmarkedIds: string[];

  // Core Actions
  fetchProgress: () => Promise<void>;
  submitAnswer: (params: {
    questionId: string;
    subjectId: string;
    selectedAnswer: string;
    timeTakenSeconds?: number;
    isCodingOrText?: boolean;
  }) => Promise<{
    success: boolean;
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  }>;
  toggleBookmark: (questionId: string) => void;
  recordAttempt: (
    questionId: string,
    category: string,
    topic: string,
    passed: boolean,
    score: number,
    hintsUsed: number,
    timeSeconds: number,
    totalPoints: number
  ) => Promise<void>;
}

export const usePracticeStore = create<PracticeState>()((set, get) => ({
  isLoading: true,
  userId: null,
  totalSolved: 0,
  totalAttempted: 0,
  totalQuestions: 70,
  accuracy: 0,
  streak: 0,
  subjectStats: {},
  recentActivity: [],
  attempts: {},
  bookmarkedIds: [],

  fetchProgress: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/practice/progress', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch student progress (Status ${res.status})`);
      }

      const data = await res.json();
      if (data.authenticated) {
        set({
          isLoading: false,
          userId: data.userId || null,
          totalSolved: data.totalSolved ?? 0,
          totalAttempted: data.totalAttempted ?? 0,
          totalQuestions: data.totalQuestions ?? 70,
          accuracy: data.accuracy ?? 0,
          streak: data.streak ?? 0,
          subjectStats: data.subjectStats || {},
          recentActivity: data.recentActivity || [],
          attempts: data.attempts || {},
        });
      } else {
        set({
          isLoading: false,
          userId: null,
          totalSolved: 0,
          totalAttempted: 0,
          accuracy: 0,
          streak: 0,
          subjectStats: {},
          recentActivity: [],
          attempts: {},
        });
      }
    } catch (err) {
      console.error('Error in fetchProgress:', err);
      set({ isLoading: false });
    }
  },

  submitAnswer: async ({ questionId, subjectId, selectedAnswer, timeTakenSeconds = 0, isCodingOrText = false }) => {
    const res = await fetch('/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId,
        subjectId,
        selectedAnswer,
        timeTakenSeconds,
        isCodingOrText,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.error || `Server failed to save answer (HTTP ${res.status})`;
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Server reported failure recording answer');
    }

    if (data.progress) {
      set({
        totalSolved: data.progress.totalSolved ?? 0,
        totalAttempted: data.progress.totalAttempted ?? 0,
        totalQuestions: data.progress.totalQuestions ?? 70,
        accuracy: data.progress.accuracy ?? 0,
        streak: data.progress.streak ?? 0,
        subjectStats: data.progress.subjectStats || {},
        recentActivity: data.progress.recentActivity || [],
        attempts: data.progress.attempts || {},
      });
    }

    return {
      success: true,
      isCorrect: data.isCorrect,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
    };
  },

  toggleBookmark: (questionId: string) => {
    set((state) => ({
      bookmarkedIds: state.bookmarkedIds.includes(questionId)
        ? state.bookmarkedIds.filter((id) => id !== questionId)
        : [...state.bookmarkedIds, questionId],
    }));
  },

  recordAttempt: async (questionId, category, _topic, passed, _score, _hints, timeSeconds) => {
    // Adapter for code execution and legacy pages
    try {
      await get().submitAnswer({
        questionId,
        subjectId: category,
        selectedAnswer: passed ? 'CODE_PASSED' : 'CODE_ATTEMPTED',
        timeTakenSeconds: timeSeconds,
        isCodingOrText: true,
      });
    } catch (err) {
      console.error('Error in recordAttempt adapter:', err);
    }
  },
}));
