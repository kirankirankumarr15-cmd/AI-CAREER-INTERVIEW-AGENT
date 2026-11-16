'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/store/useProfileStore';
import { clientLogout } from '@/lib/auth/logout';
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  Dumbbell,
  Mic,
  Briefcase,
  FileText,
  Send,
  LineChart,
  UserCheck,
  Sparkles,
  LogOut,
  FolderOpen,
  Route,
  Settings,
  Bot,
  Users,
  Award,
  ChevronRight,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'D' },
  { label: 'Ask CareerPilot', href: '/chat', icon: Bot, shortcut: 'K', badge: 'AI' },
  { label: 'Profile', href: '/profile', icon: UserCheck, shortcut: 'P' },
  { label: 'AI Resume', href: '/resume', icon: FileText, shortcut: 'R' },
  { label: 'ATS Analyzer', href: '/resume/ats', icon: Sparkles, shortcut: 'T' },
  { label: 'Mock Interview', href: '/interview', icon: Mic, shortcut: 'I', badge: 'Voice' },
  { label: 'Group Discussion', href: '/interview/gd', icon: Users, shortcut: 'U' },
  { label: 'Career Audit', href: '/career', icon: Compass, shortcut: 'C' },
  { label: 'Job Matching', href: '/jobs', icon: Briefcase, shortcut: 'J' },
  { label: 'Applications', href: '/applications', icon: Send, shortcut: 'A' },
  { label: 'Documents', href: '/documents', icon: FolderOpen, shortcut: 'O' },
  { label: 'Readiness Index', href: '/readiness', icon: Award, shortcut: 'K' },
  { label: 'Progress', href: '/progress', icon: LineChart, shortcut: 'G' },
  { label: 'Learn Roadmap', href: '/learn', icon: BookOpen, shortcut: 'L' },
  { label: 'Roadmap Agent', href: '/roadmap', icon: Route, shortcut: 'M' },
  { label: 'Practice Hub', href: '/practice', icon: Dumbbell, shortcut: 'X' },
  { label: 'Settings', href: '/settings', icon: Settings, shortcut: 'S' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function MissionControlSidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfileStore();
  const [isHovered, setIsHovered] = useState(false);

  const initials = profile.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'CP';

  const handleLogout = async () => {
    await clientLogout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#070A12]/80 backdrop-blur-md z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed top-3 left-3 bottom-3 z-50 select-none transition-all duration-300 ease-out flex flex-col justify-between rounded-3xl hud-glass-card border border-white/10 shadow-2xl backdrop-blur-2xl',
          // Desktop: Slim icon-only (w-18), expands on hover (w-64)
          'hidden md:flex',
          isHovered ? 'w-64' : 'w-18',
          // Mobile state
          mobileOpen && '!flex !w-72 !left-2 !top-2 !bottom-2'
        )}
      >
        {/* Top: Brand Emblem */}
        <div className="p-3.5 flex items-center justify-between border-b border-white/10 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border border-white/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>

            {(isHovered || mobileOpen) && (
              <div className="min-w-0 overflow-hidden animate-fade-in">
                <h1 className="font-extrabold font-heading text-sm text-white tracking-tight flex items-center gap-1.5 truncate">
                  CareerPilot
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    HUD
                  </span>
                </h1>
                <p className="text-[10px] font-mono text-slate-400 truncate">
                  Mission Control
                </p>
              </div>
            )}
          </Link>

          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Center: Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-sans transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 via-blue-600/15 to-transparent text-white font-bold border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                )}
                title={!isHovered ? item.label : undefined}
              >
                {/* Active Glowing Pill on Left (Smooth Framer Motion layoutId transition) */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarPill"
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-cyan-400 shadow-[0_0_12px_#22D3EE]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                  )}
                />

                {(isHovered || mobileOpen) && (
                  <div className="flex-1 flex items-center justify-between min-w-0 animate-fade-in">
                    <span className="truncate">{item.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.badge && (
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 uppercase">
                          {item.badge}
                        </span>
                      )}
                      <kbd className="hidden lg:inline-block px-1 py-0.5 text-[9px] font-mono text-slate-500 bg-black/40 rounded border border-white/5">
                        {item.shortcut}
                      </kbd>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Profile / Logout */}
        <div className="p-2 border-t border-white/10 shrink-0">
          <div
            className={cn(
              'p-2 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between transition-all',
              (isHovered || mobileOpen) ? 'gap-2.5' : 'justify-center'
            )}
          >
            <Link
              href="/profile"
              onClick={onMobileClose}
              className="flex items-center gap-2.5 min-w-0"
              title={profile.fullName || 'Candidate Profile'}
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-mono font-black text-white shrink-0 shadow-md">
                {initials}
              </div>

              {(isHovered || mobileOpen) && (
                <div className="min-w-0 overflow-hidden animate-fade-in">
                  <p className="text-xs font-bold text-white truncate font-sans">
                    {profile.fullName || 'Candidate'}
                  </p>
                  <p className="text-[10px] font-mono text-cyan-400 truncate">
                    {profile.readinessScore || 0}% Ready
                  </p>
                </div>
              )}
            </Link>

            {(isHovered || mobileOpen) && (
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                title="Disconnect session"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

