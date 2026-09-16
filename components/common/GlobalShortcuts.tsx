'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Keyboard, FileText, LayoutDashboard, Mic, Dumbbell,
  Briefcase, Compass, Send, FolderOpen, UserCheck, X, Sparkles, Search, ChevronRight
} from 'lucide-react';

export function GlobalShortcuts() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in form inputs, textareas, editable fields
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Modifier key combinations (e.g. Ctrl+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowModal((prev) => !prev);
        return;
      }

      // Toggle modal on '?'
      if (e.key === '?') {
        e.preventDefault();
        setShowModal((prev) => !prev);
        return;
      }

      // Single key navigation
      const key = e.key.toLowerCase();
      switch (key) {
        case 'r':
          e.preventDefault();
          router.push('/resume');
          break;
        case 'd':
          e.preventDefault();
          router.push('/dashboard');
          break;
        case 'i':
          e.preventDefault();
          router.push('/interview');
          break;
        case 'p':
          e.preventDefault();
          router.push('/practice');
          break;
        case 'j':
          e.preventDefault();
          router.push('/jobs');
          break;
        case 'c':
          e.preventDefault();
          router.push('/career');
          break;
        case 'a':
          e.preventDefault();
          router.push('/applications');
          break;
        case 'o':
          e.preventDefault();
          router.push('/documents');
          break;
        case 'u':
          e.preventDefault();
          router.push('/profile');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const shortcuts = [
    { key: 'D', label: 'Go to Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Main' },
    { key: 'R', label: 'Build / View Resume', href: '/resume', icon: FileText, category: 'Career Tools' },
    { key: 'I', label: 'Launch Mock Interview', href: '/interview', icon: Mic, category: 'AI Tools' },
    { key: 'P', label: 'Daily DSA Practice', href: '/practice', icon: Dumbbell, category: 'Learning' },
    { key: 'J', label: 'Job Matching', href: '/jobs', icon: Briefcase, category: 'Career Tools' },
    { key: 'C', label: 'Career Profile', href: '/career', icon: Compass, category: 'Main' },
    { key: 'A', label: 'Applications Tracker', href: '/applications', icon: Send, category: 'Career Tools' },
    { key: 'O', label: 'Documents Vault', href: '/documents', icon: FolderOpen, category: 'Career Tools' },
    { key: 'U', label: 'User Profile & Settings', href: '/profile', icon: UserCheck, category: 'Account' },
    { key: '?', label: 'Toggle Shortcuts Panel', href: '#', icon: Keyboard, category: 'Helpers' },
  ];

  const filteredShortcuts = shortcuts.filter(s =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Slide-over Left Drawer Backdrop & Drawer Container */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex select-none">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
          />

          {/* Left-Side Drawer Panel */}
          <div className="relative z-10 w-full max-w-md bg-[#0E0E12] border-r border-indigo-500/20 shadow-2xl h-full flex flex-col transform transition-all duration-300 ease-out animate-in slide-in-from-left">

            {/* Top Glow Accent Bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-500" />

            {/* Header */}
            <div className="p-5 border-b border-slate-800/80 bg-[#12121A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                  <Keyboard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
                    Quick Key Navigation
                    <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                      Fast Key
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Single-key shortcuts for instant access</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-800/60 bg-[#0E0E12]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter shortcuts by key, page, or category..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#161622] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* List of Shortcuts */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2.5 custom-scrollbar">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Press key when not typing
                </span>
                <span className="text-[10px] text-indigo-400 font-mono font-semibold">
                  {filteredShortcuts.length} Shortcuts
                </span>
              </div>

              {filteredShortcuts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Keyboard className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-medium">No shortcuts matching &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredShortcuts.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.key}
                        onClick={() => {
                          if (item.href !== '#') router.push(item.href);
                          setShowModal(false);
                        }}
                        className="p-3 rounded-2xl bg-[#161622] border border-slate-800/80 hover:border-indigo-500/50 hover:bg-[#1A1A2A] cursor-pointer transition-all flex items-center justify-between group shadow-xs hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-colors">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-200 group-hover:text-white block transition-colors">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-slate-500 group-hover:text-slate-400">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <kbd className="px-2.5 py-1 rounded-lg bg-slate-900 border border-indigo-500/30 text-xs font-mono font-bold text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)] group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-400 transition-all">
                            {item.key}
                          </kbd>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#12121A] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-emerald-400 text-[11px]">
                <Sparkles className="h-3.5 w-3.5" /> Direct Key Router Active
              </span>
              <span className="font-mono text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-300">
                Esc to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
