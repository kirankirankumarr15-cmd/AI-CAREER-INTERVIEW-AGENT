'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Keyboard, FileText, LayoutDashboard, Mic, Dumbbell,
  Briefcase, Compass, Send, FolderOpen, UserCheck, X, Sparkles,
} from 'lucide-react';

export function GlobalShortcuts() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

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
    { key: 'R', label: 'Build / View Resume', href: '/resume', icon: FileText },
    { key: 'D', label: 'Go to Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'I', label: 'Launch Mock Interview', href: '/interview', icon: Mic },
    { key: 'P', label: 'Daily DSA Practice', href: '/practice', icon: Dumbbell },
    { key: 'J', label: 'Job Matching', href: '/jobs', icon: Briefcase },
    { key: 'C', label: 'Career Profile', href: '/career', icon: Compass },
    { key: 'A', label: 'Applications Tracker', href: '/applications', icon: Send },
    { key: 'O', label: 'Documents Vault', href: '/documents', icon: FolderOpen },
    { key: 'U', label: 'User Profile & Settings', href: '/profile', icon: UserCheck },
    { key: '?', label: 'Open Shortcuts Helper', href: '#', icon: Keyboard },
  ];

  return (
    <>
      {/* Help Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up select-none">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Keyboard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
                    Quick Key Navigation
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                      Press Key
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">Instant single-key navigation for CareerPilot AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List of shortcuts */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2 bg-slate-50">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Press any key below when not typing in text fields
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shortcuts.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      onClick={() => {
                        if (item.href !== '#') router.push(item.href);
                        setShowModal(false);
                      }}
                      className="p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-900">
                          {item.label}
                        </span>
                      </div>
                      <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 text-xs font-mono font-bold text-slate-800 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors">
                        {item.key}
                      </kbd>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Fast Key Mode Active
              </span>
              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                Press Esc or ? to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
