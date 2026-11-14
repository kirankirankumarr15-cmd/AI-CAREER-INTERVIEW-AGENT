/**
 * Phase 5 — Admin/TPO domain types.
 * Shared by server APIs, aggregation helpers and the admin client.
 */

export const ADMIN_ROLES = [
  'super_admin',
  'institution_admin',
  'tpo',
  'department_coordinator',
  'faculty',
  'student',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type StaffRole = Exclude<AdminRole, 'student'>;

export const PERMISSIONS = [
  'platform.manage',
  'institution.settings.read',
  'institution.settings.write',
  'students.read',
  'students.write',
  'analytics.read',
  'skillgaps.read',
  'import.execute',
  'consent.read',
  'consent.write',
  'assessments.manage',
  'audit.read',
  'users.read',
  'users.manage',
  'roles.manage',
  'reports.export',
  'integrations.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type PermissionScope = 'global' | 'organization' | 'department' | 'self' | 'none';

export interface AdminUserContext {
  userId: string;
  email: string;
  fullName: string;
  role: AdminRole;
  organizationId: string;
  organizationName: string;
  organizationCode?: string;
  departmentId: string | null;
  departmentName: string | null;
  permissions: Record<Permission, boolean>;
  scopes: Record<Permission, PermissionScope>;
  isSuperAdmin: boolean;
  isDevFallback?: boolean;
}

export interface AdminFilters {
  academicYear?: string;
  departmentId?: string | null;
  batch?: string | null;
  course?: string | null;
  assessmentId?: string | null;
  from?: string | null;
  to?: string | null;
  targetRole?: string | null;
  search?: string;
  skillCategory?: 'technical' | 'professional';
  groupBy?: 'department' | 'batch';
  skillId?: string;
  dateRange?: string;
  threshold?: number;
}

export interface FilterOptions {
  academicYears: string[];
  departments: Array<{ id: string; name: string; code?: string | null; studentCount?: number }>;
  batches: string[];
  courses: string[];
  assessments: Array<{ id: string; title: string }>;
  targetRoles: string[];
}

export type ReadinessCategoryKey =
  | 'highly_prepared'
  | 'moderately_prepared'
  | 'needs_improvement'
  | 'insufficient_data';

export interface ReadinessCategoryConfig {
  category_key: ReadinessCategoryKey | string;
  label: string;
  description?: string | null;
  min_score: number | null;
  max_score: number | null;
  min_coverage: number;
  color: string;
  sort_order: number;
  is_active?: boolean;
}

export interface InstitutionSettings {
  organization_id: string;
  academic_year: string;
  readiness_weights: {
    assessments: number;
    resume: number;
    interview: number;
    groupDiscussion: number;
    profile: number;
  };
  readiness_thresholds: Record<string, number>;
  minimum_cohort_size: number;
  readiness_min_coverage: number;
  require_consent_for_drilldown: boolean;
  skill_proficiency_threshold: number;
  skill_min_evidence: number;
  consent_notice_version: string;
  data_retention_months: number;
  allow_staff_export: boolean;
  updated_at?: string;
}

export interface TopicScore {
  topic: string;
  total: number;
  correct: number;
  percentage: number;
}

export interface SelfReportedSkill {
  name: string;
  proficiency: string;
  category: string;
}

export interface StudentSignals {
  assessmentAttempts: Array<{
    id: string;
    assessmentId: string;
    percentage: number;
    submittedAt: string;
  }>;
  interviewSessions: Array<{
    id: string;
    overallScore: number | null;
    technicalScore: number | null;
    communicationScore: number | null;
    problemSolvingScore: number | null;
    createdAt: string;
  }>;
  gdSessions: Array<{ id: string; overallScore: number | null; createdAt: string }>;
  resumeScores: Array<{ id: string; score: number; createdAt: string }>;
  atsScores: Array<{ id: string; score: number; createdAt: string }>;
  readinessSnapshots: Array<{
    overallScore: number;
    coverage: number;
    createdAt: string;
  }>;
}

export interface ReadinessResult {
  score: number | null;
  coverage: number;
  assessedPillars: string[];
  missingPillars: string[];
  category: string;
  isReliable: boolean;
  source: 'snapshot' | 'computed' | 'insufficient_data';
  calculatedAt: string | null;
  evidence: Record<string, { score: number | null; weight: number; assessed: boolean; source: string }>;
}

export interface CohortStudent {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  studentIdNumber: string | null;
  departmentId: string | null;
  departmentName: string;
  batchName: string | null;
  course: string | null;
  academicYear: string | null;
  graduationYear: number | null;
  targetRole: string | null;
  cgpa: number | null;
  verificationStatus: string;
  profileVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastActivityAt: string | null;
  profileCompletion: number;
  hasResume: boolean;
  assessmentCount: number;
  avgAssessmentScore: number | null;
  lastAssessmentAt: string | null;
  interviewCount: number;
  avgInterviewScore: number | null;
  technicalScore: number | null;
  communicationScore: number | null;
  gdScore: number | null;
  resumeScore: number | null;
  topicScores: TopicScore[];
  weakTopics: string[];
  selfReportedSkills: SelfReportedSkill[];
  learningProgress: Array<{ topic: string; status: string }>;
  readiness: ReadinessResult;
  hasConsent: boolean | null;
  flags: string[];
}

export interface CohortData {
  dataSource: 'live' | 'unavailable';
  generatedAt: string;
  students: CohortStudent[];
  totals: {
    profilesInScope: number;
    studentsReturned: number;
    truncated: boolean;
  };
  warnings: string[];
  error?: string;
}

export interface AdminDashboardResponse {
  dataSource: 'live' | 'unavailable';
  generatedAt: string;
  context: {
    organizationName: string;
    organizationCode?: string;
    academicYear: string;
    departmentName: string | null;
    role: AdminRole;
    userName: string;
  };
  filters: AdminFilters;
  filterOptions: FilterOptions;
  stats: {
    totalStudents: number;
    activeStudents: number;
    verifiedProfiles: number;
    completedResumes: number;
    assessmentParticipation: { count: number; percentage: number };
    interviewParticipation: { count: number; percentage: number };
    avgTechnicalScore: number | null;
    avgInterviewScore: number | null;
    readinessMet: number;
    needsPreparation: number;
    readinessReliableCount: number;
  };
  studentOverview: {
    registeredThisMonth: number;
    profileCompletionBuckets: Array<{ label: string; count: number }>;
    verifiedProfiles: number;
    pendingRoster: number;
  };
  readinessDistribution: Array<{
    key: string;
    label: string;
    color: string;
    count: number;
    percentage: number;
  }>;
  assessmentPerformance: {
    avgScore: number | null;
    participationPercentage: number;
    scoreBuckets: Array<{ label: string; count: number }>;
    byAssessment: Array<{ id: string; title: string; attempts: number; avgScore: number | null }>;
  };
  interviewPerformance: {
    avgOverall: number | null;
    avgTechnical: number | null;
    avgCommunication: number | null;
    participationPercentage: number;
  };
  departmentComparison: Array<{
    departmentId: string | null;
    department: string;
    students: number;
    avgReadiness: number | null;
    avgAssessment: number | null;
    avgInterview: number | null;
    readinessMet: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    detail: string;
    timestamp: string;
    href?: string;
  }>;
  actionCenter: Array<{
    key: string;
    label: string;
    description: string;
    count: number;
    href: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  methodology: {
    readinessWeights: InstitutionSettings['readiness_weights'];
    readinessThresholds: Record<string, number>;
    minimumCohortSize: number;
    readinessMinCoverage: number;
    sources: Array<{ metric: string; source: string; weight: number | null; lastUpdated: string }>;
  };
  warnings: string[];
  error?: string;
}

export interface ReadinessAnalyticsResponse {
  dataSource: 'live' | 'unavailable';
  generatedAt: string;
  filters: AdminFilters;
  filterOptions: FilterOptions;
  methodology: {
    weights: InstitutionSettings['readiness_weights'];
    thresholds: Record<string, number>;
    minCoverage: number;
    categories: ReadinessCategoryConfig[];
    sources: Array<{ metric: string; source: string; weight: number | null; description: string }>;
  };
  distribution: Array<{
    key: string;
    label: string;
    color: string;
    count: number;
    percentage: number;
  }>;
  departmentComparison: Array<{
    departmentId: string | null;
    department: string;
    students: number;
    assessed: number;
    avgReadiness: number | null;
    distribution: Record<string, number>;
  }>;
  batchComparison: Array<{
    batch: string;
    students: number;
    assessed: number;
    avgReadiness: number | null;
  }>;
  monthlyTrends: Array<{ month: string; avgReadiness: number | null; coverage: number | null; snapshotCount: number }>;
  participation: {
    assessment: { count: number; percentage: number };
    interview: { count: number; percentage: number };
    resume: { count: number; percentage: number };
  };
  students: Array<{
    id: string | null;
    maskedId: string;
    name: string | null;
    department: string;
    batch: string | null;
    graduationYear: number | null;
    course: string | null;
    profileCompletion: number;
    assessmentCount: number;
    interviewCount: number;
    readinessScore: number | null;
    readinessCoverage: number;
    readinessCategory: string;
    weakTopics: string[];
    consentGranted: boolean | null;
    consentRequired: boolean;
  }>;
  totals: { students: number; assessed: number; insufficientData: number; consentSuppressed: number };
  warnings: string[];
  error?: string;
}

export type SkillCategory = 'technical' | 'professional';
export type SkillStatus = 'proficient' | 'needs_improvement' | 'not_assessed' | 'insufficient_evidence';

export interface SkillCatalogItem {
  id: string;
  organization_id: string | null;
  name: string;
  category: SkillCategory;
  aliases: string[];
  is_active: boolean;
  sort_order: number;
}

export interface SkillCell {
  value: number | null;
  assessedCount: number | null;
  proficientCount: number | null;
  needsImprovementCount: number | null;
  notAssessedCount: number | null;
  insufficientCount: number | null;
  suppressed: boolean;
}

export interface SkillHeatmapRow {
  skillId: string;
  skill: string;
  category: SkillCategory;
  cells: Record<string, SkillCell>;
  overall: SkillCell;
}

export interface SkillGapResponse {
  dataSource: 'live' | 'unavailable';
  generatedAt: string;
  filters: AdminFilters;
  groupBy: 'department' | 'batch';
  filterOptions: FilterOptions;
  cohorts: Array<{ key: string; label: string; studentCount: number }>;
  skills: SkillHeatmapRow[];
  weakest: Array<{ skill: string; category: SkillCategory; value: number; assessedCount: number }>;
  strongest: Array<{ skill: string; category: SkillCategory; value: number; assessedCount: number }>;
  privacy: {
    minimumCohortSize: number;
    threshold: number;
    minEvidence: number;
    suppressedCells: number;
  };
  warnings: string[];
  error?: string;
}

export type SkillGapHeatmapResponse = SkillGapResponse;

export interface SkillDrilldownResponse {
  dataSource: 'live' | 'unavailable';
  generatedAt: string;
  skill: SkillCatalogItem | null;
  threshold: number;
  minEvidence: number;
  students: Array<{
    id: string | null;
    maskedId: string;
    name: string | null;
    department: string;
    batch: string | null;
    status: SkillStatus;
    score: number | null;
    source: 'assessment' | 'interview' | 'self_report' | 'none';
    evidenceCount: number;
    learningStatus: string | null;
    practiceTopics: string[];
  }>;
  counts: Record<SkillStatus, number>;
  warning?: string;
}
