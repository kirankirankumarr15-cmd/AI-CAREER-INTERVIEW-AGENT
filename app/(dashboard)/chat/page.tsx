'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { createClient } from '@/utils/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Square,
  Sparkles,
  Plus,
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Edit2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Paperclip,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  Bot,
  User,
  Zap,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  title: string;
  pinned: boolean;
  remember_across_chats: boolean;
  last_active_at: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  grounding?: string[];
  deepLinks?: Array<{ label: string; href: string }>;
  proposal?: {
    actionId: string;
    toolName: string;
    args: Record<string, unknown>;
    summary: string;
    riskLevel: string;
  };
  feedback?: 'up' | 'down' | null;
  model?: string;
  latency_ms?: number;
  tokens_prompt?: number;
  tokens_completion?: number;
  cost_cents?: number;
  created_at: string;
}

export default function ChatPage() {
  const { profile, skills, projects } = useProfileStore();
  const supabase = createClient();

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState('');

  // Messages & Streaming state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // User Actions state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Attached File & OCR
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);

  // Cross-chat memory & Quota
  const [rememberAcrossChats, setRememberAcrossChats] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ messagesUsed: number; messagesLimit: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  // Load chat sessions on mount
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (data.sessions && data.sessions.length > 0 && !activeSessionId) {
          setActiveSessionId(data.sessions[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch sessions:', err);
    }
  }, [activeSessionId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages whenever active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const res = await fetch(`/api/chat/messages?sessionId=${activeSessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(
            (data.messages || []).map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              feedback: m.feedback,
              model: m.model,
              latency_ms: m.latency_ms,
              created_at: m.created_at,
              proposal: m.tool_results?.[0],
            }))
          );
        }
      } catch (err) {
        console.warn('Failed to load messages for session:', err);
      }
    }

    loadMessages();
  }, [activeSessionId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Handle Ctrl+K shortcut to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      if (e.key === 'Escape' && isStreaming) {
        e.preventDefault();
        handleStopStreaming();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming]);

  // Create New Chat
  const handleNewChat = async () => {
    if (isStreaming) handleStopStreaming();
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation', rememberAcrossChats }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessions((prev) => [data.session, ...prev]);
        setActiveSessionId(data.session.id);
        setMessages([]);
        setInput('');
        textareaRef.current?.focus();
      }
    } catch (err) {
      console.warn('Failed to create new session:', err);
    }
  };

  // Rename Session
  const handleRenameSession = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, title: newTitle.trim() } : s))
        );
        setEditingSessionId(null);
      }
    } catch (err) {
      console.warn('Failed to rename session:', err);
    }
  };

  // Pin/Unpin Session
  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !currentPin }),
      });
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, pinned: !currentPin } : s))
        );
      }
    } catch (err) {
      console.warn('Failed to toggle pin:', err);
    }
  };

  // Delete Single Session
  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = sessions.filter((s) => s.id !== id);
        setSessions(remaining);
        if (activeSessionId === id) {
          setActiveSessionId(remaining[0]?.id || null);
        }
      }
    } catch (err) {
      console.warn('Failed to delete session:', err);
    }
  };

  // Delete All Chats
  const handleDeleteAllChats = async () => {
    if (!confirm('Warning: This will permanently delete ALL your conversations. Proceed?')) return;
    try {
      const res = await fetch('/api/chat/sessions', { method: 'DELETE' });
      if (res.ok) {
        setSessions([]);
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.warn('Failed to delete all chats:', err);
    }
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsStreaming(false);
    setThinkingStep(null);
  };

  // Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isStreaming) return;

    setErrorMessage(null);
    setInput('');
    if (attachedFile) setAttachedFile(null);

    // Optimistically add User Message
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: prompt,
      created_at: new Date().toISOString(),
    };

    // Placeholder Assistant Message
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setThinkingStep('Checking verified profile credentials...');

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: prompt,
          sessionId: activeSessionId,
          attachedContent: attachedFile?.content,
          rememberAcrossChats,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${res.status}`);
      }

      if (!res.body) {
        throw new Error('Readable stream not supported by browser.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedAnswer = '';
      let activeGrounding: string[] = [];
      let activeDeepLinks: Array<{ label: string; href: string }> = [];
      let activeProposal: any = null;

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
                if (eventData.sessionId && eventData.sessionId !== activeSessionId) {
                  setActiveSessionId(eventData.sessionId);
                  loadSessions();
                }
                if (eventData.grounding) activeGrounding = eventData.grounding;
                if (eventData.deepLinks) activeDeepLinks = eventData.deepLinks;
                setThinkingStep('Synthesizing career recommendations...');
              } else if (eventData.type === 'token') {
                setThinkingStep(null);
                streamedAnswer += eventData.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: streamedAnswer,
                          grounding: activeGrounding,
                          deepLinks: activeDeepLinks,
                        }
                      : m
                  )
                );
              } else if (eventData.type === 'proposal') {
                activeProposal = eventData.proposal;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, proposal: activeProposal } : m
                  )
                );
              } else if (eventData.type === 'done') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: streamedAnswer,
                          grounding: activeGrounding,
                          deepLinks: activeDeepLinks,
                          proposal: activeProposal,
                          tokens_prompt: eventData.tokens?.promptTokens,
                          tokens_completion: eventData.tokens?.completionTokens,
                          latency_ms: eventData.latencyMs,
                        }
                      : m
                  )
                );
              } else if (eventData.type === 'error') {
                setErrorMessage(eventData.error);
              }
            } catch {
              // Ignore malformed chunk
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'Something went wrong. Please check your connection.');
        // Restore prompt in composer for quick retry
        setInput(prompt);
      }
    } finally {
      setIsStreaming(false);
      setThinkingStep(null);
      setAbortController(null);
    }
  };

  // Feedback (Thumbs Up / Down)
  const handleFeedback = async (msgId: string, type: 'up' | 'down') => {
    try {
      const currentFeedback = messages.find((m) => m.id === msgId)?.feedback;
      const nextFeedback = currentFeedback === type ? null : type;

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, feedback: nextFeedback } : m))
      );

      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId, feedback: nextFeedback }),
      });
    } catch (err) {
      console.warn('Feedback update error:', err);
    }
  };

  // Read Aloud (TTS)
  const handleReadAloud = async (msgId: string, text: string) => {
    if (playingAudioId === msgId) {
      audioElement?.pause();
      setPlayingAudioId(null);
      return;
    }

    try {
      setPlayingAudioId(msgId);
      const res = await fetch('/api/chat/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 1000) }),
      });

      if (!res.ok) {
        // Fallback to browser SpeechSynthesis
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => setPlayingAudioId(null);
          window.speechSynthesis.speak(utterance);
          return;
        }
        throw new Error('TTS failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      setAudioElement(audio);

      audio.onended = () => {
        setPlayingAudioId(null);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setPlayingAudioId(null);
      };

      await audio.play();
    } catch {
      setPlayingAudioId(null);
    }
  };

  // Execute Confirmed Sensitive Action
  const handleConfirmAction = async (proposal: any) => {
    setExecutingActionId(proposal.actionId);
    setActionSuccessMessage(null);
    try {
      const res = await fetch('/api/chat/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionName: proposal.toolName,
          args: proposal.args,
          actionId: proposal.actionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed.');

      setActionSuccessMessage(data.message);
      // Remove proposal card after successful execution
      setMessages((prev) =>
        prev.map((m) => (m.proposal?.actionId === proposal.actionId ? { ...m, proposal: undefined } : m))
      );
    } catch (err: any) {
      alert(`Action error: ${err.message}`);
    } finally {
      setExecutingActionId(null);
    }
  };

  // Voice recording (Speech-to-Text)
  const handleToggleVoice = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert('Speech Recognition is not supported by your browser. Please type your message.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // File Upload & OCR Preview
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingDoc(true);
    try {
      if (file.type === 'text/plain') {
        const text = await file.text();
        setAttachedFile({ name: file.name, content: text });
      } else {
        // Generic text representation / OCR note
        setAttachedFile({
          name: file.name,
          content: `Uploaded document "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Please analyze this file for my career profile.`,
        });
      }
    } catch {
      alert('Could not read file.');
    } finally {
      setIsExtractingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Dynamic starter prompts grounded in real data
  const starterPrompts = [
    {
      title: 'Analyze My Skill Gaps',
      desc: `Compare my verified skills against benchmarks for ${profile.targetRole || 'Software Engineer'}.`,
      prompt: `What are the top 3 gaps between my verified skills and industry benchmarks for a ${profile.targetRole || 'Software Engineer'}?`,
    },
    {
      title: 'Interview Improvement',
      desc: 'Get direct coaching on my latest mock interview scores.',
      prompt: 'Review my latest mock interview scores. What are my weakest areas and how can I fix them before real placements?',
    },
    {
      title: 'Today’s Learning Mission',
      desc: 'Check my current daily streak and next priority milestone.',
      prompt: 'What is my top priority learning roadmap milestone for today, and how do I keep my streak alive?',
    },
    {
      title: 'Resume & Job Readiness',
      desc: `Evaluate my readiness score (${profile.readinessScore || 65}%) for upcoming openings.`,
      prompt: `My career readiness score is currently ${profile.readinessScore || 65}%. What concrete project or certificate will give me the highest score increase?`,
    },
  ];

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* ────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: Conversation History                         */}
      {/* ────────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col border-r border-slate-800 bg-slate-950/80 backdrop-blur-md transition-all duration-300 z-20',
          sidebarOpen ? 'w-72 md:w-80' : 'w-0 overflow-hidden border-none'
        )}
      >
        {/* Header / New Chat */}
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden"
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              {searchQuery ? 'No matching conversations' : 'No conversations yet.'}
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const isEditing = s.id === editingSessionId;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    if (!isEditing) setActiveSessionId(s.id);
                  }}
                  className={cn(
                    'group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all',
                    isActive
                      ? 'bg-blue-900/40 text-blue-200 border border-blue-800/60 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-2 truncate mr-2 flex-1">
                    {s.pinned ? (
                      <Pin className="h-3 w-3 text-blue-400 shrink-0 fill-blue-400" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5 text-slate-500 shrink-0 group-hover:text-slate-400" />
                    )}

                    {isEditing ? (
                      <input
                        type="text"
                        value={editingSessionTitle}
                        onChange={(e) => setEditingSessionTitle(e.target.value)}
                        onBlur={() => handleRenameSession(s.id, editingSessionTitle)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSession(s.id, editingSessionTitle);
                          if (e.key === 'Escape') setEditingSessionId(null);
                        }}
                        autoFocus
                        className="bg-slate-900 px-1 py-0.5 rounded text-white text-xs w-full focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{s.title || 'Untitled Chat'}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(s.id, s.pinned);
                      }}
                      title={s.pinned ? 'Unpin chat' : 'Pin chat'}
                      className="p-1 hover:text-white rounded"
                    >
                      <Pin className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSessionId(s.id);
                        setEditingSessionTitle(s.title);
                      }}
                      title="Rename chat"
                      className="p-1 hover:text-white rounded"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(s.id);
                      }}
                      title="Delete chat"
                      className="p-1 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Memory toggle & clear all */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] space-y-2">
          <label className="flex items-center justify-between text-slate-400 cursor-pointer select-none">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>Cross-chat Memory</span>
            </span>
            <input
              type="checkbox"
              checked={rememberAcrossChats}
              onChange={(e) => setRememberAcrossChats(e.target.checked)}
              className="accent-blue-600 h-3.5 w-3.5 rounded cursor-pointer"
            />
          </label>

          <button
            onClick={handleDeleteAllChats}
            className="w-full py-1.5 text-center text-slate-500 hover:text-rose-400 transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear all conversations</span>
          </button>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MAIN CONVERSATION CONTAINER                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full bg-slate-900 relative">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                title="Open sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-blue-800/50 border border-blue-700 flex items-center justify-center text-blue-300">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                  <span>Ask CareerPilot</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-900/60 text-blue-300 border border-blue-700">
                    ChatGPT Powered
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500">
                  Grounded in verified profile ({skills.length} skills, {profile.readinessScore || 65}% readiness)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl w-full mx-auto scrollbar-thin scrollbar-thumb-slate-800">
          {messages.length === 0 ? (
            /* Empty State: Starter Prompts */
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 max-w-xl mx-auto space-y-8 animate-fadeIn">
              <div className="space-y-3">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-800/40 border border-blue-700/60 flex items-center justify-center text-blue-300 shadow-xl shadow-blue-900/30">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-slate-100">How can I help your career today?</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  I have full access to your verified career credentials, target role benchmarks, mock interview performance, and learning roadmap. Ask me anything or choose a starting point below.
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {starterPrompts.map((card, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(card.prompt)}
                    className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-600 text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{card.desc}</p>
                    </div>
                    <span className="text-[10px] text-blue-400 mt-2 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Ask now</span>
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message turns */
            messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 group transition-all',
                    isAssistant ? 'justify-start' : 'justify-end'
                  )}
                >
                  {isAssistant && (
                    <div className="h-8 w-8 rounded-xl bg-blue-800/40 border border-blue-700 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={cn('space-y-2 max-w-[85%]', isAssistant ? 'text-left' : 'text-right')}>
                    {/* User Edit Box or Normal Render */}
                    {!isAssistant && editingMessageId === msg.id ? (
                      <div className="bg-slate-950 border border-blue-700 rounded-xl p-3 space-y-2 text-left">
                        <textarea
                          value={editingMessageText}
                          onChange={(e) => setEditingMessageText(e.target.value)}
                          className="w-full bg-slate-900 text-xs text-white p-2 rounded-lg focus:outline-none resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setEditingMessageId(null);
                              handleSendMessage(editingMessageText);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
                          >
                            Save & Resend
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'p-4 rounded-2xl text-xs leading-relaxed',
                          isAssistant
                            ? 'bg-slate-950/70 border border-slate-800 text-slate-200'
                            : 'bg-blue-600 text-white ml-auto'
                        )}
                      >
                        {isAssistant ? (
                          <div className="prose prose-invert prose-xs max-w-none space-y-3">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const codeText = String(children).replace(/\n$/, '');
                                  const codeId = `code-${Math.random()}`;

                                  if (!inline) {
                                    return (
                                      <div className="my-2 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden font-mono text-[11px]">
                                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[10px]">
                                          <span>{match?.[1] || 'code'}</span>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(codeText);
                                              setCopiedCodeId(codeId);
                                              setTimeout(() => setCopiedCodeId(null), 2000);
                                            }}
                                            className="flex items-center gap-1 hover:text-white transition-colors"
                                          >
                                            {copiedCodeId === codeId ? (
                                              <>
                                                <Check className="h-3 w-3 text-blue-400" />
                                                <span>Copied</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="h-3 w-3" />
                                                <span>Copy code</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                        <pre className="p-3 overflow-x-auto text-slate-200">
                                          <code>{children}</code>
                                        </pre>
                                      </div>
                                    );
                                  }
                                  return (
                                    <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-blue-300 font-mono text-[11px]">
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>

                            {/* Grounding Citation Chips */}
                            {msg.grounding && msg.grounding.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap gap-1.5 items-center">
                                <span className="text-[10px] text-slate-500 font-medium">Grounding:</span>
                                {msg.grounding.map((chip, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono"
                                  >
                                    {chip}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Deep Links Action Buttons */}
                            {msg.deepLinks && msg.deepLinks.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {msg.deepLinks.map((link, idx) => (
                                  <a
                                    key={idx}
                                    href={link.href}
                                    className="px-3 py-1.5 rounded-xl bg-blue-900/50 hover:bg-blue-600 border border-blue-700/80 text-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                                  >
                                    <span>{link.label}</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Sensitive Action Proposal Card (Requires Explicit Student Confirmation) */}
                            {msg.proposal && (
                              <div className="mt-3 p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/80 text-slate-200 space-y-2">
                                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>Action Confirmation Required</span>
                                </div>
                                <p className="text-xs text-slate-300">{msg.proposal.summary}</p>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handleConfirmAction(msg.proposal)}
                                    disabled={executingActionId === msg.proposal.actionId}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                                  >
                                    {executingActionId === msg.proposal.actionId ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>Executing...</span>
                                      </>
                                    ) : (
                                      <span>Confirm Action</span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setMessages((prev) =>
                                        prev.map((m) =>
                                          m.id === msg.id ? { ...m, proposal: undefined } : m
                                        )
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    )}

                    {/* Turn Actions on Hover / Focus */}
                    <div
                      className={cn(
                        'flex items-center gap-2 text-[10px] text-slate-500 px-1',
                        isAssistant ? 'justify-start' : 'justify-end'
                      )}
                    >
                      {isAssistant ? (
                        <>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              setCopiedId(msg.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="hover:text-slate-300 flex items-center gap-1"
                            title="Copy reply"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-blue-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            onClick={() => handleReadAloud(msg.id, msg.content)}
                            className="hover:text-slate-300 flex items-center gap-1"
                            title="Read aloud"
                          >
                            {playingAudioId === msg.id ? (
                              <>
                                <VolumeX className="h-3 w-3 text-blue-400 animate-pulse" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3 w-3" />
                                <span>Read</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleFeedback(msg.id, 'up')}
                            className={cn(
                              'hover:text-slate-300 p-0.5 rounded',
                              msg.feedback === 'up' && 'text-blue-400'
                            )}
                            title="Thumbs up"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => handleFeedback(msg.id, 'down')}
                            className={cn(
                              'hover:text-slate-300 p-0.5 rounded',
                              msg.feedback === 'down' && 'text-rose-400'
                            )}
                            title="Thumbs down"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </button>

                          {msg.latency_ms && (
                            <span className="text-[9px] text-slate-600 font-mono">
                              {(msg.latency_ms / 1000).toFixed(1)}s
                            </span>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditingMessageText(msg.content);
                          }}
                          className="hover:text-slate-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 font-bold text-xs">
                      {profile.fullName
                        ? profile.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'ME'}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Thinking / Streaming Indicator */}
          {thinkingStep && (
            <div className="flex items-center gap-3 animate-fadeIn">
              <div className="h-8 w-8 rounded-xl bg-blue-800/40 border border-blue-700 flex items-center justify-center text-blue-300 shrink-0">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                <span>{thinkingStep}</span>
              </div>
            </div>
          )}

          {/* Action Success Alert */}
          {actionSuccessMessage && (
            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-700/80 text-blue-300 text-xs flex items-center justify-between">
              <span>{actionSuccessMessage}</span>
              <button onClick={() => setActionSuccessMessage(null)}>
                <X className="h-3.5 w-3.5 text-blue-400" />
              </button>
            </div>
          )}

          {/* Error Banner with Retry */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white font-medium text-[11px] shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* STICKY COMPOSER                                            */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md p-4 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Attached file chip preview */}
            {attachedFile && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 w-fit animate-fadeIn">
                <Paperclip className="h-3.5 w-3.5 text-blue-400" />
                <span className="truncate max-w-xs">{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="hover:text-rose-400 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Input row */}
            <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 focus-within:border-blue-500 transition-all shadow-inner">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                title="Attach resume or certificate"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask CareerPilot anything about your career, roadmap, or interview..."
                rows={1}
                className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none py-1.5 max-h-40 leading-relaxed"
              />

              {/* Voice recording button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                disabled={isStreaming}
                className={cn(
                  'p-2 rounded-xl transition-colors shrink-0',
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
                title="Voice input"
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              {/* Send / Stop button */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopStreaming}
                  className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-all shrink-0 active:scale-95 shadow-md"
                  title="Stop generation (Esc)"
                >
                  <Square className="h-4 w-4 fill-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim()}
                  className={cn(
                    'p-2 rounded-xl transition-all shrink-0 active:scale-95 shadow-md',
                    input.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  )}
                  title="Send message (Enter)"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Footer disclosure */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>CareerPilot AI is strictly grounded in your verified data.</span>
              <span className="hidden sm:inline">Ctrl+K to focus • Esc to stop</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
