'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHoverMotion } from '@/lib/motion';

interface MotionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevation?: 'subtle' | 'medium' | 'flat';
  children: React.ReactNode;
}

export function MotionCard({
  interactive = false,
  elevation = 'subtle',
  className = '',
  children,
  ...props
}: MotionCardProps) {
  const elevationClasses = {
    flat: 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
    subtle: 'border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shadow-slate-900/5',
    medium: 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md shadow-slate-900/5',
  };

  if (!interactive) {
    return (
      <div
        className={cn(
          'rounded-2xl transition-colors duration-200',
          elevationClasses[elevation],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={cardHoverMotion.hover}
      whileTap={cardHoverMotion.tap}
      className={cn(
        'rounded-2xl transition-shadow duration-200 cursor-pointer hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/5',
        elevationClasses[elevation],
        className
      )}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
