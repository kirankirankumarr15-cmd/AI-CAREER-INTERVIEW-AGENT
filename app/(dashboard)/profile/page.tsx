'use client';

import { useState } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import {
  UserCheck,
  GraduationCap,
  Code2,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  Briefcase,
  Award,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { SkillItem } from '@/types';
import { RadialProgressRing } from '@/components/common/RadialProgressRing';

function VerificationBadge({ status }: { status: string }) {
  if (status === 'Verified') {
    return (
      <span className="badge-verified">
        <CheckCircle2 className="h-3 w-3" /> Verified
      </span>
    );
  }
  if (status === 'Needs Review') {
    return (
      <span className="badge-review">
        <AlertCircle className="h-3 w-3" /> Needs Review
      </span>
    );
  }
  return (
    <span className="badge-unverified">
      <HelpCircle className="h-3 w-3" /> Unverified
    </span>
  );
}

function SectionHeader({ icon: Icon, title, action }: { icon: any; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[#1F1F27] pb-4 mb-4">
      <h2 className="text-sm font-extrabold text-[#FAFAFA] flex items-center gap-2.5">
        <Icon className="h-4.5 w-4.5 text-indigo-400" />
        {title}
      </h2>
      {action}
    </div>
  );
}

export default function ProfilePage() {
  const {
    profile,
    updateProfile,
    skills,
    addSkill,
    removeSkill,
    updateSkillVerification,
    projects,
    experiences,
    certifications,
  } = useProfileStore();

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState(profile);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillItem['category']>('Technical');

  const handleSavePersonal = () => {
    updateProfile(personalForm);
    setIsEditingPersonal(false);
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    addSkill({
      name: newSkillName.trim(),
      category: newSkillCategory,
      proficiency: 'Intermediate',
      verificationStatus: 'Needs Review',
    });
    setNewSkillName('');
  };

  const verifiedSkills = skills.filter(s => s.verificationStatus === 'Verified').length;
  const verifiedProjects = projects.filter(p => p.verificationStatus === 'Verified').length;

  return (
    <div className="space-y-6 pb-16 animate-fade-in-up max-w-5xl">
      {/* ── Header ── */}
      <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-600/25">
            {profile.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CP'}
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">
              <UserCheck className="h-3.5 w-3.5" /> Career Profile
            </div>
            <h1 className="text-xl font-extrabold text-[#FAFAFA]">{profile.fullName || 'Student Profile'}</h1>
            <p className="text-xs text-[#71717A] mt-0.5">{profile.college} · {profile.branch}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <RadialProgressRing
            score={profile.readinessScore}
            size={80}
            strokeWidth={7}
            sublabel="Ready"
          />
          <div className="space-y-1 text-xs">
            <div className="flex gap-1.5 items-center">
              <VerificationBadge status={profile.verificationStatus} />
            </div>
            <p className="text-[#71717A] font-medium">{verifiedSkills} verified skills</p>
            <p className="text-[#71717A] font-medium">{verifiedProjects} verified projects</p>
          </div>
        </div>
      </div>

      {/* ── Single Source of Truth notice ── */}
      <div className="px-4 py-3 rounded-xl bg-indigo-500/8 border border-indigo-500/20 text-xs text-indigo-300 font-medium flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
        <span>
          Only <strong className="text-indigo-300">Verified</strong> data is pulled into AI Resumes, Job Matching, and Interview Training. Unverified data is never trusted.
        </span>
      </div>

      {/* ── 1. Academic & Personal ── */}
      <div className="card p-6">
        <SectionHeader
          icon={GraduationCap}
          title="Academic & Personal Details"
          action={
            <button
              onClick={() => {
                if (isEditingPersonal) handleSavePersonal();
                else setIsEditingPersonal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/15 text-xs font-bold transition-colors"
            >
              {isEditingPersonal ? <Save className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
              <span>{isEditingPersonal ? 'Save Changes' : 'Edit Info'}</span>
            </button>
          }
        />

        {isEditingPersonal ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
            {[
              { label: 'Full Name', key: 'fullName', type: 'text' },
              { label: 'College / University', key: 'college', type: 'text' },
              { label: 'Branch / Major', key: 'branch', type: 'text' },
              { label: 'Graduation Year', key: 'graduationYear', type: 'number' },
              { label: 'CGPA / Grade', key: 'cgpa', type: 'number' },
              { label: 'Target Role', key: 'targetRole', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-[#71717A] mb-1 font-bold">{label}</label>
                <input
                  type={type}
                  value={(personalForm as any)[key]}
                  onChange={(e) =>
                    setPersonalForm({ ...personalForm, [key]: type === 'number' ? Number(e.target.value) : e.target.value })
                  }
                  className="w-full bg-[#111113] border border-[#27272F] rounded-xl p-2.5 text-[#FAFAFA] font-semibold focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Full Name', value: profile.fullName },
              { label: 'College', value: profile.college },
              { label: 'Branch & CGPA', value: `${profile.branch} (${profile.cgpa})` },
              { label: 'Graduation Year', value: `${profile.graduationYear}` },
              { label: 'Target Role', value: profile.targetRole },
              { label: 'Location', value: profile.location },
              { label: 'GitHub', value: profile.githubUrl ? '✓ Connected' : 'Not set' },
              { label: 'LinkedIn', value: profile.linkedInUrl ? '✓ Connected' : 'Not set' },
            ].map(({ label, value }) => (
              <div key={label} className="p-3.5 rounded-xl bg-white/3 border border-[#1F1F27]">
                <span className="text-[#71717A] block mb-0.5 font-medium">{label}</span>
                <p className="font-bold text-[#FAFAFA] truncate">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 2. Skills Inventory ── */}
      <div className="card p-6">
        <SectionHeader
          icon={Code2}
          title="Verified Skills Inventory"
          action={
            <span className="text-xs text-[#71717A] font-mono font-semibold tabular-nums">
              {skills.length} Skills · {verifiedSkills} Verified
            </span>
          }
        />

        {/* Add Skill Row */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Add new skill (e.g. Docker, GraphQL, Redis)..."
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
            className="flex-1 px-3.5 py-2.5 text-xs font-medium"
          />
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value as any)}
            className="px-3.5 py-2.5 text-xs font-semibold text-[#FAFAFA]"
          >
            <option value="Technical">Technical</option>
            <option value="Framework">Framework</option>
            <option value="Tool">Tool</option>
            <option value="Soft">Soft Skill</option>
          </select>
          <button
            onClick={handleAddSkill}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {/* Skill Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between group transition-all ${
                skill.verificationStatus === 'Verified'
                  ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/35'
                  : skill.verificationStatus === 'Needs Review'
                  ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/35'
                  : 'bg-white/3 border-[#27272F] hover:border-[#3A3A45]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#FAFAFA]">{skill.name}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/8 text-[#71717A] uppercase">
                    {skill.category}
                  </span>
                </div>
                <div className="mt-1.5">
                  <VerificationBadge status={skill.verificationStatus} />
                </div>
              </div>

              <div className="flex items-center gap-1">
                {skill.verificationStatus !== 'Verified' && (
                  <button
                    onClick={() => updateSkillVerification(skill.id, 'Verified')}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 hover:underline"
                  >
                    Verify
                  </button>
                )}
                <button
                  onClick={() => removeSkill(skill.id)}
                  className="p-1 text-[#52525B] hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Verified Projects ── */}
      <div className="card p-6">
        <SectionHeader icon={FolderGit2} title="Verified Projects" />

        <div className="space-y-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className={`p-4 rounded-xl border space-y-3 transition-all ${
                proj.verificationStatus === 'Verified'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-white/3 border-[#27272F]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-sm text-[#FAFAFA] truncate">{proj.title}</h3>
                    <VerificationBadge status={proj.verificationStatus} />
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed font-medium">{proj.description}</p>
                </div>
                {proj.githubUrl && (
                  <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-[#71717A] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {proj.techStack.map((tech, tIdx) => (
                  <span key={tIdx} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Experience ── */}
      {experiences.length > 0 && (
        <div className="card p-6">
          <SectionHeader icon={Briefcase} title="Work Experience" />
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="p-4 rounded-xl bg-white/3 border border-[#27272F] space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#FAFAFA]">{exp.role}</h3>
                    <p className="text-xs text-[#A1A1AA] font-medium">{exp.company} · {exp.location}</p>
                    <p className="text-[10px] text-[#71717A] font-medium mt-0.5">
                      {exp.startDate?.slice(0, 7)} → {exp.isCurrent ? 'Present' : exp.endDate?.slice(0, 7)}
                    </p>
                  </div>
                  <VerificationBadge status={exp.verificationStatus} />
                </div>
                <ul className="space-y-1">
                  {exp.achievements?.map((ach, i) => (
                    <li key={i} className="text-xs text-[#A1A1AA] font-medium flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                      {ach}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Certifications ── */}
      {certifications.length > 0 && (
        <div className="card p-6">
          <SectionHeader icon={Award} title="Certifications" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certifications.map((cert) => (
              <div key={cert.id} className="p-4 rounded-xl bg-white/3 border border-[#27272F] flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xs text-[#FAFAFA]">{cert.name}</h3>
                  <p className="text-[10px] text-[#71717A] mt-0.5 font-medium">{cert.issuer} · {cert.issueDate?.slice(0, 7)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <VerificationBadge status={cert.verificationStatus} />
                  {cert.credentialUrl && (
                    <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer"
                      className="p-1 rounded-lg text-[#71717A] hover:text-indigo-400 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── WhatsApp Connection Card ── */}
      <div className="card p-6">
        <SectionHeader icon={MessageCircle} title="WhatsApp Notifications" />
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25">
              <MessageCircle className="h-5 w-5 fill-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#FAFAFA]">WhatsApp Business Notifications</p>
              <p className="text-xs text-[#71717A] font-medium">Receive job alerts, interview reports & resume updates via WhatsApp</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md shadow-emerald-600/20">
            Connect WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
