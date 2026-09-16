'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Keyboard, FileText, LayoutDashboard, Mic, Dumbbell,
  Briefcase, Compass, Send, FolderOpen, UserCheck, X, Sparkles, Search, ChevronRight, LineChart, BookOpen
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
        case 'p':
          e.preventDefault();
          router.push('/profile');
          break;
        case 'd':
          e.preventDefault();
          router.push('/dashboard');
          break;
        case 'r':
          e.preventDefault();
          router.push('/resume');
          break;
        case 'i':
          e.preventDefault();
          router.push('/interview');
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
        case 'g':
          e.preventDefault();
          router.push('/progress');
          break;
        case 'l':
          e.preventDefault();
          router.push('/learn');
          break;
        case 'x':
          e.preventDefault();
          router.push('/practice');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const shortcuts = [
    { key: 'P', label: 'User Profile & Verification', href: '/profile', icon: UserCheck, category: 'Account' },
    { key: 'D', label: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard, category: 'Main' },
    { key: 'R', label: 'AI ATS Resume Builder', href: '/resume', icon: FileText, category: 'Career Tools' },
    { key: 'I', label: 'Launch Voice Mock Interview', href: '/interview', icon: Mic, category: 'AI Tools' },
    { key: 'J', label: 'AI Job Matching', href: '/jobs', icon: Briefcase, category: 'Career Tools' },
    { key: 'C', label: 'Career Track & Skills', href: '/career', icon: Compass, category: 'Main' },
    { key: 'A', label: 'Applications Tracker', href: '/applications', icon: Send, category: 'Career Tools' },
    { key: 'O', label: 'Documents & Certs Vault', href: '/documents', icon: FolderOpen, category: 'Vault' },
    { key: 'G', label: 'Placement Readiness Progress', href: '/progress', icon: LineChart, category: 'Analytics' },
    { key: 'L', label: 'Learning Roadmap', href: '/learn', icon: BookOpen, category: 'Learning' },
    { key: 'X', label: 'Daily DSA & Aptitude Practice', href: '/practice', icon: Dumbbell, category: 'Learning' },
    { key: '?', label: 'Toggle Shortcuts Panel', href: '#', icon: Keyboard, category: 'Helpers' },
  ];

  const filteredShortcuts = shortcuts.filter(s =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Left-Side Slide-Over Drawer */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex select-none">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
          />

          {/* Left Panel */}
          <div className="relative z-10 w-full max-w-md bg-[#0D121F] border-r border-slate-700/60 shadow-2xl h-full flex flex-col transform transition-all duration-300 ease-out animate-in slide-in-from-left">

            {/* Gradient Highlight Top Bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />

            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-[#111827] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <Keyboard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
                    Quick Key Navigation
                    <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                      Press Key
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">Single-key instant page switching</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-800 bg-[#0D121F]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type key (e.g. P) or search tabs..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#172033] border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium shadow-inner"
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

            {/* Shortcut List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2 custom-scrollbar bg-[#0D121F]">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Press any key below when browsing
                </span>
                <span className="text-[10px] text-indigo-300 font-mono font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                  P = Profile
                </span>
              </div>

              {filteredShortcuts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Keyboard className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-medium">No shortcuts found for &quot;{searchQuery}&quot;</p>
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
                        className="p-3.5 rounded-2xl bg-[#151D2E] border border-slate-700/60 hover:border-indigo-400/80 hover:bg-[#1C273E] cursor-pointer transition-all flex items-center justify-between group shadow-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-400 transition-colors">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white group-hover:text-indigo-200 block transition-colors">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-300">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <kbd className="px-2.5 py-1 rounded-lg bg-indigo-600/30 border border-indigo-400/50 text-xs font-mono font-extrabold text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.25)] group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-300 transition-all">
                            {item.key}
                          </kbd>
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-300 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#111827] border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400 text-[11px]">
                <Sparkles className="h-3.5 w-3.5" /> Instant Key Router Active
              </span>
              <span className="font-mono text-[10px] bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg text-slate-200 font-bold">
                Esc to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
