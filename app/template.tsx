'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(true);

  useEffect(() => {
    setNavigating(true);
    const timer = setTimeout(() => setNavigating(false), 400);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {/* Top Thin Animated Route Progress Bar (Linear/NProgress style) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2.5px] pointer-events-none overflow-hidden">
        {navigating && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
          />
        )}
      </div>

      {/* Page Content Animation (opacity 0->1, y 12->0, 350ms, easeOut) */}
      <motion.div
        key={pathname}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full"
      >
        {children}
      </motion.div>
    </>
  );
}
