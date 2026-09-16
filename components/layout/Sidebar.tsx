'use client';

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
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',      href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Career Profile', href: '/career',        icon: Compass },
  { label: 'Learn Roadmap',  href: '/learn',         icon: BookOpen },
  { label: 'Daily Practice', href: '/practice',      icon: Dumbbell },
  { label: 'Mock Interview', href: '/interview',     icon: Mic,      badge: 'AI Voice' },
  { label: 'Job Matching',   href: '/jobs',          icon: Briefcase },
  { label: 'AI Resume',      href: '/resume',        icon: FileText },
  { label: 'Applications',   href: '/applications',  icon: Send },
  { label: 'Documents',      href: '/documents',     icon: FolderOpen },
  { label: 'Progress',       href: '/progress',      icon: LineChart },
  { label: 'Profile',        href: '/profile',       icon: UserCheck },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfileStore();

  const initials = profile.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CP';

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'w-[252px] flex flex-col justify-between h-screen fixed md:sticky top-0 z-50 select-none transition-transform duration-300 ease-in-out md:translate-x-0',
          'bg-[#0E0E12] border-r border-[#1F1F27]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col min-h-0">
          {/* Brand */}
          <div className="px-5 py-4 border-b border-[#1F1F27] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-[15px] text-[#FAFAFA] tracking-tight flex items-center gap-1.5">
                  CareerPilot
                  <span className="text-[9px] font-extrabold px-1.5 py-[2px] rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-wider">
                    AI
                  </span>
                </h1>
                <p className="text-[10px] text-[#71717A] font-medium tracking-wide">Your AI Career Coach</p>
              </div>
            </div>

            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/5"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-0.5 overflow-y-auto flex-1 nav-scroll">
            {navItems.map((item) => {
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
                    'group flex items-center justify-between px-3 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-150 relative',
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 font-bold'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/5'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-500" />
                  )}
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isActive ? 'text-indigo-400' : 'text-[#52525B] group-hover:text-[#A1A1AA]'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-[2px] rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="shrink-0">
          {/* WhatsApp Support Banner */}
          <a
            href="https://wa.me/919999999999?text=Hello%20CareerPilot%20AI%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-3 mb-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageCircle className="h-3.5 w-3.5 fill-white" />
              </div>
              <span className="font-bold text-[#FAFAFA] group-hover:text-emerald-300">WhatsApp Help</span>
            </div>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white">24/7</span>
          </a>

          {/* User Footer */}
          <div className="p-3 mx-3 mb-4 rounded-xl bg-white/4 border border-white/6 flex items-center justify-between">
            <Link
              href="/profile"
              onClick={onMobileClose}
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <div className="relative shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-xs text-white">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#0E0E12]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[12px] text-[#FAFAFA] truncate">{profile.fullName || 'Student'}</p>
                <p className="text-[10px] text-emerald-400 font-medium tabular-nums">{profile.readinessScore}% Ready</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-[#52525B] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
