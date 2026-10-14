'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProfileStore } from '@/store/useProfileStore';
import { createClient } from '@/utils/supabase/client';
import {
  Printer,
  Sparkles,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Copy,
  Check,
  Briefcase,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TemplateType = 'standard_single_column' | 'modern_technical' | 'compact_one_page';

interface SavedVersion {
  id: string;
  name: string;
  template: TemplateType;
  content: any;
  source: string;
  latestAtsScore?: number;
  updated_at: string;
}

export default function ResumePage() {
  const { profile, education, skills, projects, experiences, syncWithSupabase } = useProfileStore();
  const supabase = createClient();

  // Template & Customization controls (within ATS-safe limits)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('standard_single_column');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [fontSize, setFontSize] = useState<'sm' | 'base'>('sm');
  const [spacing, setSpacing] = useState<'compact' | 'normal'>('normal');

  // Section visibility & order
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'summary',
    'skills',
    'projects',
    'experience',
    'education',
  ]);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    summary: true,
    skills: true,
    projects: true,
    experience: true,
    education: true,
  });

  // Versions state
  const [savedVersions, setSavedVersions] = useState<SavedVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Tailor to Job state
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Array<{ id: string; role_title: string; company: string; description: string }>>([]);
  const [tailorJobId, setTailorJobId] = useState('');
  const [tailorJdText, setTailorJdText] = useState('');
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorProposal, setTailorProposal] = useState<any>(null);

  // Export & Plain-text preview
  const [plainTextPreviewOpen, setPlainTextPreviewOpen] = useState(false);
  const [plainTextContent, setPlainTextContent] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);

  // Active bullet tweaks approved by user
  const [approvedBulletTweaks, setApprovedBulletTweaks] = useState<Record<string, string>>({});

  useEffect(() => {
    syncWithSupabase();
    loadVersions();

    // Load jobs for tailoring
    supabase
      .from('jobs')
      .select('id, role_title, company, description')
      .limit(8)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setSavedJobs(data);
          setTailorJobId(data[0].id);
          setTailorJdText(data[0].description);
        }
      });
  }, [syncWithSupabase, supabase]);

  const loadVersions = async () => {
    try {
      const res = await fetch('/api/resume/versions');
      if (res.ok) {
        const data = await res.json();
        setSavedVersions(data.versions || []);
      }
    } catch (err) {
      console.warn('Failed to load resume versions:', err);
    }
  };

  // Only verified profile data feeds the resume builder
  const verifiedSkills = skills.filter((s: any) => s.verificationStatus === 'Verified' || s.verified);
  const verifiedProjects = projects.filter((p: any) => p.verificationStatus === 'Verified' || p.verified);
  const verifiedEdu = education.filter((e: any) => e.verificationStatus === 'Verified' || e.verified);

  // Computed Live ATS Score Estimate
  let computedAtsScore = 40;
  if (profile.fullName && profile.email) computedAtsScore += 15;
  if (profile.targetRole) computedAtsScore += 10;
  if (verifiedEdu.length > 0 || profile.college) computedAtsScore += 10;
  if (verifiedSkills.length >= 4) computedAtsScore += 15;
  if (verifiedProjects.length >= 2) computedAtsScore += 10;

  // Move section up/down
  const moveSection = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sectionOrder.length) return;
    const nextOrder = [...sectionOrder];
    const temp = nextOrder[idx];
    nextOrder[idx] = nextOrder[targetIdx];
    nextOrder[targetIdx] = temp;
    setSectionOrder(nextOrder);
  };

  // Save Version
  const handleSaveVersion = async () => {
    if (!newVersionName.trim()) return;
    setIsSaving(true);
    try {
      const resumeContent = {
        profile,
        summary: (profile as any).bio || '',
        skills: verifiedSkills,
        projects: verifiedProjects.map((p) => ({
          ...p,
          description: approvedBulletTweaks[p.id] || p.description,
        })),
        experiences,
        education: verifiedEdu.length > 0 ? verifiedEdu : [{ institution: profile.college, degree: 'B.E./B.Tech' }],
        template: selectedTemplate,
        fontFamily,
        fontSize,
        spacing,
        sectionOrder,
      };

      const res = await fetch('/api/resume/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVersionName.trim(),
          template: selectedTemplate,
          content: resumeContent,
          source: tailorProposal ? 'tailored' : 'builder',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSavedVersions((prev) => [data.version, ...prev]);
        setActiveVersionId(data.version.id);
        setSaveModalOpen(false);
        setNewVersionName('');
      }
    } catch (err) {
      alert('Failed to save version.');
    } finally {
      setIsSaving(false);
    }
  };

  // Run Tailor Job
  const handleTailorJob = async () => {
    let jd = tailorJdText.trim();
    if (!jd && tailorJobId) {
      const j = savedJobs.find((job) => job.id === tailorJobId);
      jd = j?.description || '';
    }

    if (!jd) {
      alert('Please select or paste a job description.');
      return;
    }

    setIsTailoring(true);
    try {
      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: activeVersionId || undefined,
          jobId: tailorJobId || undefined,
          jdText: jd,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTailorProposal(data.proposal);
      }
    } catch (err) {
      alert('Tailoring failed.');
    } finally {
      setIsTailoring(false);
    }
  };

  // Export Plain Text / PDF
  const handleExport = async (format: 'pdf' | 'txt' = 'pdf') => {
    setIsExporting(true);
    setExportDownloadUrl(null);
    try {
      // First ensure version exists
      let versionIdToExport = activeVersionId;
      if (!versionIdToExport && savedVersions.length > 0) {
        versionIdToExport = savedVersions[0].id;
      }

      if (!versionIdToExport) {
        // Save temporary version first
        const saveRes = await fetch('/api/resume/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${profile.fullName || 'Student'} Resume`,
            template: selectedTemplate,
            content: {
              profile,
              summary: (profile as any).bio,
              skills: verifiedSkills,
              projects: verifiedProjects,
              education: verifiedEdu,
              experiences,
            },
          }),
        });
        const saveJson = await saveRes.json();
        versionIdToExport = saveJson.version?.id;
      }

      const res = await fetch('/api/resume/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: versionIdToExport,
          format,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.plainTextPreview) {
          setPlainTextContent(data.plainTextPreview);
        }
        if (data.downloadUrl) {
          setExportDownloadUrl(data.downloadUrl);
          // Auto trigger download
          window.open(data.downloadUrl, '_blank');
        }
      }
    } catch (err) {
      alert('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
            ATS-Safe Layout Studio • Verified Career Credentials Only
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Resume Builder</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Version Selector */}
          <select
            value={activeVersionId || ''}
            onChange={(e) => {
              const v = savedVersions.find((ver) => ver.id === e.target.value);
              if (v) {
                setActiveVersionId(v.id);
                setSelectedTemplate(v.template);
              }
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="">Master Resume (Profile)</option>
            {savedVersions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.latestAtsScore ? `(${v.latestAtsScore} ATS)` : ''}
              </option>
            ))}
          </select>

          {/* Tailor to Job Button */}
          <button
            onClick={() => setTailorModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>Tailor to Job</span>
          </button>

          {/* Plain Text Preview (What ATS Sees) */}
          <button
            onClick={() => {
              handleExport('txt');
              setPlainTextPreviewOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Preview what automated ATS parsers extract"
          >
            <Eye className="h-4 w-4 text-slate-500" />
            <span>What ATS Sees</span>
          </button>

          {/* Save Version */}
          <button
            onClick={() => setSaveModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>Save Version</span>
          </button>

          {/* Export / Print */}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Customization Panel on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ────────────────────────────────────────────────────────── */}
        {/* LEFT PANEL: ATS Controls & Section Customizer              */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* ATS Health Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated ATS Score</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                Single Column Verified
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-700">{computedAtsScore}</span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${computedAtsScore}%` }}
              />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Full audit breakdown:</span>
              <Link href="/resume/ats" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                <span>Run ATS Analyzer</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Template Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-600" />
              <span>ATS-Safe Templates</span>
            </h3>

            <div className="space-y-2 text-xs">
              {[
                { id: 'standard_single_column', name: 'Standard Single-Column', desc: 'Universally parsed by Taleo & Workday. Clean centered header.' },
                { id: 'modern_technical', name: 'Modern Technical', desc: 'Prioritizes Technical Skills and Projects at top for engineering roles.' },
                { id: 'compact_one_page', name: 'Compact One-Page', desc: 'Tight margins and crisp spacing ideal for college grads.' },
              ].map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id as TemplateType)}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all',
                    selectedTemplate === tmpl.id
                      ? 'bg-blue-50/70 border-blue-600 text-blue-900 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{tmpl.name}</span>
                    {selectedTemplate === tmpl.id && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] font-normal text-slate-500 mt-1">{tmpl.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Formatting Controls within ATS Limits */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
            <h3 className="font-black text-slate-900 uppercase tracking-wider">Formatting Constraints</h3>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 block">Font Family (ATS Safe):</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-center font-bold">
                <button
                  onClick={() => setFontFamily('sans')}
                  className={cn('py-1.5 rounded-lg transition-all', fontFamily === 'sans' && 'bg-white shadow-sm text-blue-800')}
                >
                  Inter / Arial
                </button>
                <button
                  onClick={() => setFontFamily('serif')}
                  className={cn('py-1.5 rounded-lg transition-all', fontFamily === 'serif' && 'bg-white shadow-sm text-blue-800')}
                >
                  Times Serif
                </button>
                <button
                  onClick={() => setFontFamily('mono')}
                  className={cn('py-1.5 rounded-lg transition-all', fontFamily === 'mono' && 'bg-white shadow-sm text-blue-800')}
                >
                  Robo Mono
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 block">Font Size:</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-center font-bold">
                <button
                  onClick={() => setFontSize('sm')}
                  className={cn('py-1.5 rounded-lg transition-all', fontSize === 'sm' && 'bg-white shadow-sm text-blue-800')}
                >
                  10.5 pt (Standard)
                </button>
                <button
                  onClick={() => setFontSize('base')}
                  className={cn('py-1.5 rounded-lg transition-all', fontSize === 'base' && 'bg-white shadow-sm text-blue-800')}
                >
                  11.5 pt (Relaxed)
                </button>
              </div>
            </div>
          </div>

          {/* Section Reordering & Toggles */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Section Order &amp; Toggle</span>
            </h3>

            <div className="space-y-1.5">
              {sectionOrder.map((sec, idx) => (
                <div
                  key={sec}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 capitalize">
                    <input
                      type="checkbox"
                      checked={visibleSections[sec]}
                      onChange={(e) =>
                        setVisibleSections((prev) => ({ ...prev, [sec]: e.target.checked }))
                      }
                      className="accent-blue-600 h-3.5 w-3.5 rounded"
                    />
                    <span>{sec}</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === sectionOrder.length - 1}
                      className="p-1 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* RIGHT PANEL: Live ATS Document Preview (Real Selectable Text) */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
          <div
            id="ats-resume-document"
            className={cn(
              'bg-white rounded-xl border border-slate-300 shadow-lg p-10 min-h-[1050px] transition-all',
              fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans',
              fontSize === 'sm' ? 'text-xs' : 'text-sm'
            )}
          >
            {/* Header: Candidate Details */}
            <header
              className={cn(
                'border-b-2 border-slate-800 pb-4 mb-6',
                selectedTemplate === 'modern_technical' ? 'text-left' : 'text-center'
              )}
            >
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {profile.fullName || 'CANDIDATE NAME'}
              </h1>
              <div className="text-[11px] text-slate-600 mt-1.5 flex flex-wrap gap-2 justify-center font-medium">
                {profile.email && <span>{profile.email}</span>}
                {profile.phone && <span>• {profile.phone}</span>}
                {profile.location && <span>• {profile.location}</span>}
                {((profile as any).linkedin || profile.linkedInUrl) && <span>• {(profile as any).linkedin || profile.linkedInUrl}</span>}
                {((profile as any).github || profile.githubUrl) && <span>• {(profile as any).github || profile.githubUrl}</span>}
              </div>
            </header>

            {/* Sections in user-defined order */}
            <div className="space-y-5">
              {sectionOrder.map((sectionKey) => {
                if (!visibleSections[sectionKey]) return null;

                switch (sectionKey) {
                  case 'summary':
                    return ((profile as any).bio || profile.targetRole) ? (
                      <section key="summary" className="space-y-1.5">
                        <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                          Professional Summary
                        </h2>
                        <p className="text-slate-700 leading-relaxed font-normal">
                          {(profile as any).bio ||
                            `Motivated ${profile.targetRole || 'Software Engineer'} with verified proficiencies in ${(verifiedSkills.slice(0, 4).map((s) => s.name)).join(', ')}. Seeking to deliver high-quality, scalable code to production environments.`}
                        </p>
                      </section>
                    ) : null;

                  case 'skills':
                    return verifiedSkills.length > 0 ? (
                      <section key="skills" className="space-y-1.5">
                        <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                          Technical Skills
                        </h2>
                        <div className="text-slate-800 leading-relaxed">
                          <strong>Languages &amp; Technologies: </strong>
                          {verifiedSkills.map((s) => s.name).join(', ')}
                        </div>
                      </section>
                    ) : null;

                  case 'projects':
                    return verifiedProjects.length > 0 ? (
                      <section key="projects" className="space-y-3">
                        <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                          Technical Projects
                        </h2>
                        <div className="space-y-3">
                          {verifiedProjects.map((proj: any) => (
                            <div key={proj.id} className="space-y-1">
                              <div className="flex items-baseline justify-between font-bold text-slate-900">
                                <span>{proj.title}</span>
                                <span className="text-[10px] text-slate-500 font-normal">
                                  {(proj.techStack || proj.tech_stack || []).join(' | ')}
                                </span>
                              </div>
                              <p className="text-slate-700 leading-relaxed pl-3 border-l-2 border-slate-200">
                                • {approvedBulletTweaks[proj.id] || proj.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null;

                  case 'experience':
                    return experiences.length > 0 ? (
                      <section key="experience" className="space-y-3">
                        <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                          Work Experience &amp; Internships
                        </h2>
                        <div className="space-y-2.5">
                          {experiences.map((exp: any) => (
                            <div key={exp.id} className="space-y-1">
                              <div className="flex items-baseline justify-between font-bold text-slate-900">
                                <span>{exp.role} — {exp.company}</span>
                                <span className="text-[10px] text-slate-500 font-normal">
                                  {exp.duration || `${exp.startDate || '2024'} - ${exp.endDate || 'Present'}`}
                                </span>
                              </div>
                              <p className="text-slate-700 leading-relaxed pl-3 border-l-2 border-slate-200">
                                • {exp.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null;

                  case 'education':
                    return (
                      <section key="education" className="space-y-2">
                        <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                          Education
                        </h2>
                        {verifiedEdu.length > 0 ? (
                          verifiedEdu.map((edu: any) => (
                            <div key={edu.id} className="flex items-baseline justify-between">
                              <div>
                                <span className="font-bold text-slate-900">{edu.degree}</span>
                                <span className="text-slate-600">, {edu.institution}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {edu.year || edu.endYear || profile.graduationYear || '2025'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="font-bold text-slate-900">Bachelor of Technology / Engineering</span>
                              <span className="text-slate-600">, {profile.college || 'Engineering University'}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{profile.graduationYear || '2025'}</span>
                          </div>
                        )}
                      </section>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAILOR TO JOB DRAWER / MODAL                               */}
      {/* ────────────────────────────────────────────────────────── */}
      {tailorModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-7 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-blue-700 font-black text-sm uppercase tracking-wider">
                <Sparkles className="h-5 w-5" />
                <span>Tailor Resume to Job Requirements</span>
              </div>
              <button
                onClick={() => setTailorModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Select a target job. The AI will reorder your verified skills and suggest action-oriented bullet point revisions. <strong>Nothing is applied automatically without your explicit approval.</strong>
              </p>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Select Target Job:</label>
                <select
                  value={tailorJobId}
                  onChange={(e) => {
                    setTailorJobId(e.target.value);
                    const j = savedJobs.find((job) => job.id === e.target.value);
                    if (j) setTailorJdText(j.description);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  {savedJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.role_title} at {j.company}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleTailorJob}
                disabled={isTailoring}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {isTailoring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing Job Keywords &amp; Reordering...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Tailored Suggestions</span>
                  </>
                )}
              </button>

              {/* Proposed Tailoring Suggestions for Approval */}
              {tailorProposal && (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-fadeIn">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Review Proposed Bullet Tweaks ({tailorProposal.bulletSuggestions.length})
                  </h4>

                  <div className="space-y-3">
                    {tailorProposal.bulletSuggestions.map((sug: any) => {
                      const isAccepted = approvedBulletTweaks[sug.projectId] === sug.proposedBullet;

                      return (
                        <div
                          key={sug.projectId}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{sug.projectTitle}</span>
                            <button
                              onClick={() => {
                                setApprovedBulletTweaks((prev) => ({
                                  ...prev,
                                  [sug.projectId]: isAccepted ? sug.originalBullet : sug.proposedBullet,
                                }));
                              }}
                              className={cn(
                                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                                isAccepted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-blue-600 text-white hover:bg-blue-600'
                              )}
                            >
                              {isAccepted ? '✓ Accepted' : 'Accept Tweak'}
                            </button>
                          </div>

                          <div className="text-[11px] space-y-1">
                            <div className="text-slate-500 line-through">
                              Original: {sug.originalBullet}
                            </div>
                            <div className="text-blue-800 font-semibold">
                              Proposed: {sug.proposedBullet}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setTailorModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SAVE VERSION MODAL                                         */}
      {/* ────────────────────────────────────────────────────────── */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Save Named Resume Version</h3>
            <p className="text-xs text-slate-600">
              Save this customized layout and ordering as a named version to attach to job applications.
            </p>
            <input
              type="text"
              placeholder="e.g. Backend Engineer - Fintech"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVersion}
                disabled={isSaving || !newVersionName.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Version'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* PLAIN TEXT / WHAT ATS SEES MODAL                           */}
      {/* ────────────────────────────────────────────────────────── */}
      {plainTextPreviewOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-7 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wider">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>What an ATS Parser Extracts</span>
              </div>
              <button
                onClick={() => setPlainTextPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Applicant Tracking Systems (Taleo, Workday, Greenhouse) strip out colors, graphics, and tables. Here is the raw plain-text stream your resume produces:
            </p>

            <pre className="flex-1 overflow-y-auto p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all">
              {plainTextContent || 'Loading plain-text extraction...'}
            </pre>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(plainTextContent);
                  alert('Copied ATS plain text to clipboard!');
                }}
                className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Plain Text</span>
              </button>
              <button
                onClick={() => setPlainTextPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
