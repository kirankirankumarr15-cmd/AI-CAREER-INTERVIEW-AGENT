'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Lock, GraduationCap, Loader2, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { registerUser } from '@/lib/auth/userStore';
import { useRouter } from 'next/navigation';

export default function StudentSignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // Send 6-digit OTP to student's email via Nodemailer Gmail SMTP
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          purpose: 'signup',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send verification code. Please try again.');
      }

      setIsOtpSent(true);
      setResendCooldown(30);
      setSuccessMsg(data.message || `Verification code sent to ${email.trim()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending verification code.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          purpose: 'signup',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend code.');
      }

      setResendCooldown(30);
      setSuccessMsg('A new verification code has been dispatched to your email.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not resend code.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify code and create/sync user account in Supabase
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          code: cleanOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed.');
      }

      // 2. Sign in to establish active Supabase session cookies for middleware
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.warn('Initial session signin notice:', signInError.message);
      }

      // 3. Update localStorage fallback store
      registerUser({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
        college: 'PESITM Shivamogga',
        provider: 'credentials',
      });

      // 4. Redirect to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Please check the code.';
      setErrorMsg(msg);
      setLoading(false);
    }
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

        {!isOtpSent ? (
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
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 cursor-pointer"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <Link href="/login" className="text-[12px] font-bold text-slate-500 hover:text-emerald-600 transition-colors">
                Already have an account? Log In
              </Link>
            </div>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div className="text-center mb-4">
              <p className="text-[13px] font-medium text-slate-600">
                We&apos;ve sent a 6-digit verification code to <span className="font-bold text-slate-900">{email}</span>.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Please check your Gmail inbox (and Spam folder).
              </p>
            </div>
            
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-700 text-[12px] font-semibold p-2.5 rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-[13px] font-bold p-3 rounded-xl border border-red-200 text-center">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest pl-1">
                Verification Code
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="Enter 6-digit code"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-bold shadow-sm text-center tracking-[0.5em]"
                  maxLength={6}
                  autoFocus
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Continue'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 px-1 text-[12px]">
              <button 
                type="button" 
                onClick={() => { setIsOtpSent(false); setOtp(''); setErrorMsg(''); setSuccessMsg(''); }}
                className="font-bold text-slate-500 hover:text-emerald-600 transition-colors"
              >
                ← Back to Sign Up
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className={`font-bold transition-colors flex items-center gap-1 ${
                  resendCooldown > 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-emerald-600 hover:text-emerald-700 cursor-pointer'
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
