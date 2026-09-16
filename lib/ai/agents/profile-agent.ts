import { callGeminiJSON } from '../gemini';
import { StudentProfile, SkillItem, ProjectItem } from '@/types';

export interface RoleRequirements {
  role: string;
  requiredSkills: string[];
  importantSubjects: string[];
  commonInterviewTopics: string[];
  typicalRounds: string[];
  recommendedProjects: string[];
  learningRoadmap: Array<{ step: number; title: string; desc: string }>;
}

export async function analyzeProfileRole(profile: StudentProfile, skills: SkillItem[], targetRole: string): Promise<RoleRequirements> {
  const prompt = `
  You are an expert AI Career Profile Advisor.
  Analyze the student profile below for the target role: "${targetRole}".

  Student Profile:
  College: ${profile.college || 'Engineering College'}
  Branch: ${profile.branch || 'Computer Science'}
  CGPA: ${profile.cgpa || 8.0}
  Skills: ${skills.map(s => s.name).join(', ')}

  Return a JSON object:
  {
    "role": "${targetRole}",
    "requiredSkills": ["React", "Node.js", "TypeScript", "SQL"],
    "importantSubjects": ["Data Structures", "DBMS", "Operating Systems", "Computer Networks"],
    "commonInterviewTopics": ["REST API Design", "State Management", "Database Indexing", "DSA"],
    "typicalRounds": ["Online Assessment", "Technical Round 1 (DSA + OS)", "Technical Round 2 (System/Web)", "HR Round"],
    "recommendedProjects": ["Full Stack E-Commerce Platform", "Real-time Collaboration Tool"],
    "learningRoadmap": [
      { "step": 1, "title": "Core Foundations", "desc": "Master Advanced Data Structures & SQL queries" },
      { "step": 2, "title": "Full Stack Mastery", "desc": "Build microservices with Node.js & React" }
    ]
  }
  `;

  const fallback: RoleRequirements = {
    role: targetRole,
    requiredSkills: ['JavaScript / TypeScript', 'React.js', 'Node.js & Express', 'SQL Databases', 'RESTful API Architecture', 'Git / GitHub'],
    importantSubjects: ['Data Structures & Algorithms', 'Database Management Systems (DBMS)', 'Object Oriented Programming (OOP)', 'Operating Systems (OS)'],
    commonInterviewTopics: ['Array / String manipulation', 'SQL joins & query optimization', 'HTTP protocols & status codes', 'Async/Await event loop in Node.js', 'React Hooks lifecycle'],
    typicalRounds: ['Round 1: Online Technical Assessment (Coding + CS Fundamentals MCQs)', 'Round 2: Technical Interview 1 (DSA + DBMS + System Design Basics)', 'Round 3: Technical Interview 2 (Project Deep-Dive + Live Coding)', 'Round 4: HR & Cultural Alignment'],
    recommendedProjects: ['Production-Grade SaaS App with Authentication & Payment Integration', 'Real-time WebSocket Chat / Collaboration Workspace', 'Microservices API Gateway with Caching & Rate Limiting'],
    learningRoadmap: [
      { step: 1, title: 'Master Core CS Fundamentals', desc: 'Solve 50+ DSA problems & master SQL join queries & indexing.' },
      { step: 2, title: 'Build & Deploy Full Stack App', desc: 'Construct a complete project with React, Node.js, and PostgreSQL.' },
      { step: 3, title: 'System Architecture & Edge Cases', desc: 'Learn REST API optimization, JWT auth, and Docker deployment.' },
      { step: 4, title: 'Mock Interview & STAR Drills', desc: 'Practice technical voice interviews & structured HR responses.' }
    ]
  };

  return callGeminiJSON<RoleRequirements>(prompt, fallback);
}
