'use client';

import React from 'react';
import Link from 'next/link';
import { Mic, Sparkles, FileText, Briefcase, ArrowUpRight } from 'lucide-react';

export function QuickActionsHUD() {
  const actions = [
    {
      title: 'AI Mock Interview',
      desc: 'Realtime speech analysis, STT latency & STAR evaluation',
      href: '/interview',
      icon: Mic,
      gradient: 'from-blue-600/30 via-cyan-600/20 to-transparent',
      borderHover: 'hover:border-cyan-400/50',
      glowColor: 'hover:shadow-cyan-500/20',
      badge: 'AI Voice Room',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    },
    {
      title: 'ATS Resume Analyzer',
      desc: '100-point JD alignment, keyword gaps & grammar fix',
      href: '/resume/ats',
      icon: Sparkles,
      gradient: 'from-purple-600/30 via-pink-600/20 to-transparent',
      borderHover: 'hover:border-purple-400/50',
      glowColor: 'hover:shadow-purple-500/20',
      badge: 'Deep Scan',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    },
    {
      title: 'AI Resume Builder',
      desc: 'One-click modern ATS templates with tailored bullets',
      href: '/resume',
      icon: FileText,
      gradient: 'from-emerald-600/30 via-teal-600/20 to-transparent',
      borderHover: 'hover:border-emerald-400/50',
      glowColor: 'hover:shadow-emerald-500/20',
      badge: 'LaTeX Engine',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    },
    {
      title: 'Verified Job Match',
      desc: 'Semantic matching against 1,200+ curated tech listings',
      href: '/jobs',
      icon: Briefcase,
      gradient: 'from-amber-600/30 via-orange-600/20 to-transparent',
      borderHover: 'hover:border-amber-400/50',
      glowColor: 'hover:shadow-amber-500/20',
      badge: 'Live Postings',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act) => {
        const Icon = act.icon;

        return (
          <Link
            key={act.title}
            href={act.href}
            className={`group relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ${act.gradient} bg-[#0D121F]/70 border border-white/10 ${act.borderHover} ${act.glowColor} shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1`}
          >
            {/* Top row */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:text-cyan-300 transition-all">
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${act.badgeColor}`}>
                {act.badge}
              </span>
            </div>

            {/* Content */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold font-heading text-base text-white group-hover:text-cyan-300 transition-colors">
                  {act.title}
                </h4>
                <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {act.desc}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

