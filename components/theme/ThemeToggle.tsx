'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={`h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center opacity-60 ${className || ''}`}
        disabled
      >
        <span className="h-4 w-4 rounded-full bg-slate-400/40" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      title="Switch to dark/light mode"
      aria-label="Switch to dark/light mode"
      className={`relative h-9 w-9 rounded-xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${className || ''}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="text-cyan-400"
          >
            <Moon className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="text-amber-400"
          >
            <Sun className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
