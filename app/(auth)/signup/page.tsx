'use client';

import { useState } from 'react';
import { User, Mail, Book, Lock, Hash, GraduationCap, Loader2 } from 'lucide-react';
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
  const [department, setDepartment] = useState('');
  const [usn, setUsn] = useState('');
  const [semester, setSemester] = useState('');
  const [scheme, setScheme] = useState('2022');
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
          department,
          usn: '4PM' + usn,
          semester,
          scheme,
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
        branch: department,
      });
      // Insert initial progress
      await supabase.from('user_progress').insert({
        user_id: data.user.id,
      });
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 font-sans bg-slate-900">
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

      {/* Main Form Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in-up my-8">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-[14px] bg-[#E8F5EE] flex items-center justify-center mb-4 shadow-sm border border-[#D1EAD9]">
            <GraduationCap className="h-6 w-6 text-[#0A9056]" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Student Sign Up</h1>
          <p className="text-[13px] font-medium text-slate-500 mt-1">Create your student account</p>
        </div>

        <form className="space-y-4" onSubmit={handleSignup}>
          {errorMsg && (
            <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl border border-red-100 text-center">
              {errorMsg}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
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
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A9056] focus:ring-1 focus:ring-[#0A9056] transition-all font-medium"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
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
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A9056] focus:ring-1 focus:ring-[#0A9056] transition-all font-medium"
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
              Department
            </label>
            <div className="relative flex items-center">
              <Book className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <select
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-700 focus:outline-none focus:border-[#0A9056] focus:ring-1 focus:ring-[#0A9056] transition-all font-medium appearance-none"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="" disabled>-- Select Department --</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ISE">Information Science (ISE)</option>
                <option value="ECE">Electronics (ECE)</option>
              </select>
              <div className="absolute right-3.5 pointer-events-none text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* USN Field */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between pl-1 pr-0.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                USN (University Seat Number)
              </label>
              <span className="text-[9px] font-extrabold text-[#0A9056] bg-[#E8F5EE] px-2 py-0.5 rounded-full border border-[#D1EAD9]">
                College Code: 4PM
              </span>
            </div>
            <div className="relative flex items-center">
              <Hash className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <div className="absolute left-10 flex items-center h-full">
                <span className="bg-[#0A9056] text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                  4PM
                </span>
              </div>
              <input
                type="text"
                placeholder="24CE011"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                required
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-[76px] pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A9056] focus:ring-1 focus:ring-[#0A9056] transition-all font-bold tracking-wide uppercase"
                maxLength={7}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono pl-1 mt-1">
              <span className="font-bold text-[#0A9056]">Format:</span> <span className="text-[#0A9056]">4PM</span> + YY (Year) + <span className="text-[#0A9056]">Dept</span> + Roll (011) e.g. 4PM24CE011
            </p>
          </div>

          {/* Semester */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
              Semester
            </label>
            <div className="relative flex items-center">
              <Hash className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <select
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-700 focus:outline-none focus:border-[#0A9056] focus:ring-1 focus:ring-[#0A9056] transition-all font-medium appearance-none"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
              >
                <option value="" disabled>-- Select Semester --</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
              <div className="absolute right-3.5 pointer-events-none text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* VTU Syllabus Scheme */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
              VTU Syllabus Scheme
            </label>
            <div className="relative flex items-center">
              <Book className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <select
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-700 focus:outline-none focus:border-[#0A9056] focus:ring-1 focus:ring-[#0A9056] transition-all font-medium appearance-none"
                value={scheme}
                onChange={(e) => setScheme(e.target.value)}
                required
              >
                <option value="2022">2022 Scheme (VTU CBCS)</option>
                <option value="2021">2021 Scheme (VTU CBCS)</option>
                <option value="2018">2018 Scheme (VTU CBCS)</option>
              </select>
              <div className="absolute right-3.5 pointer-events-none text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
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
                placeholder="Min 6 characters"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A9056] focus:ring-1 focus:ring-[#0A9056] transition-all font-medium"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
              Confirm Password
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
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A9056] focus:ring-1 focus:ring-[#0A9056] transition-all font-medium"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#0A9056] hover:bg-[#087747] text-white text-[14px] font-bold shadow-md shadow-[#0A9056]/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <a href="/login" className="text-[11px] font-bold text-slate-500 hover:text-[#0A9056]">
              Already have an account? Log In
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
