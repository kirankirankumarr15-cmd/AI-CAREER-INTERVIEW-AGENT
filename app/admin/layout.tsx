'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Upload,
  BarChart3,
  Flame,
  FileSpreadsheet,
  ShieldCheck,
  UserCog,
  ShieldAlert,
  Bell,
  Sparkles,
  ArrowLeft,
  Menu,
  X,
  Building2,
  Lock,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Institutional Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'AI Placement Insights', href: '/admin/ai-insights', icon: Sparkles, badge: 'AI' },
    ],
  },
  {
    title: 'STUDENTS',
    items: [
      { label: 'Student Directory', href: '/admin/students', icon: Users },
      { label: 'Bulk CSV Import', href: '/admin/students/import', icon: Upload },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Readiness Distribution', href: '/admin/analytics/readiness', icon: BarChart3 },
      { label: 'Skill Gap Heatmaps', href: '/admin/analytics/skill-gaps', icon: Flame },
    ],
  },
  {
    title: 'PLACEMENT & REPORTS',
    items: [
      { label: 'Institutional Reports', href: '/admin/reports', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'PRIVACY (DPDP ACT)',
    items: [
      { label: 'Consent & Privacy', href: '/admin/privacy', icon: ShieldCheck },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Staff Directory', href: '/admin/users', icon: UserCog },
      { label: 'Roles & Permissions', href: '/admin/roles', icon: Lock },
      { label: 'Audit Activity Logs', href: '/admin/audit-logs', icon: ShieldAlert },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <span className="font-extrabold text-sm text-slate-900">CareerPilot TPO</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="overflow-y-auto p-4 space-y-6">
          {/* Institution Header Brand */}
          <div className="pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2 text-blue-600 font-extrabold text-xs uppercase tracking-wider">
              <Building2 className="h-4 w-4" /> Enterprise TPO Portal
            </div>
            <h1 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
              PESITM Shivamogga
            </h1>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              AY 2026–2027
            </span>
          </div>

          {/* Navigation Sections */}
          <nav className="space-y-5">
            {ADMIN_NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase px-2">
                  {section.title}
                </span>
                <div className="space-y-0.5 pt-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer: Switch to Student Portal */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-2">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-600" />
            <span>Switch to Student View</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

