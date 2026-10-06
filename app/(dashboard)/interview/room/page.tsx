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
  const [showEndModal, setShowEndModal] = useState(false);

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
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Top Chrome Bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-teal-700 flex items-center justify-center">
              <span className="text-[10px] font-black text-white">CP</span>
            </div>
            <span className="font-black text-slate-900 text-sm tracking-tight">CareerPilot AI Interview</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-500 text-xs font-bold">
              {targetRole} · <span className="text-slate-400">{interviewType}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold">
            Remaining: <span className="text-slate-900 tabular-nums font-black">{mins}:{secs}</span>
          </div>
          <button
            onClick={() => setShowEndModal(true)}
            className="px-4 py-2 rounded-full text-red-600 border border-red-200 font-bold hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        {/* AI Avatar */}
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-teal-500 p-0.5 mb-3 shadow-md">
             <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
               <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Interviewer" className="h-full w-full object-cover" />
             </div>
          </div>
          <h2 className="text-sm font-black text-slate-900">Dr. Sarah Chen</h2>
          <p className="text-[11px] text-slate-500 font-bold mt-0.5">Principal Systems Architect & Technical Interviewer</p>
          
          {/* Status badge */}
          <div className="mt-4 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 bg-teal-50 text-teal-600 border border-teal-100">
             <Volume2 className="h-3 w-3" /> SPEAKING QUESTION
          </div>
        </div>

        {/* Question Display */}
        <div className="max-w-3xl w-full text-center space-y-3 mt-4">
          <h2 className="text-2xl md:text-[28px] font-black text-slate-900 leading-snug tracking-tight">
            "{currentQ?.questionText || 'Tell me about yourself and what drove you to specialize in Backend Engineering.'}"
          </h2>
          <p className="text-[11px] text-teal-600/90 font-bold italic max-w-xl mx-auto">
            Hint: keep your answer under 60 seconds. Focus on your college projects, your passion for distributed systems, and real impact.
          </p>
        </div>

        {/* Waveform Visualization (Simulated) */}
        <div className="flex items-center justify-center h-12 gap-1.5 mt-8 mb-4">
          {[12, 24, 16, 32, 20, 40, 24, 32, 16, 28, 12, 24].map((h, i) => (
             <div key={i} className="w-1.5 rounded-full bg-teal-500/80 animate-pulse" style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}></div>
          ))}
        </div>

        {/* Status Pill */}
        <div className="px-6 py-2.5 rounded-full border border-slate-200 bg-white shadow-sm">
           <p className="text-[11px] text-slate-500 font-bold">
             Microphone is active. Speak your answer clearly, or switch to text mode below.
           </p>
        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div className="border-t border-slate-200 bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between shrink-0 text-xs gap-4">
         <div className="flex items-center gap-4 text-slate-500 font-bold tracking-wide uppercase text-[10px]">
           <span>Question {currentQuestionIndex + 1} / {questions.length || 5}</span>
           <span className="text-slate-300">|</span>
           <span>Time on question: 00:12</span>
         </div>
         <div className="flex items-center gap-3">
           <button onClick={handleReplayQuestion} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
             <RotateCcw className="h-3.5 w-3.5" /> Repeat
           </button>
           <button className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
             <span className="font-mono text-sm leading-none">&lt;/&gt;</span> Use Text Input
           </button>
           <button className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
             Transcript ^
           </button>
           <button onClick={() => handleFinishAnswer()} className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-2 shadow-sm transition-colors active:scale-95">
             Next Question &rarr;
           </button>
         </div>
      </div>

      {/* End Interview Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 animate-in zoom-in-95">
            <h3 className="text-[15px] font-black text-slate-900 mb-2">End Interview Early?</h3>
            <p className="text-[11px] text-slate-500 font-medium mb-6 leading-relaxed">
              Are you sure you want to end your interview session? Your progress will be saved and an analytics report will be generated.
            </p>
            <div className="flex items-center justify-between gap-3">
              <button 
                onClick={() => setShowEndModal(false)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Continue Interview
              </button>
              <button 
                onClick={() => {
                  ttsEngine.stop();
                  sttEngine.stop();
                  router.push('/interview');
                }}
                className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-[11px] font-bold shadow-md shadow-red-900/20 transition-all active:scale-95"
              >
                Yes, End & View Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
