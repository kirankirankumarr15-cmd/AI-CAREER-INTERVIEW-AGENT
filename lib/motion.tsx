'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useReducedMotion, Variants, HTMLMotionProps } from 'framer-motion';
import { cn } from './utils';

// =========================================================================
// Standard Motion Variants (Subtle, professional, 200–400ms, easeOut)
// =========================================================================

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.28, ease: 'easeOut' },
  },
};

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

// =========================================================================
// Reusable <MotionCard> Component
// =========================================================================

export interface MotionCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  delay?: number;
}

export function MotionCard({
  children,
  className,
  hoverEffect = true,
  delay = 0,
  ...props
}: MotionCardProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
      whileInView={shouldReduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      whileHover={
        hoverEffect && !shouldReduce
          ? { y: -3, transition: { duration: 0.2, ease: 'easeOut' } }
          : undefined
      }
      whileTap={hoverEffect && !shouldReduce ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className={cn(
        'transition-colors duration-300',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// =========================================================================
// Reusable <AnimatedNumber> Component
// =========================================================================

export interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  className,
}: AnimatedNumberProps) {
  const shouldReduce = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduce ? value : 0);

  useEffect(() => {
    if (shouldReduce) {
      setDisplayValue(value);
      return;
    }

    let start = displayValue;
    const end = value;
    const duration = 800; // ms
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    const anim = requestAnimationFrame(update);
    return () => cancelAnimationFrame(anim);
  }, [value, shouldReduce]);

  return (
    <span className={cn('tabular-nums font-mono', className)}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

// =========================================================================
// Reusable <AnimatedProgressBar> Component
// =========================================================================

export interface AnimatedProgressBarProps {
  value: number; // 0-100
  color?: string;
  className?: string;
  heightClass?: string;
}

export function AnimatedProgressBar({
  value,
  color,
  className,
  heightClass = 'h-2',
}: AnimatedProgressBarProps) {
  const shouldReduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden', heightClass, className)}>
      <motion.div
        initial={shouldReduce ? { width: `${clamped}%` } : { width: '0%' }}
        whileInView={{ width: `${clamped}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"
        style={color ? { backgroundColor: color, backgroundImage: 'none' } : undefined}
      />
    </div>
  );
}
