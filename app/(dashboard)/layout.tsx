'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MissionControlSidebar } from '@/components/layout/MissionControlSidebar';
import { MissionControlTopBar } from '@/components/layout/MissionControlTopBar';
import { AuroraBackground } from '@/components/dashboard/AuroraBackground';
import { FloatingCoachOrb } from '@/components/dashboard/FloatingCoachOrb';
import { CareerChat } from '@/components/chat/CareerChat';
import { GlobalShortcuts } from '@/components/common/GlobalShortcuts';
import { DatabaseStatusBanner } from '@/components/ui/DatabaseStatusBanner';
import { useProfileStore } from '@/store/useProfileStore';
import { useProgressStore } from '@/store/useProgressStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const syncProfile = useProfileStore((state) => state.syncWithSupabase);
  const syncProgress = useProgressStore((state) => state.syncWithSupabase);

  useEffect(() => {
    syncProfile();
    syncProgress();
  }, [syncProfile, syncProgress]);

  // Chrome-minimal full-bleed mode for the interview room
  const isInterviewRoom = pathname === '/interview/room';

  if (isInterviewRoom) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans antialiased">
        {children}
        <GlobalShortcuts />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex font-sans antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      <AuroraBackground />
      <MissionControlSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 md:pl-24 transition-all duration-300">
        <DatabaseStatusBanner />
        <MissionControlTopBar onMobileMenuToggle={() => setMobileOpen((prev) => !prev)} />
        <main className="flex-1 px-3 sm:px-6 md:px-8 max-w-[1400px] w-full mx-auto pb-16">
          {children}
        </main>
      </div>

      <FloatingCoachOrb />
      <CareerChat />
      <GlobalShortcuts />
    </div>
  );
}
