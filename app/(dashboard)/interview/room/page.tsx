'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterviewStore } from '@/store/useInterviewStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useProgressStore } from '@/store/useProgressStore';
import { ttsEngine } from '@/lib/speech/text-to-speech';
import { sttEngine } from '@/lib/speech/speech-to-text';
import type { TurnOutput } from '@/lib/ai/dialog-manager';
import type { PrismFinalReport } from '@/app/api/interview/finish/route';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Clock,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
  History,
  Briefcase,
  HelpCircle,
  BarChart3,
  User,
  LogOut,
  ChevronRight,
  TrendingUp,
  Brain,
  Lightbulb,
  Award,
  Layers,
  Flame,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import Link from 'next/link';

interface ConversationEntry {
  role: 'ai' | 'user';
  text: string;
  questionId?: string;
  category?: string;
}

interface RunningPerformance {
  overallScore: number;
  communication: number;
  technicalKnowledge: number;
  confidence: number;
  answerClarity: number;
  mentorMessage: string;
  competencies: {
    technicalKnowledge: number;
    problemSolving: number;
    communication: number;
    leadership: number;
    teamwork: number;
  };
  actionableSuggestions: string[];
  answeredTurnsCount: number;
}

export default function InterviewRoomPage() {
  const router = useRouter();
  const { profile, projects } = useProfileStore();
  const { updateScores } = useProgressStore();
  const {
    targetRole,
    interviewType,
    difficulty,
    mode,
    companyName,
    experienceLevel,
    technicalSubject,
    durationMinutes = 15,
    setAiSpeaking,
    setListening,
    setProcessing,
    isAiSpeaking,
    isListening,
    isProcessing,
  } = useInterviewStore();

  // ─── Session State ──────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const totalTurns = durationMinutes === 10 ? 4 : durationMinutes === 20 ? 8 : 6;
  const [lastQuestionId, setLastQuestionId] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState('');
  const [lastQuestionCategory, setLastQuestionCategory] = useState('Introduction');
  const [isComplete, setIsComplete] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'interview' | 'history' | 'mocks' | 'feedback' | 'progress' | 'profile' | 'help'>('interview');
  const [showConfirmEndModal, setShowConfirmEndModal] = useState(false);
  const [finalReport, setFinalReport] = useState<PrismFinalReport | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySessions, setHistorySessions] = useState<any[]>([]);

  // ─── Running Performance & Real-time Metrics ────────────────────────────────
  const [runningScores, setRunningScores] = useState<RunningPerformance>({
    overallScore: 0,
    communication: 0,
    technicalKnowledge: 0,
    confidence: 0,
    answerClarity: 0,
    mentorMessage: 'Listening to your responses to evaluate your placement readiness.',
    competencies: {
      technicalKnowledge: 0,
      problemSolving: 0,
      communication: 0,
      leadership: 0,
      teamwork: 0,
    },
    actionableSuggestions: [
      'Speak in a structured format: Situation, Task, Action, Result.',
      'Explicitly cite the technologies and architectural trade-offs you chose.',
      'Quantify your impact (e.g. reduced load time by 30%).',
    ],
    answeredTurnsCount: 0,
  });

  // ─── Server-Authoritative Timer ─────────────────────────────────────────────
  const totalDurationSeconds = durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalDurationSeconds);

  // ─── Media & Voice States ───────────────────────────────────────────────────
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [silenceTimer, setSilenceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [aiState, setAiState] = useState<'waiting' | 'speaking' | 'listening' | 'processing' | 'generating' | 'complete'>('waiting');

  const videoRef = useRef<HTMLVideoElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // ─── Sync AI State with Flags ───────────────────────────────────────────────
  useEffect(() => {
    if (isComplete) {
      setAiState('complete');
    } else if (isProcessing) {
      setAiState(turnIndex > 0 ? 'generating' : 'processing');
    } else if (isAiSpeaking) {
      setAiState('speaking');
    } else if (isListening) {
      setAiState('listening');
    } else {
      setAiState('waiting');
    }
  }, [isComplete, isProcessing, isAiSpeaking, isListening, turnIndex]);

  // ─── Speak via TTS with animated waveform ───────────────────────────────────
  const speakMessage = useCallback(
    (text: string) => {
      if (isMuted) return;
      ttsEngine.speak(
        text,
        () => {
          setAiSpeaking(true);
        },
        () => {
          setAiSpeaking(false);
          // Auto-activate microphone when AI finishes asking the question
          if (!showTextInput && sttEngine.isSupported()) {
            startVoiceCapture();
          }
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMuted, showTextInput]
  );

  // ─── Real-time Voice Capture (STT) ──────────────────────────────────────────
  const startVoiceCapture = useCallback(() => {
    if (!sttEngine.isSupported()) {
      setShowTextInput(true);
      return;
    }
    setListening(true);
    sttEngine.start(
      (text: string) => {
        setLiveTranscript(text);
      },
      (err: string) => {
        console.warn('[STT] Speech recognition notice:', err);
        setListening(false);
      }
    );
  }, [setListening]);

  const stopVoiceCapture = useCallback(() => {
    sttEngine.stop();
    setListening(false);
  }, [setListening]);

  const toggleMicrophone = useCallback(() => {
    if (isListening) {
      stopVoiceCapture();
    } else {
      ttsEngine.stop();
      setAiSpeaking(false);
      startVoiceCapture();
    }
  }, [isListening, startVoiceCapture, stopVoiceCapture, setAiSpeaking]);

  // ─── Silence Nudge: gentle reminder after 35 seconds of quiet ───────────────
  const scheduleSilenceNudge = useCallback(() => {
    if (silenceTimer) clearTimeout(silenceTimer);
    const t = setTimeout(() => {
      if (!isProcessing && !isComplete) {
        const nudgeText = "Take your time. You can speak your thoughts aloud into the microphone or type them in the box.";
        setConversationHistory((prev) => [...prev, { role: 'ai', text: nudgeText }]);
        speakMessage(nudgeText);
      }
    }, 35_000);
    setSilenceTimer(t);
  }, [silenceTimer, isProcessing, isComplete, speakMessage]);

  // ─── Start Session API ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let timerInterval: ReturnType<typeof setInterval> | null = null;
    let authoritativeDeadline = Date.now() + totalDurationSeconds * 1000;

    const startTimerCountdown = (deadlineMs: number) => {
      authoritativeDeadline = deadlineMs;
      if (timerInterval) clearInterval(timerInterval);

      timerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((authoritativeDeadline - Date.now()) / 1000));
        setSecondsRemaining(remaining);

        if (remaining === 0 && !isComplete && !isFinishing) {
          if (timerInterval) clearInterval(timerInterval);
          handleAutoSubmitOnTimeOut();
        }
      }, 1000);
    };

    const startSession = async () => {
      setProcessing(true);
      setSessionError(null);

      try {
        const res = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetRole: targetRole || profile.targetRole || 'Software Developer (SDE)',
            interviewType: interviewType === 'Resume-based' ? 'Project' : interviewType,
            difficulty,
            mode,
            companyName: companyName || undefined,
            experienceLevel: experienceLevel || 'Fresh Graduate',
            totalTurns,
            isFirstTimerMode: false,
            sessionMode: 'solo',
            profile: {
              id: profile.id || 'student-demo',
              fullName: profile.fullName || 'Student',
              cgpa: profile.cgpa,
              college: profile.college || 'PESITM Shivamogga',
              branch: profile.branch || 'Computer Science & Engineering',
              targetRole: profile.targetRole,
            },
            projects: (projects ?? []).slice(0, 3).map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              techStack: p.techStack,
              verificationStatus: p.verificationStatus,
            })),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          if (!cancelled) setSessionError(err.error || 'Failed to initialize session.');
          return;
        }

        const data: {
          sessionId: string;
          greeting: TurnOutput;
          startedAt?: string;
          deadlineAt?: string;
          durationSeconds?: number;
        } = await res.json();

        if (cancelled) return;

        setSessionId(data.sessionId);
        setLastQuestion(data.greeting.questionText);
        setLastQuestionCategory(data.greeting.category || 'Introduction');

        if (data.deadlineAt) {
          startTimerCountdown(new Date(data.deadlineAt).getTime());
        } else {
          startTimerCountdown(Date.now() + totalDurationSeconds * 1000);
        }

        setConversationHistory([
          { role: 'ai', text: data.greeting.questionText, category: data.greeting.category },
        ]);
        speakMessage(data.greeting.questionText);
        scheduleSilenceNudge();
      } catch (err) {
        console.error('[InterviewRoom] Start error:', err);
        if (!cancelled) setSessionError('Could not connect to PRISM interview intelligence. Please refresh or retry.');
      } finally {
        if (!cancelled) setProcessing(false);
      }
    };

    startSession();

    return () => {
      cancelled = true;
      if (timerInterval) clearInterval(timerInterval);
      if (silenceTimer) clearTimeout(silenceTimer);
      ttsEngine.stop();
      sttEngine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Optional Webcam Toggle ─────────────────────────────────────────────────
  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCameraEnabled(false);
    } else {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setStream(media);
          setCameraEnabled(true);
          if (videoRef.current) {
            videoRef.current.srcObject = media;
          }
        }
      } catch (err) {
        console.warn('Camera access denied:', err);
        alert('Camera access was not granted. The interview will proceed in audio mode.');
        setCameraEnabled(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // ─── Conclude Interview & Generate Comprehensive Evaluation ─────────────────
  const finishInterviewSession = async (history: ConversationEntry[]) => {
    setIsFinishing(true);
    setIsComplete(true);
    ttsEngine.stop();
    sttEngine.stop();
    setListening(false);
    setAiSpeaking(false);

    try {
      const finishRes = await fetch('/api/interview/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || 'session-local',
          transcript: history,
        }),
      });

      if (finishRes.ok) {
        const finishData = await finishRes.json();
        const report = finishData.report as PrismFinalReport;
        if (report?.overallScore) {
          updateScores({ readinessScore: report.overallScore });
        }
        setFinalReport(report);
        if (typeof window !== 'undefined' && report) {
          sessionStorage.setItem('interview_report', JSON.stringify({ sessionId, report }));
        }
      }
    } catch (err) {
      console.error('[InterviewRoom] Finish error:', err);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleAutoSubmitOnTimeOut = () => {
    const finalAnswer = typedAnswer || liveTranscript || '(Time elapsed)';
    const updatedHistory: ConversationEntry[] = [
      ...conversationHistory,
      { role: 'user', text: finalAnswer },
    ];
    setConversationHistory(updatedHistory);
    finishInterviewSession(updatedHistory);
  };

  const handleEnd = () => {
    setShowConfirmEndModal(true);
  };

  const confirmEndInterview = () => {
    setShowConfirmEndModal(false);
    finishInterviewSession(conversationHistory);
  };

  // ─── Submit Student Answer & Progress Turn ──────────────────────────────────
  const handleSubmitAnswer = async () => {
    if (silenceTimer) clearTimeout(silenceTimer);

    const finalAnswer = (typedAnswer || liveTranscript || '').trim();
    if (!finalAnswer) return;

    setProcessing(true);
    ttsEngine.stop();
    sttEngine.stop();
    setListening(false);

    const updatedHistory: ConversationEntry[] = [
      ...conversationHistory,
      { role: 'user', text: finalAnswer },
    ];
    setConversationHistory(updatedHistory);
    setTypedAnswer('');
    setLiveTranscript('');

    const nextTurnIndex = turnIndex + 1;
    const isLastTurn = nextTurnIndex >= totalTurns;

    if (isLastTurn) {
      finishInterviewSession(updatedHistory);
      return;
    }

    try {
      const res = await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || 'session-local',
          turnIndex,
          totalTurns,
          studentAnswer: finalAnswer,
          lastQuestion,
          lastQuestionCategory,
          lastQuestionId,
          interviewType: interviewType === 'Resume-based' ? 'Project' : interviewType,
          difficulty,
          mode,
          targetRole: targetRole || profile.targetRole || 'Software Developer (SDE)',
          companyName: companyName || undefined,
          experienceLevel: experienceLevel || 'Fresh Graduate',
          isFirstTimerMode: false,
          profile: {
            id: profile.id || 'student-demo',
            fullName: profile.fullName || 'Student',
            cgpa: profile.cgpa,
            college: profile.college || 'PESITM Shivamogga',
            branch: profile.branch || 'Computer Science & Engineering',
            targetRole: profile.targetRole,
          },
          projects: (projects ?? []).slice(0, 3).map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            techStack: p.techStack,
            verificationStatus: p.verificationStatus,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setSessionError(err.error || 'Failed to process response.');
        setProcessing(false);
        return;
      }

      const data = await res.json();
      const next: TurnOutput = data.next;

      // Update Running Real-time Scorecard from live evaluated answer
      if (data.runningScores) {
        setRunningScores(data.runningScores);
      }

      setConversationHistory((prev) => [
        ...prev,
        { role: 'ai', text: next.questionText, category: next.category },
      ]);
      setTurnIndex(nextTurnIndex);
      setLastQuestion(next.questionText);
      setLastQuestionCategory(next.category || 'Technical');
      setLastQuestionId(next.questionText);
      speakMessage(next.questionText);

      if (next.isInterviewComplete) {
        finishInterviewSession(updatedHistory);
      } else {
        scheduleSilenceNudge();
      }
    } catch (err) {
      console.error('[InterviewRoom] Turn error:', err);
      setSessionError('Network error connecting to interview intelligence. Please re-submit.');
    } finally {
      setProcessing(false);
    }
  };

  // Keyboard shortcut: Ctrl+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  // ─── Fetch Past Interviews for History Modal ────────────────────────────────
  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    try {
      const res = await fetch('/api/interview/history');
      if (res.ok) {
        const d = await res.json();
        setHistorySessions(d.sessions || []);
      }
    } catch {}
  };

  // Timer formatting
  const timerMins = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
  const timerSecs = (secondsRemaining % 60).toString().padStart(2, '0');
  const isUrgentTimer = secondsRemaining <= 30;
  const isWarningTimer = secondsRemaining <= 120 && secondsRemaining > 30;

  // Question progress percentage
  const progressPercent = Math.min(100, Math.round(((turnIndex + 1) / totalTurns) * 100));

  return (
    <div className="fixed inset-0 z-[100] bg-[#070A13] text-slate-200 font-sans flex flex-col overflow-hidden select-none">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-slate-800/80 bg-[#0B1120]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Live indicator badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Interview in Progress</span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Job Role & Type Badges */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-tight">
              {targetRole || 'Software Developer (SDE)'}
            </span>
            <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
              {interviewType} Track
            </span>
            {technicalSubject && (
              <span className="hidden lg:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                {technicalSubject}
              </span>
            )}
          </div>
        </div>

        {/* Right Header: Timer, Voice Mute, End Call, Profile */}
        <div className="flex items-center gap-3">
          {/* Live countdown timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold transition-all ${
              isUrgentTimer
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : isWarningTimer
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-300'
            }`}
          >
            <Clock className="h-3.5 w-3.5 opacity-70" />
            <span>{timerMins}:{timerSecs}</span>
          </div>

          {/* Mute AI Voice */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* End Interview Action */}
          <button
            onClick={handleEnd}
            className="flex items-center gap-1.5 bg-rose-600/90 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 cursor-pointer active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End Interview</span>
          </button>

          {/* User Profile Chip */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
              {(profile.fullName || 'K')[0]}
            </div>
          </div>
        </div>
      </header>

      {/* ── 3-COLUMN MAIN WORKSPACE ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── 1. LEFT NAVIGATION SIDEBAR ───────────────────────────────────── */}
        <aside className="w-56 border-r border-slate-800/80 bg-[#0A0E1A] flex flex-col justify-between shrink-0 hidden md:flex z-10">
          <div className="p-4 space-y-6">
            {/* PRISM Brand Header */}
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-500/20">
                P
              </div>
              <div>
                <div className="text-xs font-black tracking-wider text-white">PRISM AI</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Placement Hub</div>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveSidebarTab('interview')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all bg-blue-600/20 text-blue-400 border border-blue-500/30"
              >
                <Briefcase className="h-4 w-4" />
                <span>Interview</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              </button>

              <button
                onClick={openHistoryModal}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all text-left"
              >
                <History className="h-4 w-4" />
                <span>Interview History</span>
              </button>

              <button
                onClick={() => router.push('/interview')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all text-left"
              >
                <Layers className="h-4 w-4" />
                <span>Mock Interviews</span>
              </button>

              <button
                onClick={() => setActiveSidebarTab('feedback')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all text-left"
              >
                <Award className="h-4 w-4" />
                <span>Rubrics & Feedback</span>
              </button>

              <button
                onClick={() => router.push('/readiness')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all text-left"
              >
                <BarChart3 className="h-4 w-4" />
                <span>My Progress</span>
              </button>

              <button
                onClick={() => router.push('/profile')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all text-left"
              >
                <User className="h-4 w-4" />
                <span>Candidate Profile</span>
              </button>

              <button
                onClick={() => setActiveSidebarTab('help')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all text-left"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Interview Guide</span>
              </button>
            </nav>
          </div>

          {/* Sidebar Bottom: Credits / Quota & User Card */}
          <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#080B15]">
            {/* Daily Quota */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-amber-400" /> Daily AI Quota
                </span>
                <span className="text-white font-bold">18 / 20</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[90%]" />
              </div>
            </div>

            {/* Account Card */}
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                {(profile.fullName || 'S')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {profile.fullName || 'Placement Candidate'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {profile.college || 'PESITM Shivamogga'}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── 2. CENTRAL INTERVIEW WORKSPACE ───────────────────────────────── */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
          {sessionError && (
            <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs px-4 py-3 rounded-2xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{sessionError}</span>
              <button className="ml-auto text-rose-400 hover:text-white" onClick={() => setSessionError(null)}>
                ✕
              </button>
            </div>
          )}

          {/* ── TOP CENTRAL: AI INTERVIEWER STAGE ──────────────────────────── */}
          <div className="relative rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#0D1424] to-[#090D1A] shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
            {/* Subtle Blue/Cyan Ambient Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(37,99,235,0.12),transparent_70%)] pointer-events-none" />

            {/* AI State Badge in Top Corner */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-[11px] font-semibold text-slate-300">
                {aiState === 'speaking' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span className="text-blue-300">Speaking...</span>
                  </>
                )}
                {aiState === 'listening' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300">Listening to you...</span>
                  </>
                )}
                {aiState === 'processing' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
                    <span className="text-amber-300">Analyzing Answer...</span>
                  </>
                )}
                {aiState === 'generating' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-purple-300">Formulating Follow-up...</span>
                  </>
                )}
                {aiState === 'waiting' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="text-slate-400">Ready</span>
                  </>
                )}
                {aiState === 'complete' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-300">Round Complete</span>
                  </>
                )}
              </div>
            </div>

            {/* Camera Preview Toggle Badge */}
            <div className="absolute top-4 right-4">
              <button
                onClick={toggleCamera}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold transition-all ${
                  cameraEnabled
                    ? 'bg-blue-950/60 border-blue-500 text-blue-300'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                {cameraEnabled ? <Video className="h-3.5 w-3.5 text-blue-400" /> : <VideoOff className="h-3.5 w-3.5" />}
                <span>{cameraEnabled ? 'Camera On' : 'Enable Camera'}</span>
              </button>
            </div>

            {/* Center: Holographic Animated AI Interviewer Orb */}
            <div className="relative my-4 flex flex-col items-center">
              {/* Outer Pulsing Waveform Ring */}
              <motion.div
                animate={{
                  scale: isAiSpeaking ? [1, 1.25, 1.05, 1.2, 1] : [1, 1.05, 1],
                  opacity: isAiSpeaking ? [0.6, 0.9, 0.7] : [0.2, 0.35, 0.2],
                }}
                transition={{ repeat: Infinity, duration: isAiSpeaking ? 1.5 : 4, ease: 'easeInOut' }}
                className={`absolute -inset-6 rounded-full blur-xl transition-colors ${
                  isAiSpeaking
                    ? 'bg-gradient-to-r from-blue-500/40 via-cyan-400/40 to-indigo-500/40'
                    : isListening
                    ? 'bg-emerald-500/30'
                    : 'bg-blue-600/10'
                }`}
              />

              {/* Middle Rotating Neural Particle Orbit */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
                className="w-32 h-32 rounded-full border border-blue-500/30 border-dashed flex items-center justify-center p-2"
              >
                {/* Inner Glow Core */}
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E3A8A] flex items-center justify-center border border-blue-400/30 shadow-inner relative overflow-hidden">
                  {/* Subtle inner grid aura */}
                  <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />

                  {/* AI Interviewer Avatar Icon */}
                  <div className="relative z-10 flex flex-col items-center">
                    <Brain className={`h-10 w-10 transition-colors ${
                      isAiSpeaking
                        ? 'text-cyan-400'
                        : isListening
                        ? 'text-emerald-400'
                        : 'text-blue-400'
                    }`} />
                  </div>
                </div>
              </motion.div>

              {/* Interviewer Name & Title */}
              <div className="mt-4 text-center">
                <h3 className="text-base font-bold text-white tracking-tight">PRISM AI Interviewer</h3>
                <p className="text-xs text-slate-400 font-medium">Senior Engineering Placement Evaluator</p>
              </div>

              {/* Dynamic Sound Waveform Bars (Reacts when AI speaks) */}
              <div className="flex items-center gap-1.5 h-6 mt-3">
                {[14, 22, 10, 28, 18, 24, 12, 26, 16, 20, 14, 25].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: isAiSpeaking ? [8, h, 6, h * 0.7, 8] : 4,
                      opacity: isAiSpeaking ? 1 : 0.25,
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6 + (i % 3) * 0.2,
                      ease: 'easeInOut',
                    }}
                    className={`w-1 rounded-full ${
                      isAiSpeaking
                        ? 'bg-gradient-to-t from-blue-500 to-cyan-300'
                        : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Optional Picture-in-Picture Webcam Stream */}
            {cameraEnabled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bottom-4 right-4 w-32 sm:w-40 h-24 sm:h-28 rounded-2xl overflow-hidden border-2 border-blue-500/60 shadow-xl bg-black"
              >
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                <div className="absolute bottom-1 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                  Candidate View
                </div>
              </motion.div>
            )}
          </div>

          {/* ── BOTTOM CENTRAL: DEDICATED AI QUESTION CARD ────────────────── */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#0B1120] p-6 space-y-5 shadow-xl">
            {/* Question Progress & Stage Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  Question {turnIndex + 1} of {totalTurns}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  {lastQuestionCategory}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold">{progressPercent}% Completed</span>
                <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Current Prominent Question */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> PRISM Interviewer Prompt
              </div>
              <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                {lastQuestion || 'Preparing your interview questions...'}
              </p>
            </div>

            {/* Live Real-time Answer Transcript (When Student is Speaking) */}
            {(isListening || liveTranscript) && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs space-y-1"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Speech Transcript:
                </div>
                <p className="font-mono text-emerald-100">
                  {liveTranscript || 'Listening to your microphone... speak clearly.'}
                </p>
              </motion.div>
            )}

            {/* Optional Typed Answer Input Field */}
            {showTextInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <textarea
                  ref={textInputRef}
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your structured answer here... (Press Ctrl+Enter to submit)"
                  rows={4}
                  className="w-full p-3.5 rounded-2xl border border-slate-700 bg-slate-900/90 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
                />
              </motion.div>
            )}

            {/* Student Action Bar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {/* Microphone Toggle Button */}
                <button
                  onClick={toggleMicrophone}
                  disabled={isProcessing || isComplete}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                    isListening
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  } disabled:opacity-50`}
                >
                  {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  <span>{isListening ? 'Mute Mic' : 'Speak Answer'}</span>
                </button>

                {/* Repeat Question Button */}
                <button
                  onClick={() => speakMessage(lastQuestion)}
                  disabled={isAiSpeaking || isProcessing}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all disabled:opacity-40"
                  title="Repeat the question using TTS"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Repeat</span>
                </button>

                {/* Toggle Type Answer */}
                <button
                  onClick={() => setShowTextInput(!showTextInput)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    showTextInput
                      ? 'bg-blue-950/80 border-blue-500 text-blue-300'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{showTextInput ? 'Hide Text' : 'Type Answer'}</span>
                </button>
              </div>

              {/* Submit Answer Button */}
              <button
                onClick={handleSubmitAnswer}
                disabled={isProcessing || isComplete || (!typedAnswer.trim() && !liveTranscript.trim())}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* ── 3. RIGHT PERFORMANCE & COMPETENCY PANEL ───────────────────────── */}
        <aside className="w-72 border-l border-slate-800/80 bg-[#0A0E1A] p-5 overflow-y-auto shrink-0 hidden xl:flex flex-col gap-5 z-10">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-blue-400" /> Live Assessment
            </h2>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Active Evaluation
            </span>
          </div>

          {/* Provisional Overall Performance Ring */}
          <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Overall Performance
            </div>

            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Circular SVG Progress */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="currentColor"
                  strokeWidth="7"
                  className="text-slate-800"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeDasharray={238}
                  strokeDashoffset={238 - (238 * (runningScores.overallScore || 0)) / 100}
                  className="text-blue-500 transition-all duration-700 ease-out"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">
                  {runningScores.overallScore > 0 ? `${runningScores.overallScore}%` : '—'}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase">
                  {runningScores.overallScore >= 80 ? 'Strong' : runningScores.overallScore >= 65 ? 'Proficient' : 'Analyzing'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug font-medium">
              &quot;{runningScores.mentorMessage}&quot;
            </p>
          </div>

          {/* Category Progress Meters */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#0F172A] border border-slate-800">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Core Assessment Pillars
            </div>

            {/* Technical Knowledge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Technical Knowledge</span>
                <span className="text-blue-400 font-bold">
                  {runningScores.technicalKnowledge > 0 ? `${runningScores.technicalKnowledge}%` : 'Awaiting data'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${runningScores.technicalKnowledge}%` }}
                />
              </div>
            </div>

            {/* Communication */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Communication</span>
                <span className="text-indigo-400 font-bold">
                  {runningScores.communication > 0 ? `${runningScores.communication}%` : 'Awaiting data'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${runningScores.communication}%` }}
                />
              </div>
            </div>

            {/* Answer Clarity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Answer Clarity & Structure</span>
                <span className="text-cyan-400 font-bold">
                  {runningScores.answerClarity > 0 ? `${runningScores.answerClarity}%` : 'Awaiting data'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${runningScores.answerClarity}%` }}
                />
              </div>
            </div>

            {/* Confidence Indicators */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Confidence Indicators</span>
                <span className="text-emerald-400 font-bold">
                  {runningScores.confidence > 0 ? `${runningScores.confidence}%` : 'Awaiting data'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${runningScores.confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Competency Analysis Breakdown */}
          <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-2.5">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-400" /> Competency Analysis
            </div>

            {runningScores.answeredTurnsCount === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-2">
                Not enough data yet. Complete your first response to generate competency metrics.
              </p>
            ) : (
              <div className="space-y-2 pt-1 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Problem Solving</span>
                  <span className="font-bold text-blue-400">{runningScores.competencies.problemSolving}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Technical Knowledge</span>
                  <span className="font-bold text-blue-400">{runningScores.competencies.technicalKnowledge}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Leadership Impact</span>
                  <span className="font-bold text-blue-400">{runningScores.competencies.leadership}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Teamwork & Collaboration</span>
                  <span className="font-bold text-blue-400">{runningScores.competencies.teamwork}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Actionable Feedback Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900 border border-blue-900/40 space-y-2">
            <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Real-time Tips
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              {runningScores.actionableSuggestions.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* ── CONFIRM END INTERVIEW MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showConfirmEndModal && (
          <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0B1120] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Conclude Interview Session?</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ending the interview now will stop the simulation and immediately generate your full evaluation report based on the answers you have provided so far.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmEndModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white transition-all"
                >
                  Continue Interview
                </button>
                <button
                  onClick={confirmEndInterview}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/30"
                >
                  Yes, Conclude & Evaluate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FINAL COMPREHENSIVE EVALUATION MODAL / OVERLAY ─────────────────── */}
      <AnimatePresence>
        {(isFinishing || finalReport) && (
          <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-3xl bg-[#0B1120] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              {isFinishing ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto" />
                  <h3 className="text-lg font-bold text-white">Synthesizing Placement Scorecard...</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Analyzing technical depth, STAR behavioral structure, communication pacing, and generating custom model answers.
                  </p>
                </div>
              ) : finalReport ? (
                <div className="space-y-6">
                  {/* Report Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                        Official Assessment Report
                      </span>
                      <h2 className="text-xl font-black text-white mt-0.5">
                        {targetRole || 'Software Developer'} Interview Scorecard
                      </h2>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-blue-400">
                        {finalReport.overallScore}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Overall Score
                      </div>
                    </div>
                  </div>

                  {/* 4 Core Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Communication</div>
                      <div className="text-lg font-bold text-white mt-1">{finalReport.communication.score}%</div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{finalReport.communication.howToImprove}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Technical Accuracy</div>
                      <div className="text-lg font-bold text-white mt-1">{finalReport.technicalAccuracy.score}%</div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{finalReport.technicalAccuracy.howToImprove}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Structure & STAR</div>
                      <div className="text-lg font-bold text-white mt-1">{finalReport.structure.score}%</div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{finalReport.structure.howToImprove}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Confidence Index</div>
                      <div className="text-lg font-bold text-white mt-1">{finalReport.estimatedConfidence.score}%</div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{finalReport.estimatedConfidence.howToImprove}</div>
                    </div>
                  </div>

                  {/* Strengths & Weak Areas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Demonstrated Strengths
                      </div>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {finalReport.strongAreas.map((s, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40 space-y-2">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> Focus Areas for Placement
                      </div>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {finalReport.weakAreas.map((w, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Question by Question Detailed Feedback & AI Model Answers */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Question-by-Question Evaluation & Model Answers
                    </h4>
                    <div className="space-y-3">
                      {finalReport.questionEvaluations.map((q, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-blue-400">Question {idx + 1} ({q.category})</span>
                            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">{q.score}%</span>
                          </div>
                          <p className="text-xs font-semibold text-white">{q.questionText}</p>
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
                            <span className="text-slate-400 font-bold block mb-0.5">Your Response:</span>
                            {q.studentAnswer}
                          </div>
                          <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-200">
                            <span className="text-blue-300 font-bold block mb-0.5">AI-Suggested Model Answer:</span>
                            {q.modelAnswer}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => router.push('/interview')}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                    >
                      Practice Another Role
                    </button>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/30"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── INTERVIEW HISTORY MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#0B1120] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Your Past Interview Sessions</h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {historySessions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No past interview records found. Complete this interview to generate your first verified placement scorecard!
                  </div>
                ) : (
                  historySessions.map((session, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{session.targetRole}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {session.interviewType} • {session.difficulty} • {new Date(session.createdAt || session.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black text-blue-400">
                          {session.overallScore ? `${session.overallScore}%` : 'In Progress'}
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase">Score</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
