'use client';

import { useState } from 'react';
import { Sparkles, Printer, ChevronRight } from 'lucide-react';

export default function ResumePage() {
  const [activeTab, setActiveTab] = useState('Backend Resume');

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
            ATS-Optimized Studio • Truthful & Verified Resumes
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Resume Builder</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['Backend Resume', 'Full Stack Resume', 'Frontend Resume'].map((tab) => (
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
          <button className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-2 shadow-md shadow-emerald-700/20 ml-2">
            <Printer className="h-3.5 w-3.5" /> Export / Print
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Column - Sections */}
        <div className="w-full lg:w-[260px] shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Resume Sections</h3>
            <nav className="space-y-1">
              {['Summary & Title', 'Education & CGPA', 'Technical Skills'].map(item => (
                <button key={item} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold">
                  {item}
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                </button>
              ))}
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 transition-colors text-xs font-bold">
                Projects & Defense
                <ChevronRight className="h-3.5 w-3.5 text-emerald-400" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold">
                Internships & Work
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              </button>
            </nav>

            <div className="mt-6 pt-5 border-t border-slate-100 px-2">
              <div className="flex justify-between text-[11px] font-bold mb-2">
                <span className="text-emerald-700">ATS Score: 91 / 100</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                <div className="h-full bg-emerald-500 rounded-full w-[91%]"></div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Clean single-column layout, machine-readable tables, standard headings.
              </p>
            </div>
          </div>
        </div>

        {/* Middle Column - Resume Preview */}
        <div className="flex-1 w-full bg-[#0f172a] rounded-xl shadow-xl overflow-hidden text-slate-300 p-10 font-sans border border-slate-800 min-h-[800px]">
          <div className="text-center border-b border-slate-800 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-white tracking-wide">CHINMAY HEGDE</h1>
            <p className="text-xs mt-2 text-slate-400 flex items-center justify-center gap-2">
              <span>Bengaluru, India</span> • <span>chinmay.hegde@campus.edu</span> • <span>+91 98765 43210</span>
            </p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center justify-center gap-2">
              <span>github.com/chinmayhegde</span> • <span>linkedin.com/in/chinmay-hegde</span>
            </p>
          </div>

          {/* EDUCATION */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-3">Education</h3>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-bold text-slate-100 text-sm">XYZ Institute of Technology</span>
              <span className="text-xs text-slate-400 font-medium">2026</span>
            </div>
            <div className="flex justify-between items-baseline text-xs mb-3">
              <span className="text-slate-400">B.E. (Bachelor of Engineering) — Computer Science & Engineering</span>
              <span className="font-bold">CGPA: <span className="text-white">8.4 / 10.0</span></span>
            </div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-bold text-slate-100 text-sm">National Pre-University College</span>
              <span className="text-xs text-slate-400 font-medium">2022</span>
            </div>
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-400">Higher Secondary (PCMC) — Science</span>
              <span className="font-bold">CGPA: <span className="text-white">96.7%</span></span>
            </div>
          </div>

          {/* TECHNICAL SKILLS */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-3">Technical Skills</h3>
            <div className="space-y-2 text-xs">
              <p><span className="font-bold text-slate-200">Languages:</span> <span className="text-slate-400">Java, SQL, TypeScript, Python</span></p>
              <p><span className="font-bold text-slate-200">Frameworks:</span> <span className="text-slate-400">Spring Boot, Node.js, Express, React, JUnit</span></p>
              <p><span className="font-bold text-slate-200">Databases & Tools:</span> <span className="text-slate-400">PostgreSQL, Redis, Docker, Git, RESTful APIs</span></p>
            </div>
          </div>

          {/* WORK EXPERIENCE */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-3">Work Experience</h3>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-bold text-slate-100 text-sm">TechFlow Innovations — Backend Engineering Intern</span>
              <span className="text-xs text-slate-400 font-medium">Jan 2025 – Aug 2025 (8 mos)</span>
            </div>
            <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs text-slate-400 marker:text-slate-600">
              <li>Reduced p95 query latency by 34% by redesigning relational indexes across 4 core Postgres tables.</li>
              <li>Wrote integration test suites in JUnit ensuring 92% coverage for billing webhooks.</li>
              <li>Collaborated on message queues with RabbitMQ for event-driven transactions.</li>
            </ul>
          </div>

          {/* PROJECTS */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-3">Projects</h3>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-bold text-slate-100 text-sm">Campus Placement & Career Hub</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Java, Spring Boot, Postgres</span>
            </div>
            <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs text-slate-400 marker:text-slate-600">
              <li className="bg-emerald-900/30 text-emerald-200 p-1 -ml-1 rounded">Architected a distributed application gateway with Redis caching, supporting 15,000+ daily peak requests and reducing p99 latency by 34%.</li>
              <li>Implemented Redis Cache-Aside pattern with 5-minute TTL, decreasing duplicate read queries by 60%.</li>
            </ul>
          </div>
        </div>

        {/* Right Column - AI Bullet Polish */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" /> AI Bullet Polish
              </h3>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Polish Item 1 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projects Improvement</span>
                </div>
                
                <p className="text-xs text-slate-400 line-through decoration-slate-300">
                  "Engineered a high-concurrency student application gateway handling 15,000+ daily requests with automated resume parsing and interview scheduling."
                </p>
                
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900 font-medium leading-relaxed">
                  "Architected a distributed application gateway with Redis caching, supporting 15,000+ daily peak requests and reducing p99 latency by 34%."
                </div>

                <p className="text-[10px] text-slate-500">
                  <span className="font-bold text-slate-700">Why:</span> Added distributed architecture detail, quantifiable metrics, and specific caching technologies.
                </p>

                <button className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center justify-center gap-2 transition-colors">
                  <Sparkles className="h-3.5 w-3.5" /> Apply with AI
                </button>
              </div>

              {/* Polish Item 2 */}
              <div className="space-y-3 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience Improvement</span>
                </div>
                
                <p className="text-xs text-slate-400 line-through decoration-slate-300">
                  "Worked with database system and integrated idempotency keys."
                </p>
                
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900 font-medium leading-relaxed">
                  "Implemented database idempotency mechanisms and optimized relational query plans, preventing double charges across 50,000+ billing transactions."
                </div>

                <p className="text-[10px] text-slate-500">
                  <span className="font-bold text-slate-700">Why:</span> Replaced generic "worked with" with high-impact action verbs and business scale.
                </p>

                <button className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center justify-center gap-2 transition-colors">
                  <Sparkles className="h-3.5 w-3.5" /> Apply with AI
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
