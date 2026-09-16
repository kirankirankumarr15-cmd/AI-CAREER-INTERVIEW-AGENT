'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/store/useProfileStore';
import { supabase } from '@/lib/supabase/client';
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
  MessageCircle,
  X,
  Search,
  Keyboard,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',      href: '/dashboard',    icon: LayoutDashboard, shortcut: 'D' },
  { label: 'Profile',        href: '/profile',       icon: UserCheck,       shortcut: 'P' },
  { label: 'AI Resume',      href: '/resume',        icon: FileText,        shortcut: 'R' },
  { label: 'Mock Interview', href: '/interview',     icon: Mic,             shortcut: 'I', badge: 'AI Voice' },
  { label: 'Job Matching',   href: '/jobs',          icon: Briefcase,       shortcut: 'J' },
  { label: 'Career Track',   href: '/career',        icon: Compass,         shortcut: 'C' },
  { label: 'Applications',   href: '/applications',  icon: Send,            shortcut: 'A' },
  { label: 'Documents',      href: '/documents',     icon: FolderOpen,      shortcut: 'O' },
  { label: 'Progress',       href: '/progress',      icon: LineChart,       shortcut: 'G' },
  { label: 'Learn Roadmap',  href: '/learn',         icon: BookOpen,        shortcut: 'L' },
  { label: 'Daily Practice', href: '/practice',      icon: Dumbbell,        shortcut: 'X' },
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
    ? profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CP';

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    router.push('/login');
  };

  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.shortcut.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'w-[256px] flex flex-col justify-between h-screen fixed md:sticky top-0 z-50 select-none transition-transform duration-300 ease-in-out md:translate-x-0',
          'bg-[#0D1322] border-r border-slate-800/80 shadow-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0B0F19]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400/30">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-[15px] text-white tracking-tight flex items-center gap-1.5">
                  CareerPilot
                  <span className="text-[9px] font-extrabold px-1.5 py-[2px] rounded bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 tracking-wider">
                    AI
                  </span>
                </h1>
                <p className="text-[10px] text-slate-300 font-medium tracking-wide">AI Career Command Center</p>
              </div>
            </div>

            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Sidebar Search Input */}
          <div className="p-3 border-b border-slate-800/60 bg-[#0D1322] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tabs or key..."
                className="w-full pl-8 pr-7 py-1.5 bg-[#141C2E] border border-slate-700/70 rounded-xl text-[11px] text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400 bg-slate-800/80 px-1 py-0.5 rounded border border-slate-700">
                  ?
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2.5 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'group flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 relative border',
                    isActive
                      ? 'bg-indigo-600/20 text-white border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)] font-bold'
                      : 'text-slate-300 border-transparent hover:text-white hover:bg-slate-800/60 hover:border-slate-700/50'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
                  )}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span className="text-[8.5px] font-bold px-1.5 py-[1px] rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider">
                        {item.badge}
                      </span>
                    )}
                    <kbd className={cn(
                      'px-1.5 py-0.5 rounded text-[9.5px] font-mono font-extrabold border transition-colors',
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 group-hover:border-slate-600 group-hover:text-white'
                    )}>
                      {item.shortcut}
                    </kbd>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="shrink-0 border-t border-slate-800/80 bg-[#0B0F19] pt-2">
          {/* Shortcuts Quick Trigger */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
            className="mx-2.5 mb-2 px-3 py-2 rounded-xl bg-[#141C2E] hover:bg-indigo-600/20 border border-slate-700/80 hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-indigo-400" />
              <span className="font-bold text-[11px]">Key Shortcuts</span>
            </div>
            <span className="text-[9.5px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-400/30">
              Press ?
            </span>
          </button>

          {/* WhatsApp Support Banner */}
          <a
            href="https://wa.me/919999999999?text=Hello%20CareerPilot%20AI%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2.5 mb-2 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageCircle className="h-3 w-3 fill-white" />
              </div>
              <span className="font-bold text-[11px] text-white group-hover:text-emerald-300">WhatsApp Help</span>
            </div>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white">24/7</span>
          </a>

          {/* User Profile Footer */}
          <div className="p-2.5 mx-2.5 mb-3 rounded-xl bg-[#141C2E] border border-slate-700/80 flex items-center justify-between">
            <Link
              href="/profile"
              onClick={onMobileClose}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
            >
              <div className="relative shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-xs text-white shadow-md">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0B0F19]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[12px] text-white truncate">{profile.fullName || 'Student'}</p>
                <p className="text-[10px] text-emerald-400 font-semibold tabular-nums">{profile.readinessScore}% Ready</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
