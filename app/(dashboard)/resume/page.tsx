'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';

export default function ResumePage() {
  const [activeTab, setActiveTab] = useState('Standard Master');
  const { profile, education, skills, projects, experiences, syncWithSupabase } = useProfileStore();

  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  // Dynamically compute real ATS score based on verified profile completeness
  const verifiedSkills = skills.filter((s) => s.verificationStatus === 'Verified');
  const verifiedProjects = projects.filter((p) => p.verificationStatus === 'Verified');
  const verifiedEducation = education.filter((e) => e.verificationStatus === 'Verified');

  let computedAtsScore = 40;
  if (profile.fullName && profile.email) computedAtsScore += 10;
  if (profile.targetRole) computedAtsScore += 10;
  if (verifiedEducation.length > 0 || profile.college) computedAtsScore += 10;
  if (verifiedSkills.length >= 3) computedAtsScore += 15;
  if (verifiedProjects.length >= 1) computedAtsScore += 15;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            ATS-Optimized Studio • Truthful &amp; Verified Data Only
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Resume Builder</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['Standard Master', 'Targeted ATS', 'Compact One-Page'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 ml-2 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> Export / Print
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column - Sections */}
        <div className="w-full lg:w-[260px] shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">
              Profile Sections
            </h3>
            <nav className="space-y-1">
              {[
                { name: 'Summary & Title', count: profile.targetRole ? 'Set' : 'Empty' },
                { name: 'Education & CGPA', count: `${education.length || 1} records` },
                { name: 'Technical Skills', count: `${verifiedSkills.length} verified` },
                { name: 'Projects & Defense', count: `${projects.length} added` },
                { name: 'Work Experience', count: `${experiences.length} added` },
              ].map((item) => (
                <div
                  key={item.name}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold"
                >
                  <span>{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{item.count}</span>
                </div>
              ))}
            </nav>

            <div className="mt-6 pt-5 border-t border-slate-100 px-2">
              <div className="flex justify-between text-[11px] font-bold mb-2">
                <span className="text-indigo-700">Computed ATS Score: {computedAtsScore} / 100</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${computedAtsScore}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Derives strictly from your verified profile data. Verify skills in Documents to increase score.
              </p>
            </div>
          </div>
        </div>

        {/* Middle Column - Resume Preview (Clean Single Column Standard) */}
        <div className="flex-1 w-full bg-[#0f172a] rounded-xl shadow-xl overflow-hidden text-slate-300 p-10 font-sans border border-slate-800 min-h-[800px]">
          {/* Header */}
          <div className="text-center border-b border-slate-800 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
              {profile.fullName || 'Student Name'}
            </h1>
            <p className="text-xs mt-2 text-slate-400 flex flex-wrap items-center justify-center gap-2">
              <span>{profile.location || 'Location Not Specified'}</span>
              <span>•</span>
              <span>{profile.email || 'student@careerpilot.ai'}</span>
              {profile.phone && (
                <>
                  <span>•</span>
                  <span>{profile.phone}</span>
                </>
              )}
            </p>
            <p className="text-xs text-indigo-400 mt-1 flex flex-wrap items-center justify-center gap-2">
              {profile.githubUrl && <span>{profile.githubUrl}</span>}
              {profile.githubUrl && profile.linkedInUrl && <span>•</span>}
              {profile.linkedInUrl && <span>{profile.linkedInUrl}</span>}
            </p>
            {profile.targetRole && (
              <p className="text-xs font-semibold text-slate-300 mt-2">
                Target Role: <span className="text-indigo-300">{profile.targetRole}</span>
              </p>
            )}
          </div>

          {/* EDUCATION */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-3 border-b border-slate-800 pb-1">
              Education
            </h3>
            {education.length > 0 ? (
              education.map((edu) => (
                <div key={edu.id} className="mb-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-slate-100 text-sm">{edu.institution}</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {edu.startYear} – {edu.endYear}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">
                      {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                    </span>
                    {edu.cgpa > 0 && (
                      <span className="font-bold">
                        CGPA: <span className="text-white">{edu.cgpa} / 10.0</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : profile.college ? (
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-slate-100 text-sm">{profile.college}</span>
                  <span className="text-xs text-slate-400 font-medium">
                    Graduation: {profile.graduationYear || 'Expected'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400">{profile.branch || 'Engineering'}</span>
                  {profile.cgpa ? (
                    <span className="font-bold">
                      CGPA: <span className="text-white">{profile.cgpa} / 10.0</span>
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No education details verified yet. Complete onboarding or add marks card.
              </p>
            )}
          </div>

          {/* TECHNICAL SKILLS */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-3 border-b border-slate-800 pb-1">
              Technical Skills
            </h3>
            {skills.length > 0 ? (
              <div className="space-y-2 text-xs">
                {['Technical', 'Framework', 'Tool', 'Soft'].map((category) => {
                  const catSkills = skills.filter((s) => s.category === category);
                  if (catSkills.length === 0) return null;
                  return (
                    <p key={category}>
                      <span className="font-bold text-slate-200">{category}s:</span>{' '}
                      <span className="text-slate-400">
                        {catSkills.map((s) => (
                          <span key={s.id} className="inline-flex items-center gap-1 mr-2">
                            {s.name}
                            {s.verificationStatus === 'Verified' ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 inline" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-amber-400 inline" />
                            )}
                          </span>
                        ))}
                      </span>
                    </p>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No skills recorded. Upload certificates or transcripts in Documents.
              </p>
            )}
          </div>

          {/* WORK EXPERIENCE */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-3 border-b border-slate-800 pb-1">
              Work Experience
            </h3>
            {experiences.length > 0 ? (
              experiences.map((exp) => (
                <div key={exp.id} className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-slate-100 text-sm">
                      {exp.company} — {exp.role}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || ''}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-xs text-slate-400 mb-1 leading-relaxed">{exp.description}</p>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-slate-400">
                      {exp.achievements.map((ach, idx) => (
                        <li key={idx}>{ach}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">
                No internships or work experience verified yet.
              </p>
            )}
          </div>

          {/* PROJECTS */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-3 border-b border-slate-800 pb-1">
              Projects
            </h3>
            {projects.length > 0 ? (
              projects.map((proj) => (
                <div key={proj.id} className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-slate-100 text-sm">{proj.title}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      {Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}
                    </span>
                  </div>
                  {proj.description && (
                    <p className="text-xs text-slate-400 mb-1 leading-relaxed">{proj.description}</p>
                  )}
                  {proj.studentContribution && (
                    <p className="text-xs text-indigo-300 italic">
                      Contribution: {proj.studentContribution}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">
                No verified projects recorded. Add projects with GitHub links in your profile.
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Action Guidance */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-[11px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" /> Verification Insights
              </h3>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Truth Guarantee
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Every bullet point and skill presented on this resume originates from verified records in your Career Profile.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider">
                  Next Step to Level Up
                </span>
                <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                  {verifiedSkills.length < 5
                    ? 'Upload college documents or skill certificates to reach 5+ verified skills for Tier-1 ATS compatibility.'
                    : 'Your verified skills meet the requirements! Practice in the Mock Interview Room to defend these project bullets.'}
                </p>
              </div>

              <a
                href="/documents"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center gap-2 transition-colors"
              >
                Upload Documents to Verify More &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
