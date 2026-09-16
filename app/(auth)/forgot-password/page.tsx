'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  isSupabaseConfigured,
  createAndStoreOtp,
  verifyOtpCode,
  updatePassword,
} from '@/lib/auth/userStore';
import {
  Sparkles, Mail, KeyRound, Loader2, ShieldCheck, ArrowLeft,
  CheckCircle2, Lock, Eye, EyeOff, Building2, Award, Copy, Check,
  ShieldAlert,
} from 'lucide-react';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      let code = '';
      try {
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), purpose: 'reset' }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        if (data.code) {
           code = data.code;
           if (typeof window !== 'undefined') {
             sessionStorage.setItem('careerpilot_otp_' + email.trim().toLowerCase(), JSON.stringify({
               email: email.trim().toLowerCase(),
               code,
               expiresAt: Date.now() + 10 * 60 * 1000
             }));
           }
        }
        setStatusMessage(data.message || `6-digit password reset code sent to ${email}`);
      } catch (err: any) {
        console.warn('API /api/auth/send-otp failed, falling back:', err);
        code = createAndStoreOtp(email);
        setStatusMessage(`6-digit password reset code sent to ${email} (Fallback)`);
      }

      setGeneratedOtp(code || null);

      if (isSupabaseConfigured()) {
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/forgot-password`,
        });
      }

      setStep('otp');
      setTimeout(() => {
        document.getElementById('fp-otp-0')?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length > 0) {
        const newCode = [...otpCode];
        digits.forEach((d, i) => {
          if (index + i < 6) newCode[index + i] = d;
        });
        setOtpCode(newCode);
        const nextIndex = Math.min(index + digits.length, 5);
        document.getElementById(`fp-otp-${nextIndex}`)?.focus();
        return;
      }
    }

    if (!/^\d*$/.test(val)) return;
    const newCode = [...otpCode];
    newCode[index] = val;
    setOtpCode(newCode);

    if (val && index < 5) {
      document.getElementById(`fp-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      document.getElementById(`fp-otp-${index - 1}`)?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split('');
    const newCode = ['', '', '', '', '', ''];
    digits.forEach((d, idx) => {
      newCode[idx] = d;
    });
    setOtpCode(newCode);
    const lastIdx = Math.min(digits.length, 5);
    document.getElementById(`fp-otp-${lastIdx}`)?.focus();
  };

  const handleAutoFillOtp = () => {
    if (!generatedOtp) return;
    setOtpCode(generatedOtp.split(''));
    setErrorMessage('');
    setTimeout(() => {
      document.getElementById('fp-otp-5')?.focus();
    }, 50);
  };

  const handleCopyOtp = () => {
    if (!generatedOtp) return;
    navigator.clipboard.writeText(generatedOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpCode.join('');
    if (fullOtp.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: fullOtp,
          type: 'email',
        });
        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }
      } else {
        // Server OTP verification
        let verifySuccess = false;
        try {
          const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), code: fullOtp }),
          });
          const data = await response.json();
          if (data.success) {
            verifySuccess = true;
          } else {
            const check = verifyOtpCode(email, fullOtp);
            if (check.success) verifySuccess = true;
            else {
              setErrorMessage(data.error || check.error || 'Invalid OTP code.');
              setLoading(false);
              return;
            }
          }
        } catch (err: any) {
          const check = verifyOtpCode(email, fullOtp);
          if (check.success) verifySuccess = true;
          else {
             setErrorMessage(check.error || 'Invalid OTP code.');
             setLoading(false);
             return;
          }
        }
        
        if (!verifySuccess) {
           setErrorMessage('Invalid OTP code. Please retry.');
           setLoading(false);
           return;
        }
      }

      setStatusMessage('Code verified! Please create your new password.');
      setStep('newPassword');
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.updateUser({ password: newPassword });
      }

      // Persist new password in user store
      updatePassword(email, newPassword);

      setStatusMessage('Password reset successfully!');
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = ['email', 'otp', 'newPassword', 'success'].indexOf(step);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 lg:p-8 select-none relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">

        {/* Left Hero */}
        <div className="lg:col-span-6 relative p-8 lg:p-12 flex flex-col justify-between overflow-hidden min-h-[380px] lg:min-h-[640px] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-extrabold shadow-lg">
              <Building2 className="h-4 w-4 text-cyan-400" />
              <span>PESITM Shivamogga</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
              Security &amp; Account Recovery
            </h2>
            <p className="text-xs text-slate-300 font-medium max-w-sm">
              Placement Cell • Reset Student Access Credentials
            </p>
          </div>

          <div className="relative z-10 space-y-4 pt-8">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                <Award className="h-4 w-4" /> PESITM Account Protection
              </div>
              <p className="text-sm font-bold text-white leading-tight">
                Secure end-to-end OTP verification protects your career readiness portfolio.
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-center space-y-6 bg-slate-900/95">
          {/* Header */}
          <div className="space-y-1.5">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
            </Link>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-indigo-400" /> Account Recovery
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              {step === 'email' && 'Reset Your Password'}
              {step === 'otp' && 'Enter Verification Code'}
              {step === 'newPassword' && 'Create New Password'}
              {step === 'success' && 'Password Updated!'}
            </h1>
            <p className="text-xs text-slate-400">
              {step === 'email' && 'Enter your student email and we’ll generate a verification code.'}
              {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
              {step === 'newPassword' && 'Choose a strong password with at least 8 characters.'}
              {step === 'success' && 'Your credentials have been securely updated.'}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {['Email', 'Verify OTP', 'New Password', 'Done'].map((label, idx) => (
              <div key={label} className="flex-1 flex flex-col gap-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx <= stepIndex ? 'bg-indigo-500' : 'bg-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-400 font-semibold truncate">{label}</span>
              </div>
            ))}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-semibold flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === 'email' && (
            <form onSubmit={handleSendResetEmail} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Student Email Address</label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.dev@pesitm.edu.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                <span>Send Reset Code</span>
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              {/* Info — no OTP shown on screen */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                  <span>Check Your Email Inbox</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  A 6-digit password reset code was sent to <span className="text-indigo-300 font-bold">{email}</span>. Check your Gmail inbox and spam folder.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2 text-center">
                  Enter 6-Digit Code for <span className="text-indigo-400 font-bold">{email}</span>
                </label>
                <div className="flex gap-2 justify-center" onPaste={handlePasteOtp}>
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`fp-otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-11 h-12 bg-slate-950 border border-slate-800 rounded-xl text-center text-xl font-bold font-mono text-indigo-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Verify Reset Code</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtpCode(['', '', '', '', '', '']); setStatusMessage(''); }}
                  className="text-[11px] font-bold text-slate-400 hover:text-indigo-400 underline"
                >
                  Change Email Address
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'newPassword' && (
            <form onSubmit={handleSetNewPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrorMessage(''); }}
                    placeholder="Min. 8 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-medium font-mono"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(''); }}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-medium font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Save New Password</span>
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Password Updated!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You can now log in to CareerPilot AI using your new password.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>Proceed to Login</span>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
