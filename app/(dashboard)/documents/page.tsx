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
  const [activeCategory, setActiveCategory] = useState('Resume');
  const [activeExtraction, setActiveExtraction] = useState<{
    docId: string;
    fileName: string;
    result: DocumentExtractionResult;
  } | null>(null);

  const categories = ['Resume', 'Marks Card', 'Certificate', 'Internship Certificate', 'Project Report', 'Achievement', 'Other'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const docId = `doc-${Date.now()}`;
    const docRecord = {
      id: docId,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      docType: activeCategory as any,
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

  const demoDocuments = [
    { name: 'Chinmay_Hegde_Resume_2026.pdf', type: 'Resume', size: '432 KB', time: '2 days ago', fields: 24 },
    { name: 'Semester_6_Official_Marks_Card.pdf', type: 'Marks Card', size: '1.2 MB', time: '1 week ago', fields: 12 },
    { name: 'TechFlow_Internship_Certificate.pdf', type: 'Internship Certificate', size: '650 KB', time: '2 weeks ago', fields: 5 },
    { name: 'AWS_Cloud_Practitioner_Badge.pdf', type: 'Certificate', size: '120 KB', time: '3 weeks ago', fields: 6 },
  ];

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-5xl">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
           <FileText className="h-3.5 w-3.5" /> Document Verification Engine . OCR & Entity Extraction
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Build Your Career Profile</h1>
        <p className="text-[13px] text-slate-500 font-medium">
          Upload your documents once. CareerPilot extracts, indexes, and helps you verify your career credentials.
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              activeCategory === cat 
                ? 'bg-indigo-600 text-white shadow-indigo-600/30' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-14 flex flex-col items-center justify-center text-center transition-all hover:border-indigo-400 group">
        <input
          type="file"
          id="doc-upload"
          accept=".pdf,.png,.jpg,.jpeg,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center w-full">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            {isProcessing ? <Loader2 className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">
            {isProcessing ? 'Extracting Document...' : 'Drag & Drop your Resume here'}
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-8">
            Supports PDF, PNG, JPG, DOCX (Max 25 MB)
          </p>
          <div className="flex items-center gap-3 pointer-events-none">
            <div className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20">
              Browse Files
            </div>
            <div className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm">
              Upload Demo File
            </div>
          </div>
        </label>
      </div>

      {/* Extraction Verification Modal */}
      {activeExtraction && (
        <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-200 shadow-sm space-y-4 animate-fade-in-up">
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
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
              {activeExtraction.result.confidenceScore}% Confidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
              <span className="text-slate-500 font-bold block">Academic Details Extracted:</span>
              <p className="text-slate-800">College: <strong className="text-indigo-600">{activeExtraction.result.extractedInformation.college}</strong></p>
              <p className="text-slate-800">Degree: <strong className="text-indigo-600">{activeExtraction.result.extractedInformation.degree}</strong></p>
              <p className="text-slate-800">CGPA: <strong className="text-emerald-700">{activeExtraction.result.extractedInformation.cgpa}</strong></p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
              <span className="text-slate-500 font-bold block">Skills Extracted ({activeExtraction.result.extractedInformation.skillsExtracted?.length}):</span>
              <div className="flex flex-wrap gap-1.5">
                {activeExtraction.result.extractedInformation.skillsExtracted?.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleRejectExtraction}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors shadow-sm"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
            <button
              onClick={handleConfirmExtraction}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm & Verify
            </button>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-extrabold text-sm text-slate-900">Uploaded Documents ({(documents.length > 0 ? documents.length : demoDocuments.length)})</h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Securely stored and verified credentials</p>
        </div>
        <div className="p-3 space-y-1">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="p-3.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between group transition-colors">
                 <div className="flex items-center gap-3.5">
                   <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                      <FileText className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-[13px] font-bold text-slate-900">{doc.fileName}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{doc.docType} • Uploaded {doc.createdAt}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5 text-emerald-600">
                     <CheckCircle2 className="h-4 w-4" />
                     <span className="text-xs font-bold">{doc.status === 'Confirmed' ? 'Verified' : doc.status}</span>
                   </div>
                   <button className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                     Review
                   </button>
                 </div>
              </div>
            ))
          ) : (
            demoDocuments.map((doc, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between group transition-colors">
                 <div className="flex items-center gap-3.5">
                   <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                      <FileText className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-[13px] font-bold text-slate-900">{doc.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{doc.type} • {doc.size} • Uploaded {doc.time}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5 text-emerald-600">
                     <CheckCircle2 className="h-4 w-4" />
                     <span className="text-xs font-bold">{doc.fields} fields verified</span>
                   </div>
                   <button className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                     Review
                   </button>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
