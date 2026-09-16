'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProfileStore } from '@/store/useProfileStore';
import { supabase } from '@/lib/supabase/client';
import {
  Bell, Target, ChevronDown, Flame, Award, LogOut,
  Mic, FileText, BookOpen, CheckCircle2, AlertCircle, Info, X, Menu, Keyboard,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const router = useRouter();
  const { profile, updateProfile } = useProfileStore();
  const [showRoles, setShowRoles] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const roles = [
    'Full Stack Developer',
    'Software Developer',
    'Frontend Developer',
    'Backend Developer',
    'Data Analyst',
    'AI/ML Engineer',
    'Cloud/DevOps',
  ];

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'n-1',
      type: 'info',
      title: 'Mock Interview Ready',
      message: `Start a ${profile.targetRole} mock interview to boost your readiness score.`,
      time: 'Just now',
      read: false,
      link: '/interview',
    },
    {
      id: 'n-2',
      type: 'success',
      title: 'Profile Connected',
      message: 'Your CareerPilot AI profile is active and synced.',
      time: '2 min ago',
      read: false,
    },
    {
      id: 'n-3',
      type: 'warning',
      title: 'Resume Not Built Yet',
      message: 'Build your AI-optimized resume to start applying to jobs.',
      time: '1 hour ago',
      read: false,
      link: '/resume',
    },
    {
      id: 'n-4',
      type: 'info',
      title: 'Daily Practice Available',
      message: 'New DSA and aptitude questions are ready for you today.',
      time: '3 hours ago',
      read: true,
      link: '/practice',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    router.push('/login');
  };

  const notifIcon = (type: Notification['type']) => {
    if (type === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (type === 'warning') return <AlertCircle className="h-4 w-4 text-amber-400" />;
    return <Info className="h-4 w-4 text-indigo-400" />;
  };

  return (
    <header className="h-[58px] border-b border-[#1F1F27] bg-[#0E0E12]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/5 transition-colors"
          title="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Target Role Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoles(!showRoles)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/5 border border-[#27272F] text-xs font-semibold text-[#A1A1AA] hover:border-[#3A3A45] hover:text-[#FAFAFA] transition-all"
          >
            <Target className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-[#71717A]">Target:</span>
            <span className="text-[#FAFAFA] font-bold">{profile.targetRole}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-[#52525B] transition-transform ${showRoles ? 'rotate-180' : ''}`} />
          </button>

          {showRoles && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoles(false)} />
              <div className="absolute left-0 mt-2 w-60 bg-[#16161A] border border-[#27272F] rounded-xl shadow-2xl z-50 p-1">
                <p className="px-3 py-2 text-[10px] uppercase font-bold text-[#52525B] tracking-wider">
                  Select Career Track
                </p>
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => { updateProfile({ targetRole: role }); setShowRoles(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      profile.targetRole === role
                        ? 'bg-indigo-500/10 text-indigo-400 font-bold'
                        : 'text-[#A1A1AA] hover:bg-white/5 hover:text-[#FAFAFA]'
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

      {/* Right: Stats + Notifications */}
      <div className="flex items-center gap-2.5">
        {/* Streak */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
          <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>1 Day</span>
        </div>

        {/* Readiness */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <Award className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[#71717A] font-medium">Ready:</span>
          <span className="font-extrabold text-emerald-400 tabular-nums">{profile.readinessScore}%</span>
        </div>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-400 text-[#71717A] border border-[#27272F] text-xs font-semibold transition-colors"
          title="Press '?' for Quick Key Shortcuts"
        >
          <Keyboard className="h-3.5 w-3.5" />
          <span className="font-mono text-[10px] font-bold">[?]</span>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/5 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#16161A] border border-[#27272F] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-[#27272F] flex items-center justify-between bg-[#111113]">
                <div>
                  <h3 className="font-bold text-xs text-[#FAFAFA]">Notifications</h3>
                  <p className="text-[10px] text-[#71717A]">{unreadCount} unread</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-indigo-400 font-semibold hover:underline">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-[#71717A] hover:text-[#FAFAFA]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markRead(notif.id);
                      if (notif.link) { router.push(notif.link); setShowNotifications(false); }
                    }}
                    className={`p-3 border-b border-[#1F1F27] flex gap-3 cursor-pointer transition-colors ${
                      notif.read ? 'hover:bg-white/3' : 'bg-indigo-500/5 hover:bg-indigo-500/10'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">{notifIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-bold truncate ${notif.read ? 'text-[#A1A1AA]' : 'text-[#FAFAFA]'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug">{notif.message}</p>
                      <p className="text-[10px] text-[#52525B] mt-1 font-medium">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick action shortcuts */}
              <div className="p-2 bg-[#111113] border-t border-[#27272F]">
                <p className="text-[10px] uppercase font-bold text-[#52525B] px-1 mb-1.5 tracking-wider">Quick Actions</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Interview', href: '/interview', icon: Mic },
                    { label: 'Resume', href: '/resume', icon: FileText },
                    { label: 'Learn', href: '/learn', icon: BookOpen },
                  ].map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setShowNotifications(false)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-[#27272F] hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-[10px] font-semibold text-[#A1A1AA]">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-[#71717A] border border-[#27272F] text-xs font-bold transition-all"
          title="Log out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
