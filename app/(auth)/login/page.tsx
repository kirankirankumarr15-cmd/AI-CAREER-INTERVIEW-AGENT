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
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 py-12 font-sans bg-slate-900 overflow-y-auto">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
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
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1.5 flex w-full mb-6 shadow-lg border border-slate-200/50">
          <button
            onClick={() => { setActiveTab('HOD'); setErrorMsg(''); setEmail(''); setPassword(''); }}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'HOD' 
                ? 'bg-emerald-50 border-2 border-emerald-200 shadow-sm text-emerald-700' 
                : 'border-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className={`h-5 w-5 mb-1 ${activeTab === 'HOD' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${activeTab === 'HOD' ? 'text-emerald-700' : 'text-slate-500'}`}>
              HOD
            </span>
          </button>
          
          <button
            onClick={() => { setActiveTab('FACULTY'); setErrorMsg(''); setEmail(''); setPassword(''); }}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'FACULTY' 
                ? 'bg-emerald-50 border-2 border-emerald-200 shadow-sm text-emerald-700' 
                : 'border-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className={`h-5 w-5 mb-1 ${activeTab === 'FACULTY' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${activeTab === 'FACULTY' ? 'text-emerald-700' : 'text-slate-500'}`}>
              FACULTY
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('STUDENT'); setErrorMsg(''); setEmail(''); setPassword(''); }}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
              activeTab === 'STUDENT' 
                ? 'bg-emerald-50 border-2 border-emerald-200 shadow-sm text-emerald-700' 
                : 'border-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className={`h-5 w-5 mb-1 ${activeTab === 'STUDENT' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${activeTab === 'STUDENT' ? 'text-emerald-700' : 'text-slate-500'}`}>
              STUDENT
            </span>
          </button>
        </div>

        {/* Main Form Card */}
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in-up">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-[14px] bg-emerald-50 flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
              {activeTab === 'STUDENT' && <GraduationCap className="h-6 w-6 text-emerald-600" />}
              {activeTab === 'FACULTY' && <BookOpen className="h-6 w-6 text-emerald-600" />}
              {activeTab === 'HOD' && <Shield className="h-6 w-6 text-emerald-600" />}
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight capitalize">
              {activeTab.toLowerCase()} Login
            </h1>
            <p className="text-[13px] font-medium text-slate-500 mt-1">
              Sign in to access {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} dashboard
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-[13px] font-bold p-3 rounded-xl border border-red-200 text-center">
                {errorMsg}
              </div>
            )}

            {/* Email / USN Address */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest pl-1">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold shadow-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold shadow-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
              </button>
            </div>

            {/* Footer */}
            {activeTab === 'STUDENT' && (
              <div className="text-center pt-2">
                <span className="text-[12px] font-medium text-slate-500">Don&apos;t have an account? </span>
                <Link href="/signup" className="text-[12px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
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
