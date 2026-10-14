'use client';

import { 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail,
  Globe,
  Upload,
  ExternalLink,
  Code2,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useProfileStore } from '@/store/useProfileStore';

function VerifiedBadge() {
  return (
    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
      <CheckCircle2 className="h-3 w-3" /> Verified
    </span>
  );
}

function SkillPill({ name, verified }: { name: string; verified?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold shadow-sm">
      {name} {verified && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
    </div>
  );
}

export default function ProfilePage() {
  const { profile, skills, education, projects, experiences, certifications } = useProfileStore();

  const initials = (profile.fullName || 'Career Pilot')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const technicalSkills = skills.filter((s) => s.category === 'Technical');
  const frameworkSkills = skills.filter((s) => s.category === 'Framework');
  const toolSkills = skills.filter((s) => s.category === 'Tool');
  const softSkills = skills.filter((s) => s.category === 'Soft');

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 pb-16 animate-fade-in-up font-sans">
      {/* Top Dark Header Card */}
      <div className="bg-[#111113] rounded-3xl p-8 pb-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10 mb-6">
          <div className="flex gap-6 items-start">
            <div className="h-20 w-20 rounded-2xl bg-blue-600/30 border-2 border-blue-500/50 flex items-center justify-center text-2xl font-black text-blue-300 shrink-0 shadow-inner">
              {initials}
            </div>
            <div className="space-y-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight flex flex-wrap items-center gap-3">
                  {profile.fullName || 'Student Career Profile'}
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 tracking-widest uppercase border border-blue-500/30">
                    Target: {profile.targetRole || 'Software Engineer'}
                  </span>
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                {profile.email && (
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {profile.email}</span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>
                )}
              </div>

              <div className="flex gap-4 pt-1">
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
                    <Code2 className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {profile.linkedInUrl && (
                  <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
                    <Briefcase className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {profile.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
                    <Globe className="h-3.5 w-3.5" /> Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            <div className="bg-white text-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-lg w-full md:w-64">
              <div className="h-12 w-12 rounded-full border-4 border-blue-500 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-slate-900">{profile.readinessScore || 78}%</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-0.5">OVERALL READINESS</p>
                <p className="text-[10px] font-bold text-slate-500">Verified Credentials: {skills.length + projects.length}</p>
              </div>
            </div>
            <Link
              href="/documents"
              className="w-full md:w-64 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center justify-center gap-2 border border-white/20 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" /> Manage & Verify Documents
            </Link>
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" /> Education & Academics
          </h2>
          <span className="text-xs font-bold text-slate-400">{education.length} Records</span>
        </div>
        
        {education.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No verified education records uploaded yet. Upload your transcripts in Documents.</p>
        ) : (
          <div className="space-y-6">
            {education.map((edu) => (
              <div key={edu.id} className="flex items-start justify-between border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-1">{edu.institution}</h3>
                  <p className="text-[13px] font-semibold text-slate-600 mb-2">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                    <span>{edu.startYear} - {edu.endYear || 'Present'}</span>
                    {edu.cgpa > 0 && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">CGPA: {edu.cgpa}</span>}
                  </div>
                </div>
                {edu.verificationStatus === 'Verified' && <VerifiedBadge />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills & Technologies */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" /> Skills & Competencies
          </h2>
          <span className="text-xs font-bold text-slate-400">{skills.length} Skills</span>
        </div>

        {skills.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No skills extracted yet. Upload your resume or certifications to verify skills.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technicalSkills.length > 0 && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">TECHNICAL & LANGUAGES</h3>
                <div className="flex flex-wrap gap-2">
                  {technicalSkills.map((s) => (
                    <SkillPill key={s.id} name={s.name} verified={s.verificationStatus === 'Verified'} />
                  ))}
                </div>
              </div>
            )}
            {frameworkSkills.length > 0 && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">FRAMEWORKS & LIBRARIES</h3>
                <div className="flex flex-wrap gap-2">
                  {frameworkSkills.map((s) => (
                    <SkillPill key={s.id} name={s.name} verified={s.verificationStatus === 'Verified'} />
                  ))}
                </div>
              </div>
            )}
            {toolSkills.length > 0 && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">TOOLS & PLATFORMS</h3>
                <div className="flex flex-wrap gap-2">
                  {toolSkills.map((s) => (
                    <SkillPill key={s.id} name={s.name} verified={s.verificationStatus === 'Verified'} />
                  ))}
                </div>
              </div>
            )}
            {softSkills.length > 0 && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">SOFT & PROFESSIONAL SKILLS</h3>
                <div className="flex flex-wrap gap-2">
                  {softSkills.map((s) => (
                    <SkillPill key={s.id} name={s.name} verified={s.verificationStatus === 'Verified'} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-600" /> Verified Projects
          </h2>
          <span className="text-xs font-bold text-slate-400">{projects.length} Projects</span>
        </div>
        
        {projects.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No verified projects yet. Upload project certificates or repository reports in Documents.</p>
        ) : (
          <div className="space-y-6">
            {projects.map((proj) => (
              <div key={proj.id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-[14px] font-black text-slate-900">
                      {proj.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {proj.verificationStatus === 'Verified' && <VerifiedBadge />}
                  </div>
                </div>
                {proj.description && (
                  <p className="text-[12px] font-medium text-slate-600 mb-3 leading-relaxed">
                    {proj.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {proj.techStack?.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {proj.liveUrl && (
                      <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
                        <ExternalLink className="h-3 w-3" /> Live Demo
                      </a>
                    )}
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
                        <Code2 className="h-3 w-3" /> Code
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Experience & Certifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Experience */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" /> Work Experience
            </h2>
            <span className="text-xs font-bold text-slate-400">{experiences.length} Positions</span>
          </div>

          {experiences.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No work experience or internships recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-[13px] font-black text-slate-900">{exp.role}</h3>
                    {exp.verificationStatus === 'Verified' && <VerifiedBadge />}
                  </div>
                  <p className="text-[12px] font-semibold text-slate-600">{exp.company} {exp.location ? `• ${exp.location}` : ''}</p>
                  <p className="text-[10px] font-bold text-slate-400 mb-2">
                    {exp.startDate ? `${exp.startDate} - ${exp.endDate || 'Present'}` : 'Recent'}
                  </p>
                  {exp.description && (
                    <p className="text-[12px] text-slate-600 mb-2 leading-relaxed">{exp.description}</p>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      {exp.achievements.map((a: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" /> Certifications & Honors
            </h2>
            <span className="text-xs font-bold text-slate-400">{certifications.length} Credentials</span>
          </div>

          {certifications.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No certifications uploaded yet. Upload certificates in Documents.</p>
          ) : (
            <div className="space-y-4">
              {certifications.map((cert) => (
                <div key={cert.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-[13px] font-black text-slate-900">{cert.name}</h3>
                    {cert.verificationStatus === 'Verified' && <VerifiedBadge />}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">{cert.issuer} {cert.issueDate ? `(${cert.issueDate})` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
