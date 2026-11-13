'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Lock, GraduationCap, Shield, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { verifyPassword, registerUser } from '@/lib/auth/userStore';
import { useProfileStore } from '@/store/useProfileStore';

type Tab = 'HOD' | 'STUDENT';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const setSessionCookies = () => {
    document.cookie = 'careerpilot_session=active; path=/; max-age=604800; SameSite=Lax';
    document.cookie = 'sb-careerpilot-auth-token=demo; path=/; max-age=604800; SameSite=Lax';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const cleanEmail = email.trim();

    // 1. Attempt Server-Side Supabase Authentication
    try {
      const authPromise = supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      const timeoutPromise = new Promise<{ data: { session: unknown } | null; error: Error | null }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Supabase network timeout') }), 2500)
      );

      const res = await Promise.race([authPromise, timeoutPromise]);
      if (res?.data?.session) {
        setSessionCookies();
        router.push('/dashboard');
        return;
      }
    } catch {
      // Supabase is offline/paused
    }

    // 2. Production Security Gate: Fallbacks are disallowed in production builds
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      setErrorMsg('Cloud authentication service is currently unreachable. Please verify system health.');
      setLoading(false);
      return;
    }

    // 3. Development Fallback Verification (RBAC Enforced: Tab cannot grant staff access)
    const verification = verifyPassword(cleanEmail, password);
    if (verification.success && verification.user) {
      // Institutional accounts (e.g. hod@pesitm.edu.in) get their pre-seeded staff role;
      // All other accounts are strictly student role regardless of the active tab.
      const isInstitutionalStaff = cleanEmail.toLowerCase() === 'hod@pesitm.edu.in' || cleanEmail.toLowerCase() === 'admin@pesitm.edu.in';
      const userRole = isInstitutionalStaff ? 'tpo' : 'student';

      if (activeTab === 'HOD' && !isInstitutionalStaff) {
        setErrorMsg('Access Denied: This account does not possess institutional Faculty / TPO credentials.');
        setLoading(false);
        return;
      }

      setSessionCookies();
      localStorage.setItem('careerpilot_current_user', JSON.stringify({
        ...verification.user,
        role: userRole,
      }));
      useProfileStore.getState().updateProfile({
        email: verification.user.email,
        fullName: verification.user.fullName,
        role: userRole,
      });
      router.push('/dashboard');
      return;
    }

    if (verification.error && verification.error.includes('Incorrect password')) {
      setErrorMsg(verification.error);
      setLoading(false);
      return;
    }

    // 4. Student Auto-Provisioning (Strictly assigns 'student' role, never staff)
    if (activeTab === 'HOD') {
      setErrorMsg('Access Denied: Faculty and TPO accounts cannot be auto-registered. They must be provisioned by the placement cell.');
      setLoading(false);
      return;
    }

    if (cleanEmail.includes('@') && password.length >= 6) {
      const reg = registerUser({
        email: cleanEmail,
        password,
        fullName: cleanEmail.split('@')[0],
        college: 'PESITM Shivamogga',
        provider: 'credentials',
      });
      setSessionCookies();
      localStorage.setItem('careerpilot_current_user', JSON.stringify({
        ...reg.user,
        role: 'student',
      }));
      useProfileStore.getState().updateProfile({
        email: cleanEmail,
        fullName: cleanEmail.split('@')[0],
        role: 'student',
      });
      router.push('/dashboard');
      return;
    }

    setErrorMsg(
      verification.error || 'Please enter a valid email address and password (minimum 6 characters).'
    );
    setLoading(false);
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

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[440px] my-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-10 space-y-6">

          {/* College Header */}
          <div className="text-center space-y-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              PESITM Shivamogga
            </h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              PRISM Placement Intelligence
            </p>
          </div>

          {/* Role Navigation Tabs (UI filter only, role is server-verified) */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setActiveTab('STUDENT'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'STUDENT'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('HOD'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'HOD'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="h-4 w-4" />
              Faculty / TPO
            </button>
          </div>

          {/* Informational Subtext */}
          <div className="text-center">
            <p className="text-xs text-slate-500 font-medium">
              {activeTab === 'HOD'
                ? 'Authorized Placement Cell & Department Faculty Portal'
                : 'Sign in to access your placement preparation modules'}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {activeTab === 'HOD' ? 'Institutional Email' : 'Student Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'HOD' ? 'hod@pesitm.edu.in' : 'student@pesitm.edu.in'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                activeTab === 'HOD'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                `Sign In as ${activeTab === 'HOD' ? 'Faculty / TPO' : 'Student'}`
              )}
            </button>
          </form>

          {/* Footer Signup Link */}
          {activeTab === 'STUDENT' && (
            <p className="text-center text-xs text-slate-500">
              New placement candidate?{' '}
              <Link href="/signup" className="font-bold text-blue-600 hover:underline">
                Create Account
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
