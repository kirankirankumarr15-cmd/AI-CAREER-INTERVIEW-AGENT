'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { CareerChat } from '@/components/chat/CareerChat';
import { GlobalShortcuts } from '@/components/common/GlobalShortcuts';
import { DatabaseStatusBanner } from '@/components/ui/DatabaseStatusBanner';
import { PageTransition } from '@/components/ui/PageTransition';
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex font-sans antialiased transition-colors duration-200">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <DatabaseStatusBanner />
        <TopBar onMobileMenuToggle={() => setMobileOpen((prev) => !prev)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          <PageTransition key={pathname}>
            {children}
          </PageTransition>
        </main>
      </div>
      <CareerChat />
      <GlobalShortcuts />
    </div>
  );
}
