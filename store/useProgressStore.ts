import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProgressData, LearningTopic } from '@/types';
import { createClient } from '@/utils/supabase/client';

interface ProgressState {
  progress: UserProgressData;
  roadmaps: LearningTopic[];

  toggleMissionTask: (taskId: string) => void;
  markTopicMastered: (topicId: string) => void;
  addLearningTopic: (topic: Omit<LearningTopic, 'id'>) => void;
  updateScores: (scores: Partial<UserProgressData>) => void;
  resetProgress: () => void;
  syncWithSupabase: () => Promise<void>;
}

const defaultProgress: UserProgressData = {
  readinessScore: 0,
  questionsSolved: 0,
  interviewsCompleted: 0,
  dailyStreak: 1,
  technicalKnowledge: 0,
  communicationScore: 0,
  confidenceScore: 0,
  dsaScore: 0,
  dbmsScore: 0,
  osScore: 0,
  oopScore: 0,
  projectsScore: 0,
  resumeScore: 0,
  weakAreas: [],
  todaysMission: {
    completed: 0,
    total: 5,
    tasks: [
      { id: 'm-1', text: 'Answer 2 technical questions (DBMS / Indexing)', category: 'Technical', done: false },
      { id: 'm-2', text: 'Solve 1 Coding challenge (Array Sliding Window)', category: 'Coding', done: false },
      { id: 'm-3', text: 'Complete 1 Communication pitch (Tell Me About Yourself)', category: 'Communication', done: false },
      { id: 'm-4', text: 'Practice 1 Behavioral STAR Question', category: 'HR', done: false },
      { id: 'm-5', text: '5-minute AI Mock Interview practice session', category: 'Interview', done: false },
    ],
  },
};

const defaultRoadmaps: LearningTopic[] = [
  {
    id: 'rt-1',
    topic: 'DBMS Joins, Indexing & Query Optimization',
    category: 'Database',
    estimatedMinutes: 25,
    status: 'To Learn',
    resources: [
      { title: 'Understanding INNER, LEFT, RIGHT & FULL Joins visually', url: '#', type: 'Article' },
      { title: 'B-Trees & Indexing efficiency explained', url: '#', type: 'Video' },
      { title: 'Interactive SQL Join practice problems', url: '#', type: 'Practice' },
    ],
  },
  {
    id: 'rt-2',
    topic: 'STAR Method for Behavioral HR Interviews',
    category: 'HR & Communication',
    estimatedMinutes: 20,
    status: 'To Learn',
    resources: [
      { title: 'Mastering Situation-Task-Action-Result format', url: '#', type: 'Article' },
      { title: '10 Most common behavioral questions and winning answers', url: '#', type: 'Video' },
    ],
  },
  {
    id: 'rt-3',
    topic: 'Reducing Speech Hesitations & Filler Words',
    category: 'Communication',
    estimatedMinutes: 15,
    status: 'To Learn',
    resources: [
      { title: 'Pausing strategically instead of saying "Um" or "Like"', url: '#', type: 'Article' },
      { title: 'Micro-speech exercises for clear articulation', url: '#', type: 'Practice' },
    ],
  },
];

// Clean legacy stale dummy data from user browser storage
if (typeof window !== 'undefined') {
  try {
    const legacy = localStorage.getItem('careerpilot-progress-store');
    if (legacy && (legacy.includes('"completed":2') || legacy.includes('"technicalKnowledge":82') || legacy.includes('"questionsSolved":42'))) {
      localStorage.removeItem('careerpilot-progress-store');
    }
  } catch {}
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      progress: defaultProgress,
      roadmaps: defaultRoadmaps,

      toggleMissionTask: (taskId) =>
        set((state) => {
          const updatedTasks = state.progress.todaysMission.tasks.map((t) =>
            t.id === taskId ? { ...t, done: !t.done } : t
          );
          const completedCount = updatedTasks.filter((t) => t.done).length;
          return {
            progress: {
              ...state.progress,
              todaysMission: {
                ...state.progress.todaysMission,
                completed: completedCount,
                tasks: updatedTasks,
              },
            },
          };
        }),

      markTopicMastered: (topicId) =>
        set((state) => ({
          roadmaps: state.roadmaps.map((r) =>
            r.id === topicId ? { ...r, status: 'Mastered' as const } : r
          ),
        })),

      addLearningTopic: (topic) =>
        set((state) => ({
          roadmaps: [...state.roadmaps, { ...topic, id: `rt-${Date.now()}` }],
        })),

      updateScores: (newScores) =>
        set((state) => ({
          progress: { ...state.progress, ...newScores },
        })),

      resetProgress: () =>
        set(() => ({
          progress: defaultProgress,
          roadmaps: defaultRoadmaps,
        })),

      syncWithSupabase: async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: prog } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (prog) {
            set((state) => ({
              progress: {
                ...state.progress,
                technicalKnowledge: prog.technical_knowledge ?? 0,
                communicationScore: prog.communication_score ?? 0,
                confidenceScore: prog.confidence_score ?? 0,
                dsaScore: prog.dsa_score ?? 0,
                dbmsScore: prog.dbms_score ?? 0,
                osScore: prog.os_score ?? 0,
                oopScore: prog.oop_score ?? 0,
                projectsScore: prog.projects_score ?? 0,
                resumeScore: prog.resume_score ?? 0,
                weakAreas: Array.isArray(prog.weak_areas) ? prog.weak_areas : [],
                questionsSolved: prog.questions_solved ?? 0,
                interviewsCompleted: prog.interviews_completed ?? 0,
                dailyStreak: prog.daily_streak ?? 1,
              },
            }));
          }
        } catch (err) {
          console.error('Failed to sync progress with Supabase:', err);
        }
      },
    }),
    {
      name: 'careerpilot-progress-store-v2',
      version: 2,
      migrate: (persistedState: any) => {
        // If persisted state has legacy dummy values, return clean initial state
        if (
          persistedState?.progress?.todaysMission?.completed === 2 ||
          persistedState?.progress?.technicalKnowledge === 82 ||
          persistedState?.progress?.questionsSolved === 42
        ) {
          return {
            progress: defaultProgress,
            roadmaps: defaultRoadmaps,
          };
        }
        return persistedState;
      },
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
