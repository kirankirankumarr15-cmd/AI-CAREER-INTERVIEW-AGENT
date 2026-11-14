'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
} from 'lucide-react';

type Stage = 'upload' | 'preview' | 'mapping' | 'validation' | 'complete';

export default function BulkStudentImportPage() {
  const [stage, setStage] = useState<Stage>('upload');
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleCSV = `student_id,full_name,email,phone,department,batch,graduation_year,course
PES1UG22CS101,Aarav Sharma,aarav.cs22@pesitm.edu.in,+919876543210,Computer Science,2026 Batch,2026,B.Tech
PES1UG22IS045,Bhavana Gowda,bhavana.is22@pesitm.edu.in,+919876543211,Information Science,2026 Batch,2026,B.Tech
PES1UG22EC032,Chetan Kumar,chetan.ec22@pesitm.edu.in,+919876543212,Electronics & Comm,2026 Batch,2026,B.Tech`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleRunPreview = async () => {
    if (!csvContent.trim()) {
      setErrorMsg('Please select or paste CSV content first.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent, mode: 'preview' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview validation failed');
      setPreviewData(data);
      setStage('preview');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error analyzing CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent, mode: 'commit' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResults(data);
      setStage('complete');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error committing import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Upload className="h-3.5 w-3.5" /> Institutional Enrollment
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Student CSV Import</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            5-Stage idempotent enrollment workflow with formula-injection sanitization and duplicate detection.
          </p>
        </div>

        <a
          href="/api/admin/students/import/template"
          download
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all self-start md:self-auto"
        >
          <Download className="h-3.5 w-3.5 text-blue-600" />
          <span>Download CSV Template</span>
        </a>
      </div>

      {/* 5-Stage Stepper Bar */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold border-b border-slate-200 pb-4">
        <div className={`pb-1 ${stage === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>
          1. Upload
        </div>
        <div className={`pb-1 ${stage === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>
          2. Preview
        </div>
        <div className={`pb-1 ${stage === 'mapping' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>
          3. Mapping
        </div>
        <div className={`pb-1 ${stage === 'validation' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>
          4. Validation
        </div>
        <div className={`pb-1 ${stage === 'complete' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>
          5. Complete
        </div>
      </div>

      {/* STAGE 1: UPLOAD */}
      {stage === 'upload' && (
        <div className="card p-8 rounded-2xl border border-slate-200 bg-white space-y-6">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3 hover:border-blue-400 transition-colors bg-slate-50/50">
            <FileSpreadsheet className="h-10 w-10 text-blue-600 mx-auto" />
            <div>
              <p className="text-sm font-extrabold text-slate-900">Choose a CSV file or drag and drop</p>
              <p className="text-xs text-slate-400 mt-0.5">Maximum file size: 5MB • Must follow CareerPilot format</p>
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            {fileName && <p className="text-xs font-bold text-emerald-600 mt-2">Selected: {fileName}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Or paste raw CSV text:</span>
              <button
                type="button"
                onClick={() => setCsvContent(sampleCSV)}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Insert Sample Batch Data
              </button>
            </div>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="student_id,full_name,email,phone,department,batch,graduation_year,course..."
              rows={6}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleRunPreview}
              disabled={loading || !csvContent.trim()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Validating CSV...' : 'Proceed to Preview →'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: PREVIEW & STATS */}
      {stage === 'preview' && previewData && (
        <div className="card p-8 rounded-2xl border border-slate-200 bg-white space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Stage 2: Validation Preview</h2>
              <p className="text-xs text-slate-500">Review preliminary format analysis before database insertion.</p>
            </div>
            <button
              onClick={() => setStage('upload')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ← Change File
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Rows</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{previewData.totalRows}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Valid Records</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{previewData.validRows}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Duplicates</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{previewData.duplicateRows}</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Invalid Rows</span>
              <p className="text-2xl font-black text-rose-700 mt-1">{previewData.invalidRows}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setStage('upload')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Back
            </button>
            <button
              onClick={handleCommitImport}
              disabled={loading || previewData.validRows === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Importing Roster...' : 'Confirm & Commit Import →'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 5: IMPORT COMPLETE */}
      {stage === 'complete' && importResults && (
        <div className="card p-8 rounded-2xl border border-slate-200 bg-white space-y-6 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">Import Completed Successfully</h2>
            <p className="text-xs text-slate-500">Student cohort accounts have been created and assigned to your institution.</p>
          </div>

          <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center max-w-lg mx-auto">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Records</span>
              <p className="text-lg font-black text-slate-900">{importResults.totalRecords}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Imported</span>
              <p className="text-lg font-black text-emerald-600">{importResults.successfullyImported}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase">Skipped</span>
              <p className="text-lg font-black text-amber-600">{importResults.skipped}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-700 uppercase">Failed</span>
              <p className="text-lg font-black text-rose-600">{importResults.failed}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setStage('upload');
                setCsvContent('');
                setFileName('');
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              Import Another Batch
            </button>
            <Link
              href="/admin/students"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all"
            >
              <span>View Enrolled Students →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

