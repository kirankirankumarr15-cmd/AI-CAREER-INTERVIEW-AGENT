'use client';

import { 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail,
  Globe,
  Upload,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Code2,
  Briefcase
} from 'lucide-react';

function VerifiedBadge() {
  return (
    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest">
      <CheckCircle2 className="h-3 w-3" /> Verified
    </span>
  );
}

function SkillPill({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-bold shadow-sm">
      {name} <CheckCircle2 className="h-3 w-3 text-emerald-400" />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="max-w-[1100px] mx-auto space-y-6 pb-16 animate-fade-in-up font-sans">
      
      {/* Top Dark Header Card */}
      <div className="bg-[#111113] rounded-3xl p-8 pb-0 text-white shadow-xl relative overflow-hidden">
        {/* Abstract background blobs could go here, keeping it clean for now */}
        
        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10 mb-8">
          <div className="flex gap-6">
            <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-slate-700 shrink-0">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="h-full w-full object-cover" />
            </div>
            <div className="space-y-3">
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  Chinmay Hegde 
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-400 tracking-widest uppercase border border-teal-500/30">
                    Target: Software Developer (SDE1)
                  </span>
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> chinmay.hegde@example.com</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> +91 80554 13359</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Bengaluru, India</span>
              </div>

              <div className="flex gap-4 pt-1">
                <a href="#" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
                  <Code2 className="h-3.5 w-3.5" /> Github
                </a>
                <a href="#" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
                  <Briefcase className="h-3.5 w-3.5" /> LinkedIn
                </a>
                <a href="#" className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
                  <Globe className="h-3.5 w-3.5" /> Portfolio
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="bg-white text-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-lg w-64">
              <div className="h-12 w-12 rounded-full border-4 border-teal-500 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-slate-900">94%</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-0.5">OVERALL READINESS</p>
                <p className="text-[10px] font-bold text-slate-500">Missing skill: System Design & GraphQL</p>
              </div>
            </div>
            <button className="w-64 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center justify-center gap-2 border border-white/20 transition-colors">
              <Upload className="h-3.5 w-3.5" /> Explore Credentials
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-widest border-t border-slate-800 pt-4">
          <button className="pb-4 border-b-2 border-teal-500 text-teal-400">All</button>
          <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-300 transition-colors">Education</button>
          <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-300 transition-colors">Skills</button>
          <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-300 transition-colors">Projects</button>
          <button className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-300 transition-colors">Experience</button>
        </div>
      </div>

      {/* Education */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-1 bg-teal-50 px-2 py-1 rounded">
             <Upload className="h-3 w-3" /> Upload Meta Card
          </span>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-6 mt-4">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-1">PES Institute of Technology</h3>
              <p className="text-[13px] font-semibold text-slate-500 mb-2">B.E., Computer Engineering | Computers and Software Engineering</p>
              <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                <span>Oct 2018 - Jul 2022</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">CGPA: 9.21 / 10.0</span>
              </div>
            </div>
            <VerifiedBadge />
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-1">National Pre-University College</h3>
              <p className="text-[13px] font-semibold text-slate-500 mb-2">Higher Secondary School | Science</p>
              <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                <span>Jun 2016 - May 2018</span>
              </div>
            </div>
            <VerifiedBadge />
          </div>
        </div>
      </div>

      {/* Skills & Technologies */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="text-teal-500">▼</span> Skills & Technologies
          </h2>
          <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-sm bg-white">
            <Plus className="h-3 w-3" /> Add Skill
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Programming Languages */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-inner">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">PROGRAMMING LANGUAGES</h3>
            <div className="flex flex-wrap gap-2">
              <SkillPill name="C++" />
              <SkillPill name="Python" />
              <SkillPill name="Java" />
              <SkillPill name="JavaScript" />
              <SkillPill name="SQL" />
            </div>
          </div>
          {/* Frameworks */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-inner">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">FRAMEWORKS & LIBRARIES</h3>
            <div className="flex flex-wrap gap-2">
              <SkillPill name="React.js" />
              <SkillPill name="Next.js" />
              <SkillPill name="Node.js" />
              <SkillPill name="Express.js" />
              <SkillPill name="Spring Boot" />
            </div>
          </div>
          {/* Databases */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-inner">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">DATABASES & TOOLS</h3>
            <div className="flex flex-wrap gap-2">
              <SkillPill name="PostgreSQL" />
              <SkillPill name="MongoDB" />
              <SkillPill name="Docker" />
              <SkillPill name="Git" />
              <SkillPill name="AWS" />
            </div>
          </div>
          {/* Architecture */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-inner">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">ARCHITECTURE & TECHNOLOGIES</h3>
            <div className="flex flex-wrap gap-2">
              <SkillPill name="Microservices" />
              <SkillPill name="RESTful API" />
              <SkillPill name="System Design" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span className="text-teal-500">▼</span> Projects
          </h2>
          <button className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-slate-800 transition-colors">
            <RefreshCw className="h-3 w-3" /> Sync From Github
          </button>
        </div>
        
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-[14px] font-black text-slate-900">Campus Placement & Career Hub <span className="text-[11px] font-semibold text-slate-400 ml-2">Full Stack Developer</span></h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-400">Sep 2023 - Present</span>
                <VerifiedBadge />
              </div>
            </div>
            <p className="text-[12px] font-medium text-slate-600 mb-3">
              Built an automated AI resume evaluation system handling 500+ daily requests with 99.9% uptime and <br/> real-time feedback.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">Java</span>
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">Spring Boot</span>
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">PostgreSQL</span>
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">React</span>
              </div>
              <a href="#" className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:underline">
                <ExternalLink className="h-3 w-3" /> Live Demo
              </a>
            </div>
          </div>

          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-[14px] font-black text-slate-900">Distributed Rate Limiter Service <span className="text-[11px] font-semibold text-slate-400 ml-2">Core Backend Eng</span></h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-400">Jan 2023 - May 2023</span>
                <VerifiedBadge />
              </div>
            </div>
            <p className="text-[12px] font-medium text-slate-600 mb-3">
              Implemented sliding window token bucket rate limiting algorithm in Go (Redis Backend) with <br/> 1ms P99 latency across clusters.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">Golang</span>
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">Redis</span>
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">gRPC</span>
              </div>
              <a href="#" className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:underline">
                <Code2 className="h-3 w-3" /> Source
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Experience & Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Experience */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="text-teal-500">▼</span> Experience & Internships
            </h2>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-[14px] font-black text-slate-900">Backend Engineer Intern</h3>
              <VerifiedBadge />
            </div>
            <p className="text-[12px] font-semibold text-slate-500 mb-1">Techflow Innovations, Bengaluru (Hybrid)</p>
            <p className="text-[10px] font-bold text-slate-400 mb-4">Jan 2023 - Aug 2023 (8 Mos)</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-[12px] font-medium text-slate-600 leading-relaxed">
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                Worked with core backend team migrating legacy monolith to Node.js microservices.
              </li>
              <li className="flex items-start gap-2 text-[12px] font-medium text-slate-600 leading-relaxed">
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                Reduced API response times by 30% by refactoring database indexing and Redis caching policies.
              </li>
              <li className="flex items-start gap-2 text-[12px] font-medium text-slate-600 leading-relaxed">
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                Collaborated with QA to increase test coverage from 45% to 80% via Jest.
              </li>
            </ul>
          </div>
        </div>

        {/* Certifications */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="text-teal-500">▼</span> Certifications & Honors
            </h2>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-6">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-[13px] font-black text-slate-900">AWS Certified Cloud Practitioner</h3>
                <VerifiedBadge />
              </div>
              <p className="text-[11px] font-medium text-slate-500">Amazon Web Services (Nov 2023)</p>
            </div>
            
            <div className="border-b border-slate-100 pb-6">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-[13px] font-black text-slate-900">Oracle Certified Associate, Java SE 8</h3>
                <VerifiedBadge />
              </div>
              <p className="text-[11px] font-medium text-slate-500">Oracle (Jan 2022)</p>
            </div>

            <div>
              <h3 className="text-[13px] font-black text-slate-900 mb-2">Hackathons & Leadership</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-[11px] font-medium text-slate-600">
                  <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  Winner at SIH (Smart India Hackathon) 2022
                </li>
                <li className="flex items-start gap-2 text-[11px] font-medium text-slate-600">
                  <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  Technical Lead at Campus Developer Student Club (DSC)
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
