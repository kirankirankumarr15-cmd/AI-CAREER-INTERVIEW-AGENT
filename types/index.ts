export type VerificationStatus = 'Verified' | 'Unverified' | 'Needs Review';

export interface StudentProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  college?: string;
  branch?: string;
  graduationYear?: number;
  cgpa?: number;
  githubUrl?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  targetRole: string;
  targetCompanies: string[];
  preferredLocations: string[];
  readinessScore: number;
  verificationStatus: VerificationStatus;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
  cgpa: number;
  verificationStatus: VerificationStatus;
}

export interface SkillItem {
  id: string;
  name: string;
  category: 'Technical' | 'Framework' | 'Tool' | 'Soft';
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  verificationStatus: VerificationStatus;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  architectureSummary?: string;
  studentContribution?: string;
  githubUrl?: string;
  liveUrl?: string;
  keyChallenges?: string[];
  interviewQuestions?: { question: string; hint: string }[];
  verificationStatus: VerificationStatus;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description: string;
  achievements: string[];
  verificationStatus: VerificationStatus;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  credentialUrl?: string;
  verificationStatus: VerificationStatus;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  docType: 'Resume' | 'Marks Card' | 'Degree' | 'Certificate' | 'Internship' | 'Project Report' | 'Other';
  status: 'Pending' | 'Processing' | 'Extracted' | 'Confirmed' | 'Rejected';
  extractedData?: {
    college?: string;
    degree?: string;
    branch?: string;
    graduationYear?: number;
    cgpa?: number;
    skills?: string[];
    projects?: Array<{ title: string; tech: string[]; summary: string }>;
    experience?: Array<{ company: string; role: string; summary: string }>;
    certifications?: string[];
  };
  createdAt: string;
}

export interface JobDescription {
  id: string;
  company: string;
  roleTitle: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  location: string;
  eligibilityCriteria?: string;
}

export interface JobMatchResult {
  matchScore: number; // 0-100%
  strongMatches: string[];
  partialMatches: string[];
  missingSkills: string[];
  recommendations: string[];
}

export interface GeneratedResume {
  id: string;
  targetRole: string;
  title: string;
  summary: string;
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  certifications: CertificationItem[];
  atsScore: number;
  atsFeedback: {
    formattingScore: number;
    keywordScore: number;
    readabilityScore: number;
    suggestions: string[];
    missingKeywords: string[];
  };
}

export interface JobApplicationRecord {
  id: string;
  company: string;
  role: string;
  status: 'Saved' | 'Ready to Apply' | 'Applied' | 'Assessment' | 'Interview' | 'Shortlisted' | 'Offer' | 'Rejected';
  appliedDate?: string;
  interviewDate?: string;
  jobDescription: string;
  generatedAnswers: Record<string, string>;
  studentApproved: boolean;
  notes?: string;
}

export type InterviewType = 'Technical' | 'HR' | 'Behavioral' | 'DSA' | 'Project' | 'Full Interview' | 'Company Simulation';
export type InterviewDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type InterviewMode = 'Friendly' | 'Professional' | 'Strict' | 'Pressure';

export interface InterviewSession {
  id: string;
  targetRole: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  mode: InterviewMode;
  companyName?: string;
  status: 'In Progress' | 'Completed' | 'Abandoned';
  currentQuestionIndex: number;
  totalQuestions: number;
  overallScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
  problemSolvingScore?: number;
  projectScore?: number;
  hrScore?: number;
  strongAreas: string[];
  weakAreas: string[];
  recommendations: string[];
  createdAt: string;
}

export interface AnswerEvaluation {
  answerScore: number;
  technicalAccuracy: number;
  relevance: number;
  structureScore: number;
  communicationScore: number;
  estimatedConfidence: number;
  speakingSpeed: 'Too Slow' | 'Optimal' | 'Too Fast';
  fillerWords: string[];
  feedbackGood: string;
  feedbackImprovement: string;
  starStructureScore: number; // For HR STAR method
}

export interface InterviewQuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  category: string;
  studentAnswer?: string;
  evaluation?: AnswerEvaluation;
}

export interface LearningTopic {
  id: string;
  topic: string;
  category: string;
  estimatedMinutes: number;
  status: 'To Learn' | 'In Progress' | 'Mastered';
  resources: Array<{ title: string; url: string; type: 'Article' | 'Video' | 'Practice' }>;
}

export interface UserProgressData {
  readinessScore: number;
  questionsSolved: number;
  interviewsCompleted: number;
  dailyStreak: number;
  technicalKnowledge: number;
  communicationScore: number;
  confidenceScore: number;
  dsaScore: number;
  dbmsScore: number;
  osScore: number;
  oopScore: number;
  projectsScore: number;
  resumeScore: number;
  weakAreas: string[];
  todaysMission: {
    completed: number;
    total: number;
    tasks: Array<{ id: string; text: string; category: string; done: boolean }>;
  };
}
