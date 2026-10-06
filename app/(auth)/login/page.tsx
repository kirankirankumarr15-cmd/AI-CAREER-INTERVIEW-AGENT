'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Lock, GraduationCap, Shield, BookOpen, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Tab = 'HOD' | 'FACULTY' | 'STUDENT';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Redirect to dashboard on success
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 font-sans bg-slate-900">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/pes_shivamogga.png"
          alt="Campus Background"
          fill
          className="object-cover object-center opacity-40 blur-sm"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/40" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {/* Top Tabs Container */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-1.5 flex w-full mb-6 shadow-lg">
          <button
            onClick={() => { setActiveTab('HOD'); setErrorMsg(''); }}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'HOD' ? 'bg-white border-2 border-[#0A9056] shadow-sm' : 'text-slate-400 hover:bg-slate-100/50'
            }`}
          >
            <Shield className={`h-5 w-5 mb-1 ${activeTab === 'HOD' ? 'text-[#0A9056]' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${activeTab === 'HOD' ? 'text-[#0A9056]' : 'text-slate-400'}`}>
              HOD
            </span>
          </button>
          
          <button
            onClick={() => { setActiveTab('FACULTY'); setErrorMsg(''); }}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'FACULTY' ? 'bg-white border-2 border-[#0A9056] shadow-sm' : 'text-slate-400 hover:bg-slate-100/50'
            }`}
          >
            <BookOpen className={`h-5 w-5 mb-1 ${activeTab === 'FACULTY' ? 'text-[#0A9056]' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${activeTab === 'FACULTY' ? 'text-[#0A9056]' : 'text-slate-400'}`}>
              FACULTY
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('STUDENT'); setErrorMsg(''); }}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'STUDENT' ? 'bg-white border-2 border-[#0A9056] shadow-sm' : 'text-slate-400 hover:bg-slate-100/50'
            }`}
          >
            <GraduationCap className={`h-5 w-5 mb-1 ${activeTab === 'STUDENT' ? 'text-[#0A9056]' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${activeTab === 'STUDENT' ? 'text-[#0A9056]' : 'text-slate-400'}`}>
              STUDENT
            </span>
          </button>
        </div>

        {/* Main Form Card */}
        <div className="w-full bg-[#FAFAFA] rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in-up">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-[14px] bg-[#E8F5EE] flex items-center justify-center mb-4 shadow-sm border border-[#D1EAD9]">
              {activeTab === 'STUDENT' && <GraduationCap className="h-6 w-6 text-[#0A9056]" />}
              {activeTab === 'FACULTY' && <BookOpen className="h-6 w-6 text-[#0A9056]" />}
              {activeTab === 'HOD' && <Shield className="h-6 w-6 text-[#0A9056]" />}
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight capitalize">
              {activeTab.toLowerCase()} Login
            </h1>
            <p className="text-[13px] font-medium text-slate-500 mt-1">
              Sign in to access {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} dashboard
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl border border-red-100 text-center">
                {errorMsg}
              </div>
            )}

            {/* Email / USN Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
                {activeTab === 'STUDENT' ? 'Email Address or USN' : 'Email Address'}
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  type={activeTab === 'STUDENT' ? 'text' : 'email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={activeTab === 'STUDENT' ? 'Email or USN (e.g. 4PM22CS001)' : 'name@college.edu'}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A9056] focus:ring-1 focus:ring-[#0A9056] transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[10px] font-extrabold text-[#0A9056] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A9056] focus:ring-1 focus:ring-[#0A9056] transition-all font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#0A9056] hover:bg-[#087747] text-white text-[14px] font-bold shadow-md shadow-[#0A9056]/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
              </button>
            </div>

            {/* Footer */}
            {activeTab === 'STUDENT' && (
              <div className="text-center pt-2">
                <span className="text-[12px] font-medium text-slate-500">Don&apos;t have an account? </span>
                <Link href="/signup" className="text-[12px] font-bold text-blue-600 hover:underline">
                  Sign Up
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
