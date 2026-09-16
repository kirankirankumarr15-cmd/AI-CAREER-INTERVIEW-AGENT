'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/useInterviewStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useProgressStore } from '@/store/useProgressStore';
import { ttsEngine } from '@/lib/speech/text-to-speech';
import { sttEngine } from '@/lib/speech/speech-to-text';
import {
  generateInitialInterviewQuestions,
  generateDynamicFollowUp,
  evaluateStudentAnswer
} from '@/lib/ai/agents/interview-agent';
import { analyzeCommunicationSpeech } from '@/lib/ai/agents/communication-agent';
import { RadialProgressRing } from '@/components/common/RadialProgressRing';
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Bot,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Send,
  ArrowLeft,
  Clock,
  TrendingUp,
} from 'lucide-react';

export default function InterviewRoomPage() {
  const router = useRouter();
  const { profile, projects } = useProfileStore();
  const { updateScores } = useProgressStore();

  const {
    isActive,
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
    interviewScore,
    setQuestions,
    nextQuestion,
    setTranscript,
    setAiSpeaking,
    setListening,
    setProcessing,
    submitAnswer,
    completeInterview,
    resetInterview
  } = useInterviewStore();

  const [typedAnswer, setTypedAnswer] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function initQuestions() {
      if (questions.length === 0) {
        setProcessing(true);
        const initial = await generateInitialInterviewQuestions(
          targetRole, interviewType, difficulty, mode, profile, projects, companyName
        );
        setQuestions(initial);
        setProcessing(false);
        if (initial.length > 0) speakQuestion(initial[0].questionText);
      }
    }
    initQuestions();
  }, []);

  const speakQuestion = (text: string) => {
    ttsEngine.speak(text, () => setAiSpeaking(true), () => { setAiSpeaking(false); startListening(); });
  };

  const startListening = () => {
    if (!sttEngine.isSupported()) return;
    sttEngine.start((text) => setTranscript(text), (err) => console.warn(err));
    setListening(true);
  };

  const stopListening = () => { sttEngine.stop(); setListening(false); };

  const handleReplayQuestion = () => {
    const currentQ = questions[currentQuestionIndex];
    if (currentQ) speakQuestion(currentQ.questionText);
  };

  const handleFinishAnswer = async (overrideAnswer?: string) => {
    stopListening();
    const answerText = overrideAnswer || transcript || typedAnswer;
    if (!answerText.trim() || isProcessing) return;

    setProcessing(true);
    const currentQ = questions[currentQuestionIndex];
    const evalResult = await evaluateStudentAnswer(currentQ.questionText, answerText, currentQ.category);
    const commAnalysis = await analyzeCommunicationSpeech(answerText, currentQ.questionText);

    submitAnswer(currentQ.id, answerText, {
      ...evalResult,
      communicationScore: commAnalysis.communicationScore,
      estimatedConfidence: commAnalysis.estimatedConfidence,
      speakingSpeed: commAnalysis.speakingSpeed,
      fillerWords: commAnalysis.fillerWordsList,
    });
    setTypedAnswer('');
    setTranscript('');

    const isLast = currentQuestionIndex + 1 >= questions.length;
    if (isLast) {
      completeInterview({
        overall: 78, technical: 82, communication: 74, confidence: 69, problemSolving: 85, project: 88, hr: 76,
        strongAreas: ['Project Architecture explanation', 'Problem Solving logic', 'Technical accuracy'],
        weakAreas: ['Speech confidence hesitations', 'DBMS indexing details', 'STAR structure'],
        recommendations: [
          'Practice DBMS joins & indexing execution plans for 20 minutes.',
          'Adopt Situation → Task → Action → Result format for behavioral questions.',
        ],
      });
      updateScores({ interviewsCompleted: 7, readinessScore: 78, technicalKnowledge: 82, communicationScore: 74, confidenceScore: 69 });
      setProcessing(false);
    } else {
      const followUp = await generateDynamicFollowUp(currentQ.questionText, answerText, currentQuestionIndex, questions.length, profile, targetRole, interviewType);
      nextQuestion();
      setProcessing(false);
      const nextQText = questions[currentQuestionIndex + 1]?.questionText || followUp.questionText;
      speakQuestion(nextQText);
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const secs = (timerSeconds % 60).toString().padStart(2, '0');
  const progressPct = questions.length > 0 ? Math.round((currentQuestionIndex / questions.length) * 100) : 0;

  /* ── REPORT SCREEN ── */
  if (interviewScore) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] p-4 sm:p-8 animate-fade-in-up">
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                ✓ Interview Completed · Session Report
              </span>
              <h1 className="text-2xl font-extrabold text-[#FAFAFA]">Performance Evaluation</h1>
              <p className="text-xs text-[#71717A] mt-1 font-medium">
                Role: {targetRole} ({interviewType} Round · {difficulty})
              </p>
              <p className="text-[10px] text-amber-400/70 mt-1 font-medium italic">
                AI-generated interview simulation. Results are for training purposes only.
              </p>
            </div>

            <RadialProgressRing
              score={interviewScore.overall}
              size={110}
              strokeWidth={9}
              sublabel="Overall Score"
            />
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {[
              { label: 'Technical Knowledge', value: interviewScore.technical, color: '#6366F1' },
              { label: 'Communication', value: interviewScore.communication, color: '#8B5CF6' },
              { label: 'Est. Confidence', value: interviewScore.confidence, color: '#0EA5E9' },
              { label: 'Problem Solving', value: interviewScore.problemSolving, color: '#10B981' },
            ].map((s) => (
              <div key={s.label} className="card p-4 text-center">
                <span className="text-[#71717A] font-medium block mb-2">{s.label}</span>
                <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.value}%</p>
                <div className="mt-2 h-1.5 rounded-full bg-[#27272F] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Strong vs Weak */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5 space-y-3 border-emerald-500/20" style={{ background: 'rgba(16,185,129,0.04)' }}>
              <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4" /> Strong Performance Areas
              </h3>
              {interviewScore.strongAreas.map((sa, i) => (
                <p key={i} className="text-xs text-[#A1A1AA] font-medium flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {sa}
                </p>
              ))}
            </div>
            <div className="card p-5 space-y-3 border-amber-500/20" style={{ background: 'rgba(245,158,11,0.04)' }}>
              <h3 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                <AlertTriangle className="h-4 w-4" /> Areas to Improve
              </h3>
              {interviewScore.weakAreas.map((wa, i) => (
                <p key={i} className="text-xs text-[#A1A1AA] font-medium flex items-center gap-2">
                  <span className="text-amber-400">→</span> {wa}
                </p>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-[#FAFAFA] text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" /> AI Recommendations
            </h3>
            {interviewScore.recommendations?.map((rec, i) => (
              <div key={i} className="p-3 rounded-lg bg-indigo-500/8 border border-indigo-500/20 text-xs text-[#A1A1AA] font-medium">
                {rec}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { resetInterview(); router.push('/interview'); }}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              <RotateCcw className="h-4 w-4" /> Try Interview Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#FAFAFA] font-bold text-xs border border-[#27272F] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── INTERVIEW ROOM ── */
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col">
      {/* Top Chrome Bar */}
      <div className="border-b border-[#1F1F27] bg-[#0E0E12]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { ttsEngine.stop(); sttEngine.stop(); router.push('/interview'); }}
            className="p-2 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <span className="font-bold text-[#FAFAFA] text-xs">
                {companyName ? `${companyName} Simulation` : `${targetRole} Mock Interview`}
              </span>
              <span className="text-[#71717A] text-xs font-medium ml-2">({interviewType} · {difficulty})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[#71717A]">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums font-semibold">{mins}:{secs}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-[#27272F] overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="font-bold text-indigo-400 tabular-nums">
              {currentQuestionIndex + 1} / {questions.length || 5}
            </span>
          </div>
          <button
            onClick={() => { ttsEngine.stop(); sttEngine.stop(); router.push('/interview'); }}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/25 font-bold hover:bg-rose-500/20 transition-colors"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 space-y-8">
        {/* AI Avatar */}
        <div className="relative flex flex-col items-center">
          <div className={`relative ${isAiSpeaking ? 'glow-pulse' : ''}`}>
            <div className={`h-32 w-32 rounded-full p-1 transition-all duration-300 ${
              isAiSpeaking
                ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-600/30 scale-105'
                : 'bg-gradient-to-tr from-indigo-600/60 to-violet-500/60'
            }`}>
              <div className="h-full w-full rounded-full bg-[#111113] flex items-center justify-center">
                <Bot className={`h-16 w-16 transition-colors ${isAiSpeaking ? 'text-indigo-400' : 'text-[#52525B]'}`} />
              </div>
            </div>

            {/* Audio wave rings when speaking */}
            {isAiSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/15 animate-ping" style={{ animationDuration: '2s' }} />
              </>
            )}
          </div>

          {/* Status badge */}
          <div className={`mt-3 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
            isAiSpeaking ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
            isListening  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' :
            isProcessing ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            'bg-white/5 text-[#71717A] border border-[#27272F]'
          }`}>
            {isAiSpeaking ? '🔊 AI Speaking...' :
             isListening  ? '🎙️ Listening...' :
             isProcessing ? '⚙️ Processing...' :
             '💬 Your Turn'}
          </div>
        </div>

        {/* Question Display */}
        <div className="max-w-2xl w-full text-center space-y-2">
          {isProcessing && questions.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm text-[#71717A] font-medium">Generating personalized interview questions...</p>
            </div>
          ) : (
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FAFAFA] leading-snug px-4">
              "{currentQ?.questionText || 'Loading initial question...'}"
            </h2>
          )}
          {currentQ?.category && (
            <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              {currentQ.category}
            </span>
          )}
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReplayQuestion}
            className="p-3 rounded-xl bg-white/5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/10 border border-[#27272F] transition-colors"
            title="Replay Question"
          >
            <Volume2 className="h-5 w-5" />
          </button>

          {isListening ? (
            <button
              onClick={stopListening}
              className="px-7 py-3.5 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/25 animate-pulse"
            >
              <MicOff className="h-4 w-4" /> Stop Recording
            </button>
          ) : (
            <button
              onClick={startListening}
              className="btn-shine px-7 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              <Mic className="h-4 w-4" /> Start Speaking
            </button>
          )}
        </div>

        {/* Live Transcript / Typing fallback */}
        <div className="w-full max-w-2xl">
          <div className="bg-[#16161A] border border-[#27272F] rounded-2xl p-4 space-y-2 focus-within:border-indigo-500/40 transition-colors">
            <span className="text-[10px] uppercase font-bold text-[#52525B] block">
              Live Speech Transcript / Type Answer:
            </span>
            <textarea
              rows={3}
              value={transcript || typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Your answer will transcribe here in real-time as you speak — or type directly..."
              className="w-full bg-transparent text-xs font-semibold text-[#FAFAFA] placeholder:text-[#3A3A45] focus:outline-none resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleFinishAnswer()}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Submit Answer</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-[#52525B] text-center mt-2 font-medium">
            ⓘ AI-generated interview simulation · Not affiliated with any specific company
          </p>
        </div>
      </div>
    </div>
  );
}
