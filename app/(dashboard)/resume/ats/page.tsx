'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/useProfileStore';
import { createClient } from '@/utils/supabase/client';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  FileText,
  Upload,
  Briefcase,
  HelpCircle,
  Copy,
  Check,
  Loader2,
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  Sliders,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ATSAnalysisResult } from '@/lib/resume/ats-engine';
import { ATS34EvaluationReport } from '@/lib/resume/ats-rubric-34';

export default function AtsAnalyzerPage() {
  const router = useRouter();
  const { profile, skills, projects, education, experiences, syncWithSupabase } = useProfileStore();
  const supabase = createClient();

  // Inputs state
  const [resumeSource, setResumeSource] = useState<'profile' | 'version' | 'upload'>('profile');
  const [savedVersions, setSavedVersions] = useState<Array<{ id: string; name: string; template: string; content: any }>>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedResumeText, setUploadedResumeText] = useState<string>('');

  const [jdSource, setJdSource] = useState<'paste' | 'job'>('paste');
  const [customJdText, setCustomJdText] = useState<string>('');
  const [savedJobs, setSavedJobs] = useState<Array<{ id: string; role_title: string; company: string; description: string }>>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Analysis & View state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null);
  const [rubricResult, setRubricResult] = useState<ATS34EvaluationReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rubric34' | 'keywords' | 'bullet_improver' | 'tailoring' | 'sections' | 'issues'>('overview');
  const [rubricFilter, setRubricFilter] = useState<'all' | 'pass' | 'warn' | 'fail'>('all');
  const [keywordCategory, setKeywordCategory] = useState<'all' | 'hard_skill' | 'tool' | 'soft_skill' | 'certification'>('all');
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Bullet Improver State (Google XYZ Formula)
  const [targetBulletText, setTargetBulletText] = useState('');
  const [metricUserCount, setMetricUserCount] = useState('');
  const [metricPercent, setMetricPercent] = useState('');
  const [metricLatency, setMetricLatency] = useState('');
  const [isImprovingBullet, setIsImprovingBullet] = useState(false);
  const [bulletImprovements, setBulletImprovements] = useState<any>(null);

  // Tailoring State
  const [tailorResult, setTailorResult] = useState<any>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorSaved, setTailorSaved] = useState(false);

  useEffect(() => {
    syncWithSupabase();

    // Fetch saved versions
    fetch('/api/resume/versions')
      .then((r) => r.json())
      .then((d) => {
        if (d.versions) {
          setSavedVersions(d.versions);
          if (d.versions.length > 0) setSelectedVersionId(d.versions[0].id);
        }
      })
      .catch(console.warn);

    // Fetch saved jobs
    supabase
      .from('jobs')
      .select('id, role_title, company, description')
      .limit(10)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setSavedJobs(data);
          setSelectedJobId(data[0].id);
        }
      });
  }, [syncWithSupabase, supabase]);

  // Build plain text from current verified profile
  const buildProfileResumeText = (): string => {
    const verifiedSkills = skills.filter((s: any) => s.verificationStatus === 'Verified' || s.verified);
    const verifiedProjects = projects.filter((p: any) => p.verificationStatus === 'Verified' || p.verified);
    const verifiedEdu = education.filter((e: any) => e.verificationStatus === 'Verified' || e.verified);

    let text = `${profile.fullName || 'Student Candidate'}\n`;
    text += `${profile.email || ''} | ${profile.phone || ''} | ${profile.targetRole || 'Software Engineer'}\n\n`;

    const bio = (profile as any).bio;
    if (bio) {
      text += `PROFESSIONAL SUMMARY\n${bio}\n\n`;
    }

    if (verifiedSkills.length > 0) {
      text += `TECHNICAL SKILLS\n${verifiedSkills.map((s) => s.name).join(', ')}\n\n`;
    }

    if (experiences.length > 0) {
      text += `WORK EXPERIENCE\n`;
      experiences.forEach((exp: any) => {
        const duration = exp.duration || `${exp.startDate || '2024'} - ${exp.endDate || 'Present'}`;
        text += `${exp.role} at ${exp.company} (${duration})\n• ${exp.description}\n`;
      });
      text += `\n`;
    }

    if (verifiedProjects.length > 0) {
      text += `TECHNICAL PROJECTS\n`;
      verifiedProjects.forEach((proj: any) => {
        const stack = (proj.techStack || proj.tech_stack || []).join(', ');
        text += `${proj.title} | Tech Stack: ${stack}\n• ${proj.description}\n`;
      });
      text += `\n`;
    }

    if (verifiedEdu.length > 0 || profile.college) {
      text += `EDUCATION\n`;
      if (verifiedEdu.length > 0) {
        verifiedEdu.forEach((edu: any) => {
          const year = edu.year || edu.endYear || profile.graduationYear || '2025';
          text += `${edu.degree || 'B.E./B.Tech'} - ${edu.institution || profile.college} (${year})\n• CGPA: ${edu.cgpa || profile.cgpa || '8.5'}/10.0\n`;
        });
      } else {
        text += `Bachelor of Engineering / Technology - ${profile.college} (${profile.graduationYear || '2025'})\n`;
      }
    }

    return text;
  };

  // Handle uploaded text/file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    try {
      if (file.type === 'text/plain') {
        const text = await file.text();
        setUploadedResumeText(text);
      } else {
        // Fallback representation for non-text
        setUploadedResumeText(
          `${profile.fullName || 'Candidate'}\nTarget: ${profile.targetRole || 'Developer'}\nUploaded file: ${file.name}\n${buildProfileResumeText()}`
        );
      }
    } catch {
      alert('Could not parse file. Please upload a plain text or PDF resume.');
    }
  };

  // Run ATS Analysis
  const handleAnalyze = async () => {
    let resumeText = '';
    if (resumeSource === 'profile') {
      resumeText = buildProfileResumeText();
    } else if (resumeSource === 'version') {
      const v = savedVersions.find((ver) => ver.id === selectedVersionId);
      if (v) {
        const content = v.content || {};
        resumeText = `${content.profile?.fullName || ''}\n${content.profile?.email || ''}\n${content.summary || ''}\n${(content.skills || []).map((s: any) => (typeof s === 'string' ? s : s.name)).join(', ')}\n${(content.projects || []).map((p: any) => `${p.title}: ${p.description}`).join('\n')}`;
      } else {
        resumeText = buildProfileResumeText();
      }
    } else {
      resumeText = uploadedResumeText || buildProfileResumeText();
    }

    let jdText = customJdText.trim();
    if (jdSource === 'job') {
      const j = savedJobs.find((job) => job.id === selectedJobId);
      jdText = j ? `${j.role_title} at ${j.company}\n\n${j.description}` : customJdText;
    }

    if (!jdText) {
      alert('Please enter or select a Job Description to evaluate keyword match.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzingStep('Extracting requirements & parsing keywords...');

    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jdText,
          resumeVersionId: resumeSource === 'version' ? selectedVersionId : undefined,
          jobId: jdSource === 'job' ? selectedJobId : undefined,
          isSingleColumn: true,
          hasNoTables: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysisResult(data.analysis);
      if (data.analysis?.rubric34) {
        setRubricResult(data.analysis.rubric34);
      }
      setActiveTab('rubric34');
    } catch (err: any) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
      setAnalyzingStep('');
    }
  };

  // ─── Bullet Improver Action ────────────────────────────────────────────────
  const handleImproveBullet = async () => {
    if (!targetBulletText.trim()) return;
    setIsImprovingBullet(true);
    setBulletImprovements(null);

    try {
      const res = await fetch('/api/resume/bullet-improver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet: targetBulletText,
          projectContext: {
            title: projects[0]?.title || 'Technical Project',
            techStack: projects[0]?.techStack || ['Java', 'React', 'PostgreSQL'],
            description: projects[0]?.description || '',
          },
          providedMetrics: {
            userCount: metricUserCount || undefined,
            percentageImprovement: metricPercent || undefined,
            latencyOrSpeed: metricLatency || undefined,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to generate XYZ improvements');
      const data = await res.json();
      setBulletImprovements(data);
    } catch (err: any) {
      alert(`Bullet improver error: ${err.message}`);
    } finally {
      setIsImprovingBullet(false);
    }
  };

  // ─── Resume Tailoring Action ────────────────────────────────────────────────
  const handleTailorResume = async () => {
    const jdText = jdSource === 'job'
      ? savedJobs.find((j) => j.id === selectedJobId)?.description || ''
      : customJdText;

    if (!jdText.trim()) {
      alert('Please provide a job description first.');
      return;
    }

    setIsTailoring(true);
    setTailorResult(null);
    setTailorSaved(false);

    try {
      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: resumeSource === 'version' ? selectedVersionId : undefined,
          jobId: jdSource === 'job' ? selectedJobId : undefined,
          jdText,
        }),
      });

      if (!res.ok) throw new Error('Failed to tailor resume to JD');
      const data = await res.json();
      setTailorResult(data.proposal);
    } catch (err: any) {
      alert(`Tailoring error: ${err.message}`);
    } finally {
      setIsTailoring(false);
    }
  };

  // ─── Save Tailored Version Action ───────────────────────────────────────────
  const handleSaveTailoredVersion = async () => {
    if (!tailorResult) return;
    const targetRole = tailorResult.targetRole || 'Software Engineer';
    const versionName = `v2 - Tailored for ${targetRole.slice(0, 25)}`;

    try {
      const res = await fetch('/api/resume/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: versionName,
          template: 'modern',
          source: 'tailored',
          content: {
            profile: {
              fullName: profile.fullName,
              email: profile.email,
              phone: profile.phone,
              college: profile.college,
              targetRole,
            },
            summary: analysisResult?.breakdown ? (analysisResult as any).profileSummaryRewrite : profile.targetRole,
            skills: tailorResult.skillsOrder || skills.map((s: any) => s.name),
            projects: projects.map((p: any) => ({
              title: p.title,
              techStack: p.techStack,
              description: p.description,
            })),
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to save tailored version');
      setTailorSaved(true);
    } catch (err: any) {
      alert(`Failed to save tailored version: ${err.message}`);
    }
  };

  // Filter keywords
  const filteredKeywords = analysisResult?.keywords
    ? [
        ...analysisResult.keywords.matched,
        ...analysisResult.keywords.partial,
        ...analysisResult.keywords.missing,
      ].filter((k) => keywordCategory === 'all' || k.category === keywordCategory)
    : [];

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
            Automated Scanner Engine • Deterministic Scoring &amp; Parser Audit
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ATS Resume Analyzer</h1>
          <p className="text-[13px] text-slate-600 font-medium max-w-3xl">
            Evaluate your resume against real job descriptions using standard Workday, Taleo, and Greenhouse keyword &amp; layout benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFormulaModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="h-4 w-4 text-slate-500" />
            <span>How this is calculated</span>
          </button>
          <Link
            href="/resume"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <span>Open in Builder</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main 2-Column Grid: Inputs on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ────────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN: Resume & Job Description Selectors            */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Resume Source */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>1. Select Resume</span>
              </h2>
            </div>

            {/* Resume Source Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setResumeSource('profile')}
                className={cn('py-1.5 rounded-lg transition-all', resumeSource === 'profile' && 'bg-white text-blue-800 shadow-sm')}
              >
                Verified Profile
              </button>
              <button
                onClick={() => setResumeSource('version')}
                className={cn('py-1.5 rounded-lg transition-all', resumeSource === 'version' && 'bg-white text-blue-800 shadow-sm')}
              >
                Saved Version
              </button>
              <button
                onClick={() => setResumeSource('upload')}
                className={cn('py-1.5 rounded-lg transition-all', resumeSource === 'upload' && 'bg-white text-blue-800 shadow-sm')}
              >
                Upload File
              </button>
            </div>

            {resumeSource === 'profile' && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/60 text-xs text-blue-800 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Truthful Profile Resume</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Uses verified data from your Career Profile ({skills.length} skills, {projects.length} projects, {education.length} education records).
                </p>
              </div>
            )}

            {resumeSource === 'version' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600">Choose Version:</label>
                {savedVersions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No saved versions found. Create one in the Builder.</p>
                ) : (
                  <select
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    {savedVersions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.template.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {resumeSource === 'upload' && (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 cursor-pointer bg-slate-50/50 transition-colors">
                  <Upload className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Upload Resume (TXT, PDF, DOCX)</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Selectable text files work best</span>
                  <input type="file" accept=".txt,.pdf,.docx" onChange={handleFileUpload} className="hidden" />
                </label>
                {uploadedFileName && (
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 bg-slate-100 px-3 py-2 rounded-lg">
                    <span className="truncate">{uploadedFileName}</span>
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Job Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span>2. Job Description</span>
            </h2>

            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setJdSource('paste')}
                className={cn('py-1.5 rounded-lg transition-all', jdSource === 'paste' && 'bg-white text-blue-800 shadow-sm')}
              >
                Paste Job Description
              </button>
              <button
                onClick={() => setJdSource('job')}
                className={cn('py-1.5 rounded-lg transition-all', jdSource === 'job' && 'bg-white text-blue-800 shadow-sm')}
              >
                Pick Saved Job ({savedJobs.length})
              </button>
            </div>

            {jdSource === 'paste' ? (
              <textarea
                value={customJdText}
                onChange={(e) => setCustomJdText(e.target.value)}
                placeholder="Paste the full job requirements, responsibilities, and qualifications text here..."
                rows={7}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 leading-relaxed resize-none"
              />
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  {savedJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.role_title} • {j.company}
                    </option>
                  ))}
                </select>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 max-h-36 overflow-y-auto">
                  {savedJobs.find((j) => j.id === selectedJobId)?.description || 'No description preview available.'}
                </div>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-98 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{analyzingStep || 'Analyzing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run ATS Match Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: Real, Explainable ATS Analysis Results       */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {!analysisResult ? (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ready for ATS Audit</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Select your resume and job description on the left, then click &quot;Run ATS Match Audit&quot; to calculate keyword coverage, layout checks, and impact verbs.
              </p>
            </div>
          ) : (
            /* Results Panel */
            <div className="space-y-6 animate-fadeIn">
              {/* Overall Score Banner */}
              <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-100 pb-6 mb-6">
                  <div className="flex items-center gap-5">
                    {/* Big Score Ring */}
                    <div
                      className={cn(
                        'h-20 w-20 shrink-0 rounded-2xl border-4 flex flex-col items-center justify-center shadow-inner',
                        analysisResult.overallScore >= 80
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : analysisResult.overallScore >= 60
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-amber-50 border-amber-500 text-amber-700'
                      )}
                    >
                      <span className="text-3xl font-black">{analysisResult.overallScore}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">/ 100</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900">
                          {analysisResult.overallScore >= 80
                            ? 'Excellent Match'
                            : analysisResult.overallScore >= 60
                            ? 'Competitive Match'
                            : 'Needs Verification'}
                        </h3>
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider',
                            analysisResult.overallScore >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-700'
                          )}
                        >
                          {analysisResult.overallScore >= 80 ? 'High Likelihood' : 'Moderate'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        ATS Match Estimate based on {analysisResult.keywords.matched.length} matched keywords &amp; clean single-column format.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/resume"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors shrink-0"
                  >
                    <span>Tailor in Builder</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* 5 Breakdown Progress Bars */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    { label: 'Keywords (40%)', score: analysisResult.breakdown.keywordsScore },
                    { label: 'Relevance (20%)', score: analysisResult.breakdown.relevanceScore },
                    { label: 'Sections (15%)', score: analysisResult.breakdown.sectionCompletenessScore },
                    { label: 'Formatting (15%)', score: analysisResult.breakdown.formattingScore },
                    { label: 'Quality (10%)', score: analysisResult.breakdown.contentQualityScore },
                  ].map((metric) => (
                    <div key={metric.label} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span className="truncate">{metric.label}</span>
                        <span>{metric.score}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${metric.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="italic">
                    Notice: Real ATS software differs. No score guarantees an interview.
                  </span>
                  <button
                    onClick={() => setShowFormulaModal(true)}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    View Formula
                  </button>
                </div>
              </div>

              {/* Sub-Tabs Navigation */}
              <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-wrap gap-1 text-xs font-bold">
                {[
                  { id: 'rubric34', label: `34-Point Rubric (${rubricResult ? rubricResult.overallScore : 0}/100)` },
                  { id: 'bullet_improver', label: 'XYZ Bullet Improver' },
                  { id: 'tailoring', label: 'JD Tailoring & Diff' },
                  { id: 'overview', label: 'Overview & Summary' },
                  { id: 'keywords', label: `Keywords (${analysisResult.keywords.matched.length} Matched)` },
                  { id: 'issues', label: `Issues (${analysisResult.issues.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl transition-all',
                      activeTab === t.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB: 34-CHECKPOINT ATS RUBRIC                            */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'rubric34' && rubricResult && (
                <div className="space-y-6">
                  {/* Published Formula Banner */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-blue-700">
                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                        <span>Published 34-Point Diagnostic Formula</span>
                      </span>
                      <span className="text-blue-800 font-black text-sm">
                        Total Score: {rubricResult.overallScore} / 100
                      </span>
                    </div>
                    <p className="text-slate-600 font-mono text-[11px]">
                      Formula: Score = Σ (Checkpoint_Weight × Factor) [Pass = 1.0, Warn = 0.5, Fail = 0.0]
                    </p>
                    <p className="text-[11px] text-slate-500 italic">
                      {rubricResult.disclaimer}
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-slate-500 text-[11px] mr-1">Filter Checks:</span>
                    {(['all', 'pass', 'warn', 'fail'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setRubricFilter(f)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs capitalize transition-all',
                          rubricFilter === f
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {f === 'all'
                          ? `All (34)`
                          : f === 'pass'
                          ? `Passed (${rubricResult.passedCount})`
                          : f === 'warn'
                          ? `Warnings (${rubricResult.warnCount})`
                          : `Failed (${rubricResult.failedCount})`}
                      </button>
                    ))}
                  </div>

                  {/* 34 Checkpoint Cards by Category */}
                  <div className="space-y-3">
                    {rubricResult.checkpoints
                      .filter((cp) => rubricFilter === 'all' || cp.status === rubricFilter)
                      .map((cp) => (
                        <div
                          key={cp.checkpointId}
                          className={cn(
                            'p-4 rounded-2xl border transition-all space-y-2 text-xs',
                            cp.status === 'pass'
                              ? 'bg-emerald-50/40 border-emerald-200/80'
                              : cp.status === 'warn'
                              ? 'bg-amber-50/40 border-amber-200/80'
                              : 'bg-rose-50/40 border-rose-200/80'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {cp.status === 'pass' ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              ) : cp.status === 'warn' ? (
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                              )}
                              <span className="font-black text-slate-900 text-sm">{cp.name}</span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-700">
                                {cp.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={cn(
                                  'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full',
                                  cp.status === 'pass'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : cp.status === 'warn'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                )}
                              >
                                {cp.status.toUpperCase()} (+{cp.pointsEarned}/{cp.maxPoints} pts)
                              </span>
                              {cp.status !== 'pass' && (
                                <button
                                  onClick={() => {
                                    if (cp.actionType === 'improve_bullet') {
                                      setActiveTab('bullet_improver');
                                      if (projects[0]?.description) {
                                        setTargetBulletText(projects[0].description.split('\n')[0] || '');
                                      }
                                    } else {
                                      router.push('/resume');
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                                >
                                  Apply Fix →
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-700 font-medium text-[11px] leading-relaxed">
                            <strong>Finding:</strong> {cp.finding}
                          </p>

                          <div className="pt-1 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-600">
                            <span>
                              <strong>Recommendation:</strong> {cp.fixSuggestion}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              ID: {cp.checkpointId}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB: GOOGLE XYZ BULLET IMPROVER                          */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'bullet_improver' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span>Google XYZ Bullet Improver</span>
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        Standard: &quot;Accomplished [X] as measured by [Y], by doing [Z]&quot;. Strict truthfulness: AI never hallucinates or invents numbers.
                      </p>
                    </div>

                    {/* Pre-fill from verified projects */}
                    {projects.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 block">
                          Select bullet from verified projects (or paste below):
                        </label>
                        <select
                          onChange={(e) => setTargetBulletText(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 bg-slate-50 focus:outline-none"
                        >
                          <option value="">-- Choose a project bullet --</option>
                          {projects.map((p: any) =>
                            (p.description || '')
                              .split('\n')
                              .filter((l: string) => l.trim().length > 10)
                              .map((line: string, idx: number) => (
                                <option key={`${p.id}-${idx}`} value={line.replace(/^[•\-\*]\s*/, '')}>
                                  {p.title}: {line.slice(0, 75)}...
                                </option>
                              ))
                          )}
                        </select>
                      </div>
                    )}

                    {/* Bullet Text Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Original Bullet Text:
                      </label>
                      <textarea
                        value={targetBulletText}
                        onChange={(e) => setTargetBulletText(e.target.value)}
                        placeholder="e.g., Worked on backend API for student portal and made it faster."
                        rows={3}
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Verified Metrics Inputs (To prevent AI hallucinations) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Student-Supplied Verified Metrics (Optional, ensures zero AI guesswork):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={metricUserCount}
                          onChange={(e) => setMetricUserCount(e.target.value)}
                          placeholder="User count (e.g. 500+ users)"
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
                        />
                        <input
                          type="text"
                          value={metricPercent}
                          onChange={(e) => setMetricPercent(e.target.value)}
                          placeholder="% Improvement (e.g. 35%)"
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
                        />
                        <input
                          type="text"
                          value={metricLatency}
                          onChange={(e) => setMetricLatency(e.target.value)}
                          placeholder="Speed / Scale (e.g. 120ms)"
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleImproveBullet}
                      disabled={isImprovingBullet || !targetBulletText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
                    >
                      {isImprovingBullet ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      <span>{isImprovingBullet ? 'Applying XYZ Rubric...' : 'Generate 3 XYZ Variations'}</span>
                    </button>
                  </div>

                  {/* Bullet Improver Results */}
                  {bulletImprovements && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 animate-fade-in-up">
                      {/* Metric Request Alert if metrics missing */}
                      {bulletImprovements.needsMetricInput && (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold">Honest Metric Request (Zero Guesswork):</span>
                            <p className="text-[11px] text-amber-800">
                              {bulletImprovements.metricPromptQuestion || 'Provide the specific number or % improvement above to finalize your metric-focused bullet.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 3 Variations */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Suggested Improvements:
                        </h5>
                        {bulletImprovements.suggestions?.map((sug: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-blue-700 uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-blue-100">
                                Variant {idx + 1}: {sug.variant.replace('_', ' ')}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(sug.improvedBullet);
                                  alert('Copied to clipboard!');
                                }}
                                className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"
                              >
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </button>
                            </div>

                            <p className="font-semibold text-slate-900 text-sm leading-relaxed">
                              • {sug.improvedBullet}
                            </p>

                            <p className="text-[11px] text-slate-500 italic">
                              <strong>Why it scores higher:</strong> {sug.whyBetter}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB: RESUME AI TAILORING & DIFF VIEW                     */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === 'tailoring' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="h-4 w-4 text-blue-600" />
                          <span>Job Description Tailoring &amp; Diff Engine</span>
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">
                          Align your verified resume structure with target JD keywords and preview diff changes before saving.
                        </p>
                      </div>

                      <button
                        onClick={handleTailorResume}
                        disabled={isTailoring}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
                      >
                        {isTailoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        <span>{isTailoring ? 'Aligning...' : 'Generate Tailored Alignment'}</span>
                      </button>
                    </div>
                  </div>

                  {tailorResult && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in-up">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target Alignment</span>
                          <span className="text-base font-black text-slate-900">{tailorResult.targetRole}</span>
                        </div>

                        <button
                          onClick={handleSaveTailoredVersion}
                          disabled={tailorSaved}
                          className={cn(
                            'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors',
                            tailorSaved
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          )}
                        >
                          {tailorSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                          <span>{tailorSaved ? 'Saved to Versions (v2)' : 'Save as Tailored Version (v2)'}</span>
                        </button>
                      </div>

                      {/* Keyword Diff Matrix */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Keyword Coverage Diff
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                            <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span>Matched Keywords ({tailorResult.matchedKeywords?.length || 0})</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {tailorResult.matchedKeywords?.map((kw: string) => (
                                <span key={kw} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                              <Info className="h-4 w-4 text-slate-500" />
                              <span>Optimized Skills Order</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {tailorResult.skillsOrder?.slice(0, 10).map((sk: string) => (
                                <span key={sk} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bullet Diff View */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Project Bullet Diff View (Before vs After)
                        </h5>
                        <div className="space-y-3">
                          {tailorResult.bulletSuggestions?.map((b: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2 text-xs">
                              <span className="font-bold text-slate-900 block">{b.projectTitle}</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200 text-rose-900 space-y-1">
                                  <span className="text-[10px] font-bold text-rose-700 uppercase">Original:</span>
                                  <p className="line-through text-[11px]">{b.originalBullet}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-950 space-y-1">
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Tailored (Action Verb):</span>
                                  <p className="font-bold text-[11px]">{b.proposedBullet}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 1: Overview & Verified Profile Summary Rewrite */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary Rewrite Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span>ATS-Optimized Summary (Verified Data Only)</span>
                      </h4>
                      <button
                        onClick={() => {
                          if ((analysisResult as any).profileSummaryRewrite) {
                            navigator.clipboard.writeText((analysisResult as any).profileSummaryRewrite);
                            setCopiedSummary(true);
                            setTimeout(() => setCopiedSummary(false), 2000);
                          }
                        }}
                        className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"
                      >
                        {copiedSummary ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-medium">
                      {(analysisResult as any).profileSummaryRewrite ||
                        'No rewrite generated yet. Ensure your target role is set in your profile.'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      This rewrite draws strictly from your verified profile and target role benchmarks without inventing any claims.
                    </p>
                  </div>

                  {/* High Priority Actions */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      High-Priority Recommendations
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.issues
                        .filter((i) => i.severity === 'high')
                        .map((issue) => (
                          <div
                            key={issue.id}
                            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-xs"
                          >
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1 flex-1">
                              <h5 className="font-bold text-rose-950">{issue.title}</h5>
                              <p className="text-rose-900 text-[11px] leading-relaxed">{issue.description}</p>
                              <p className="text-[11px] text-rose-700 font-semibold pt-1">
                                Fix: {issue.suggestion}
                              </p>
                            </div>
                            {issue.actionType === 'add_skill' && (
                              <Link
                                href="/profile#skills"
                                className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[10px] shrink-0"
                              >
                                Add Skill
                              </Link>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Keywords Breakdown */}
              {activeTab === 'keywords' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Extracted Keywords Audit
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Synonyms resolved automatically (e.g. JS = JavaScript, Postgres = PostgreSQL).
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-1 text-[11px] font-bold">
                      {['all', 'hard_skill', 'tool', 'soft_skill', 'certification'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setKeywordCategory(cat as any)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg transition-colors',
                            keywordCategory === cat
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          )}
                        >
                          {cat.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Keywords Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {filteredKeywords.map((kw, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-3 rounded-xl border text-xs flex flex-col justify-between space-y-2',
                          kw.status === 'matched'
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : kw.status === 'partial'
                            ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                            : 'bg-rose-50/60 border-rose-200 text-rose-950'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            {kw.status === 'matched' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : kw.status === 'partial' ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            )}
                            <span>{kw.term}</span>
                          </span>

                          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200">
                            {kw.category.replace('_', ' ')}
                          </span>
                        </div>

                        {kw.synonymMatched && (
                          <p className="text-[10px] text-emerald-700 italic">
                            Matched via synonym: &quot;{kw.synonymMatched}&quot;
                          </p>
                        )}

                        {kw.status === 'missing' && (
                          <div className="pt-1 border-t border-rose-200/60 flex items-center justify-between text-[10px]">
                            <span className="text-rose-700">Add only if verified</span>
                            <Link href="/profile#skills" className="text-blue-700 font-bold hover:underline">
                              + Add to Profile
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Layout & Sections Check */}
              {activeTab === 'sections' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                      Standard ATS Section Detection
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {[
                        { label: 'Contact Info Header', ok: analysisResult.sectionChecks.contactInfo },
                        { label: 'Professional Summary', ok: analysisResult.sectionChecks.summary },
                        { label: 'Technical Skills', ok: analysisResult.sectionChecks.skills },
                        { label: 'Work Experience', ok: analysisResult.sectionChecks.experience },
                        { label: 'Technical Projects', ok: analysisResult.sectionChecks.projects },
                        { label: 'Education & CGPA', ok: analysisResult.sectionChecks.education },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={cn(
                            'p-3 rounded-xl border flex items-center justify-between font-medium',
                            item.ok
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          )}
                        >
                          <span>{item.label}</span>
                          {item.ok ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formatting & Parsing Signals */}
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                      Formatting &amp; Readability Metrics
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">Word Count</span>
                        <span className="text-lg font-black text-slate-900">
                          {analysisResult.formattingChecks.wordCount}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">Estimated Pages</span>
                        <span className="text-lg font-black text-slate-900">
                          {analysisResult.formattingChecks.pageCountEstimate} page
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">Quantified Metrics</span>
                        <span className="text-lg font-black text-slate-900">
                          {analysisResult.contentQuality.quantifiedMetricsCount}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">Action Verbs</span>
                        <span className="text-lg font-black text-slate-900">
                          {analysisResult.contentQuality.strongActionVerbsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Prioritized Fix List */}
              {activeTab === 'issues' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    All Prioritized Fixes ({analysisResult.issues.length})
                  </h4>

                  <div className="space-y-3">
                    {analysisResult.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={cn(
                          'p-4 rounded-xl border text-xs space-y-1.5',
                          issue.severity === 'high'
                            ? 'bg-rose-50 border-rose-200'
                            : issue.severity === 'medium'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-2">
                            <span
                              className={cn(
                                'h-2 w-2 rounded-full',
                                issue.severity === 'high'
                                  ? 'bg-rose-600'
                                  : issue.severity === 'medium'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              )}
                            />
                            <span>{issue.title}</span>
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200">
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{issue.description}</p>
                        <p className="text-[11px] font-semibold text-slate-800 pt-1">
                          Advice: {issue.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* "HOW THIS IS CALCULATED" MODAL                             */}
      {/* ────────────────────────────────────────────────────────── */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-7 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-blue-700 font-black text-sm uppercase tracking-wider">
                <Info className="h-5 w-5" />
                <span>How ATS Score is Calculated</span>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-800">
                Score = (Keywords × 40%) + (Experience Relevance × 20%) + (Section Completeness × 15%) + (Formatting × 15%) + (Content Quality × 10%)
              </div>

              <div className="space-y-2">
                <p>
                  <strong>1. Keywords (40%):</strong> Evaluates coverage of hard skills, tools, and certifications mentioned in the job description using automated synonym mapping.
                </p>
                <p>
                  <strong>2. Experience Relevance (20%):</strong> Measures whether matched technologies are actively tied to project bullet points and quantified outcomes.
                </p>
                <p>
                  <strong>3. Section Completeness (15%):</strong> Verifies standard headings (Contact Info, Skills, Experience, Projects, Education) in single-column order.
                </p>
                <p>
                  <strong>4. Formatting &amp; Parseability (15%):</strong> Confirms plain selectable text, avoiding tables, text boxes, or graphics that confuse Taleo &amp; Workday parsers.
                </p>
                <p>
                  <strong>5. Content Quality (10%):</strong> Rewards strong action verbs and quantified metrics (e.g. 20%, 500+ users) while penalizing passive phrases.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                <strong>Honest Labeling:</strong> This score is an educational estimate. Real ATS systems differ by employer configuration, and no software can guarantee an interview.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
