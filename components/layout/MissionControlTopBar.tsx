'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProfileStore } from '@/store/useProfileStore';
import { useProgressStore } from '@/store/useProgressStore';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  Target,
  ChevronDown,
  Flame,
  Bell,
  Search,
  Keyboard,
  Menu,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Zap,
} from 'lucide-react';

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

export function MissionControlTopBar({ onMobileMenuToggle }: TopBarProps) {
  const { profile, updateProfile } = useProfileStore();
  const { progress } = useProgressStore();

  const [showRoles, setShowRoles] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);

  const streak = progress.dailyStreak || 1;
  const targetRole = profile.targetRole || 'Software Developer';

  const roles = [
    'Software Developer',
    'Full Stack Developer',
    'Backend Developer',
    'Frontend Developer',
    'Data Analyst',
    'AI/ML Engineer',
    'Cloud/DevOps',
  ];

  const notifications = [
    {
      id: 'n-1',
      title: 'Mock Interview Telemetry',
      message: `Complete a 5-min mock interview for ${targetRole} to calibrate voice confidence.`,
      time: 'Just now',
      type: 'info',
    },
    {
      id: 'n-2',
      title: 'Mission Control Online',
      message: 'All career radar metrics synchronized with Supabase.',
      time: '5m ago',
      type: 'success',
    },
  ];

  // Theme detection and toggle (Dark is default)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('careerpilot-theme');
      const doc = document.documentElement;
      if (stored === 'light') {
        setIsDark(false);
        doc.classList.remove('dark');
        doc.setAttribute('data-theme', 'light');
      } else {
        setIsDark(true);
        doc.classList.add('dark');
        doc.setAttribute('data-theme', 'dark');
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const doc = document.documentElement;
    if (nextDark) {
      doc.classList.add('dark');
      doc.setAttribute('data-theme', 'dark');
      localStorage.setItem('careerpilot-theme', 'dark');
    } else {
      doc.classList.remove('dark');
      doc.setAttribute('data-theme', 'light');
      localStorage.setItem('careerpilot-theme', 'light');
    }
  };

  // Close notifications on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const triggerCommandPalette = () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true })
    );
  };

  return (
    <header className="sticky top-3 z-30 mb-6 mx-auto max-w-[1400px] w-full">
      <div className="h-14 rounded-2xl hud-glass-card border border-white/10 px-4 sm:px-6 flex items-center justify-between shadow-2xl backdrop-blur-2xl">
        {/* Left Section: Mobile Menu & Target Role */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Target Role Selector */}
          <div className="relative">
            <button
              onClick={() => setShowRoles(!showRoles)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono transition-all text-slate-300 hover:text-white"
            >
              <Target className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400 hidden sm:inline">Target:</span>
              <span className="font-bold text-white">{targetRole}</span>
              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition-transform ${
                  showRoles ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showRoles && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoles(false)}
                />
                <div className="absolute left-0 mt-2 w-52 rounded-2xl hud-glass border border-white/15 p-1.5 shadow-2xl z-50 animate-fade-in-up">
                  <p className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    Target Role
                  </p>
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        updateProfile({ targetRole: role });
                        setShowRoles(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono font-medium transition-colors ${
                        targetRole === role
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center: Quick Command Palette Trigger (Search / ⌘K) */}
        <div className="hidden md:flex items-center">
          <button
            onClick={triggerCommandPalette}
            className="flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-xs font-mono text-slate-400 hover:text-slate-200 transition-all w-64 justify-between group"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              <span>Command Palette...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/40 border border-white/10 text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Section: Streak, Theme Toggle, Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak Flame */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs font-mono font-bold text-amber-400">
            <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{streak}d</span>
          </div>

          {/* Theme Toggle (Dark / Light with Smooth Morph) */}
          <ThemeToggle />

          {/* Shortcuts Info Button */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
            className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-3xl hud-glass-card border border-white/15 p-4 shadow-2xl z-50 animate-fade-in-up font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-white">
                    Telemetry Alerts
                  </h4>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    2 New
                  </span>
                </div>

                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white font-heading">
                          {n.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

