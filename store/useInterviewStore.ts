import { create } from 'zustand';
import { InterviewType, InterviewDifficulty, InterviewMode, InterviewQuestionItem, AnswerEvaluation } from '@/types';

interface InterviewState {
  isActive: boolean;
  targetRole: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  mode: InterviewMode;
  companyName: string;
  currentQuestionIndex: number;
  questions: InterviewQuestionItem[];
  isAiSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  interviewScore?: {
    overall: number;
    technical: number;
    communication: number;
    confidence: number;
    problemSolving: number;
    project: number;
    hr: number;
    strongAreas: string[];
    weakAreas: string[];
    recommendations: string[];
  };

  startInterview: (config: {
    targetRole: string;
    interviewType: InterviewType;
    difficulty: InterviewDifficulty;
    mode: InterviewMode;
    companyName?: string;
  }) => void;
  setQuestions: (questions: InterviewQuestionItem[]) => void;
  nextQuestion: () => void;
  setTranscript: (text: string) => void;
  setAiSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;
  setProcessing: (processing: boolean) => void;
  submitAnswer: (questionId: string, answerText: string, evaluation: AnswerEvaluation) => void;
  completeInterview: (finalScore: InterviewState['interviewScore']) => void;
  resetInterview: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  isActive: false,
  targetRole: 'Full Stack Developer',
  interviewType: 'Technical',
  difficulty: 'Intermediate',
  mode: 'Professional',
  companyName: '',
  currentQuestionIndex: 0,
  questions: [],
  isAiSpeaking: false,
  isListening: false,
  isProcessing: false,
  transcript: '',

  startInterview: (config) =>
    set({
      isActive: true,
      targetRole: config.targetRole,
      interviewType: config.interviewType,
      difficulty: config.difficulty,
      mode: config.mode,
      companyName: config.companyName || '',
      currentQuestionIndex: 0,
      questions: [],
      transcript: '',
      interviewScore: undefined,
    }),

  setQuestions: (questions) => set({ questions }),

  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1),
      transcript: '',
    })),

  setTranscript: (transcript) => set({ transcript }),
  setAiSpeaking: (isAiSpeaking) => set({ isAiSpeaking }),
  setListening: (isListening) => set({ isListening }),
  setProcessing: (isProcessing) => set({ isProcessing }),

  submitAnswer: (questionId, studentAnswer, evaluation) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId ? { ...q, studentAnswer, evaluation } : q
      ),
    })),

  completeInterview: (interviewScore) =>
    set({
      isActive: false,
      interviewScore,
    }),

  resetInterview: () =>
    set({
      isActive: false,
      currentQuestionIndex: 0,
      questions: [],
      transcript: '',
      interviewScore: undefined,
      isAiSpeaking: false,
      isListening: false,
      isProcessing: false,
    }),
}));
