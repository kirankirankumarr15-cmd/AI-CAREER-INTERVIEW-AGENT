'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function AuroraBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#070A12] select-none">
      {/* Dynamic Animated Mesh Blobs */}
      {!shouldReduceMotion ? (
        <>
          {/* Cyan Glow - Top Left */}
          <motion.div
            animate={{
              x: [-20, 30, -20],
              y: [-10, 20, -10],
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.28, 0.15],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[130px]"
          />

          {/* Indigo / Violet Aurora - Top Right & Center */}
          <motion.div
            animate={{
              x: [30, -20, 30],
              y: [20, -30, 20],
              scale: [1.1, 0.95, 1.1],
              opacity: [0.22, 0.35, 0.22],
            }}
            transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[5%] right-[5%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-indigo-600/25 via-violet-600/20 to-purple-600/10 blur-[140px]"
          />

          {/* Emerald Glow - Bottom Center / Left */}
          <motion.div
            animate={{
              x: [-15, 25, -15],
              y: [20, -15, 20],
              scale: [0.95, 1.1, 0.95],
              opacity: [0.12, 0.22, 0.12],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[5%] left-[20%] w-[550px] h-[550px] rounded-full bg-emerald-500/15 blur-[130px]"
          />

          {/* Deep Violet Center Ambient Anchor */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[40%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-blue-600/15 blur-[150px]"
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(7,10,18,0))]" />
      )}

      {/* Cybernetic Micro-Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Micro-Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-vignette opacity-80" />
    </div>
  );
}

