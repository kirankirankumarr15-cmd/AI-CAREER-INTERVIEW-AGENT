'use client';

import { useState, useRef, useEffect } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { MessageSquare, Send, X, Bot, Sparkles, Loader2, ChevronRight, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

// Call backend Gemini API route
async function askGemini(prompt: string): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data?.text || '';
  } catch {
    return '';
  }
}

export function CareerChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile, skills, projects, experiences } = useProfileStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const greeting = `Hi ${profile.fullName?.split(' ')[0] || 'there'}! 👋 I'm your AI Career Coach. I know your profile — skills like ${skills.slice(0, 3).map(s => s.name).join(', ')} and projects like "${projects[0]?.title || 'your projects'}". Ask me anything!`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: greeting,
      timestamp: 'Just now',
    },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Dynamic quick prompts based on user's actual profile
  const quickPrompts = [
    `What interview questions will they ask about "${projects[0]?.title || 'my project'}"?`,
    `How can I improve my ${profile.targetRole} skills this week?`,
    `Write a strong summary for my resume targeting ${profile.targetRole}`,
    `What are the top 5 DSA topics for ${profile.targetRole} interviews?`,
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    // Build a rich context prompt using actual user profile data
    const contextPrompt = `You are CareerPilot AI, a sharp and encouraging career coach for a college student.

STUDENT PROFILE:
- Name: ${profile.fullName}
- Target Role: ${profile.targetRole}
- College: ${profile.college || 'College'}
- Skills: ${skills.map(s => `${s.name} (${s.proficiency})`).join(', ')}
- Projects: ${projects.map(p => `"${p.title}" — Tech: ${p.techStack?.join(', ')}`).join(' | ')}
- Experience: ${experiences.map(e => `${e.role} at ${e.company}`).join(', ') || 'fresher'}
- Readiness Score: ${profile.readinessScore}%

STUDENT'S QUESTION: "${query}"

Give a personalized, practical, specific answer referencing their actual skills, projects, or target role where relevant. 
Be concise (max 3 paragraphs or bullet points). Be encouraging but honest. Do NOT give generic advice.`;

    const aiText = await askGemini(contextPrompt);

    const finalText = aiText ||
      `Based on your ${profile.targetRole} profile and skills like ${skills[0]?.name || 'your tech stack'}, here's my advice for "${query}": Focus on building demonstrable projects around your target role, practice STAR-format answers for behavioral questions, and research the specific company's tech culture. Your "${projects[0]?.title || 'current project'}" is a great talking point — be ready to explain architectural decisions and trade-offs you made.`;

    const aiMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      sender: 'ai',
      text: finalText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105 active:scale-95"
        >
          <Bot className="h-4 w-4" />
          <span>Ask CareerPilot</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        </button>
      )}

      {isOpen && (
        <div className="w-96 h-[540px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">CareerPilot AI Coach</h3>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  Context-Aware • Knows Your Profile
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a
                href="https://wa.me/919999999999?text=Hello%20CareerPilot%20Support"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-indigo-900/50 transition-colors flex items-center gap-1 text-[10px] font-bold"
                title="Chat on WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded text-slate-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 text-xs mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none font-medium'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[9px] opacity-60 block text-right mt-1 font-mono">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Analyzing your profile & crafting response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts — shown until user has chatted a bit */}
          {messages.length < 4 && (
            <div className="p-2 border-t border-slate-100 bg-white shrink-0">
              <p className="text-[9px] uppercase font-bold text-slate-400 px-1 mb-1.5 tracking-wider">Quick Ask</p>
              <div className="space-y-1">
                {quickPrompts.slice(0, 2).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors font-semibold flex items-center gap-1.5 truncate"
                  >
                    <ChevronRight className="h-3 w-3 shrink-0 text-indigo-400" />
                    <span className="truncate">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about interview, resume, skills..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 font-medium"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
