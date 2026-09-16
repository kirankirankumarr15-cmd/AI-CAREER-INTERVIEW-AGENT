'use client';

import { useState } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { processDocumentText, DocumentExtractionResult } from '@/lib/ai/agents/document-agent';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
  FileCheck
} from 'lucide-react';

export default function DocumentsPage() {
  const { documents, addDocument, updateDocumentStatus, updateProfile, addSkill, addProject } = useProfileStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeExtraction, setActiveExtraction] = useState<{
    docId: string;
    fileName: string;
    result: DocumentExtractionResult;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const docId = `doc-${Date.now()}`;
    const docRecord = {
      id: docId,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      docType: file.name.toLowerCase().includes('resume') ? ('Resume' as const) : ('Certificate' as const),
      status: 'Processing' as const,
      createdAt: new Date().toISOString().split('T')[0],
    };
    addDocument(docRecord);

    try {
      const simulatedOcrText = `Document: ${file.name}. Alex Morgan, University of Technology, B.S. Computer Science & Engineering. CGPA: 8.7, Graduation: 2025. Skills: React, Node.js, TypeScript, PostgreSQL, Python. Project: Smart Campus Resource Optimization Platform.`;

      const extraction = await processDocumentText(simulatedOcrText, file.name);
      setActiveExtraction({ docId, fileName: file.name, result: extraction });
      updateDocumentStatus(docId, 'Extracted');
    } catch (err) {
      console.error(err);
      updateDocumentStatus(docId, 'Pending');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmExtraction = () => {
    if (!activeExtraction) return;

    const info = activeExtraction.result.extractedInformation;
    if (info.college || info.cgpa) {
      updateProfile({
        college: info.college || undefined,
        branch: info.branch || undefined,
        cgpa: info.cgpa || undefined,
        graduationYear: info.graduationYear || undefined,
        verificationStatus: 'Verified',
      });
    }

    if (info.skillsExtracted) {
      info.skillsExtracted.forEach((skillName) => {
        addSkill({
          name: skillName,
          category: 'Technical',
          proficiency: 'Intermediate',
          verificationStatus: 'Verified',
        });
      });
    }

    if (info.projectsExtracted) {
      info.projectsExtracted.forEach((p) => {
        addProject({
          title: p.title,
          description: p.summary,
          techStack: p.tech,
          verificationStatus: 'Verified',
        });
      });
    }

    updateDocumentStatus(activeExtraction.docId, 'Confirmed');
    setActiveExtraction(null);
  };

  const handleRejectExtraction = () => {
    if (!activeExtraction) return;
    updateDocumentStatus(activeExtraction.docId, 'Rejected');
    setActiveExtraction(null);
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Header */}
      <div className="white-card p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <FileText className="h-4 w-4" /> OCR Document Intelligence
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Document Scanner & Verification</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Upload Resumes, Marks Cards, Degrees & Certificates. AI extracts details for your verification.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="white-card border-2 border-dashed border-slate-300 hover:border-indigo-500 p-8 text-center transition-colors">
        <input
          type="file"
          id="doc-upload"
          accept=".pdf,.png,.jpg,.jpeg,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
            {isProcessing ? <Loader2 className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {isProcessing ? 'AI Scanning & Extracting Document...' : 'Click to Upload Career Document'}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Supports Resumes, Degree Certificates, Grade Cards, Internship Letters (PDF, PNG, JPG)
            </p>
          </div>
        </label>
      </div>

      {/* Extraction Verification Modal */}
      {activeExtraction && (
        <div className="white-card p-6 border-indigo-200 bg-indigo-50/30 space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-6 w-6 text-emerald-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  AI Extracted Information — Review Required
                </h3>
                <p className="text-xs text-slate-600">File: {activeExtraction.fileName}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {activeExtraction.result.confidenceScore}% Confidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
              <span className="text-slate-500 font-bold block">Academic Details Extracted:</span>
              <p className="text-slate-800">College: <strong className="text-indigo-600">{activeExtraction.result.extractedInformation.college}</strong></p>
              <p className="text-slate-800">Degree: <strong className="text-indigo-600">{activeExtraction.result.extractedInformation.degree}</strong></p>
              <p className="text-slate-800">CGPA: <strong className="text-emerald-700">{activeExtraction.result.extractedInformation.cgpa}</strong></p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
              <span className="text-slate-500 font-bold block">Skills Extracted ({activeExtraction.result.extractedInformation.skillsExtracted?.length}):</span>
              <div className="flex flex-wrap gap-1">
                {activeExtraction.result.extractedInformation.skillsExtracted?.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleRejectExtraction}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <XCircle className="h-4 w-4" /> Reject Extraction
            </button>
            <button
              onClick={handleConfirmExtraction}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm & Add to Verified Profile
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="white-card p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Uploaded Documents History</h3>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="font-bold text-slate-900">{doc.fileName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{doc.docType} • Uploaded {doc.createdAt}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                doc.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
