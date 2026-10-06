'use client';

import { useState } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { ChevronRight, Layers, Database, LayoutTemplate, Server, LineChart, BrainCircuit, ShieldCheck, Cloud, Code2 } from 'lucide-react';

const rolesData = [
  {
    id: 'backend',
    title: 'Backend Developer',
    icon: Server,
    description: 'Design robust APIs, handle high-traffic systems, microservices, databases, and server-side business logic.',
    stack: ['Java', 'Spring Boot', 'SQL', 'REST APIs'],
    extraStack: '+ 3 more',
    level: 'Intermediate to Advanced',
    salary: '10 - 18 LPA',
  },
  {
    id: 'sde1',
    title: 'Software Developer (SDE 1)',
    icon: Code2,
    description: 'Core problem solving, data structures, algorithms, system design fundamentals, and enterprise software engineering.',
    stack: ['DSA', 'OOP', 'Java / C++', 'System Design'],
    extraStack: '+ 2 more',
    level: 'Advanced',
    salary: '16 - 22 LPA',
  },
  {
    id: 'frontend',
    title: 'Frontend Developer',
    icon: LayoutTemplate,
    description: 'Build fast, responsive, accessible, and delightful user interfaces using modern web frameworks and design systems.',
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
    extraStack: '+ 3 more',
    level: 'Intermediate',
    salary: '10 - 16 LPA',
  },
  {
    id: 'fullstack',
    title: 'Full Stack Developer',
    icon: Layers,
    description: 'Bridge client interfaces and distributed cloud backends with end-to-end architecture skills.',
    stack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    extraStack: '+ 2 more',
    level: 'Advanced',
    salary: '15 - 28 LPA',
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    icon: LineChart,
    description: 'Transform raw institutional datasets into actionable business narratives and executive dashboards.',
    stack: ['SQL', 'Python', 'Tableau / PowerBI', 'Excel'],
    extraStack: '+ 1 more',
    level: 'Intermediate',
    salary: '7 - 14 LPA',
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    icon: Database,
    description: 'Formulate predictive models, statistical inferences, and machine learning pipelines for complex datasets.',
    stack: ['Python', 'Machine Learning', 'Linear Algebra', 'Pandas'],
    extraStack: '+ 1 more',
    level: 'Advanced',
    salary: '18 - 24 LPA',
  },
  {
    id: 'aiml',
    title: 'AI/ML Engineer',
    icon: BrainCircuit,
    description: 'Deploy deep learning models, LLM agents, vector embeddings, and production inference architectures.',
    stack: ['PyTorch', 'Transformers', 'LangChain', 'Python'],
    extraStack: '+ 2 more',
    level: 'Advanced',
    salary: '20 - 32 LPA',
  },
  {
    id: 'cloud',
    title: 'Cloud / DevOps Engineer',
    icon: Cloud,
    description: 'Automate CI/CD pipelines, container orchestration, infrastructure as code, and cloud reliability.',
    stack: ['Kubernetes', 'Docker', 'AWS / GCP', 'Terraform'],
    extraStack: '+ 2 more',
    level: 'Intermediate to Advanced',
    salary: '15 - 26 LPA',
  },
  {
    id: 'cyber',
    title: 'Cybersecurity Analyst',
    icon: ShieldCheck,
    description: 'Safeguard infrastructure, perform vulnerability assessments, secure protocols, and incident response.',
    stack: ['Network Security', 'Cryptography', 'Linux', 'Ethical Hacking'],
    extraStack: '+ 1 more',
    level: 'Advanced',
    salary: '12 - 20 LPA',
  },
];

export default function CareerPage() {
  const { profile, updateProfile } = useProfileStore();
  const defaultRole = rolesData.find((r) => r.title === profile.targetRole) || rolesData[1];
  const [selectedRole, setSelectedRole] = useState(defaultRole);

  const handleSelectRole = (role: typeof rolesData[0]) => {
    setSelectedRole(role);
    updateProfile({ targetRole: role.title });
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Target Roles</h1>
        <p className="text-[13px] text-slate-500 font-medium mt-1">Choose your desired role and required skill path</p>
      </div>
      
      {/* Main Content */}
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
             Target Alignment Engine • 11 Career Paths
          </p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">What role are you targeting?</h2>
          <p className="text-[13px] text-slate-500 font-medium">
            Selecting a target role automatically customizes your learning roadmap, interview question banks, and resume ATS keywords.
          </p>
        </div>

        {/* Hero Selected Role Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all hover:border-emerald-300">
           <div className="space-y-4 flex-1">
             <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border border-emerald-200">
               Currently Selected Target Role
             </span>
             <div>
               <h3 className="text-2xl font-extrabold text-slate-900">{selectedRole.title}</h3>
               <p className="text-[13px] text-slate-600 font-medium mt-1.5 max-w-2xl leading-relaxed">
                 {selectedRole.description}
               </p>
             </div>
             <div className="flex items-center gap-3 pt-2">
               <span className="text-xs font-bold text-slate-900">Core Stack:</span>
               <div className="flex flex-wrap gap-2">
                 {[...selectedRole.stack, selectedRole.extraStack.replace('+', '').replace('more', '').trim()].map((s, i) => (
                   <span key={i} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-bold shadow-sm">
                     {s}
                   </span>
                 ))}
               </div>
             </div>
           </div>
           <button className="shrink-0 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all active:scale-95">
             Build My Roadmap <ChevronRight className="h-4 w-4" />
           </button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
           {rolesData.map((role) => {
             const isSelected = selectedRole.id === role.id;
             const Icon = role.icon;
             return (
               <div 
                 key={role.id}
                 onClick={() => handleSelectRole(role)}
                 className={`cursor-pointer rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between min-h-[220px] ${
                   isSelected 
                     ? 'bg-emerald-50/40 border-2 border-emerald-500 shadow-md shadow-emerald-500/10 scale-[1.02]' 
                     : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                 }`}
               >
                 <div className="space-y-4">
                   <div className="flex items-center gap-3">
                     <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                       isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600'
                     }`}>
                        <Icon className="h-5 w-5" />
                     </div>
                     <h3 className={`font-extrabold text-[15px] ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                       {role.title}
                     </h3>
                   </div>
                   <p className="text-[12px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                     {role.description}
                   </p>
                   <div className="flex flex-wrap gap-1.5 pt-1">
                     {role.stack.map((s, i) => (
                       <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                         isSelected ? 'bg-slate-700 text-white' : 'bg-slate-700 text-white'
                       }`}>
                         {s}
                       </span>
                     ))}
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                       isSelected ? 'text-emerald-700' : 'text-slate-500'
                     }`}>
                       {role.extraStack}
                     </span>
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                   <span className="text-[10px] text-slate-400 font-medium">{role.level}</span>
                   <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{role.salary}</span>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
}

