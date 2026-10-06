'use client';

import { useState } from 'react';
import { Settings2, User, Bell, Shield, KeyRound, Palette, LogOut, CheckCircle2 } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const { profile } = useProfileStore();
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            Manage your account preferences and configurations
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar">
            {[
              { id: 'account', label: 'Account', icon: User },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'appearance', label: 'Appearance', icon: Palette },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
            
            <div className="h-px bg-slate-200 my-2 hidden lg:block" />
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all whitespace-nowrap"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
            
            {activeTab === 'account' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Account Details</h2>
                  <p className="text-sm text-slate-500 mt-1">Update your personal information</p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-3xl shadow-sm">
                    {profile?.fullName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors">
                      Change Avatar
                    </button>
                    <p className="text-[11px] text-slate-400 font-medium mt-2">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-1">Full Name</label>
                    <input
                      type="text"
                      defaultValue={profile?.fullName || ''}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-1">Email Address</label>
                    <input
                      type="email"
                      defaultValue={profile?.email || ''}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Security & Passwords</h2>
                  <p className="text-sm text-slate-500 mt-1">Manage your password and 2FA settings</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-1">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-1">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all">
                    Update Password
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
                  <p className="text-sm text-slate-500 mt-1">Control how CareerPilot communicates with you</p>
                </div>
                
                <div className="space-y-6">
                  {[
                    { title: 'Interview Reminders', desc: 'Get an email 1 hour before scheduled mocks' },
                    { title: 'Career Matches', desc: 'Weekly digest of jobs matching your profile' },
                    { title: 'Resume Feedback', desc: 'Alerts when your resume score improves' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                        <p className="text-[12px] text-slate-500 font-medium mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Appearance</h2>
                  <p className="text-sm text-slate-500 mt-1">Customize your UI theme</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 max-w-lg">
                  {[
                    { id: 'light', name: 'Light', active: true },
                    { id: 'dark', name: 'Dark', active: false },
                    { id: 'system', name: 'System', active: false }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        theme.active 
                          ? 'border-emerald-500 bg-emerald-50/50' 
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full ${theme.active ? 'bg-emerald-500' : 'bg-slate-200'} flex items-center justify-center`}>
                        {theme.active && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <span className={`text-xs font-bold ${theme.active ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
