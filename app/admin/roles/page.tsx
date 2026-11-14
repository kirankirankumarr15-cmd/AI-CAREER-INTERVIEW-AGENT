'use client';

import { Shield, Check, X, Info, Lock } from 'lucide-react';

interface PermissionRow {
  feature: string;
  superAdmin: string;
  admin: string;
  tpo: string;
  coordinator: string;
  faculty: string;
  student: string;
}

const PERMISSION_MATRIX: PermissionRow[] = [
  {
    feature: 'Platform Management',
    superAdmin: 'Yes (Global)',
    admin: 'No',
    tpo: 'No',
    coordinator: 'No',
    faculty: 'No',
    student: 'No',
  },
  {
    feature: 'Institution Settings',
    superAdmin: 'Yes',
    admin: 'Yes',
    tpo: 'Limited (Read)',
    coordinator: 'No',
    faculty: 'No',
    student: 'No',
  },
  {
    feature: 'Student Management',
    superAdmin: 'Yes',
    admin: 'Yes',
    tpo: 'Yes',
    coordinator: 'Department Scope',
    faculty: 'Limited (Read)',
    student: 'Own Profile',
  },
  {
    feature: 'Cohort Readiness Analytics',
    superAdmin: 'Yes',
    admin: 'Yes',
    tpo: 'Yes',
    coordinator: 'Department Scope',
    faculty: 'Limited (Read)',
    student: 'Own Index',
  },
  {
    feature: 'Skill Gap Heatmaps',
    superAdmin: 'Yes',
    admin: 'Yes',
    tpo: 'Yes',
    coordinator: 'Department Scope',
    faculty: 'Limited (Read)',
    student: 'Own Gaps',
  },
  {
    feature: 'Bulk CSV Student Import',
    superAdmin: 'Yes',
    admin: 'Yes',
    tpo: 'Yes',
    coordinator: 'Limited',
    faculty: 'No',
    student: 'No',
  },
  {
    feature: 'DPDP Act Consent Management',
    superAdmin: 'Yes',
    admin: 'Yes',
    tpo: 'Limited (Audit)',
    coordinator: 'No',
    faculty: 'No',
    student: 'Own Consent',
  },
  {
    feature: 'Assessment Management',
    superAdmin: 'Yes',
    admin: 'Yes',
    tpo: 'Yes',
    coordinator: 'Limited',
    faculty: 'Limited',
    student: 'No',
  },
  {
    feature: 'Personal Assessments',
    superAdmin: 'No',
    admin: 'No',
    tpo: 'No',
    coordinator: 'No',
    faculty: 'No',
    student: 'Own Tests',
  },
  {
    feature: 'Audit Logs & Governance',
    superAdmin: 'Yes',
    admin: 'Yes',
    tpo: 'Limited (Org)',
    coordinator: 'No',
    faculty: 'No',
    student: 'No',
  },
];

export default function AdminRolesPage() {
  const renderCell = (val: string) => {
    if (val === 'Yes' || val.startsWith('Yes')) {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <Check className="h-3 w-3" /> {val}
        </span>
      );
    }
    if (val === 'No') {
      return (
        <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[11px]">
          <X className="h-3 w-3 text-slate-300" /> No
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-blue-700 font-bold text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
        {val}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
          <Lock className="h-3.5 w-3.5" /> Security & Governance
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Role-Based Access Control (RBAC)
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Server-side enforced authorization matrix. A hidden button is never an authorization mechanism; all policies are strictly validated on the database and API layers.
        </p>
      </div>

      {/* Permissions Matrix Card */}
      <div className="card rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Feature / Scope</th>
                <th className="py-3.5 px-3">Super Admin</th>
                <th className="py-3.5 px-3">Inst. Admin</th>
                <th className="py-3.5 px-3">TPO</th>
                <th className="py-3.5 px-3">Dept Coord</th>
                <th className="py-3.5 px-3">Faculty</th>
                <th className="py-3.5 px-3">Student</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{row.feature}</td>
                  <td className="py-3 px-3">{renderCell(row.superAdmin)}</td>
                  <td className="py-3 px-3">{renderCell(row.admin)}</td>
                  <td className="py-3 px-3">{renderCell(row.tpo)}</td>
                  <td className="py-3 px-3">{renderCell(row.coordinator)}</td>
                  <td className="py-3 px-3">{renderCell(row.faculty)}</td>
                  <td className="py-3 px-3">{renderCell(row.student)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Institutional Isolation Guarantee:</strong> College administrators and TPOs are cryptographically bound to their institution&apos;s unique UUID. Under PostgreSQL Row-Level Security (RLS), an administrator from PESITM can never access or query records from another institution.
        </p>
      </div>
    </div>
  );
}

