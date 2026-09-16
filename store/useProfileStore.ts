import { create } from 'zustand';
import {
  StudentProfile,
  EducationItem,
  SkillItem,
  ProjectItem,
  ExperienceItem,
  CertificationItem,
  DocumentRecord
} from '@/types';

interface ProfileState {
  profile: StudentProfile;
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  certifications: CertificationItem[];
  documents: DocumentRecord[];

  updateProfile: (data: Partial<StudentProfile>) => void;
  addSkill: (skill: Omit<SkillItem, 'id'>) => void;
  removeSkill: (id: string) => void;
  updateSkillVerification: (id: string, status: SkillItem['verificationStatus']) => void;
  addProject: (project: Omit<ProjectItem, 'id'>) => void;
  updateProject: (id: string, data: Partial<ProjectItem>) => void;
  removeProject: (id: string) => void;
  addEducation: (edu: Omit<EducationItem, 'id'>) => void;
  addExperience: (exp: Omit<ExperienceItem, 'id'>) => void;
  addCertification: (cert: Omit<CertificationItem, 'id'>) => void;
  addDocument: (doc: DocumentRecord) => void;
  updateDocumentStatus: (id: string, status: DocumentRecord['status']) => void;
  confirmExtractedData: (docId: string, verifiedData: any) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: {
    id: 'user-1',
    email: 'alex.dev@college.edu',
    fullName: 'Alex Morgan',
    phone: '+1 (555) 234-5678',
    location: 'Seattle, WA',
    college: 'University of Technology',
    branch: 'Computer Science & Engineering',
    graduationYear: 2025,
    cgpa: 8.7,
    githubUrl: 'https://github.com/alex-morgan-dev',
    linkedInUrl: 'https://linkedin.com/in/alex-morgan',
    portfolioUrl: 'https://alexmorgan.dev',
    targetRole: 'Full Stack Developer',
    targetCompanies: ['Google', 'Microsoft', 'Stripe', 'Amazon'],
    preferredLocations: ['Seattle, WA', 'San Francisco, CA', 'Remote'],
    readinessScore: 78,
    verificationStatus: 'Verified',
  },
  education: [
    {
      id: 'edu-1',
      institution: 'University of Technology',
      degree: 'B.S. Computer Science',
      fieldOfStudy: 'Computer Science & Software Engineering',
      startYear: 2021,
      endYear: 2025,
      cgpa: 8.7,
      verificationStatus: 'Verified',
    },
  ],
  skills: [
    { id: 's-1', name: 'React.js', category: 'Framework', proficiency: 'Advanced', verificationStatus: 'Verified' },
    { id: 's-2', name: 'Node.js', category: 'Framework', proficiency: 'Advanced', verificationStatus: 'Verified' },
    { id: 's-3', name: 'TypeScript', category: 'Technical', proficiency: 'Advanced', verificationStatus: 'Verified' },
    { id: 's-4', name: 'Python', category: 'Technical', proficiency: 'Intermediate', verificationStatus: 'Verified' },
    { id: 's-5', name: 'PostgreSQL', category: 'Technical', proficiency: 'Intermediate', verificationStatus: 'Verified' },
    { id: 's-6', name: 'Docker', category: 'Tool', proficiency: 'Beginner', verificationStatus: 'Needs Review' },
    { id: 's-7', name: 'AWS S3 / EC2', category: 'Tool', proficiency: 'Beginner', verificationStatus: 'Unverified' },
    { id: 's-8', name: 'Data Structures & Algorithms', category: 'Technical', proficiency: 'Intermediate', verificationStatus: 'Verified' },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Smart Campus Resource Optimization Platform',
      description: 'A full-stack web application designed to optimize university lab equipment, room booking, and energy consumption using predictive scheduling.',
      techStack: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Tailwind CSS'],
      architectureSummary: 'Microservices architecture with RESTful APIs, JWT authentication, and WebSockets for real-time occupancy updates.',
      studentContribution: 'Architected backend APIs, implemented DB schema, built responsive admin dashboard and real-time socket events.',
      githubUrl: 'https://github.com/alex-morgan-dev/smart-campus',
      liveUrl: 'https://smart-campus-demo.vercel.app',
      keyChallenges: ['Concurrency control during peak room bookings', 'Reducing WebSocket battery drain on mobile clients'],
      interviewQuestions: [
        { question: 'How did you prevent race conditions when two students booked the same lab seat simultaneously?', hint: 'Mention PostgreSQL row-level locks (SELECT FOR UPDATE) or atomic transaction isolation.' },
        { question: 'Why did you select WebSockets over Server-Sent Events (SSE)?', hint: 'Explain bi-directional communication requirement vs unidirectionality of SSE.' },
      ],
      verificationStatus: 'Verified',
    },
    {
      id: 'proj-2',
      title: 'AI Resume & ATS Parser Engine',
      description: 'NLP-powered tool that analyzes uploaded resume PDFs against target job descriptions, scoring keyword density and formatting match.',
      techStack: ['Python', 'FastAPI', 'Spacy', 'PDFPlumber', 'Next.js'],
      architectureSummary: 'Client-side PDF extraction with backend FastAPI NLP microservice executing TF-IDF vector similarity metrics.',
      studentContribution: 'Developed custom SpaCy NLP entity recognition pipeline to extract skills, certifications, and experience durations.',
      githubUrl: 'https://github.com/alex-morgan-dev/resume-ats-parser',
      keyChallenges: ['Extracting multi-column PDF layouts without garbling text order'],
      verificationStatus: 'Verified',
    },
  ],
  experiences: [
    {
      id: 'exp-1',
      company: 'TechNovation Labs',
      role: 'Full Stack Software Intern',
      location: 'Seattle, WA',
      startDate: '2024-05-01',
      endDate: '2024-08-31',
      isCurrent: false,
      description: 'Contributed to cloud-native internal analytics tools utilized by 200+ engineers.',
      achievements: [
        'Optimized PostgreSQL query latency by 35% through query index refactoring',
        'Developed 12 reusable React components increasing frontend velocity by 20%',
        'Integrated automated Jest & Cypress CI/CD pipelines reducing deployment bug reports by 15%',
      ],
      verificationStatus: 'Verified',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      issueDate: '2024-02-15',
      credentialUrl: 'https://aws.amazon.com/verification/AWS-1293847',
      verificationStatus: 'Verified',
    },
    {
      id: 'cert-2',
      name: 'Meta Front-End Developer Professional Certificate',
      issuer: 'Coursera / Meta',
      issueDate: '2023-11-10',
      verificationStatus: 'Verified',
    },
  ],
  documents: [
    {
      id: 'doc-1',
      fileName: 'Alex_Morgan_Software_Engineer_Resume.pdf',
      fileUrl: '/mock/Alex_Morgan_Resume.pdf',
      docType: 'Resume',
      status: 'Confirmed',
      createdAt: '2026-08-25',
    },
  ],

  updateProfile: (data) =>
    set((state) => ({ profile: { ...state.profile, ...data } })),

  addSkill: (skill) =>
    set((state) => ({
      skills: [...state.skills, { ...skill, id: `s-${Date.now()}` }],
    })),

  removeSkill: (id) =>
    set((state) => ({ skills: state.skills.filter((s) => s.id !== id) })),

  updateSkillVerification: (id, status) =>
    set((state) => ({
      skills: state.skills.map((s) => (s.id === id ? { ...s, verificationStatus: status } : s)),
    })),

  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, { ...project, id: `proj-${Date.now()}` }],
    })),

  updateProject: (id, data) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  removeProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  addEducation: (edu) =>
    set((state) => ({
      education: [...state.education, { ...edu, id: `edu-${Date.now()}` }],
    })),

  addExperience: (exp) =>
    set((state) => ({
      experiences: [...state.experiences, { ...exp, id: `exp-${Date.now()}` }],
    })),

  addCertification: (cert) =>
    set((state) => ({
      certifications: [...state.certifications, { ...cert, id: `cert-${Date.now()}` }],
    })),

  addDocument: (doc) =>
    set((state) => ({ documents: [doc, ...state.documents] })),

  updateDocumentStatus: (id, status) =>
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? { ...d, status } : d)),
    })),

  confirmExtractedData: (docId, verifiedData) =>
    set((state) => {
      const updatedDocs = state.documents.map((d) =>
        d.id === docId ? { ...d, status: 'Confirmed' as const } : d
      );
      return { documents: updatedDocs };
    }),
}));
