'use client';

import { useState, useEffect } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { analyzeProfileRole, RoleRequirements } from '@/lib/ai/agents/profile-agent';
import { Compass, CheckCircle2, Code2, BookOpen, Layers, Loader2, Sparkles } from 'lucide-react';

const roleList = [
  'Full Stack Developer',
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Analyst',
  'Data Scientist',
  'AI/ML Engineer',
  'Cybersecurity Specialist',
  'Cloud/DevOps Engineer',
  'UI/UX Engineer',
  'Mobile Developer',
];

export default function CareerPage() {
  const { profile, skills, updateProfile } = useProfileStore();
  const [selectedRole, setSelectedRole] = useState(profile.targetRole || 'Full Stack Developer');
  const [roleData, setRoleData] = useState<RoleRequirements | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRoleInfo() {
      setLoading(true);
      try {
        const data = await analyzeProfileRole(profile, skills, selectedRole);
        setRoleData(data);
      } catch (err) {
        console.error('Error loading role info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRoleInfo();
  }, [selectedRole]);

  const handleSelectTargetRole = (role: string) => {
    setSelectedRole(role);
    updateProfile({ targetRole: role });
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Header Banner */}
      <div className="white-card p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Compass className="h-4 w-4" /> Career Intelligence Engine
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Career Role Selector & Analysis</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Explore industry expectations, required skills, interview rounds, and projects for your target role.
          </p>
        </div>
      </div>

      {/* Role Picker horizontal scroll / pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {roleList.map((r) => (
          <button
            key={r}
            onClick={() => handleSelectTargetRole(r)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedRole === r
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading || !roleData ? (
        <div className="white-card p-16 text-center text-slate-500 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-medium">Analyzing career requirements for <span className="text-slate-900 font-bold">{selectedRole}</span> via Gemini AI...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          {/* Grid 1: Required Skills & Important CS Subjects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="white-card p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Code2 className="h-4 w-4 text-indigo-600" /> Core Required Skills
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {roleData.requiredSkills.map((sk, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="white-card p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-sky-600" /> Important CS Subjects
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {roleData.importantSubjects.map((sub, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold">
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Typical Interview Rounds */}
          <div className="white-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-600" /> Typical Interview Process Rounds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roleData.typicalRounds.map((rnd, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs">
                  <span className="h-7 w-7 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 border border-amber-200">
                    R{i + 1}
                  </span>
                  <span className="text-slate-800 font-semibold">{rnd}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Projects */}
          <div className="white-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" /> Recommended High-Impact Projects
            </h3>
            <div className="space-y-2">
              {roleData.recommendedProjects.map((proj, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{proj}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

