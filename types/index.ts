export type VerificationStatus = 'Verified' | 'Unverified' | 'Needs Review';

export type UserRole = 'student' | 'tpo' | 'admin';

export interface StudentProfile {
  id: string;
  email: string;
  fullName: string;
  role?: UserRole;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  college?: string;
  branch?: string;
  year?: number;
  graduationYear?: number;
  cgpa?: number;
  githubUrl?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  targetRole: string;
  targetRoles?: string[];
  targetCompanies: string[];
  preferredLocations: string[];
  skills?: string[];
  readinessScore: number;
  profileCompletionPercentage?: number;
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

export type InterviewType = 'Technical' | 'HR' | 'Resume-based' | 'Behavioral' | 'DSA' | 'Project' | 'Full Interview' | 'Company Simulation';
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
  skills?: string[];
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

// ==========================================
// PRISM Phase 3: Career Audit & GD Types
// ==========================================

export interface CareerAuditSkillGap {
  skill: string;
  category: string;
  status: 'have' | 'partial' | 'missing';
  evidence: string;
  weight: number;
}

export interface CareerAuditSalaryBenchmark {
  minLpa: number;
  maxLpa: number;
  medianLpa: number;
  currency: string;
  source: string;
  sourceDate: string;
  region: string;
  hasReliableData: boolean;
}

export interface CareerAuditRadarScores {
  skillsCoverage: number;
  projectsReadiness: number;
  academicAlignment: number;
  practicalDepth: number;
  coreFundamentals: number;
  placementPreparedness: number;
}

export interface CareerAuditResult {
  id: string;
  targetRole: string;
  researchedAt: string;
  sectorAlignment: {
    sector: string;
    alignmentPercentage: number;
    demandOutlook: string;
    rationale: string;
  };
  skillGaps: CareerAuditSkillGap[];
  expectedSalaryRange: CareerAuditSalaryBenchmark;
  competitivenessSummary: string;
  radarScores: CareerAuditRadarScores;
  createdAt: string;
}

export interface GDParticipant {
  id: string;
  role: 'moderator' | 'human' | 'bot';
  name: string;
  persona?: string;
  stance?: string;
}

export interface GDTurn {
  id: string;
  sessionId: string;
  participantId?: string;
  speakerName: string;
  speakerRole: 'moderator' | 'human' | 'bot';
  turnIndex: number;
  content: string;
  inputMethod: 'voice' | 'text' | 'system';
  timestampMs: number;
  durationSeconds?: number;
}

export interface GDEvaluation {
  contentScore: number;
  clarityScore: number;
  initiativeScore: number;
  listeningScore: number;
  overallScore: number;
  evidenceQuotes: Array<{
    metric: string;
    quote: string;
    analysis: string;
  }>;
  strengths: string[];
  improvementTips: string[];
  modelContributions?: Array<{
    phase: string;
    suggestedArgument: string;
  }>;
}

export interface GDSession {
  id: string;
  userId: string;
  topic: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  durationSeconds: number;
  startedAt: string;
  completedAt?: string;
  participants: GDParticipant[];
  turns: GDTurn[];
  evaluation?: GDEvaluation;
}


// =====================================================================
// Phase 4: Timed Assessment, Readiness Index & Dynamic Roadmap Types
// =====================================================================

export type QuestionPaletteState =
  | 'answered'
  | 'unanswered'
  | 'marked_for_review'
  | 'answered_and_marked_for_review'
  | 'review'
  | 'not_visited';

export type AssessmentStatus = 'in_progress' | 'completed' | 'expired' | 'abandoned';
export type ProctorSeverity = 'low' | 'medium' | 'high';
export type ProctorReviewStatus = 'pending' | 'reviewed' | 'flagged' | 'cleared';

export type ProctorEventType =
  | 'tab_hidden'
  | 'tab_visible'
  | 'window_blur'
  | 'window_focus'
  | 'fullscreen_exit'
  | 'fullscreen_enter'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'navigation_event'
  | 'repeated_activity'
  | 'suspicious_shortcut';

export interface QuestionOption {
  id: string; // e.g. "A", "B", "C", "D"
  text: string;
}

export interface AssessmentQuestionPublic {
  id: string;
  assessmentId: string;
  sectionId?: string;
  questionText: string;
  questionType: 'mcq' | 'multi_choice' | 'coding' | 'short_text';
  options: QuestionOption[];
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  negativeMarks: number;
  orderIndex: number;
}

export interface AssessmentQuestionFull extends AssessmentQuestionPublic {
  correctOption: string;
  explanation: string;
}

export interface AssessmentSection {
  id: string;
  assessmentId: string;
  title: string;
  description?: string;
  orderIndex: number;
  durationMinutes?: number;
  marksPerQuestion: number;
  negativeMarks: number;
}

export interface AssessmentSummary {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  totalQuestions?: number;
  questionCount: number;
  negativeMarking: boolean;
  status?: 'draft' | 'published' | 'archived';
  sections?: AssessmentSection[];
  previousAttemptsCount?: number;
  latestScore?: number;
  latestPercentage?: number;
  latestResultStatus?: 'passed' | 'failed' | 'pending';
}

export interface AttemptAnswerState {
  questionId: string;
  selectedOption: string | null;
  isMarkedReview: boolean;
  timeSpentSecs: number;
  updatedAt?: string;
}

export interface AttemptAnswerResult extends AttemptAnswerState {
  isCorrect?: boolean;
  marksAwarded?: number;
  correctOption?: string;
  explanation?: string;
  topic?: string;
}

export interface ProctorEventItem {
  id?: string;
  attemptId: string;
  userId?: string;
  eventType: ProctorEventType;
  timestamp: string;
  severity?: ProctorSeverity;
  reviewStatus?: ProctorReviewStatus;
  metadata?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

export interface AssessmentAttemptResult {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  startedAt: string;
  deadlineAt: string;
  submittedAt: string;
  status: AssessmentStatus;
  resultStatus: 'passed' | 'failed' | 'pending';
  timeTakenSecs: number;
  score: number;
  totalMarks: number;
  passMarks?: number;
  percentage: number;
  tabSwitchCount: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  sectionBreakdown: Array<{
    sectionTitle: string;
    score: number;
    totalMarks: number;
    percentage: number;
  }>;
  topicBreakdown: Array<{
    topic: string;
    total: number;
    correct: number;
    percentage: number;
  }>;
  weakTopics: string[];
  recommendations: string[];
  proctorEvents: ProctorEventItem[];
  answers: AttemptAnswerResult[];
}

// 4.2 Readiness Index Types
export interface ReadinessPillarScore {
  score: number;        // 0-100
  weight: number;       // e.g. 25
  isAssessed: boolean;
  evidence: string;
  lastUpdated?: string;
}

export interface ReadinessRecommendation {
  id: string;
  pillar: 'Assessments' | 'Resume' | 'Interview' | 'Group Discussion' | 'Profile';
  title: string;
  actionText: string;
  currentScore: number;
  targetScore: number;
  priorityScore: number; // calculated via Priority = Weight * (100 - Score) / Effort
  estimatedEffortHours: number;
  href: string;
}

export interface ReadinessIndexReport {
  overallScore: number;     // Normalized 0-100
  rawWeightedScore: number; // Raw sum
  coveragePercentage: number; // Sum of assessed weights
  formulaDescription: string;
  calculatedAt: string;
  pillars: {
    assessments: ReadinessPillarScore;
    resume: ReadinessPillarScore;
    interview: ReadinessPillarScore;
    groupDiscussion: ReadinessPillarScore;
    profile: ReadinessPillarScore;
  };
  strengths: string[];
  weaknesses: string[];
  topRecommendations: ReadinessRecommendation[];
  history: Array<{
    date: string;
    overallScore: number;
    coveragePercentage: number;
  }>;
}

// 4.3 Dynamic 12-Week Roadmap Types
export interface RoadmapTaskItem {
  id: string;
  weekId: string;
  planId: string;
  title: string;
  description: string;
  category: 'dsa' | 'aptitude' | 'technical' | 'communication' | 'resume' | 'interview' | 'gd' | 'profile';
  taskType: 'daily' | 'milestone' | 'assessment' | 'revision';
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  dayOfWeek: number; // 1-7
  isCompleted: boolean;
  completedAt?: string;
  resources: Array<{ title: string; url?: string; type: string }>;
  sourceModule?: string;
}

export interface RoadmapWeekItem {
  id: string;
  planId: string;
  weekNumber: number;
  objective: string;
  milestoneName: string;
  estimatedHours: number;
  status: 'pending' | 'in_progress' | 'completed';
  tasks: RoadmapTaskItem[];
}

export interface DynamicRoadmapPlan {
  id: string;
  userId: string;
  targetRole: string;
  targetCompany?: string;
  startingReadiness: number;
  currentReadiness: number;
  currentWeek: number;
  totalWeeks: number;
  createdAt: string;
  updatedAt: string;
  weeks: RoadmapWeekItem[];
}
