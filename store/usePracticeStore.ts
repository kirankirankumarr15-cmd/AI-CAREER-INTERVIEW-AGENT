import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QuestionStatus } from '@/lib/practice/questions';

export interface QuestionAttempt {
  questionId: string;
  status: QuestionStatus;
  score: number;
  hintsUsed: number;
  attempts: number;
  lastAttemptAt: string;
  timeSpentSeconds: number;
  correctCount: number;
  incorrectCount: number;
}

export interface TopicProgress {
  topicId: string;
  topicLabel: string;
  category: string;
  totalQuestions: number;
  solved: number;
  accuracy: number; // 0-100
  lastPracticed?: string;
}

export interface PracticeSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  questionIds: string[];
  completed: number;
  score: number;
  mode: string;
}

export interface CategoryStats {
  category: string;
  totalSolved: number;
  totalQuestions: number;
  accuracy: number;
  skillScore: number; // 0-100
}

interface PracticeState {
  // Per-question tracking
  attempts: Record<string, QuestionAttempt>;
  // Per-topic progress
  topicProgress: Record<string, TopicProgress>;
  // Per-category aggregates
  categoryStats: Record<string, CategoryStats>;
  // Bookmark list
  bookmarkedIds: string[];
  // Current practice session
  currentSession: PracticeSession | null;
  // Overall stats
  totalSolved: number;
  totalPoints: number;
  dailyStreak: number;
  lastPracticeDate: string;
  weeklyGoal: number;
  weeklyProgress: number;
  // Weak areas (category ids sorted by accuracy asc)
  weakAreas: string[];
  // Last recommendation
  recommendedQuestionId: string | null;

  // Actions
  recordAttempt: (
    questionId: string,
    category: string,
    topic: string,
    passed: boolean,
    score: number,
    hintsUsed: number,
    timeSeconds: number,
    totalPoints: number
  ) => void;
  toggleBookmark: (questionId: string) => void;
  startSession: (mode: string, questionIds: string[]) => string;
  endSession: (sessionId: string, completed: number, score: number) => void;
  updateCategoryStats: (category: string, stats: Partial<CategoryStats>) => void;
  setRecommendation: (questionId: string) => void;
  resetProgress: () => void;
}

const defaultCategoryStats: Record<string, CategoryStats> = {
  dbms: { category: 'dbms', totalSolved: 8, totalQuestions: 40, accuracy: 72, skillScore: 68 },
  dsa: { category: 'dsa', totalSolved: 24, totalQuestions: 80, accuracy: 65, skillScore: 62 },
  java: { category: 'java', totalSolved: 12, totalQuestions: 35, accuracy: 78, skillScore: 74 },
  oop: { category: 'oop', totalSolved: 6, totalQuestions: 20, accuracy: 80, skillScore: 76 },
  os: { category: 'os', totalSolved: 5, totalQuestions: 25, accuracy: 58, skillScore: 55 },
  cn: { category: 'cn', totalSolved: 4, totalQuestions: 20, accuracy: 52, skillScore: 48 },
  aptitude: { category: 'aptitude', totalSolved: 18, totalQuestions: 50, accuracy: 84, skillScore: 80 },
  hr: { category: 'hr', totalSolved: 3, totalQuestions: 15, accuracy: 70, skillScore: 65 },
};

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set) => ({
      attempts: {},
      topicProgress: {},
      categoryStats: defaultCategoryStats,
      bookmarkedIds: [],
      currentSession: null,
      totalSolved: 80,
      totalPoints: 6200,
      dailyStreak: 5,
      lastPracticeDate: new Date().toISOString().split('T')[0],
      weeklyGoal: 50,
      weeklyProgress: 28,
      weakAreas: ['cn', 'os', 'dsa'],
      recommendedQuestionId: null,

      recordAttempt: (questionId, category, topic, passed, score, hintsUsed, timeSeconds, pts) =>
        set((state) => {
          const prev = state.attempts[questionId];
          const newAttempt: QuestionAttempt = {
            questionId,
            status: passed ? (prev?.correctCount >= 2 ? 'mastered' : 'solved') : 'attempted',
            score,
            hintsUsed,
            attempts: (prev?.attempts || 0) + 1,
            lastAttemptAt: new Date().toISOString(),
            timeSpentSeconds: (prev?.timeSpentSeconds || 0) + timeSeconds,
            correctCount: (prev?.correctCount || 0) + (passed ? 1 : 0),
            incorrectCount: (prev?.incorrectCount || 0) + (passed ? 0 : 1),
          };

          const prevCat = state.categoryStats[category] || defaultCategoryStats[category] || {
            category, totalSolved: 0, totalQuestions: 20, accuracy: 0, skillScore: 0,
          };

          const newSolved = passed && !prev ? prevCat.totalSolved + 1 : prevCat.totalSolved;
          const totalAttempts = (prevCat.totalSolved > 0 ? prevCat.totalSolved : 0) + (passed ? 1 : 0) + (prev?.incorrectCount || 0) + 1;
          const newAccuracy = Math.round((newSolved / Math.max(1, totalAttempts)) * 100);

          const updatedCategoryStats = {
            ...state.categoryStats,
            [category]: {
              ...prevCat,
              totalSolved: newSolved,
              accuracy: newAccuracy,
              skillScore: Math.min(100, Math.round(newAccuracy * 0.7 + (newSolved / Math.max(1, prevCat.totalQuestions)) * 30)),
            },
          };

          // Recompute weak areas
          const weakAreas = Object.values(updatedCategoryStats)
            .sort((a, b) => a.skillScore - b.skillScore)
            .slice(0, 3)
            .map(s => s.category);

          const today = new Date().toISOString().split('T')[0];
          const isNewDay = state.lastPracticeDate !== today;

          return {
            attempts: { ...state.attempts, [questionId]: newAttempt },
            categoryStats: updatedCategoryStats,
            totalSolved: passed && !prev ? state.totalSolved + 1 : state.totalSolved,
            totalPoints: state.totalPoints + (passed ? pts : Math.round(pts * 0.1)),
            dailyStreak: isNewDay ? state.dailyStreak + 1 : state.dailyStreak,
            lastPracticeDate: today,
            weeklyProgress: state.weeklyProgress + (passed ? 1 : 0),
            weakAreas,
          };
        }),

      toggleBookmark: (questionId) =>
        set((state) => ({
          bookmarkedIds: state.bookmarkedIds.includes(questionId)
            ? state.bookmarkedIds.filter(id => id !== questionId)
            : [...state.bookmarkedIds, questionId],
        })),

      startSession: (mode, questionIds) => {
        const sessionId = `session-${Date.now()}`;
        const session: PracticeSession = {
          id: sessionId,
          startedAt: new Date().toISOString(),
          questionIds,
          completed: 0,
          score: 0,
          mode,
        };
        set({ currentSession: session });
        return sessionId;
      },

      endSession: (sessionId, completed, score) =>
        set((state) => {
          if (state.currentSession?.id !== sessionId) return state;
          return {
            currentSession: {
              ...state.currentSession!,
              endedAt: new Date().toISOString(),
              completed,
              score,
            },
          };
        }),

      updateCategoryStats: (category, stats) =>
        set((state) => ({
          categoryStats: {
            ...state.categoryStats,
            [category]: { ...(state.categoryStats[category] || {}), ...stats } as CategoryStats,
          },
        })),

      setRecommendation: (questionId) => set({ recommendedQuestionId: questionId }),

      resetProgress: () =>
        set({
          attempts: {},
          topicProgress: {},
          categoryStats: defaultCategoryStats,
          totalSolved: 0,
          totalPoints: 0,
          dailyStreak: 0,
          weeklyProgress: 0,
          weakAreas: ['cn', 'os', 'dsa'],
          recommendedQuestionId: null,
        }),
    }),
    {
      name: 'careerpilot-practice-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    }
  )
);

// Derived selectors
export function selectOverallReadiness(stats: Record<string, CategoryStats>): number {
  const weights: Record<string, number> = {
    dsa: 0.25, dbms: 0.20, java: 0.15, oop: 0.12, os: 0.10,
    cn: 0.08, aptitude: 0.05, hr: 0.05,
  };
  let total = 0;
  let weightSum = 0;
  for (const [cat, weight] of Object.entries(weights)) {
    const s = stats[cat];
    if (s) { total += s.skillScore * weight; weightSum += weight; }
  }
  return weightSum > 0 ? Math.round(total / weightSum) : 0;
}

export function selectReadinessLevel(score: number): number {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 35) return 2;
  return 1;
}

export const READINESS_LABELS: Record<number, string> = {
  1: 'Foundation',
  2: 'Developing',
  3: 'Interview Ready',
  4: 'Strong Candidate',
  5: 'Placement Ready',
};
