'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap,
  Users,
} from 'lucide-react';

interface ReportOption {
  id: string;
  title: string;
  description: string;
  category: 'Readiness' | 'Skills' | 'Eligibility' | 'Governance';
  icon: typeof FileSpreadsheet;
  columns: string[];
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'readiness_summary',
    title: 'Institutional Placement Readiness Summary',
    description: 'Comprehensive breakdown of student readiness scores across the 5 pillars with category distributions.',
    category: 'Readiness',
    icon: GraduationCap,
    columns: ['USN', 'Full Name', 'Department', 'Batch', 'CGPA', 'Readiness Score', 'Category', 'Eligible Status'],
  },
  {
    id: 'placement_eligibility',
    title: 'Placement Drive Eligibility Roster (>=70% Threshold)',
    description: 'Pre-filtered list of students meeting college and employer readiness thresholds for upcoming campus drives.',
    category: 'Eligibility',
    icon: Users,
    columns: ['USN', 'Full Name', 'Email', 'Department', 'CGPA', 'Target Role', 'Readiness Score', 'Verified Profile'],
  },
  {
    id: 'student_roster',
    title: 'Comprehensive Student Master Directory',
    description: 'Complete departmental roster with academic identifiers, contact details, and career targets.',
    category: 'Readiness',
    icon: Layers,
    columns: ['USN', 'Full Name', 'Email', 'Department', 'Batch', 'Graduation Year', 'CGPA', 'Target Role'],
  },
  {
    id: 'dpdp_compliance',
    title: 'DPDP Act 2023 Consent & Privacy Audit Roster',
    description: 'Statutory compliance roster detailing consent status, purpose grants, and timestamped audit records.',
    category: 'Governance',
    icon: ShieldCheck,
    columns: ['USN', 'Full Name', 'Department', 'Consent Status', 'Purposes Granted', 'Audit Verification'],
  },
];

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('readiness_summary');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('2026');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [isDownloading, setIsDownloading] = useState(false);

  const activeReport = REPORT_OPTIONS.find((r) => r.id === selectedReport) || REPORT_OPTIONS[0];

  const handleDownload = () => {
    setIsDownloading(true);
    const params = new URLSearchParams({
      type: selectedReport,
      format,
      departmentId: selectedDept,
      batch: selectedBatch,
    });

    const exportUrl = `/api/admin/reports?${params.toString()}`;
    window.location.href = exportUrl;

    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institutional Reports &amp; Placement Exports
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            Export Center
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Export institutional readiness data, drive eligibility lists, and DPDP compliance records. All files are formula-sanitized.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report Selection */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Report Type</h2>
          <div className="space-y-2">
            {REPORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = opt.id === selectedReport;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedReport(opt.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{opt.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{opt.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Parameters & Download */}
        <div className="lg:col-span-2 space-y-5">
          {/* Filter Configuration Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" />
              Report Scope &amp; Cohort Filters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                >
                  <option value="all">All Departments (PESITM)</option>
                  <option value="cse">Computer Science &amp; Engineering</option>
                  <option value="ise">Information Science &amp; Engineering</option>
                  <option value="ece">Electronics &amp; Communication</option>
                  <option value="me">Mechanical Engineering</option>
                  <option value="cv">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Academic Batch</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                >
                  <option value="all">All Batches</option>
                  <option value="2026">2026 (Final Year)</option>
                  <option value="2027">2027 (Pre-Final Year)</option>
                  <option value="2028">2028</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Export Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                >
                  <option value="csv">CSV (Excel Compatible, Sanitized)</option>
                  <option value="json">JSON (API / Data Pipeline)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Report Preview & Columns Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {activeReport.category}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">{activeReport.title}</h3>
              <p className="text-xs text-slate-600 mt-0.5">{activeReport.description}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Included Fields &amp; Schema
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeReport.columns.map((col) => (
                  <span
                    key={col}
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Formula-Injection Defense:</strong> All exported values are
                sanitized to protect against spreadsheet CSV formula injection attacks (`=`, `+`, `-`, `@`, `\t`, `\r`
                stripped). Every export is logged in the permanent audit trail.
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Generated from live database for <strong>PESITM Shivamogga</strong>
              </div>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? 'Generating Export...' : `Download ${format.toUpperCase()} Report`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

