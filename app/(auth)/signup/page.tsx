'use client';

import { useState } from 'react';
import { User, Mail, Lock, GraduationCap, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function StudentSignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');



  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Insert into profiles table immediately so they have a DB record
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
      });
      // Insert initial progress
      await supabase.from('user_progress').insert({
        user_id: data.user.id,
      });
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-12 font-sans bg-slate-900 overflow-y-auto">
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

      {/* Main Form Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in-up my-8">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-[14px] bg-emerald-50 flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Student Sign Up</h1>
          <p className="text-[13px] font-medium text-slate-500 mt-1">Create your academic account</p>
        </div>

        <form className="space-y-4" onSubmit={handleSignup}>
          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-[13px] font-bold p-3 rounded-xl border border-red-200 text-center">
              {errorMsg}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest pl-1">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter your full name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold shadow-sm"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest pl-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min 6 chars"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold shadow-sm"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest pl-1">
                Confirm
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <a href="/login" className="text-[12px] font-bold text-slate-500 hover:text-emerald-600 transition-colors">
              Already have an account? Log In
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
