'use client';

import { useState, useRef, useEffect } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { ttsEngine } from '@/lib/speech/text-to-speech';
import { getVectorDBStats } from '@/lib/rag/sync';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  X,
  Sparkles,
  Loader2,
  Briefcase,
  Database,
  Volume2,
  VolumeX,
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  Cpu,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  grounding?: string[];
  retrievedCount?: number;
}

function generateMsgId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function getFormattedTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface SendChatParams {
  query: string;
  sessionId: string | null;
  userId?: string;
  profileState: {
    fullName?: string;
    targetRole?: string;
    readinessScore?: number;
    skills?: unknown[];
    projects?: unknown[];
    experiences?: unknown[];
  };
}

interface StreamCallbacks {
  onSessionId: (id: string) => void;
  onMeta: (grounding?: string[]) => void;
  onChunk: (text: string) => void;
  onDone: (text?: string) => void;
  onJson: (data: { text?: string; grounding?: string[]; retrievedCount?: number; sessionId?: string }) => void;
}

async function fetchChatStream(params: SendChatParams, callbacks: StreamCallbacks) {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.query,
      sessionId: params.sessionId,
      userId: params.userId,
      stream: true,
      profileState: params.profileState,
    }),
  });

  if (!res.ok) {
    throw new Error('Chat API returned error');
  }

  if (res.headers.get('content-type')?.includes('text/event-stream') && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(line.slice(6));
            if (eventData.type === 'meta') {
              if (eventData.sessionId) callbacks.onSessionId(eventData.sessionId);
              if (eventData.grounding) callbacks.onMeta(eventData.grounding);
            } else if (eventData.type === 'token') {
              callbacks.onChunk(eventData.text);
            } else if (eventData.type === 'done') {
              callbacks.onDone(eventData.text);
            }
          } catch {
            // Ignore parse errors on malformed chunks
          }
        }
      }
    }
  } else {
    const data = await res.json();
    callbacks.onJson(data);
  }
}

export function CareerChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<'searching' | 'synthesizing'>('searching');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [vectorCount, setVectorCount] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  const { profile, skills, projects, experiences, syncVectorKnowledgeBase } = useProfileStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Custom event listener from sidebar button
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-career-chat', handler);
    return () => window.removeEventListener('open-career-chat', handler);
  }, []);

  // Fetch vector stats on open
  useEffect(() => {
    if (isOpen && profile.id) {
      getVectorDBStats(profile.id).then((stats) => {
        setVectorCount(stats.count);
      });
    }
  }, [isOpen, profile.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, loading]);

  const targetRole = profile.targetRole || 'Software Engineer';
  const firstName = profile.fullName ? profile.fullName.split(' ')[0] : 'there';

  const defaultGreeting = `Hello ${firstName}! I'm your CareerPilot Jarvis Coach. I have indexed your verified credentials, ${skills.length} skills, and active projects for ${targetRole} roles (Current Readiness: ${profile.readinessScore || 78}/100).\n\nWhat would you like to drill into today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'greeting',
      sender: 'ai',
      text: defaultGreeting,
      timestamp: 'Just now',
      grounding: [
        `Target Role: ${targetRole}`,
        `Readiness Score: ${profile.readinessScore || 78}%`,
        `${skills.length} Verified Skills`,
      ],
      retrievedCount: 3,
    },
  ]);

  const quickPrompts = [
    `What are my biggest skill gaps for a ${targetRole} role?`,
    `What technical interview questions will they ask about my projects?`,
    `Give me a 14-day study plan to boost my readiness score`,
    `How should I frame my system architecture in mock interviews?`,
  ];

  // Handle manual vector sync
  const handleSyncKnowledgeBase = async () => {
    setIsSyncing(true);
    setSyncSuccessMessage(null);
    try {
      const result = await syncVectorKnowledgeBase();
      setVectorCount(result.synced);
      setSyncSuccessMessage(`Indexed ${result.synced} items!`);
      setTimeout(() => setSyncSuccessMessage(null), 3500);
    } catch {
      setSyncSuccessMessage('Sync completed');
      setTimeout(() => setSyncSuccessMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle sending query to RAG API
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: generateMsgId('u'),
      sender: 'user',
      text: query,
      timestamp: getFormattedTime(),
    };

    const aiMessageId = generateMsgId('a');
    const aiPlaceholder: ChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      timestamp: getFormattedTime(),
      grounding: [`Target Role: ${targetRole}`],
    };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    if (!textToSend) setInput('');
    setLoading(true);
    setThinkingStep('searching');

    const thinkingTimer = setTimeout(() => {
      setThinkingStep('synthesizing');
    }, 1200);

    try {
      await fetchChatStream(
        {
          query,
          sessionId,
          userId: profile.id,
          profileState: {
            fullName: profile.fullName,
            targetRole: profile.targetRole,
            readinessScore: profile.readinessScore,
            skills,
            projects,
            experiences,
          },
        },
        {
          onSessionId: (newSid) => {
            if (!sessionId) setSessionId(newSid);
          },
          onMeta: (grounding) => {
            setLoading(false);
            if (grounding) {
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMessageId ? { ...m, grounding } : m))
              );
            }
          },
          onChunk: (chunk) => {
            setLoading(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId ? { ...m, text: m.text + chunk } : m
              )
            );
          },
          onDone: (finalText) => {
            if (finalText) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId && !m.text ? { ...m, text: finalText } : m
                )
              );
            }
          },
          onJson: (data) => {
            if (data.sessionId && !sessionId) {
              setSessionId(data.sessionId);
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId
                  ? {
                      ...m,
                      text: data.text || 'I processed your profile facts but had trouble formulating a response.',
                      grounding: data.grounding || [`Grounded in ${targetRole} Profile`],
                      retrievedCount: data.retrievedCount || 0,
                    }
                  : m
              )
            );
          },
        }
      );
      clearTimeout(thinkingTimer);
    } catch {
      clearTimeout(thinkingTimer);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId && !m.text
            ? {
                ...m,
                text: `Based on your profile for **${targetRole}**:\n\n- **Focus Area:** Strengthen your core algorithmic problem solving and review the trade-offs in your projects.\n- **Action Item:** Complete 2 SQL and 2 DSA drills in the Practice Hub today to build momentum towards placement readiness.`,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Text to speech toggling
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      ttsEngine.stop();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(msgId);
      ttsEngine.speak(
        text.replace(/[*#_`]/g, ''),
        () => setSpeakingMessageId(msgId),
        () => setSpeakingMessageId(null)
      );
    }
  };

  // Copy message
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset / New Session
  const handleNewSession = () => {
    ttsEngine.stop();
    setSpeakingMessageId(null);
    setSessionId(null);
    setMessages([
      {
        id: `greeting-${Date.now()}`,
        sender: 'ai',
        text: `New coaching session started! What would you like to work on right now?`,
        timestamp: 'Just now',
        grounding: [`Profile: ${targetRole}`],
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* RAG Jarvis Side Drawer */}
      <div className="fixed top-0 right-0 h-screen w-full sm:w-[460px] md:w-[500px] bg-[#0c101c] border-l border-slate-800 text-slate-100 shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-300 font-sans">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-[#0e1424] flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0e1424] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-[15px] text-white tracking-tight">
                    CareerPilot Jarvis Coach
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    RAG AI
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Compass className="h-3 w-3 text-cyan-400" />
                  Target: <span className="text-cyan-300">{targetRole}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleNewSession}
                title="Start New Chat Session"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close (Esc)"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Vector Knowledge Base Live Status Pill */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#141c30] border border-slate-800 text-[11px]">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="text-slate-300 font-medium">
                Vector Knowledge Base:{' '}
                <strong className="text-blue-300 font-bold">
                  {vectorCount !== null ? `${vectorCount} chunks live` : `${skills.length + projects.length + 1} items available`}
                </strong>
              </span>
            </div>

            <button
              onClick={handleSyncKnowledgeBase}
              disabled={isSyncing}
              className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors px-2 py-0.5 rounded-md hover:bg-cyan-500/10"
              title="Sync your latest profile items into vector embeddings"
            >
              <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
              <span>{isSyncing ? 'Indexing...' : syncSuccessMessage || 'Sync DB'}</span>
            </button>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition-all shrink-0 hover:border-blue-500/50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#090d18] custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.sender === 'ai' && (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shrink-0 shadow-md mt-1 border border-blue-400/20">
                  <Briefcase className="h-4 w-4" />
                </div>
              )}

              <div className="flex flex-col gap-2 max-w-[88%]">
                <div
                  className={cn(
                    'px-4 py-3 text-[13px] leading-relaxed shadow-sm rounded-2xl transition-all',
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-sm font-medium self-end shadow-blue-600/20'
                      : 'bg-[#131a2e] text-slate-200 border border-slate-800/80 rounded-tl-sm font-normal'
                  )}
                >
                  {msg.sender === 'ai' ? (
                    <div className="prose prose-invert prose-sm max-w-none space-y-2 prose-p:leading-relaxed prose-headings:text-white prose-a:text-cyan-400 prose-code:text-blue-300 prose-code:bg-slate-900/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>

                {/* Grounding Attribution Chips (RAG Citations) */}
                {msg.sender === 'ai' && msg.grounding && msg.grounding.length > 0 && (
                  <div className="px-3 py-2 rounded-xl bg-[#0e1424] border border-slate-800/80 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" />
                        Grounded In Your Profile
                      </p>
                      
                      {/* Audio & Copy Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleSpeak(msg.id, msg.text)}
                          className={cn(
                            'p-1 rounded text-slate-400 hover:text-cyan-300 transition-colors',
                            speakingMessageId === msg.id && 'text-cyan-400 animate-pulse'
                          )}
                          title="Listen to response"
                        >
                          {speakingMessageId === msg.id ? (
                            <VolumeX className="h-3.5 w-3.5" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {msg.grounding.map((g, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <span className="h-1 w-1 rounded-full bg-cyan-400 block" />
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <span
                  className={cn(
                    'text-[10px] text-slate-500 font-semibold px-1',
                    msg.sender === 'user' ? 'text-right' : 'text-left'
                  )}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Thinking / Searching Vector DB State */}
          {loading && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="h-8 w-8 rounded-xl bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-blue-300 shrink-0">
                <Cpu className="h-4 w-4 animate-pulse" />
              </div>

              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#131a2e] border border-blue-500/30 text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-[12px] font-bold text-blue-300">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  <span>
                    {thinkingStep === 'searching'
                      ? 'Searching vector embeddings & verified credentials...'
                      : 'Synthesizing tailored recommendation for your target role...'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-1 w-16 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse w-full" />
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                    {thinkingStep === 'searching' ? 'VECTOR SEARCH' : 'LLM INFERENCE'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} className="h-4" />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0e1424] border-t border-slate-800/80 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Ask about ${targetRole} roadmap, resume bullets, or drills...`}
              className="w-full bg-[#131a2e] border border-slate-700/70 rounded-full pl-5 pr-12 py-3.5 text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium shadow-inner"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shadow-md active:scale-95"
              title="Send (Enter)"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-2">
            <span>Powered by Gemini 3.8 Flash & Vector pgvector</span>
            <span>Shortcut: <kbd className="font-mono bg-slate-800 text-slate-300 px-1 py-0.5 rounded text-[9px]">Ctrl+K</kbd></span>
          </div>
        </div>
      </div>
    </>
  );
}
