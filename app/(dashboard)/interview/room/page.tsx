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
} from 'lucide-react';

interface ConversationEntry {
  role: 'ai' | 'user';
  text: string;
  questionId?: string;
}

export default function InterviewRoomPage() {
  const router = useRouter();
  const { profile, projects } = useProfileStore();
  const { updateScores } = useProgressStore();
  const {
    targetRole, interviewType, difficulty, mode, companyName,
    setAiSpeaking, setListening, setProcessing,
    isAiSpeaking, isListening, isProcessing,
    resetInterview,
  } = useInterviewStore();

  // ─── Session state ──────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const [totalTurns] = useState(6);
  const [lastQuestionId, setLastQuestionId] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState('');
  const [lastQuestionCategory, setLastQuestionCategory] = useState('Introduction');
  const [isComplete, setIsComplete] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [cameraBypassed, setCameraBypassed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [silenceTimer, setSilenceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ─── Auto-scroll chat ────────────────────────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, isProcessing]);

  // ─── Request camera / mic permissions ───────────────────────────────────────
  const requestPermissions = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraBlocked(true);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        setStream(s);
        setCameraBlocked(false);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setCameraBlocked(true));
  }, []);

  // ─── Speak via TTS ───────────────────────────────────────────────────────────
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

  // ─── Silence nudge: if student hasn't submitted in 30s, nudge ───────────────
  const scheduleSilenceNudge = useCallback(() => {
    if (silenceTimer) clearTimeout(silenceTimer);
    const t = setTimeout(() => {
      if (!isProcessing && !isComplete) {
        const nudgeText = "I'm here — take your time and answer when ready.";
        setConversationHistory((prev) => [...prev, { role: 'ai', text: nudgeText }]);
        speakMessage(nudgeText);
      }
    }, 30_000);
    setSilenceTimer(t);
  }, [silenceTimer, isProcessing, isComplete, speakMessage]);

  // ─── Start interview session ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    requestPermissions();

    const startSession = async () => {
      if (!profile?.id) return;
      setProcessing(true);
      setSessionError(null);

      try {
        const res = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetRole: targetRole || profile.targetRole || 'Software Engineer',
            interviewType,
            difficulty,
            mode,
            companyName: companyName || undefined,
            totalTurns,
            isFirstTimerMode: false,
            sessionMode: 'solo',
            profile: {
              id:         profile.id,
              fullName:   profile.fullName,
              cgpa:       profile.cgpa,
              college:    profile.college,
              branch:     profile.branch,
              targetRole: profile.targetRole,
            },
            projects: (projects ?? []).slice(0, 3).map((p) => ({
              id:          p.id,
              title:       p.title,
              description: p.description,
              techStack:   p.techStack,
              verificationStatus: p.verificationStatus,
            })),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          if (!cancelled) setSessionError(err.error || 'Failed to start interview.');
          return;
        }

        const data: { sessionId: string; greeting: TurnOutput } = await res.json();
        if (cancelled) return;

        setSessionId(data.sessionId);
        setLastQuestion(data.greeting.questionText);
        setLastQuestionCategory(data.greeting.category);

        setConversationHistory([
          { role: 'ai', text: data.greeting.questionText },
        ]);
        speakMessage(data.greeting.questionText);
        scheduleSilenceNudge();
      } catch (err) {
        console.error('[InterviewRoom] Start error:', err);
        if (!cancelled) setSessionError('Network error starting interview. Please try again.');
      } finally {
        if (!cancelled) setProcessing(false);
      }
    };

    startSession();
    const interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (silenceTimer) clearTimeout(silenceTimer);
      ttsEngine.stop();
      sttEngine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Cleanup media on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  // ─── Toggle microphone ────────────────────────────────────────────────────────
  const toggleMic = () => {
    if (isListening) {
      sttEngine.stop();
      setListening(false);
    } else {
      if (!sttEngine.isSupported()) {
        alert('Speech-to-text is not supported in this browser. Please type your answer.');
        return;
      }
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

  // ─── End interview early ──────────────────────────────────────────────────────
  const handleEnd = async () => {
    ttsEngine.stop();
    sttEngine.stop();
    if (stream) stream.getTracks().forEach((t) => t.stop());

    if (sessionId && !isComplete) {
      // Mark as abandoned
      try {
        await fetch('/api/interview/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch { /* best effort */ }
    }

    resetInterview();
    router.push('/interview');
  };

  // ─── Submit answer and get next question ─────────────────────────────────────
  const handleSubmitAnswer = async () => {
    if (silenceTimer) clearTimeout(silenceTimer);

    const finalAnswer = (typedAnswer || liveTranscript || '').trim();
    if (!finalAnswer || !sessionId) return;

    setProcessing(true);
    ttsEngine.stop();
    if (isListening) {
      sttEngine.stop();
      setListening(false);
    }

    // Add user answer to chat
    setConversationHistory((prev) => [
      ...prev,
      { role: 'user', text: finalAnswer },
    ]);
    setTypedAnswer('');
    setLiveTranscript('');

    try {
      const res = await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          turnIndex,
          totalTurns,
          studentAnswer:        finalAnswer,
          lastQuestion,
          lastQuestionCategory,
          lastQuestionId,
          interviewType,
          difficulty,
          mode,
          targetRole: targetRole || profile.targetRole || 'Software Engineer',
          companyName: companyName || undefined,
          isFirstTimerMode: false,
          profile: {
            id:         profile.id,
            fullName:   profile.fullName,
            cgpa:       profile.cgpa,
            college:    profile.college,
            branch:     profile.branch,
            targetRole: profile.targetRole,
          },
          projects: (projects ?? []).slice(0, 3).map((p) => ({
            id:          p.id,
            title:       p.title,
            description: p.description,
            techStack:   p.techStack,
            verificationStatus: p.verificationStatus,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setSessionError(err.error || 'Failed to process answer.');
        return;
      }

      const data: {
        next: TurnOutput & { questionId?: string };
        memory: { topicsAsked: string[]; weakAreasDetected: string[] };
      } = await res.json();

      const next = data.next;

      // Show next question
      setConversationHistory((prev) => [
        ...prev,
        { role: 'ai', text: next.questionText, questionId: next.questionId },
      ]);
      setTurnIndex((t) => t + 1);
      setLastQuestion(next.questionText);
      setLastQuestionCategory(next.category);
      setLastQuestionId(next.questionId ?? null);
      speakMessage(next.questionText);

      if (next.isInterviewComplete) {
        setIsComplete(true);
        setIsFinishing(true);

        // Finish the session
        const finishRes = await fetch('/api/interview/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (finishRes.ok) {
          const finishData = await finishRes.json();
          const report = finishData.report;

          // Update readiness in progress store (real computed score)
          if (report?.overallScore) {
            updateScores({ readinessScore: report.overallScore });
          }

          // Store report for results page
          if (typeof window !== 'undefined' && report) {
            sessionStorage.setItem('interview_report', JSON.stringify({ sessionId, report }));
          }
        }

        setTimeout(() => {
          router.push('/interview/results');
        }, 3000);
      } else {
        scheduleSilenceNudge();
      }
    } catch (err) {
      console.error('[InterviewRoom] Turn error:', err);
      setSessionError('Network error. Please try again.');
    } finally {
      setProcessing(false);
      setIsFinishing(false);
    }
  };

  const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const secs = (timerSeconds % 60).toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[100] bg-[#070b19] font-sans flex flex-col text-slate-300">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#070b19]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-900/60 flex items-center justify-center border border-blue-500/20">
            <span className="text-white font-bold text-xs">🤖</span>
          </div>
          <div>
            <h1 className="text-white text-[13px] font-bold leading-tight">
              {targetRole || 'Technical'} Mock Interview
            </h1>
            <p className="text-[10px] text-slate-400">
              {interviewType} Track • {difficulty} • Turn {turnIndex + 1}/{totalTurns}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold">
          <div className="flex items-center gap-2 bg-[#2a131a] border border-[#3f1520] text-[#ff4c4c] px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-[#ff4c4c] rounded-full animate-pulse" />
            LIVE
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-[#161b2a] px-3 py-1 rounded-full border border-white/5">
            <Clock className="h-3.5 w-3.5 opacity-70" />
            <span>{mins}:{secs}</span>
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
            className="bg-[#e11d48] hover:bg-[#be123c] text-white px-4 py-1 rounded-lg transition-colors cursor-pointer"
            aria-label="End interview"
          >
            End
          </button>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col p-6 relative">

          {/* Session error banner */}
          {sessionError && (
            <div className="mb-4 flex items-center gap-2 bg-red-900/30 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{sessionError}</span>
              <button
                className="ml-auto text-red-400 hover:text-white"
                onClick={() => setSessionError(null)}
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-4 space-y-6">
            {conversationHistory.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-4 max-w-4xl ${
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
                {isFinishing ? 'Compiling your evaluation report...' : 'Generating next question...'}
              </div>
            )}

            {isComplete && !isFinishing && (
              <div className="text-center text-slate-400 text-xs animate-pulse">
                Interview complete. Redirecting to your results...
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input area */}
          {!isComplete && (
            <div className="mt-4 shrink-0 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={typedAnswer || liveTranscript}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  placeholder={
                    isListening
                      ? 'Listening... speak now or type here'
                      : 'Type your answer or use the microphone...'
                  }
                  disabled={isProcessing || !sessionId}
                  className="flex-1 bg-[#121629] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  aria-label="Your answer"
                />
                <button
                  onClick={toggleMic}
                  disabled={isProcessing || !sessionId}
                  className={`flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                    isListening
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#121629] border border-white/10 text-slate-300 hover:bg-[#1a2035]'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start microphone'}
                  aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
                >
                  {isListening ? <Mic className="h-4 w-4 text-white" /> : <MicOff className="h-4 w-4 text-slate-400" />}
                  {isListening ? 'Listening' : 'Mic'}
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={isProcessing || (!typedAnswer.trim() && !liveTranscript.trim()) || !sessionId}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-600/20"
                  aria-label="Submit your answer"
                >
                  <Send className="h-3.5 w-3.5" /> Submit Answer
                </button>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>{lastQuestionCategory ? `Category: ${lastQuestionCategory}` : 'Interview Active'}</span>
                <span>Press Enter or click Submit when finished</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Avatar + Camera */}
        <div className="w-[320px] lg:w-[380px] bg-[#050814] border-l border-white/5 flex flex-col shrink-0">
          {/* AI Avatar */}
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
              <h3 className="mt-6 text-xs font-black tracking-[0.2em] uppercase text-white">
                AVA • AI INTERVIEWER
              </h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`text-[10px] font-bold lowercase tracking-widest ${
                    isAiSpeaking ? 'text-blue-400' : 'text-slate-500'
                  }`}
                >
                  {isAiSpeaking
                    ? 'Speaking...'
                    : isProcessing
                    ? 'Thinking...'
                    : isListening
                    ? 'Listening to you...'
                    : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* User Camera */}
          <div className="h-[280px] p-6 flex flex-col">
            <div className="flex-1 rounded-2xl bg-[#0f1423] border border-white/10 overflow-hidden relative shadow-inner">
              {stream && !cameraBlocked ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <VideoOff className="h-8 w-8 text-slate-600" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {cameraBypassed ? 'Audio & Text Mode' : 'Camera Off'}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider mb-1.5">
                {profile?.fullName?.split(' ')[0] || 'Student'}
              </span>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    stream && !cameraBlocked ? 'bg-emerald-500' : 'bg-slate-500'
                  }`}
                />
                <span className="text-[10px] text-slate-400 font-bold">
                  {stream && !cameraBlocked ? 'Camera active' : 'Audio/Text active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera permission overlay */}
      {cameraBlocked && !cameraBypassed && (
        <div className="absolute inset-0 z-50 bg-[#050814]/80 backdrop-blur-sm flex flex-col items-center justify-center px-4">
          <div className="bg-[#121629] border border-blue-500/30 rounded-3xl p-8 max-w-[440px] w-full text-center shadow-2xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-blue-950/60 border border-blue-500/30 flex items-center justify-center mb-6">
              <Video className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mb-3">Camera Access Notice</h2>
            <p className="text-[13px] text-slate-300 leading-relaxed mb-6 px-2">
              For an authentic mock interview simulation, video is recommended. You can enable your camera or continue in audio and text mode.
            </p>
            <div className="w-full space-y-3">
              <button
                onClick={requestPermissions}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Enable Camera &amp; Microphone
              </button>
              <button
                onClick={() => setCameraBypassed(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue in Audio &amp; Text Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
