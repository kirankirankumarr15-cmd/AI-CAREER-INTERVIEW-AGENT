'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/useProfileStore';
import {
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, Briefcase,
  GraduationCap, Upload, Check, ChevronRight, Target, ShieldCheck,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { updateProfile } = useProfileStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Selections
  const [goal, setGoal] = useState<string>('Placement');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Software Developer']);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  const goalOptions = [
    { id: 'Internship', label: 'Internship', desc: 'Looking for 3-6 month industry internships' },
    { id: 'Placement', label: 'Placement', desc: 'Campus placements & hiring drives' },
    { id: 'Full-time Job', label: 'Full-time Job', desc: 'Direct entry-level or junior role' },
    { id: 'Higher Studies', label: 'Higher Studies', desc: 'MS / M.Tech / MBA preparation' },
    { id: 'Career Switch', label: 'Career Switch', desc: 'Transitioning from non-tech or another domain' },
  ];

  const roleOptions = [
    'Software Developer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'AI/ML Engineer',
    'UI/UX Designer',
    'Cloud Engineer',
  ];

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleFinish = () => {
    updateProfile({
      targetRole: selectedRoles[0] || 'Software Developer',
    });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 lg:p-8 select-none font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-3xl bg-slate-900/95 border border-slate-800/80 rounded-3xl shadow-2xl p-6 lg:p-10 space-y-8 relative z-10">

        {/* Step Progress Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
              {step}/4
            </div>
            <div>
              <span className="text-xs font-bold text-slate-300">New User Onboarding</span>
              <p className="text-[11px] text-slate-500">Step {step} of 4</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-8 bg-indigo-500' : i < step ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-2 text-center max-w-lg mx-auto">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 items-center justify-center text-indigo-400 mb-2">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-white">Welcome to CareerPilot</h1>
              <p className="text-xs lg:text-sm text-slate-400">
                Let&apos;s build your verified career profile and tailor your AI practice roadmap.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>What we will personalize for you:</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Custom AI mock interview questions for your targeted roles</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>ATS Resume scoring against top corporate standards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Verified placement recommendations &amp; skill tracking</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Preparation Goal */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-1">
              <h2 className="text-xl lg:text-2xl font-black text-white">What are you preparing for?</h2>
              <p className="text-xs text-slate-400">Select your primary immediate objective.</p>
            </div>

            <div className="space-y-2.5">
              {goalOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setGoal(opt.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    goal === opt.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </div>
                  {goal === opt.id && <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <button
                onClick={() => setStep(3)}
                className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Role Selection */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-1">
              <h2 className="text-xl lg:text-2xl font-black text-white">Which roles interest you?</h2>
              <p className="text-xs text-slate-400">Select one or more target career profiles.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roleOptions.map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-600/15 border-cyan-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs">{role}</span>
                    {isSelected && <Check className="h-4 w-4 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <button
                onClick={() => setStep(4)}
                disabled={selectedRoles.length === 0}
                className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Profile Upload Prompt */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-1">
              <h2 className="text-xl lg:text-2xl font-black text-white">Complete your profile</h2>
              <p className="text-xs text-slate-400">
                Encourage higher visibility by attaching key documents. You can also skip and upload later in your dashboard.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-dashed border-indigo-500/40 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Upload className="h-6 w-6" />
              </div>

              <div>
                <div className="font-bold text-xs text-white">Upload Resume &amp; Documents</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PDF or DOCX format (Resume, Certificates, Project Reports)
                </p>
              </div>

              <input
                type="file"
                id="onboarding-file"
                className="hidden"
                onChange={() => setResumeUploaded(true)}
              />

              <button
                type="button"
                onClick={() => document.getElementById('onboarding-file')?.click()}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-2"
              >
                {resumeUploaded ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>File Selected</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Choose File</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                onClick={() => setStep(3)}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <button
                onClick={handleFinish}
                className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <span>Complete Profile &amp; Go to Dashboard</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
