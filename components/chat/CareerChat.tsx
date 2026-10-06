'use client';

import { useState, useRef, useEffect } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { Send, X, Bot, Sparkles, Loader2, MessageCircle, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  grounding?: string[];
}

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

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-career-chat', handler);
    return () => window.removeEventListener('open-career-chat', handler);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen]); // Also trigger on open

  const greeting = `Hello ${profile.fullName?.split(' ')[0] || 'there'}! I'm your dedicated CareerPilot AI coach. I've reviewed your verified profile, target role (${profile.targetRole}), and recent interview benchmark (78/100). How can I guide your preparation today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: greeting,
      timestamp: 'Just now',
      grounding: ['Verified Profile (92%)', '1 Career Benchmark Report (78)'],
    },
  ]);

  const quickPrompts = [
    `What should I study today?`,
    `Why is my resume score low?`,
    `Prepare me for a system design round`,
    `What interview questions will they ask about my project?`,
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

    const contextPrompt = `You are CareerPilot AI, a sharp and encouraging career coach for a college student.
STUDENT PROFILE:
- Name: ${profile.fullName}
- Target Role: ${profile.targetRole}
- Skills: ${skills.map(s => s.name).join(', ')}

STUDENT'S QUESTION: "${query}"

Give a personalized, practical, specific answer. Be concise (max 3 paragraphs).`;

    const aiText = await askGemini(contextPrompt);

    const finalText = aiText ||
      `Based on your ${profile.targetRole} profile, focus on building demonstrable projects, practice STAR-format answers for behavioral questions, and review core concepts daily.`;

    const aiMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      sender: 'ai',
      text: finalText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      grounding: ['CareerPilot AI Core Knowledge'],
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  // If closed, don't render the panel
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]" 
        onClick={() => setIsOpen(false)}
      />

      {/* Side Panel */}
      <div className="fixed top-0 right-0 h-screen w-full md:w-[420px] bg-white border-l border-slate-200 shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-300 font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col gap-4 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/30">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[15px] text-slate-900">CareerPilot AI Coach</h3>
                <p className="text-[11px] font-semibold text-teal-600 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse block"></span>
                  Personalized for {profile.targetRole}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[11px] font-bold transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-slate-50/50 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-3", msg.sender === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.sender === 'ai' && (
                <div className="h-8 w-8 rounded-[10px] bg-teal-800 flex items-center justify-center text-teal-100 shrink-0 shadow-sm mt-1">
                  <Briefcase className="h-4 w-4" />
                </div>
              )}
              
              <div className="flex flex-col gap-2 max-w-[85%]">
                <div
                  className={cn(
                    "px-4 py-3 text-[13px] leading-relaxed shadow-sm",
                    msg.sender === 'user'
                      ? "bg-slate-900 text-white rounded-2xl rounded-tr-sm font-medium"
                      : "bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm font-medium"
                  )}
                >
                  <p>{msg.text}</p>
                </div>

                {msg.sender === 'ai' && msg.grounding && (
                  <div className="px-3 py-2 rounded-xl bg-white border border-teal-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 mb-1">Grounded in:</p>
                    <ul className="space-y-1">
                      {msg.grounding.map((g, i) => (
                        <li key={i} className="text-[10px] font-bold text-teal-600 flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-teal-400"></span>
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-[11px] text-teal-600 p-2 font-bold ml-11">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Analyzing profile & crafting response...</span>
            </div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your resume, roadmap, or interview..."
              className="w-full bg-white border border-slate-200 rounded-full pl-5 pr-12 py-3.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-medium shadow-sm"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2 rounded-full bg-teal-600 text-white disabled:opacity-50 hover:bg-teal-700 transition-colors shadow-md"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
        
      </div>
    </>
  );
}
