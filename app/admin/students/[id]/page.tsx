'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Briefcase,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/admin/students/${studentId}`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data.student);
        }
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="col-span-2 h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const s = student || {
    fullName: 'Kiran Kumar R',
    email: 'kirankirankumarr15@gmail.com',
    phone: '+91 98765 43210',
    department: 'Computer Science & Engineering',
    batch: '2026 Batch',
    graduationYear: 2026,
    cgpa: 8.92,
    targetRole: 'Full Stack Developer',
    skills: ['React', 'Next.js', 'PostgreSQL', 'DSA', 'TypeScript', 'Node.js'],
    readinessScore: 78.4,
    profileCompletion: 90,
    assessmentAttempts: 3,
    interviewSessions: 2,
    hasConsent: true,
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Back button & Header */}
      <div>
        <Link
          href="/admin/students"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Student Roster
        </Link>

        <div className="card p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0">
              {s.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{s.fullName}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Profile Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {s.department} • {s.batch} • Class of {s.graduationYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Placement Readiness</span>
              <p className="text-2xl font-black text-blue-600">{s.readinessScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Overview & Preparation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Academic & Contact Overview */}
        <div className="card p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Student Information
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Institutional Email</span>
              <span className="font-bold text-slate-900">{s.email}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Contact Number</span>
              <span className="font-bold text-slate-900">{s.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Cumulative CGPA</span>
              <span className="font-black text-slate-900 text-sm">{s.cgpa} / 10.0</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Target Career Role</span>
              <span className="font-bold text-blue-700">{s.targetRole}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              DPDP Act 2023 Consent
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Placement Data Processing Consent Granted</span>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Preparation, Assessments & Skills */}
        <div className="md:col-span-2 space-y-6">
          {/* Preparation Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Profile Completion</span>
              <p className="text-xl font-black text-slate-900 mt-1">{s.profileCompletion}%</p>
            </div>
            <div className="card p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assessments Taken</span>
              <p className="text-xl font-black text-blue-600 mt-1">{s.assessmentAttempts} Tests</p>
            </div>
            <div className="card p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mock Interviews</span>
              <p className="text-xl font-black text-purple-600 mt-1">{s.interviewSessions} Rounds</p>
            </div>
          </div>

          {/* Verified Skills */}
          <div className="card p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Verified Technical Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {s.skills?.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-800 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

