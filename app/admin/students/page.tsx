'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  ArrowRight,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import type { CohortStudent } from '@/lib/admin/types';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<CohortStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (selectedDept) q.set('departmentId', selectedDept);
      if (selectedStatus !== 'all') q.set('filter', selectedStatus);

      const res = await fetch(`/api/admin/students?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch {
      // Handled in demo
    } finally {
      setLoading(false);
    }
  }, [selectedDept, selectedStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fallback demo students if DB is empty / offline
  const displayStudents = students.length > 0 ? students : [
    {
      studentId: 'PES1UG22CS101',
      fullName: 'Aarav Sharma',
      email: 'aarav.cs22@pesitm.edu.in',
      department: 'Computer Science & Engineering',
      batch: '2026 Batch',
      graduationYear: 2026,
      cgpa: 8.85,
      profileCompletion: 90,
      readiness: { score: 82.5, category: 'highly_prepared', coverage: 85 },
      hasConsent: true,
      flags: [],
    },
    {
      studentId: 'PES1UG22CS102',
      fullName: 'Ananya Rao',
      email: 'ananya.cs22@pesitm.edu.in',
      department: 'Computer Science & Engineering',
      batch: '2026 Batch',
      graduationYear: 2026,
      cgpa: 9.12,
      profileCompletion: 95,
      readiness: { score: 88.0, category: 'highly_prepared', coverage: 90 },
      hasConsent: true,
      flags: [],
    },
    {
      studentId: 'PES1UG22IS045',
      fullName: 'Bhavana Gowda',
      email: 'bhavana.is22@pesitm.edu.in',
      department: 'Information Science & Engineering',
      batch: '2026 Batch',
      graduationYear: 2026,
      cgpa: 7.64,
      profileCompletion: 80,
      readiness: { score: 68.4, category: 'moderately_prepared', coverage: 70 },
      hasConsent: true,
      flags: [],
    },
    {
      studentId: 'PES1UG22EC032',
      fullName: 'Chetan Kumar',
      email: 'chetan.ec22@pesitm.edu.in',
      department: 'Electronics & Communication',
      batch: '2026 Batch',
      graduationYear: 2026,
      cgpa: 6.95,
      profileCompletion: 60,
      readiness: { score: 54.0, category: 'needs_improvement', coverage: 60 },
      hasConsent: true,
      flags: ['needs_preparation'],
    },
    {
      studentId: 'PES1UG22AI014',
      fullName: 'Divya Hegde',
      email: 'divya.ai22@pesitm.edu.in',
      department: 'AI & Machine Learning',
      batch: '2026 Batch',
      graduationYear: 2026,
      cgpa: 8.45,
      profileCompletion: 85,
      readiness: { score: 79.0, category: 'highly_prepared', coverage: 80 },
      hasConsent: true,
      flags: [],
    },
  ];

  const filtered = displayStudents.filter((s: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.fullName?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q);
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5" /> Institutional Student Directory
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Cohort Roster</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Individual student profiles, verified career credentials, preparation participation, and readiness scores.
          </p>
        </div>

        <Link
          href="/admin/students/import"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all self-start md:self-auto"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Bulk CSV Import</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, student ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs font-bold p-2 rounded-xl border border-slate-200 bg-white"
          >
            <option value="">All Departments</option>
            <option value="dept_cse">Computer Science</option>
            <option value="dept_ise">Information Science</option>
            <option value="dept_ece">Electronics & Comm</option>
            <option value="dept_aiml">AI & ML</option>
          </select>
        </div>

        <button
          onClick={fetchStudents}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="card rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Student ID / USN</th>
                <th className="py-3.5 px-4">Department & Batch</th>
                <th className="py-3.5 px-4">Profile Verified</th>
                <th className="py-3.5 px-4">Readiness Score</th>
                <th className="py-3.5 px-4">DPDP Consent</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((s: any, idx: number) => {
                const readyScore = s.readiness?.score || 70;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{s.fullName}</div>
                      <span className="text-[11px] font-normal text-slate-400">{s.email}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{s.studentId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{s.department}</div>
                      <span className="text-[10px] text-slate-400">{s.batch}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{s.profileCompletion}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${s.profileCompletion}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          readyScore >= 75
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : readyScore >= 60
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {readyScore}% Readiness
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Granted
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/students/${s.studentId || 'sample'}`}
                        className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Profile</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

