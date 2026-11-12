'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/useProfileStore';
import { useProgressStore } from '@/store/useProgressStore';
import { ttsEngine } from '@/lib/speech/text-to-speech';
import { sttEngine } from '@/lib/speech/speech-to-text';
import { GDParticipant, GDTurn } from '@/types';
import {
  Mic,
  MicOff,
  Hand,
  Send,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Users,
  AlertCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';

export default function GroupDiscussionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { profile } = useProfileStore();
  const { updateScores } = useProgressStore();

  const [topic, setTopic] = useState<string>('Placement Group Discussion');
  const [participants, setParticipants] = useState<GDParticipant[]>([]);
  const [turns, setTurns] = useState<GDTurn[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  // Student inputs
  const [typedContribution, setTypedContribution] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [handRaised, setHandRaised] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Turn and Total Timers
  const [turnSeconds, setTurnSeconds] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const maxTotalSeconds = 12 * 60; // 12 min default

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, isProcessing]);

  // ─── Speak via TTS with interrupt support ──────────────────────────────────
  const speakUtterance = useCallback(
    (text: string, speakerName: string) => {
      if (isMuted) return;
      setActiveSpeaker(speakerName);
      ttsEngine.speak(
        text,
        () => setActiveSpeaker(speakerName),
        () => setActiveSpeaker(null)
      );
    },
    [isMuted]
  );

  // ─── Load initial session data ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`prism_gd_session_${sessionId}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.topic) setTopic(data.topic);
          if (data.participants) setParticipants(data.participants);
          if (data.openingTurn) {
            setTurns([data.openingTurn]);
            speakUtterance(data.openingTurn.content, data.openingTurn.speakerName);
          }
        } catch (err) {
          console.warn('[GD Room] Cache read error:', err);
        }
      }
    }

    const timer = setInterval(() => {
      if (!cancelled) {
        setTotalSeconds((s) => s + 1);
        setTurnSeconds((s) => s + 1);
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      ttsEngine.stop();
      sttEngine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ─── STT Speech Toggle with Interruption Handling ──────────────────────────
  const toggleMic = () => {
    if (isListening) {
      sttEngine.stop();
      setIsListening(false);
    } else {
      if (!sttEngine.isSupported()) {
        alert('Web Speech API speech-to-text is not supported in this browser. Please type your contribution.');
        return;
      }
      // Stop AI voice immediately if student starts speaking (interruption)
      ttsEngine.stop();
      setActiveSpeaker(null);
      setLiveTranscript('');
      sttEngine.start(
        (text) => {
          setLiveTranscript(text);
          setTypedContribution(text);
        },
        (err) => console.warn('STT Error:', err)
      );
      setIsListening(true);
    }
  };

  const handleTypedInputChange = (val: string) => {
    setTypedContribution(val);
    // Interruption handling on typing
    if (activeSpeaker && activeSpeaker !== profile.fullName) {
      ttsEngine.stop();
      setActiveSpeaker(null);
    }
  };

  // ─── Raise Hand Action ──────────────────────────────────────────────────────
  const handleRaiseHand = async () => {
    setHandRaised(true);
    ttsEngine.stop();
    setActiveSpeaker(null);

    try {
      const res = await fetch('/api/gd/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          topic,
          raisedHand: true,
          recentTurns: turns.map((t) => ({
            speakerName: t.speakerName,
            speakerRole: t.speakerRole,
            content: t.content,
            turnIndex: t.turnIndex,
          })),
          participants,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.nextTurn) {
          setTurns((prev) => [...prev, data.nextTurn]);
          speakUtterance(data.nextTurn.content, data.nextTurn.speakerName);
        }
      }
    } catch (err) {
      console.warn('[GD Room] Hand raise error:', err);
    }
  };

  // ─── Submit Student Turn & Get Bot Response ─────────────────────────────────
  const handleSubmitTurn = async () => {
    const textToSubmit = (typedContribution || liveTranscript || '').trim();
    if (!textToSubmit) return;

    setIsProcessing(true);
    setHandRaised(false);
    ttsEngine.stop();
    if (isListening) {
      sttEngine.stop();
      setIsListening(false);
    }

    const studentName = profile.fullName || 'Student';
    const studentTurn: GDTurn = {
      id: `turn-${turns.length}-${Date.now()}`,
      sessionId,
      speakerName: studentName,
      speakerRole: 'human',
      turnIndex: turns.length,
      content: textToSubmit,
      inputMethod: liveTranscript ? 'voice' : 'text',
      timestampMs: Date.now(),
      durationSeconds: turnSeconds,
    };

    const updatedTurns = [...turns, studentTurn];
    setTurns(updatedTurns);
    setTypedContribution('');
    setLiveTranscript('');
    setTurnSeconds(0);

    // Call /api/gd/turn to get the next peer bot response
    try {
      const res = await fetch('/api/gd/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          topic,
          studentContent: textToSubmit,
          inputMethod: studentTurn.inputMethod,
          raisedHand: false,
          recentTurns: updatedTurns.map((t) => ({
            speakerName: t.speakerName,
            speakerRole: t.speakerRole,
            content: t.content,
            turnIndex: t.turnIndex,
          })),
          participants,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get bot turn response');
      }

      const data = await res.json();
      if (data.nextTurn) {
        setTurns((prev) => [...prev, data.nextTurn]);
        speakUtterance(data.nextTurn.content, data.nextTurn.speakerName);
      }
    } catch (err) {
      console.error('[GD Room] Turn error:', err);
      setError('Network hiccup retrieving peer response. The discussion is still active.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Conclude Discussion & Generate 4-Metric Evaluation ──────────────────────
  const handleConcludeRound = async () => {
    if (!confirm('Conclude the Group Discussion now and generate your evaluation scorecard?')) {
      return;
    }

    ttsEngine.stop();
    sttEngine.stop();
    setIsProcessing(true);

    try {
      const res = await fetch('/api/gd/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          topic,
          studentName: profile.fullName || 'Student',
          turns: turns.map((t) => ({
            speakerName: t.speakerName,
            speakerRole: t.speakerRole,
            content: t.content,
            turnIndex: t.turnIndex,
            inputMethod: t.inputMethod,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Evaluation failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.evaluation) {
        // Save report for report page
        sessionStorage.setItem(`prism_gd_eval_${sessionId}`, JSON.stringify({
          topic,
          evaluation: data.evaluation,
          turns,
          totalTurns: turns.length,
          studentTurnCount: data.studentTurnCount,
        }));

        if (data.evaluation.overallScore) {
          updateScores({ readinessScore: data.evaluation.overallScore });
        }

        router.push(`/interview/gd/report/${sessionId}`);
      }
    } catch (err) {
      console.error('[GD Room] Conclude error:', err);
      setError('Failed to finalize evaluation. Please try again.');
      setIsProcessing(false);
    }
  };

  // Format Timers
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#070b19] font-sans flex flex-col text-slate-300">
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#070b19]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-900/60 flex items-center justify-center border border-indigo-500/20">
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-white text-[13px] font-bold leading-tight line-clamp-1 max-w-md sm:max-w-xl">
              GD: {topic}
            </h1>
            <p className="text-[10px] text-slate-400">
              PRISM Module 3.3 Simulation • 4 Participants • Round Turn #{turns.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161b2a] border border-white/5 text-slate-300">
            <Clock className="h-3.5 w-3.5 opacity-70" />
            <span className="font-mono">{formatTime(totalSeconds)}</span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute Discussion' : 'Mute Discussion'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            onClick={handleConcludeRound}
            disabled={isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold disabled:opacity-50"
          >
            Conclude GD &amp; Evaluate
          </button>
        </div>
      </div>

      {/* ── Main Screen ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Discussion Thread */}
        <div className="flex-1 flex flex-col p-6 relative">
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-900/30 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
              <button className="ml-auto text-red-400 hover:text-white" onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* Discussion Turns Feed */}
          <div className="flex-1 overflow-y-auto pr-4 space-y-4">
            {turns.map((turn, idx) => {
              const isMod = turn.speakerRole === 'moderator';
              const isHuman = turn.speakerRole === 'human';
              const isSpeakingNow = activeSpeaker === turn.speakerName;

              return (
                <div
                  key={turn.id || idx}
                  className={`flex items-start gap-3.5 max-w-4xl transition-all ${
                    isHuman ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isMod
                        ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : isHuman
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                        : 'bg-slate-700 text-white'
                    } ${isSpeakingNow ? 'ring-2 ring-indigo-400 scale-105' : ''}`}
                  >
                    {turn.speakerName.split(' ')[0][0]}
                  </div>

                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[11px] ${isHuman ? 'justify-end' : ''}`}>
                      <span className="font-bold text-white">{turn.speakerName}</span>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-semibold ${
                        isMod
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : isHuman
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {turn.speakerRole.toUpperCase()}
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl p-4 text-[13px] leading-relaxed shadow-sm ${
                        isMod
                          ? 'bg-[#1b152b] border border-purple-500/20 text-slate-200'
                          : isHuman
                          ? 'bg-[#181d33] border border-indigo-500/30 text-white rounded-tr-sm'
                          : 'bg-[#121629] border border-white/5 text-slate-300 rounded-tl-sm'
                      }`}
                    >
                      {turn.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold animate-pulse pl-2">
                <Sparkles className="h-4 w-4" />
                Synthesizing peer perspective...
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Controls: Voice + Typing + Hand Raise */}
          <div className="mt-4 shrink-0 space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={typedContribution || liveTranscript}
                onChange={(e) => handleTypedInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitTurn();
                  }
                }}
                placeholder={
                  isListening
                    ? 'Listening... Speak your contribution or edit directly'
                    : 'Share your perspective on the topic, build on Aarav or Priya, or raise your hand...'
                }
                disabled={isProcessing}
                className="flex-1 bg-[#121629] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />

              {/* Raise Hand Button */}
              <button
                onClick={handleRaiseHand}
                disabled={handRaised || isProcessing}
                className={`flex items-center gap-1 px-3 py-3 rounded-xl text-xs font-bold transition-all ${
                  handRaised
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-[#121629] border border-white/10 text-slate-300 hover:bg-[#1a2035]'
                }`}
                title="Raise hand to request turn from moderator"
              >
                <Hand className="h-4 w-4" />
                <span className="hidden sm:inline">{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
              </button>

              {/* Mic STT Button */}
              <button
                onClick={toggleMic}
                disabled={isProcessing}
                className={`flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-bold transition-colors ${
                  isListening
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-[#121629] border border-white/10 text-slate-300 hover:bg-[#1a2035]'
                }`}
                title="Toggle Web Speech Voice Input"
              >
                {isListening ? <Mic className="h-4 w-4 text-white" /> : <MicOff className="h-4 w-4 text-slate-400" />}
                <span className="hidden sm:inline">{isListening ? 'Listening' : 'Voice'}</span>
              </button>

              {/* Submit Turn */}
              <button
                onClick={handleSubmitTurn}
                disabled={isProcessing || (!typedContribution.trim() && !liveTranscript.trim())}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Send className="h-3.5 w-3.5" /> Contribute
              </button>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-slate-400" />
                Speaking interrupts bots automatically • Turn timer: {turnSeconds}s
              </span>
              <span>Press Enter or click Contribute</span>
            </div>
          </div>
        </div>

        {/* Right Pane: Participants & Moderator Status */}
        <div className="w-[300px] lg:w-[340px] bg-[#050814] border-l border-white/5 flex flex-col shrink-0 p-5 space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Discussion Panel
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">4-member placement simulation</p>
          </div>

          <div className="space-y-3">
            {participants.map((p) => {
              const isMod = p.role === 'moderator';
              const isHuman = p.role === 'human';
              const isSpeaking = activeSpeaker === p.name;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isSpeaking
                      ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                      : 'border-white/5 bg-[#0e1322]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isMod ? 'bg-purple-600 text-white' : isHuman ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'
                      }`}>
                        {p.name[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{p.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{p.role}</span>
                      </div>
                    </div>

                    {isSpeaking && (
                      <span className="text-[10px] font-bold text-indigo-400 animate-pulse">
                        Speaking...
                      </span>
                    )}
                    {isHuman && handRaised && (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <Hand className="h-3 w-3" /> Raised
                      </span>
                    )}
                  </div>

                  {p.stance && (
                    <p className="text-[10px] text-slate-400 mt-2 border-t border-white/5 pt-1.5 leading-snug line-clamp-2">
                      {p.stance}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-auto p-4 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 space-y-2">
            <p className="font-bold text-slate-300">Scoring Guidelines:</p>
            <p>1. Reference peer statements to score high on <strong>Listening</strong>.</p>
            <p>2. Introduce specific metrics to score high on <strong>Content</strong>.</p>
            <p>3. Do not interrupt; use &quot;Raise Hand&quot; for smooth floor transition.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
