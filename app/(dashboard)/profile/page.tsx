'use client';

import { useState } from 'react';
import { 
  CheckCircle2, MapPin, Phone, Mail, Globe, Upload,
  ExternalLink, Code2, Briefcase, GraduationCap, Award,
  Sparkles, Edit3, X, Building2, Check, Target, ChevronRight
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

const BRANCHES = [
  'Computer Science & Engineering',
  'Information Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

export default function ProfilePage() {
  const { profile, skills, education, projects, experiences, certifications, updateProfile, addSkill } = useProfileStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(profile.fullName || '');
  const [editBranch, setEditBranch] = useState(profile.branch || 'Computer Science & Engineering');
  const [editYear, setEditYear] = useState(profile.year || 4);
  const [editCgpa, setEditCgpa] = useState(profile.cgpa ? String(profile.cgpa) : '8.5');
  const [editTargetRole, setEditTargetRole] = useState(profile.targetRole || 'Software Developer');
  const [editPhone, setEditPhone] = useState(profile.phone || '');
  const [editLocation, setEditLocation] = useState(profile.location || 'Shivamogga, India');
  const [newSkillName, setNewSkillName] = useState('');

  const initials = (profile.fullName || 'Student User')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const technicalSkills = skills.filter((s) => s.category === 'Technical');
  const frameworkSkills = skills.filter((s) => s.category === 'Framework');
  const toolSkills = skills.filter((s) => s.category === 'Tool');
  const softSkills = skills.filter((s) => s.category === 'Soft');

  const completionScore = profile.profileCompletionPercentage || 75;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      fullName: editName,
      branch: editBranch,
      year: Number(editYear),
      cgpa: parseFloat(editCgpa) || 8.0,
      targetRole: editTargetRole,
      phone: editPhone,
      location: editLocation,
    });
    setIsEditModalOpen(false);
  };

  const handleAddQuickSkill = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkillName.trim()) {
      e.preventDefault();
      await addSkill({
        name: newSkillName.trim(),
        category: 'Technical',
        proficiency: 'Intermediate',
        verificationStatus: 'Verified',
      });
      setNewSkillName('');
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 pb-16 animate-fade-in-up font-sans">
      
      {/* Top Header Card */}
      <div className="bg-[#111113] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10 mb-6">
          <div className="flex gap-6 items-start">
            <div className="h-20 w-20 rounded-2xl bg-blue-600/30 border-2 border-blue-500/50 flex items-center justify-center text-2xl font-black text-blue-300 shrink-0 shadow-inner">
              {initials}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  {profile.fullName || 'Student Career Profile'}
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 tracking-widest uppercase border border-blue-500/30">
                  Target: {profile.targetRole || 'Software Developer'}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {profile.role === 'admin' ? 'Placement Admin (TPO)' : 'Engineering Student'}
                </span>
              </div>

              <div className="text-xs text-slate-300 font-medium">
                <span>{profile.branch || 'Computer Science & Engineering'}</span> • <span>Year {profile.year || 4}</span> • <span className="text-emerald-400 font-bold">{profile.cgpa || 8.5} CGPA</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                {profile.email && (
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {profile.email}</span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>
                )}
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {profile.location || 'PESITM Shivamogga'}</span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                </button>
                <Link
                  href="/documents"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Credentials
                </Link>
              </div>
            </div>
          </div>

          {/* Readiness & Completion Widgets */}
          <div className="flex flex-col gap-3 shrink-0">
            {/* Profile Completion Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full md:w-64 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Profile Completion</span>
                <span className="text-emerald-400 tabular-nums">{completionScore}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionScore}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {completionScore >= 80 ? 'Placement Drive Ready' : 'Add skills & CGPA to reach 100%'}
              </p>
            </div>

            {/* Overall Placement Readiness */}
            <div className="bg-white text-slate-900 rounded-2xl p-4 flex items-center gap-3 shadow-lg w-full md:w-64">
              <div className="h-10 w-10 rounded-full border-4 border-blue-500 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-slate-900">{profile.readinessScore || 78}%</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Placement Readiness</p>
                <p className="text-[10px] font-bold text-slate-500">{skills.length} Skills • {projects.length} Projects</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academics & Branch Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" /> Academic & Placement Standing
          </h2>
          <span className="text-xs font-bold text-slate-400">PESITM Shivamogga</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Branch</span>
            <p className="text-sm font-black text-slate-900 mt-1">{profile.branch || 'Computer Science & Engineering'}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Year of Study</span>
            <p className="text-sm font-black text-slate-900 mt-1">Year {profile.year || 4} (Final Year)</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current CGPA</span>
            <p className="text-sm font-black text-emerald-600 mt-1">{profile.cgpa || 8.5} / 10.0</p>
          </div>
        </div>
      </div>

      {/* Skills & Competencies */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" /> Verified Skills &amp; Competencies
          </h2>
          <span className="text-xs font-bold text-slate-400">{skills.length} Verified Skills</span>
        </div>

        {/* Quick Add Skill Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={handleAddQuickSkill}
            placeholder="Type skill & press Enter (e.g. Docker, Python, System Design)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {skills.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No skills added yet. Type a skill above or complete onboarding.</p>
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
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">SOFT & INTERPERSONAL</h3>
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

      {/* Target Companies & Roles */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Target className="h-5 w-5 text-blue-600" /> Target Roles & Dream Companies
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Aspirations</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {(profile.targetRoles && profile.targetRoles.length > 0 ? profile.targetRoles : [profile.targetRole || 'Software Developer']).map((r) => (
                <span key={r} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Companies</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {(profile.targetCompanies && profile.targetCompanies.length > 0 ? profile.targetCompanies : ['Google', 'Microsoft', 'Infosys']).map((c) => (
                <span key={c} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-600" /> Edit Placement Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Engineering Branch</label>
                  <select
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Year of Study</label>
                  <select
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">CGPA (out of 10.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editCgpa}
                    onChange={(e) => setEditCgpa(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Primary Target Role</label>
                  <input
                    type="text"
                    value={editTargetRole}
                    onChange={(e) => setEditTargetRole(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Campus / Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
