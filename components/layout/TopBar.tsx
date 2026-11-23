'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '@/store/useProfileStore';
import { clientLogout } from '@/lib/auth/logout';
import { dropdownVariants } from '@/lib/motion';
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
    await clientLogout();
    router.push('/login');
  };

  const notifIcon = (type: Notification['type']) => {
    if (type === 'success') return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    if (type === 'warning') return <AlertCircle className="h-4 w-4 text-amber-500" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  return (
    <header className="h-[58px] border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Target Role Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoles(!showRoles)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-slate-900 transition-all"
          >
            <Target className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-slate-500">Target:</span>
            <span className="text-slate-900 font-bold">{profile.targetRole}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showRoles ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showRoles && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRoles(false)} />
                <motion.div
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2"
                >
                  <p className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    Select Career Track
                  </p>
                  <div className="space-y-0.5">
                    {roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => { updateProfile({ targetRole: role }); setShowRoles(false); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          profile.targetRole === role
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/80'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Stats + Notifications */}
      <div className="flex items-center gap-2.5">
        {/* Streak */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400">
          <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
          <span>1 Day</span>
        </div>

        {/* Readiness */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs">
          <Award className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Ready:</span>
          <span className="font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">{profile.readinessScore}%</span>
        </div>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-blue-300 text-xs font-semibold transition-all group"
          title="Press '?' for Quick Key Shortcuts"
        >
          <Keyboard className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-[11px]">Shortcuts</span>
          <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-600/30">
            ?
          </span>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">Notifications</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{unreadCount} unread</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markRead(notif.id);
                        if (notif.link) { router.push(notif.link); setShowNotifications(false); }
                      }}
                      className={`p-3 border-b border-slate-100 dark:border-slate-800/60 flex gap-3 cursor-pointer transition-colors ${
                        notif.read
                          ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          : 'bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-950/60'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">{notifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${notif.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick action shortcuts */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 mb-1.5 tracking-wider">Quick Actions</p>
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
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all"
          title="Log out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
