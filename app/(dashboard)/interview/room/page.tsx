'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/useInterviewStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useProgressStore } from '@/store/useProgressStore';
import { ttsEngine } from '@/lib/speech/text-to-speech';
import { sttEngine } from '@/lib/speech/speech-to-text';
import type { TurnOutput } from '@/lib/ai/dialog-manager';
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
  Shield,
} from 'lucide-react';

interface ConversationEntry {
  role: 'ai' | 'user';
  text: string;
  questionId?: string;
  category?: string;
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
    technicalSubject,
    durationMinutes = 15,
    setAiSpeaking,
    setListening,
    setProcessing,
    isAiSpeaking,
    isListening,
    isProcessing,
    resetInterview,
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

  // ─── Server-Authoritative Timer (Resumes on refresh) ─────────────────────────
  const totalDurationSeconds = durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalDurationSeconds);

  // ─── Media State (Webcam OFF by default and optional) ───────────────────────
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [silenceTimer, setSilenceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, isProcessing]);

  // ─── Speak via TTS with auto-stop on interruption ───────────────────────────
  const speakMessage = useCallback(
    (text: string) => {
      if (isMuted) return;
      ttsEngine.speak(
        text,
        () => setAiSpeaking(true),
        () => setAiSpeaking(false)
      );
    },
    [isMuted, setAiSpeaking]
  );

  // ─── Silence Nudge: gentle reminder after 30 seconds of quiet ───────────────
  const scheduleSilenceNudge = useCallback(() => {
    if (silenceTimer) clearTimeout(silenceTimer);
    const t = setTimeout(() => {
      if (!isProcessing && !isComplete) {
        const nudgeText = "Take your time. You can speak your thoughts aloud or type them in the box.";
        setConversationHistory((prev) => [...prev, { role: 'ai', text: nudgeText }]);
        speakMessage(nudgeText);
      }
    }, 30_000);
    setSilenceTimer(t);
  }, [silenceTimer, isProcessing, isComplete, speakMessage]);

  // ─── Server-Authoritative Timer & Session Initialisation ─────────────────────
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

    // 2. Start Interview Session API
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
        setLastQuestionCategory(data.greeting.category);

        // Synchronize server-authoritative deadline
        if (data.deadlineAt) {
          const deadlineMs = new Date(data.deadlineAt).getTime();
          startTimerCountdown(deadlineMs);
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
        if (!cancelled) setSessionError('Network error initializing interview simulation. Please try again.');
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

  // ─── Webcam Optional Toggle (Client-side only, never uploaded) ──────────────
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
        console.warn('Camera access denied or unavailable:', err);
        alert('Camera access was not granted. The interview will proceed seamlessly in audio/text mode.');
        setCameraEnabled(false);
      }
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  // ─── Toggle Microphone / Voice STT with live captions ───────────────────────
  const toggleMic = () => {
    if (isListening) {
      sttEngine.stop();
      setListening(false);
    } else {
      if (!sttEngine.isSupported()) {
        alert('Web Speech API speech-to-text is not supported in this browser. Please type your responses.');
        return;
      }
      // Stop AI voice immediately if student starts speaking
      ttsEngine.stop();
      setAiSpeaking(false);
      setLiveTranscript('');
      sttEngine.start(
        (text) => {
          setLiveTranscript(text);
          setTypedAnswer(text);
        },
        (err) => console.warn('STT Error:', err)
      );
      setListening(true);
    }
  };

  // Interruption handler when typing begins
  const handleTypedInputChange = (val: string) => {
    setTypedAnswer(val);
    if (isAiSpeaking) {
      ttsEngine.stop();
      setAiSpeaking(false);
    }
  };

  // ─── Finalise Interview via /api/interview/finish ───────────────────────────
  const finishInterviewSession = async (history: ConversationEntry[]) => {
    setIsComplete(true);
    setIsFinishing(true);
    ttsEngine.stop();
    sttEngine.stop();
    if (stream) stream.getTracks().forEach((t) => t.stop());

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
        const report = finishData.report;

        if (report?.overallScore) {
          updateScores({ readinessScore: report.overallScore });
        }

        if (typeof window !== 'undefined' && report) {
          sessionStorage.setItem('interview_report', JSON.stringify({ sessionId, report }));
          // Clear timer
          localStorage.removeItem(`prism_interview_timer_${targetRole}_${durationMinutes}`);
        }
      }
    } catch (err) {
      console.error('[InterviewRoom] Finish error:', err);
    }

    setTimeout(() => {
      router.push('/interview/results');
    }, 2000);
  };

  const handleAutoSubmitOnTimeOut = () => {
    const finalAnswer = typedAnswer || liveTranscript || '(Time expired during thought formulation)';
    const updatedHistory: ConversationEntry[] = [
      ...conversationHistory,
      { role: 'user', text: finalAnswer },
    ];
    setConversationHistory(updatedHistory);
    finishInterviewSession(updatedHistory);
  };

  const handleEnd = () => {
    if (confirm('Are you sure you want to conclude this interview session? Your answers will be evaluated.')) {
      finishInterviewSession(conversationHistory);
    }
  };

  // ─── Submit Answer and Trigger Next Turn ────────────────────────────────────
  const handleSubmitAnswer = async () => {
    if (silenceTimer) clearTimeout(silenceTimer);

    const finalAnswer = (typedAnswer || liveTranscript || '').trim();
    if (!finalAnswer) return;

    setProcessing(true);
    ttsEngine.stop();
    if (isListening) {
      sttEngine.stop();
      setListening(false);
    }

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
      // Reached turn budget -> finalize session
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
        setSessionError(err.error || 'Failed to process answer.');
        setProcessing(false);
        return;
      }

      const data: {
        next: TurnOutput & { questionId?: string };
        memory: { topicsAsked: string[]; weakAreasDetected: string[] };
      } = await res.json();

      const next = data.next;

      setConversationHistory((prev) => [
        ...prev,
        { role: 'ai', text: next.questionText, questionId: next.questionId, category: next.category },
      ]);
      setTurnIndex(nextTurnIndex);
      setLastQuestion(next.questionText);
      setLastQuestionCategory(next.category);
      setLastQuestionId(next.questionId ?? null);
      speakMessage(next.questionText);

      if (next.isInterviewComplete) {
        finishInterviewSession(updatedHistory);
      } else {
        scheduleSilenceNudge();
      }
    } catch (err) {
      console.error('[InterviewRoom] Turn error:', err);
      setSessionError('Network error connecting to interview intelligence. Please submit again.');
    } finally {
      setProcessing(false);
    }
  };

  // Timer format (MM:SS)
  const timerMins = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
  const timerSecs = (secondsRemaining % 60).toString().padStart(2, '0');
  const isUrgentTimer = secondsRemaining <= 30;
  const isWarningTimer = secondsRemaining <= 120 && secondsRemaining > 30;

  return (
    <div className="fixed inset-0 z-[100] bg-[#070b19] font-sans flex flex-col text-slate-300">
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#070b19]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-900/60 flex items-center justify-center border border-blue-500/20">
            <span className="text-white font-bold text-xs">🤖</span>
          </div>
          <div>
            <h1 className="text-white text-[13px] font-bold leading-tight flex items-center gap-2">
              {targetRole || 'Technical'} Mock Interview
              {technicalSubject && (
                <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                  {technicalSubject}
                </span>
              )}
            </h1>
            <p className="text-[10px] text-slate-400">
              {interviewType} Track • {difficulty} • Turn {turnIndex + 1}/{totalTurns}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold">
          {/* Warning Banner if remaining time is low */}
          {isWarningTimer && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] animate-pulse">
              <AlertTriangle className="h-3 w-3" /> Under 2 min remaining
            </div>
          )}
          {isUrgentTimer && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/90 border border-red-500/60 text-red-300 text-[10px] animate-pulse">
              <AlertTriangle className="h-3 w-3" /> Final 30 seconds
            </div>
          )}

          {/* Server-authoritative Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
              isUrgentTimer
                ? 'bg-red-950/80 border-red-500/60 text-red-300 animate-pulse'
                : isWarningTimer
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                : 'bg-[#161b2a] border-white/5 text-slate-300'
            }`}
          >
            <Clock className="h-3.5 w-3.5 opacity-70" />
            <span className="font-mono">{timerMins}:{timerSecs}</span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute AI' : 'Mute AI'}
            aria-label={isMuted ? 'Unmute AI interviewer' : 'Mute AI interviewer'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            onClick={handleEnd}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold"
            aria-label="End interview"
          >
            Conclude Round
          </button>
        </div>
      </div>

      {/* ── Main Screen ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Conversation Stream & Inputs */}
        <div className="flex-1 flex flex-col p-6 relative">
          {sessionError && (
            <div className="mb-4 flex items-center gap-2 bg-red-900/30 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{sessionError}</span>
              <button className="ml-auto text-red-400 hover:text-white" onClick={() => setSessionError(null)}>
                ✕
              </button>
            </div>
          )}

          {/* Transcript Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-4 space-y-5">
            {conversationHistory.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3.5 max-w-4xl ${
                  item.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    item.role === 'ai'
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {item.role === 'ai' ? 'Ava' : 'You'}
                </div>
                <div
                  className={`rounded-2xl p-4 text-[13px] leading-relaxed shadow-sm ${
                    item.role === 'ai'
                      ? 'bg-[#121629] border border-blue-500/20 text-slate-200 rounded-tl-sm'
                      : 'bg-[#1e293b] border border-white/10 text-slate-200 rounded-tr-sm'
                  }`}
                >
                  {item.text}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold animate-pulse">
                <Sparkles className="h-4 w-4" />
                {isFinishing ? 'Generating 4-metric diagnostic report & model answers...' : 'Synthesizing adaptive follow-up...'}
              </div>
            )}

            {isComplete && !isFinishing && (
              <div className="text-center text-slate-400 text-xs animate-pulse">
                Interview completed. Preparing diagnostic evaluation...
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Response Controls (Voice + Typing Fallback) */}
          {!isComplete && (
            <div className="mt-4 shrink-0 space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={typedAnswer || liveTranscript}
                  onChange={(e) => handleTypedInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  placeholder={
                    isListening
                      ? 'Listening via Web Speech API... Speak or type directly here'
                      : 'Type your answer here or click Mic to speak...'
                  }
                  disabled={isProcessing}
                  className="flex-1 bg-[#121629] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  aria-label="Your response"
                />

                <button
                  onClick={toggleMic}
                  disabled={isProcessing}
                  className={`flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                    isListening
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-[#121629] border border-white/10 text-slate-300 hover:bg-[#1a2035]'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start microphone speech input'}
                  aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
                >
                  {isListening ? <Mic className="h-4 w-4 text-white" /> : <MicOff className="h-4 w-4 text-slate-400" />}
                  <span>{isListening ? 'Listening...' : 'Voice'}</span>
                </button>

                <button
                  onClick={handleSubmitAnswer}
                  disabled={isProcessing || (!typedAnswer.trim() && !liveTranscript.trim())}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-600/20"
                  aria-label="Submit answer"
                >
                  <Send className="h-3.5 w-3.5" /> Submit
                </button>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-slate-400" />
                  No mid-session scores shown • Evaluated objectively after round
                </span>
                <span>Press Enter or click Submit</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: AI Avatar & Optional Webcam */}
        <div className="w-[320px] lg:w-[380px] bg-[#050814] border-l border-white/5 flex flex-col shrink-0">
          {/* Avatar Area */}
          <div className="flex-1 flex flex-col items-center justify-center border-b border-white/5 relative overflow-hidden p-6">
            <div
              className={`w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-blue-400 blur-[30px] opacity-60 ${
                isAiSpeaking ? 'animate-[spin_4s_linear_infinite]' : 'animate-pulse'
              }`}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 via-blue-600 to-blue-400 shadow-[0_0_40px_rgba(99,102,241,0.5)] flex items-center justify-center text-white font-bold text-2xl transition-transform ${
                  isAiSpeaking ? 'scale-110' : 'scale-100'
                }`}
              >
                Ava
              </div>
              <h3 className="mt-5 text-xs font-black tracking-[0.2em] uppercase text-white">
                AVA • PRISM INTERVIEWER
              </h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`text-[10px] font-bold lowercase tracking-wider ${isAiSpeaking ? 'text-blue-400' : 'text-slate-500'}`}>
                  {isAiSpeaking
                    ? 'Speaking...'
                    : isProcessing
                    ? 'Thinking...'
                    : isListening
                    ? 'Listening...'
                    : 'Awaiting your answer'}
                </span>
              </div>
            </div>
          </div>

          {/* User Video Box (OFF BY DEFAULT & OPTIONAL) */}
          <div className="h-[280px] p-6 flex flex-col">
            <div className="flex-1 rounded-2xl bg-[#0f1423] border border-white/10 overflow-hidden relative shadow-inner flex flex-col items-center justify-center">
              {cameraEnabled && stream ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                    <VideoOff className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400">Webcam OFF (Default)</p>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto">
                    Video stream is purely local and never uploaded or stored.
                  </p>
                  <button
                    onClick={toggleCamera}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 mt-1"
                  >
                    <Video className="h-3.5 w-3.5 text-blue-400" /> Enable Webcam
                  </button>
                </div>
              )}

              {cameraEnabled && (
                <button
                  onClick={toggleCamera}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold flex items-center gap-1"
                  title="Turn off webcam"
                >
                  <VideoOff className="h-3 w-3" /> Turn Off
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>{profile?.fullName?.split(' ')[0] || 'Candidate'}</span>
              <span className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${cameraEnabled ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                {cameraEnabled ? 'Video active' : 'Audio/Text only'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
