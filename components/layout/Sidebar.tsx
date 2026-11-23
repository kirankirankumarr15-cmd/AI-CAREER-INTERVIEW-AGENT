'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/store/useProfileStore';
import { clientLogout } from '@/lib/auth/logout';
import { EASINGS, accordionVariants } from '@/lib/motion';
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
  X,
  Search,
  Route,
  Settings,
  Bot,
  Users,
  Award,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  shortcut: string;
  badge?: string;
  subItems?: { label: string; href: string }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Core',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: 'D' },
      { label: 'Career Audit', href: '/career', icon: Compass, shortcut: 'C', badge: 'Radar' },
      { label: 'Readiness Index', href: '/readiness', icon: Award, shortcut: 'K', badge: '5 Pillars' },
      { label: 'Progress Analytics', href: '/progress', icon: LineChart, shortcut: 'G' },
    ],
  },
  {
    title: 'AI Prep & Coaching',
    items: [
      {
        label: 'Mock Interview',
        href: '/interview',
        icon: Mic,
        shortcut: 'I',
        badge: 'Voice AI',
        subItems: [
          { label: 'Setup Room', href: '/interview' },
          { label: 'Group Discussion', href: '/interview/gd' },
          { label: 'Latest Results', href: '/interview/results' },
        ],
      },
      { label: 'Group Discussion', href: '/interview/gd', icon: Users, shortcut: 'U', badge: 'Multi-Bot' },
      { label: 'AI Resume Studio', href: '/resume', icon: FileText, shortcut: 'R' },
      { label: 'ATS Analyzer', href: '/resume/ats', icon: Sparkles, shortcut: 'T' },
      { label: 'Ask CareerPilot', href: '/chat', icon: Bot, shortcut: 'K', badge: 'AI Chat' },
    ],
  },
  {
    title: 'Practice & Learning',
    items: [
      {
        label: 'Practice Arena',
        href: '/practice',
        icon: Dumbbell,
        shortcut: 'X',
        subItems: [
          { label: 'Subject Drills', href: '/practice' },
          { label: 'Coding & SQL', href: '/practice/technical' },
          { label: 'Communication', href: '/practice/communication' },
        ],
      },
      { label: 'Learning Roadmap', href: '/learn', icon: BookOpen, shortcut: 'L' },
      { label: 'Roadmap Agent', href: '/roadmap', icon: Route, shortcut: 'M', badge: 'Live AI' },
    ],
  },
  {
    title: 'Career & Opportunities',
    items: [
      { label: 'Job Matching', href: '/jobs', icon: Briefcase, shortcut: 'J' },
      { label: 'Applications', href: '/applications', icon: Send, shortcut: 'A' },
      { label: 'Documents Vault', href: '/documents', icon: FolderOpen, shortcut: 'O' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Student Profile', href: '/profile', icon: UserCheck, shortcut: 'P' },
      { label: 'Settings', href: '/settings', icon: Settings, shortcut: 'S' },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfileStore();
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.shortcut.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop with smooth fade */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'w-[264px] flex flex-col justify-between h-screen fixed md:sticky top-0 z-50 select-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:translate-x-0',
          'bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 shadow-sm',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Header */}
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group"
              onClick={onMobileClose}
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-[15px] text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  PRISM
                  <span className="text-[9px] font-black px-1.5 py-[2px] rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 tracking-wider">
                    AI
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  Placement Command Center
                </p>
              </div>
            </Link>

            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Filter Input */}
          <div className="px-3.5 py-2.5 border-b border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules (or shortcut)..."
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[11px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400 bg-slate-50 dark:bg-slate-700 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                  /
                </span>
              )}
            </div>
          </div>

          {/* Navigation Items grouped by section */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {filteredSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  {section.title}
                </span>

                <div className="space-y-0.5 pt-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href));

                    return (
                      <div key={item.href} className="relative">
                        <Link
                          href={item.href}
                          onClick={onMobileClose}
                          className={cn(
                            'group flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-semibold transition-colors duration-150 relative z-10',
                            isActive
                              ? 'text-blue-700 dark:text-blue-300 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                isActive
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className="text-[8.5px] font-bold px-1.5 py-[1px] rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 tracking-wider">
                                {item.badge}
                              </span>
                            )}
                            <kbd
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-colors',
                                isActive
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 group-hover:border-slate-300'
                              )}
                            >
                              {item.shortcut}
                            </kbd>
                          </div>
                        </Link>

                        {/* Fluid Floating Pill for active link */}
                        {isActive && (
                          <motion.div
                            layoutId="activeNavBackground"
                            className="absolute inset-0 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/90 dark:border-blue-800/80 rounded-xl pointer-events-none z-0"
                            transition={{ duration: 0.22, ease: EASINGS.standard }}
                          />
                        )}

                        {/* Subitems with smooth accordion animation */}
                        <AnimatePresence>
                          {item.subItems && isActive && (
                            <motion.div
                              variants={accordionVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              className="overflow-hidden ml-4 pl-3.5 border-l border-slate-200 dark:border-slate-800 space-y-0.5 mt-1"
                            >
                              {item.subItems.map((subItem) => {
                                const isSubActive = pathname === subItem.href;
                                return (
                                  <Link
                                    key={subItem.href}
                                    href={subItem.href}
                                    onClick={onMobileClose}
                                    className={cn(
                                      'block px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors',
                                      isSubActive
                                        ? 'text-blue-700 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                    )}
                                  >
                                    {subItem.label}
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredSections.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No matching modules found.
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="shrink-0 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/80 p-3 flex flex-col gap-2.5">
          {/* Ask CareerCoach AI Button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-career-chat'))}
            className="w-full px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[11px] font-bold flex items-center gap-2 transition-all shadow-sm shadow-blue-600/25 group"
          >
            <Bot className="h-4 w-4 text-blue-200 group-hover:scale-110 transition-transform" />
            <span className="flex-1 text-left">Ask PRISM AI Assistant</span>
            <kbd className="text-[9px] font-mono bg-blue-700/80 px-1.5 py-0.5 rounded text-blue-100">
              Ctrl+K
            </kbd>
          </button>

          {/* Student Profile Card in Footer */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-between shadow-sm">
            <Link
              href="/profile"
              onClick={onMobileClose}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
            >
              <div className="relative shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[12px] text-slate-900 dark:text-white truncate">
                  {profile.fullName || 'Student'}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tabular-nums">
                  {profile.readinessScore}% Ready
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
