'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/useProfileStore';
import {
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft,
  GraduationCap, Briefcase, Building2, Check, Award,
} from 'lucide-react';

const BRANCH_OPTIONS = [
  'Computer Science & Engineering',
  'Information Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

const ROLE_OPTIONS = [
  'Software Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'AI/ML Engineer',
  'Data Analyst',
  'Cloud & DevOps Engineer',
  'Cybersecurity Analyst',
];

const COMPANY_OPTIONS = [
  'Google',
  'Microsoft',
  'Amazon',
  'Infosys',
  'TCS',
  'Wipro',
  'Cognizant',
  'Accenture',
  'Capgemini',
  'Oracle',
];

const COMMON_SKILLS = [
  'Python', 'Java', 'C++', 'JavaScript', 'TypeScript',
  'React', 'Next.js', 'Node.js', 'SQL', 'PostgreSQL',
  'Git & GitHub', 'Docker', 'AWS', 'Data Structures', 'System Design'
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile, addSkill } = useProfileStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [branch, setBranch] = useState(profile.branch || 'Computer Science & Engineering');
  const [year, setYear] = useState(profile.year || 4);
  const [cgpa, setCgpa] = useState(profile.cgpa ? String(profile.cgpa) : '8.5');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    profile.targetRoles && profile.targetRoles.length > 0
      ? profile.targetRoles
      : ['Software Developer']
  );
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(
    profile.targetCompanies && profile.targetCompanies.length > 0
      ? profile.targetCompanies
      : ['Google', 'Microsoft', 'Infosys']
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Python', 'Data Structures', 'React', 'SQL', 'Git & GitHub'
  ]);
  const [customSkillInput, setCustomSkillInput] = useState('');

  const toggleRole = (r: string) => {
    setSelectedRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const toggleCompany = (c: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const toggleSkill = (s: string) => {
    setSelectedSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customSkillInput.trim()) {
      e.preventDefault();
      if (!selectedSkills.includes(customSkillInput.trim())) {
        setSelectedSkills((prev) => [...prev, customSkillInput.trim()]);
      }
      setCustomSkillInput('');
    }
  };

  // Dynamic Profile Completion
  const calculateLiveCompletion = () => {
    let score = 20; // Base user creation
    if (branch) score += 20;
    if (parseFloat(cgpa) > 0) score += 10;
    if (selectedRoles.length > 0) score += 20;
    if (selectedSkills.length >= 3) score += 20;
    if (selectedCompanies.length > 0) score += 10;
    return Math.min(100, score);
  };

  const handleComplete = async () => {
    const parsedCgpa = parseFloat(cgpa) || 8.0;
    const finalCompletion = calculateLiveCompletion();

    await updateProfile({
      branch,
      year: Number(year),
      cgpa: parsedCgpa,
      targetRole: selectedRoles[0] || 'Software Developer',
      targetRoles: selectedRoles,
      targetCompanies: selectedCompanies,
      profileCompletionPercentage: finalCompletion,
    });

    // Save skills to store
    for (const skillName of selectedSkills) {
      await addSkill({
        name: skillName,
        category: 'Technical',
        proficiency: 'Intermediate',
        verificationStatus: 'Verified',
      });
    }

    // Direct to PRISM command center
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 lg:p-8 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-3xl bg-slate-900/95 border border-slate-800/80 rounded-3xl shadow-2xl p-6 lg:p-10 space-y-8 relative z-10">
        
        {/* Progress Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold text-sm">
              {step}/4
            </div>
            <div>
              <span className="text-sm font-bold text-slate-200">PRISM Placement Onboarding</span>
              <p className="text-xs text-slate-400">Step {step} of 4: Setup your Placement Profile</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 tabular-nums">
              {calculateLiveCompletion()}% Completed
            </span>
            <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${calculateLiveCompletion()}%` }}
              />
            </div>
          </div>
        </div>

        {/* STEP 1: Academics & College */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-blue-400" /> Academic Credentials
              </h1>
              <p className="text-xs text-slate-400">
                Placement drives filter eligibility by branch, graduating year, and CGPA.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Engineering Branch
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Current Year of Study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value={1}>1st Year (Fresher)</option>
                    <option value={2}>2nd Year (Sophomore)</option>
                    <option value={3}>3rd Year (Pre-Final Year)</option>
                    <option value={4}>4th Year (Final Year / Placement Ready)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Current Cumulative CGPA (Scale of 10)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    placeholder="e.g. 8.75"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                <span>Target Career Roles</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Target Roles & Companies */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-cyan-400" /> Target Roles & Aspirations
              </h2>
              <p className="text-xs text-slate-400">
                PRISM customizes interview simulations and Career Audit benchmarks based on your roles.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Target Roles (Choose one or more)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ROLE_OPTIONS.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs">{role}</span>
                        {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Dream & Core Companies
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_OPTIONS.map((company) => {
                    const isSelected = selectedCompanies.includes(company);
                    return (
                      <button
                        key={company}
                        type="button"
                        onClick={() => toggleCompany(company)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {company}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={selectedRoles.length === 0}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                <span>Skills & Competencies</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Skills & Competencies */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-amber-400" /> Core Skills & Languages
              </h2>
              <p className="text-xs text-slate-400">
                Tag your primary technical proficiencies for ATS scoring and mock interview follow-ups.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Your Strongest Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-md shadow-blue-600/25'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Add Custom Skill (Press Enter)
                </label>
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={handleAddCustomSkill}
                  placeholder="e.g. Flutter, GraphQL, Kubernetes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={selectedSkills.length === 0}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                <span>Review & Finish</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Profile Completion */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Award className="h-6 w-6 text-emerald-400" /> Review Your Placement Profile
              </h2>
              <p className="text-xs text-slate-400">
                You can update or expand all verified records at any time from your Profile Command Center.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Branch &amp; Academics</span>
                  <p className="text-sm font-bold text-white">{branch}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium">CGPA / Year</span>
                  <p className="text-sm font-bold text-emerald-400">{cgpa} CGPA (Year {year})</p>
                </div>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-400 font-medium">Target Roles ({selectedRoles.length})</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedRoles.map((r) => (
                    <span key={r} className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium">Tagged Skills ({selectedSkills.length})</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedSkills.map((s) => (
                    <span key={s} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="py-3.5 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Enter PRISM Command Center</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
