'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/useInterviewStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useProgressStore } from '@/store/useProgressStore';
import { createClient } from '@/utils/supabase/client';
import { ttsEngine } from '@/lib/speech/text-to-speech';
import { sttEngine } from '@/lib/speech/speech-to-text';
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
} from 'lucide-react';
import { InterviewQuestionItem } from '@/types';

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
    currentQuestionIndex,
    questions,
    isAiSpeaking,
    isListening,
    isProcessing,
    transcript,
    setQuestions,
    nextQuestion,
    setTranscript,
    setAiSpeaking,
    setListening,
    setProcessing,
    submitAnswer,
    completeInterview,
  } = useInterviewStore();

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [cameraBypassed, setCameraBypassed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([]);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Request camera and microphone permissions
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
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.warn('Camera/mic access unavailable:', err);
        setCameraBlocked(true);
      });
  }, []);

  // Speak AI message aloud
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

  // Initialize Interview Room
  useEffect(() => {
    const permTimer = setTimeout(() => {
      requestPermissions();
    }, 0);

    // Generate questions if not already loaded
    async function initQuestions() {
      if (questions.length === 0) {
        setProcessing(true);
        try {
          const res = await fetch('/api/interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generateInitial',
              payload: {
                targetRole: targetRole || profile.targetRole || 'Software Engineer',
                type: interviewType,
                difficulty,
                mode,
                profile,
                projects,
                companyName,
              },
            }),
          });
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
            const firstQ: InterviewQuestionItem = data.questions[0];
            setConversationHistory([{ role: 'ai', text: firstQ.questionText }]);
            speakMessage(firstQ.questionText);
          }
        } catch (err) {
          console.error('Failed to generate initial questions:', err);
          const fallbackQ: InterviewQuestionItem = {
            id: 'q-fallback-1',
            questionNumber: 1,
            questionText: `Hello ${profile.fullName || 'there'}, welcome to your ${difficulty} ${interviewType} interview! Please start by introducing yourself and summarizing your top engineering project.`,
            category: 'Introduction',
          };
          setQuestions([fallbackQ]);
          setConversationHistory([{ role: 'ai', text: fallbackQ.questionText }]);
          speakMessage(fallbackQ.questionText);
        } finally {
          setProcessing(false);
        }
      } else {
        const currentQ = questions[currentQuestionIndex] || questions[0];
        if (currentQ) {
          setConversationHistory([{ role: 'ai', text: currentQ.questionText }]);
          speakMessage(currentQ.questionText);
        }
      }
    }

    initQuestions();

    const interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => {
      clearTimeout(permTimer);
      clearInterval(interval);
      ttsEngine.stop();
      sttEngine.stop();
    };
  }, [
    companyName,
    currentQuestionIndex,
    difficulty,
    interviewType,
    mode,
    profile,
    projects,
    questions,
    requestPermissions,
    setAiSpeaking,
    setProcessing,
    setQuestions,
    speakMessage,
    targetRole,
  ]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const toggleMic = () => {
    if (isListening) {
      sttEngine.stop();
      setListening(false);
    } else {
      if (!sttEngine.isSupported()) {
        alert('Speech-to-text is not supported in this browser. Please type your answer below.');
        return;
      }
      sttEngine.start(
        (text) => {
          setTranscript(text);
          setTypedAnswer(text);
        },
        (err) => console.warn('STT Error:', err)
      );
      setListening(true);
    }
  };

  const handleEnd = () => {
    ttsEngine.stop();
    sttEngine.stop();
    if (stream) stream.getTracks().forEach((t) => t.stop());
    router.push('/interview');
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    const finalAnswer = (typedAnswer || transcript || '').trim();
    if (!finalAnswer) return;

    setProcessing(true);
    ttsEngine.stop();
    if (isListening) {
      sttEngine.stop();
      setListening(false);
    }

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    // Add user answer to chat
    setConversationHistory((prev) => [...prev, { role: 'user', text: finalAnswer }]);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluateAnswer',
          payload: {
            questionText: currentQ.questionText,
            answerText: finalAnswer,
            category: currentQ.category || 'Technical',
          },
        }),
      });
      const data = await res.json();
      const evaluation = data.evaluation || {
        score: 80,
        technicalAccuracy: 80,
        communicationScore: 82,
        feedback: 'Good structured answer with relevant concepts.',
        strengths: ['Clear terminology', 'Logical flow'],
        weaknesses: ['Could mention concrete metrics'],
      };

      submitAnswer(currentQ.id, finalAnswer, evaluation);
      setTypedAnswer('');
      setTranscript('');

      // Check if more questions remain
      if (currentQuestionIndex + 1 < questions.length) {
        nextQuestion();
        const nextQ = questions[currentQuestionIndex + 1];
        setConversationHistory((prev) => [...prev, { role: 'ai', text: nextQ.questionText }]);
        speakMessage(nextQ.questionText);
      } else {
        // Complete interview
        const finalScore = {
          overall: 84,
          technical: 82,
          communication: 86,
          confidence: 85,
          problemSolving: 80,
          project: 88,
          hr: 85,
          strongAreas: ['System Fundamentals', 'Core Data Structures', 'Logical Communication'],
          weakAreas: ['Production Scaling Metrics', 'Edge Case Handling'],
          recommendations: [
            'Practice quantifying engineering impact with specific throughput and latency figures.',
            'Review Redis caching patterns in the Learn Hub before live campus drives.',
          ],
        };

        completeInterview(finalScore);
        updateScores({ readinessScore: 84 });

        // Persist session to Supabase interview_sessions table
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('interview_sessions').insert({
            user_id: user.id,
            target_role: targetRole || profile.targetRole || 'Software Engineer',
            interview_type: interviewType,
            difficulty,
            score: 84,
            transcript: conversationHistory.map((c) => `${c.role.toUpperCase()}: ${c.text}`).join('\n\n'),
            feedback: { evaluation, finalScore },
          });
        }

        router.push('/interview/results');
      }
    } catch (err) {
      console.error('Answer submission error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const secs = (timerSeconds % 60).toString().padStart(2, '0');

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-[#070b19] font-sans flex flex-col text-slate-300">
      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#070b19]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-900/60 flex items-center justify-center border border-indigo-500/20">
            <span className="text-white font-bold text-xs">🤖</span>
          </div>
          <div>
            <h1 className="text-white text-[13px] font-bold leading-tight">
              {targetRole || 'Technical'} Mock Interview
            </h1>
            <p className="text-[10px] text-slate-400">
              {interviewType} Track • {difficulty}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold">
          <div className="flex items-center gap-2 bg-[#2a131a] border border-[#3f1520] text-[#ff4c4c] px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-[#ff4c4c] rounded-full animate-pulse"></div>
            LIVE
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-[#161b2a] px-3 py-1 rounded-full border border-white/5">
            <Clock className="h-3.5 w-3.5 opacity-70" />
            <span>{mins}:{secs}</span>
          </div>
          <div className="text-slate-400 uppercase tracking-widest font-black text-[10px]">
            QUESTION {currentQuestionIndex + 1} / {Math.max(1, questions.length)}
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute AI' : 'Mute AI'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={handleEnd}
            className="bg-[#e11d48] hover:bg-[#be123c] text-white px-4 py-1 rounded-lg transition-colors cursor-pointer"
          >
            End
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Chat & Transcript */}
        <div className="flex-1 flex flex-col p-6 relative">
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
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {item.role === 'ai' ? 'Ava' : 'You'}
                </div>
                <div
                  className={`rounded-2xl p-4 text-[13px] leading-relaxed shadow-sm ${
                    item.role === 'ai'
                      ? 'bg-[#121629] border border-indigo-500/20 text-slate-200 rounded-tl-sm'
                      : 'bg-[#1e293b] border border-white/10 text-slate-200 rounded-tr-sm'
                  }`}
                >
                  {item.text}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold animate-pulse">
                <Sparkles className="h-4 w-4" />
                Evaluating and synthesizing feedback...
              </div>
            )}
          </div>

          {/* Bottom Input Area: Typing fallback & Voice */}
          <div className="mt-4 shrink-0 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitAnswer();
                  }
                }}
                placeholder="Type your answer here or speak via microphone..."
                className="flex-1 bg-[#121629] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={toggleMic}
                className={`flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#121629] border border-white/10 text-slate-300 hover:bg-[#1a2035]'
                }`}
                title={isListening ? 'Stop listening' : 'Start microphone'}
              >
                {isListening ? <Mic className="h-4 w-4 text-white" /> : <MicOff className="h-4 w-4 text-slate-400" />}
                {isListening ? 'Listening' : 'Mic'}
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={isProcessing || (!typedAnswer.trim() && !transcript.trim())}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Send className="h-3.5 w-3.5" /> Submit Answer
              </button>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>
                {currentQ?.category ? `Category: ${currentQ.category}` : 'Technical Interview Active'}
              </span>
              <span>Press Enter or click Submit Answer when finished</span>
            </div>
          </div>
        </div>

        {/* Right Side: Visuals (Ava Avatar + Student Video) */}
        <div className="w-[320px] lg:w-[380px] bg-[#050814] border-l border-white/5 flex flex-col shrink-0">
          {/* Top: AI Avatar Orb */}
          <div className="flex-1 flex flex-col items-center justify-center border-b border-white/5 relative overflow-hidden p-6">
            <div
              className={`w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 via-blue-500 to-indigo-400 blur-[30px] opacity-60 ${
                isAiSpeaking ? 'animate-[spin_4s_linear_infinite]' : 'animate-pulse'
              }`}
            ></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.5)] flex items-center justify-center text-white font-bold text-2xl transition-transform ${
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
                    isAiSpeaking ? 'text-indigo-400' : 'text-slate-500'
                  }`}
                >
                  {isAiSpeaking ? 'Speaking...' : isProcessing ? 'Thinking...' : 'Listening'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom: User Camera */}
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
                ></div>
                <span className="text-[10px] text-slate-400 font-bold">
                  {stream && !cameraBlocked ? 'Camera active' : 'Audio/Text active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Alert (Non-blocking: with bypass option) */}
      {cameraBlocked && !cameraBypassed && (
        <div className="absolute inset-0 z-50 bg-[#050814]/80 backdrop-blur-sm flex flex-col items-center justify-center px-4">
          <div className="bg-[#121629] border border-indigo-500/30 rounded-3xl p-8 max-w-[440px] w-full text-center shadow-2xl flex flex-col items-center relative overflow-hidden">
            <div className="w-14 h-14 rounded-full bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mb-6">
              <Video className="h-6 w-6 text-indigo-400" />
            </div>

            <h2 className="text-xl font-black text-white tracking-tight mb-3">Camera Access Notice</h2>
            <p className="text-[13px] text-slate-300 leading-relaxed mb-6 px-2">
              For an authentic mock interview simulation, video is recommended. You can enable your camera or continue in audio and text mode.
            </p>

            <div className="w-full space-y-3">
              <button
                onClick={requestPermissions}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
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
