'use client';

import { useState } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { Briefcase, CheckCircle2, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

interface JobOpportunity {
  id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  requiredSkills: string[];
  description: string;
  responsibilities: string[];
}

const jobListings: JobOpportunity[] = [
  {
    id: 'stripe',
    company: 'Stripe',
    role: 'Backend Software Engineer (Early Career)',
    location: 'Bengaluru, India (Hybrid)',
    salary: '₹18,00,000 - ₹24,00,000',
    requiredSkills: ['SQL', 'PostgreSQL', 'REST APIs', 'Java', 'TypeScript', 'Redis', 'Docker'],
    description: 'We are looking for an ambitious Backend Engineer to join our Payment Processing & Settlement team. You will build high-reliability services that process billions of dollars with zero downtime.',
    responsibilities: [
      'Design, build, and maintain fault-tolerant backend microservices and public APIs.',
      'Improve PostgreSQL query execution paths and database transaction boundaries.',
      'Write comprehensive unit, integration, and load tests to safeguard high financial throughput.',
      'Participate in on-call rotations, code reviews, and architecture discussions.',
    ],
  },
  {
    id: 'razorpay',
    company: 'Razorpay',
    role: 'Software Development Engineer - I',
    location: 'Bengaluru, India',
    salary: '₹15,00,000 - ₹20,00,000',
    requiredSkills: ['Node.js', 'TypeScript', 'MySQL', 'REST APIs', 'Redis', 'AWS'],
    description: 'Scale fintech infrastructure powering millions of online merchants across India with low-latency payment gateways and banking APIs.',
    responsibilities: [
      'Implement idempotent payment webhooks and payment retry engines.',
      'Optimize relational database indexing and cache invalidation strategies.',
      'Collaborate with product and security teams on PCI-DSS compliance.',
    ],
  },
  {
    id: 'atlassian',
    company: 'Atlassian',
    role: 'Associate Software Engineer (Platform)',
    location: 'Bengaluru, India (Remote-Friendly)',
    salary: '₹16,00,000 - ₹22,00,000',
    requiredSkills: ['Java', 'React.js', 'TypeScript', 'REST APIs', 'Git', 'CI/CD'],
    description: 'Join Jira and Confluence cloud platform teams to build collaborative tooling for millions of developers globally.',
    responsibilities: [
      'Develop modern cloud features with clean asynchronous architecture.',
      'Write automated integration tests and monitor production release health.',
      'Work alongside senior staff engineers on distributed system reliability.',
    ],
  },
];

export default function JobsPage() {
  const { skills } = useProfileStore();
  const [activeCompanyId, setActiveCompanyId] = useState('stripe');

  const verifiedSkillNames = skills
    .filter((s) => s.verificationStatus === 'Verified')
    .map((s) => s.name.toLowerCase());

  const activeJob = jobListings.find((j) => j.id === activeCompanyId) || jobListings[0];

  // Dynamic skill matching against verified profile skills
  const strongMatches = activeJob.requiredSkills.filter((req) =>
    verifiedSkillNames.some((vs) => vs.includes(req.toLowerCase()) || req.toLowerCase().includes(vs))
  );

  const missingSkills = activeJob.requiredSkills.filter(
    (req) => !verifiedSkillNames.some((vs) => vs.includes(req.toLowerCase()) || req.toLowerCase().includes(vs))
  );

  const matchScore = Math.max(
    45,
    Math.round((strongMatches.length / Math.max(1, activeJob.requiredSkills.length)) * 100)
  );

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-7xl mx-auto font-sans">
      {/* Top Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Job Matching</h1>
        <p className="text-[13px] text-slate-500 font-medium mt-1">
          Skill gap analysis calibrated against live industry job descriptions
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            Semantic Job Matcher • Verified Profile Alignment
          </p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Job Matching &amp; Skill Alignment</h2>
          <p className="text-[13px] text-slate-500 font-medium max-w-3xl">
            Evaluate how your verified profile stacks up against real job descriptions. Identify missing keywords before applying.
          </p>
        </div>

        {/* Company Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
          {jobListings.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCompanyId(c.id)}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeCompanyId === c.id
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-white border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {c.company}
            </button>
          ))}
          <Link
            href="/roadmap"
            className="px-4 py-2 rounded-t-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-b-2 border-transparent transition-colors flex items-center gap-1.5 ml-2"
          >
            <Briefcase className="h-3.5 w-3.5" /> View Role Roadmap
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Job Description */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-start justify-between border-b border-slate-100 pb-6 mb-6">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2 block">
                  {activeJob.company}
                </span>
                <h3 className="text-2xl font-black text-slate-900">{activeJob.role}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                  <span>📍 {activeJob.location}</span>
                  <span>•</span>
                  <span className="font-bold text-slate-700">{activeJob.salary}</span>
                </p>
              </div>
              <Link
                href="/interview"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 shrink-0"
              >
                Mock Prep &rarr;
              </Link>
            </div>

            <div className="space-y-6 text-[13px] text-slate-600 font-medium leading-relaxed">
              <div>
                <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">
                  About the Opportunity
                </h4>
                <p>{activeJob.description}</p>
              </div>

              <div>
                <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">
                  Core Responsibilities
                </h4>
                <ul className="list-disc list-inside space-y-1.5 marker:text-indigo-500">
                  {activeJob.responsibilities.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">
                  Candidate Requirements
                </h4>
                <ul className="list-disc list-inside space-y-1.5 marker:text-indigo-500">
                  <li>Bachelor&apos;s degree in Computer Science, Software Engineering, or related technical field.</li>
                  <li>Demonstrated competence in core data structures, algorithms, and modular clean code.</li>
                  <li>Proficiency in required skills: {activeJob.requiredSkills.join(', ')}.</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium italic">
                Evaluated against verified skills in your Career Profile
              </span>
              <Link
                href="/resume"
                className="px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                Tailor Resume for this Role
              </Link>
            </div>
          </div>

          {/* Right Column: Profile Match Index */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h4 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">
                Profile Match Index
              </h4>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                {matchScore >= 80 ? 'Strong Match' : 'Action Required'}
              </span>
            </div>

            <div className="flex gap-5 mb-8">
              <div className="h-16 w-16 shrink-0 rounded-2xl bg-indigo-50 border-2 border-indigo-500 flex items-center justify-center">
                <span className="text-xl font-black text-indigo-700">{matchScore}%</span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">Job Match Score</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {strongMatches.length} of {activeJob.requiredSkills.length} required keywords verified in your profile.
                </p>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              {/* Strong Matches */}
              <div>
                <h5 className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified Matches ({strongMatches.length})
                </h5>
                <div className="flex flex-wrap gap-2">
                  {strongMatches.length > 0 ? (
                    strongMatches.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" /> {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No verified skills match yet.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <h5 className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5 mb-2.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Missing Skills ({missingSkills.length})
                </h5>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1"
                    >
                      <AlertTriangle className="h-2.5 w-2.5" /> {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/applications"
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Track in Applications Pipeline <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
