'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Sparkles, Flame, Target, Mic, FileText, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { useProfileStore } from '@/store/useProfileStore';
import { useProgressStore } from '@/store/useProgressStore';

export function HeroMissionControl() {
  const { profile, updateProfile } = useProfileStore();
  const { progress } = useProgressStore();
  const shouldReduceMotion = useReducedMotion();

  const [greeting, setGreeting] = useState('Welcome back');
  const [typedText, setTypedText] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const rawScore = profile.readinessScore || progress.readinessScore || 0;
  const score = Math.max(0, Math.min(100, rawScore));

  const firstName = profile.fullName ? profile.fullName.split(' ')[0] : 'Candidate';
  const streak = progress.dailyStreak || 1;
  const targetRole = profile.targetRole || 'Software Developer';
  const topWeakness = progress.weakAreas?.[0];

  // Dynamic rank determination
  const rank =
    score >= 85
      ? { title: 'Apex Operator', color: 'from-amber-400 to-yellow-500', glow: 'shadow-amber-500/30', border: 'border-amber-400/50' }
      : score >= 70
      ? { title: 'Combat Ready', color: 'from-purple-400 to-indigo-500', glow: 'shadow-purple-500/30', border: 'border-purple-400/50' }
      : score >= 40
      ? { title: 'Rising Candidate', color: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-500/30', border: 'border-cyan-400/50' }
      : { title: 'Cadet Trainee', color: 'from-blue-400 to-slate-400', glow: 'shadow-blue-500/20', border: 'border-blue-400/30' };

  // Dynamic greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // AI insight text for typewriter effect
  const fullInsightText = topWeakness
    ? `Your ${topWeakness} is currently holding you back. Complete today's drill to gain +6% readiness.`
    : score === 0
    ? `Complete your 5-minute diagnostic assessment to calibrate your placement velocity.`
    : `Target role ${targetRole} aligned. Maintain your daily streak to outpace 88% of applicants.`;

  // Typewriter effect
  useEffect(() => {
    if (shouldReduceMotion) {
      setTypedText(fullInsightText);
      return;
    }
    setTypedText('');
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setTypedText(fullInsightText.slice(0, idx));
      if (idx >= fullInsightText.length) clearInterval(interval);
    }, 24);
    return () => clearInterval(interval);
  }, [fullInsightText, shouldReduceMotion]);

  // Spring animated counter for the score
  const springValue = useSpring(0, { stiffness: 60, damping: 20 });
  const displayScore = useTransform(springValue, (val) => Math.round(val));

  useEffect(() => {
    springValue.set(score);
  }, [score, springValue]);

  // SVG circle calculations
  const size = 150;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const roleOptions = [
    'Software Developer',
    'Full Stack Developer',
    'Backend Developer',
    'Frontend Developer',
    'Data Analyst',
    'AI/ML Engineer',
    'Cloud/DevOps',
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl hud-glass-card border border-white/10 p-6 md:p-8">
      {/* Background radial glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-purple-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left: Cockpit Greeting & AI Insight */}
        <div className="flex-1 space-y-4 text-center lg:text-left">
          {/* Header Metadata Chips */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono tracking-wider uppercase font-semibold">
              <Zap className="h-3 w-3 animate-pulse text-cyan-400" />
              Mission Control Active
            </span>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold">
              <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400 animate-bounce" />
              <span>{streak} Day Streak</span>
            </div>

            {/* Target Role Chip with Quick Switcher */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] font-mono transition-all"
              >
                <Target className="h-3 w-3 text-cyan-400" />
                <span className="text-slate-400">Target:</span>
                <span className="font-semibold text-white">{targetRole}</span>
              </button>

              {showRoleMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
                  <div className="absolute left-0 mt-2 w-52 rounded-2xl hud-glass border border-white/15 p-1.5 shadow-2xl z-50 animate-fade-in-up">
                    <p className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                      Switch Target Role
                    </p>
                    {roleOptions.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          updateProfile({ targetRole: r });
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          targetRole === r
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Main Greeting */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-heading text-white tracking-tight">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
              All career telemetry streams synced and operational.
            </p>
          </div>

          {/* Typewriter AI Insight Banner */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3 backdrop-blur-md max-w-xl">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 animate-spin-slow" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-0.5">
                AI Strategic Directive
              </span>
              <p className="text-xs font-mono text-slate-200 leading-relaxed min-h-[36px]">
                {typedText}
                <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 animate-pulse" />
              </p>
            </div>
          </div>

          {/* Action HUD Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <Link
              href="/interview"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold font-sans flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all duration-300 hover:scale-105 active:scale-95 border border-cyan-300/30"
            >
              <Mic className="h-4 w-4" />
              <span>Launch Mock Interview</span>
            </Link>

            <Link
              href="/resume"
              className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-bold font-sans flex items-center gap-2 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 hover:border-white/20"
            >
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>Build AI Resume</span>
            </Link>

            <Link
              href="/readiness"
              className="px-4 py-2.5 rounded-2xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-cyan-300 text-xs font-medium font-sans flex items-center gap-1.5 transition-colors"
            >
              <span>5 Pillars Breakdown</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Big Animated Career Readiness Orb/Ring */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative flex items-center justify-center p-3">
            {/* Ambient Pulsing Core Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-purple-600/20 blur-2xl animate-pulse-glow" />

            {/* Futuristic SVG Ring */}
            <svg width={size} height={size} className="relative z-10 -rotate-90">
              <defs>
                <linearGradient id="orbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
              />

              {/* Glowing Dynamic Arc */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#orbGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                filter="url(#neonGlow)"
              />
            </svg>

            {/* Center Content: Count-Up & Rank */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
              <div className="flex items-baseline">
                <motion.span className="text-4xl md:text-5xl font-black font-heading text-white tracking-tighter">
                  {displayScore}
                </motion.span>
                <span className="text-sm font-mono text-cyan-400 font-bold ml-0.5">%</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold mt-0.5">
                Readiness
              </span>
            </div>
          </div>

          {/* Rank Badge Under Orb */}
          <div className="mt-2 text-center">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border ${rank.border} text-xs font-bold font-mono text-slate-100 shadow-lg ${rank.glow}`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>{rank.title}</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              {score > 0 ? '+6% potential gain this week' : 'Calibration awaiting assessment'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

