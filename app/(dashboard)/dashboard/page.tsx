'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { HeroMissionControl } from '@/components/dashboard/HeroMissionControl';
import { QuickActionsHUD } from '@/components/dashboard/QuickActionsHUD';
import { InteractiveSkillRadar } from '@/components/dashboard/InteractiveSkillRadar';
import { PlacementForecastCard } from '@/components/dashboard/PlacementForecastCard';
import { MissionQuestCard } from '@/components/dashboard/MissionQuestCard';
import { WeakAreasHUDCard } from '@/components/dashboard/WeakAreasHUDCard';
import { StreakXPCard } from '@/components/dashboard/StreakXPCard';
import { useProfileStore } from '@/store/useProfileStore';
import { useProgressStore } from '@/store/useProgressStore';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Skeleton Loader Shimmer while mounting
  if (!mounted) {
    return (
      <div className="space-y-6 pb-12 animate-pulse font-sans">
        {/* Hero Skeleton */}
        <div className="h-64 rounded-3xl bg-white/[0.03] border border-white/10" />

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-white/[0.03] border border-white/10" />
          ))}
        </div>

        {/* Bento Row 1 Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-[420px] rounded-3xl bg-white/[0.03] border border-white/10" />
          <div className="lg:col-span-5 h-[420px] rounded-3xl bg-white/[0.03] border border-white/10" />
        </div>
      </div>
    );
  }

  // Motion variants for staggered HUD entrance
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* 1. Hero Cockpit Row (Animated Readiness Orb, Greeting, Streak & Typewriter Directive) */}
      <motion.section variants={itemVariants}>
        <HeroMissionControl />
      </motion.section>

      {/* 2. Quick Actions Cyber HUD Matrix */}
      <motion.section variants={itemVariants}>
        <QuickActionsHUD />
      </motion.section>

      {/* 3. Bento Grid - Row 1: Interactive Skill Radar & Placement Velocity Forecast */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <InteractiveSkillRadar />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <PlacementForecastCard />
        </div>
      </motion.section>

      {/* 4. Bento Grid - Row 2: Quest Daily Mission & Diagnostics / Mastery */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <MissionQuestCard />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <WeakAreasHUDCard />
          <StreakXPCard />
        </div>
      </motion.section>
    </motion.div>
  );
}
