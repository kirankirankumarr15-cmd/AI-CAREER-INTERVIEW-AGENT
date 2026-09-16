import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProgressData, LearningTopic } from '@/types';

interface ProgressState {
  progress: UserProgressData;
  roadmaps: LearningTopic[];

  toggleMissionTask: (taskId: string) => void;
  markTopicMastered: (topicId: string) => void;
  addLearningTopic: (topic: Omit<LearningTopic, 'id'>) => void;
  updateScores: (scores: Partial<UserProgressData>) => void;
}

const defaultProgress: UserProgressData = {
  readinessScore: 78,
  questionsSolved: 42,
  interviewsCompleted: 6,
  dailyStreak: 5,
  technicalKnowledge: 82,
  communicationScore: 74,
  confidenceScore: 69,
  dsaScore: 75,
  dbmsScore: 62,
  osScore: 70,
  oopScore: 85,
  projectsScore: 88,
  resumeScore: 85,
  weakAreas: ['DBMS Joins & Indexing', 'Speaking Confidence', 'STAR Behavioral Structure'],
  todaysMission: {
    completed: 2,
    total: 5,
    tasks: [
      { id: 'm-1', text: 'Answer 2 technical questions (DBMS / Indexing)', category: 'Technical', done: true },
      { id: 'm-2', text: 'Solve 1 Coding challenge (Array Sliding Window)', category: 'Coding', done: true },
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
    status: 'In Progress',
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
    }),
    {
      name: 'careerpilot-progress-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
