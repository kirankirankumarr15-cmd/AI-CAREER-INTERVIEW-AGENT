'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { CareerChat } from '@/components/chat/CareerChat';
import { GlobalShortcuts } from '@/components/common/GlobalShortcuts';
import { useProfileStore } from '@/store/useProfileStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const syncWithSupabase = useProfileStore((state) => state.syncWithSupabase);

  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMobileMenuToggle={() => setMobileOpen((prev) => !prev)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
      <CareerChat />
      <GlobalShortcuts />
    </div>
  );
}
