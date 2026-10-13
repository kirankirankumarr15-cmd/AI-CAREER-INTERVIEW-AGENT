'use client';

import { useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Code2, Database, Layers, Cpu, Network, Briefcase, Calculator, Users, MessageCircle, Terminal } from 'lucide-react';

export const ALL_CATEGORIES = [
  { id: 'dbms', label: 'DBMS & SQL', icon: Database, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { id: 'dsa', label: 'Data Structures & Algorithms', icon: Code2, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  { id: 'c', label: 'C & Core Systems', icon: Terminal, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { id: 'java', label: 'Java & Backend', icon: Briefcase, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { id: 'oop', label: 'OOP & System Design', icon: Layers, color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50', borderColor: 'border-fuchsia-200' },
  { id: 'os', label: 'Operating Systems', icon: Cpu, color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
  { id: 'cn', label: 'Computer Networks', icon: Network, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  { id: 'aptitude', label: 'Aptitude & Reasoning', icon: Calculator, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'hr', label: 'HR & Behavioral', icon: Users, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  { id: 'communication', label: 'Communication', icon: MessageCircle, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
];

export function PracticeTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Extract category from path, defaults to dbms
  const currentCategoryMatch = pathname.match(/\/practice\/(arena\/|category\/)?([^\/]+)/);
  const activeCategoryId = currentCategoryMatch ? currentCategoryMatch[2] : 'dbms';

  // Make sure technical/communication pages map correctly
  const normalizedCategoryId = activeCategoryId === 'technical' ? 'dbms' : 
                               activeCategoryId === 'communication' ? 'communication' : 
                               activeCategoryId;

  return (
    <div className="w-full bg-white border-b border-slate-200 mb-6 shadow-sm sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div 
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {ALL_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = normalizedCategoryId === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => router.push(`/practice/arena/${category.id}`)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all flex-shrink-0 text-sm font-bold
                  ${isActive 
                    ? `${category.bgColor} ${category.color} border ${category.borderColor} shadow-sm ring-2 ring-white` 
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 hover:text-slate-900'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? category.color : 'text-slate-400'}`} />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
