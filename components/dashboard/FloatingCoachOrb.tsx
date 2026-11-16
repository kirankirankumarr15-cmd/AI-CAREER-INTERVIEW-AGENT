'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, X, Send, ArrowRight, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/useProfileStore';

export function FloatingCoachOrb() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const quickPrompts = [
    'What are my biggest skill gaps?',
    'How do I reach 80% readiness?',
    'Give me a 15-min interview drill',
  ];

  const handleLaunchChat = (prompt?: string) => {
    // Open full chat or pass query via custom event
    window.dispatchEvent(
      new CustomEvent('open-career-chat', {
        detail: { initialPrompt: prompt || query },
      })
    );
    setIsOpen(false);
    if (prompt || query) {
      router.push(`/chat?prompt=${encodeURIComponent(prompt || query)}`);
    }
  };

  return (
    <>
      {/* Floating HUD Orb Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-14 w-14 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-2xl shadow-cyan-500/30 flex items-center justify-center border border-white/20 group"
          title="Ask CareerCoach AI"
        >
          {/* Ambient Glow Pulse */}
          <span className="absolute inset-0 rounded-full bg-cyan-400/30 blur-md animate-ping pointer-events-none" />

          <div className="h-full w-full rounded-full bg-[#070A12] flex items-center justify-center text-white relative z-10">
            {isOpen ? (
              <X className="h-6 w-6 text-cyan-400" />
            ) : (
              <Bot className="h-6 w-6 text-cyan-400 group-hover:scale-110 transition-transform" />
            )}
          </div>

          {/* Active AI online indicator */}
          <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[#070A12] z-20" />
        </motion.button>
      </div>

      {/* Floating Glass Chat Expansion Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-40 w-[92vw] max-w-sm rounded-3xl hud-glass-card border border-white/15 p-5 shadow-2xl backdrop-blur-2xl font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-extrabold font-heading text-sm text-white flex items-center gap-1.5">
                    CareerCoach AI
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      RAG Live
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Grounded in your verified engineering profile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-1.5 mb-4">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Instant Directives
              </p>
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleLaunchChat(p)}
                  className="w-full text-left p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs text-slate-200 hover:text-cyan-300 transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{p}</span>
                  <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-cyan-300 transition-colors" />
                </button>
              ))}
            </div>

            {/* Quick Input */}
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLaunchChat()}
                placeholder="Ask CareerCoach anything..."
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
              />
              <button
                onClick={() => handleLaunchChat()}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Link to full chat */}
            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/chat');
                }}
                className="text-[11px] font-mono text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                <MessageSquare className="h-3 w-3" />
                <span>Open Full Ask CareerPilot Studio</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

