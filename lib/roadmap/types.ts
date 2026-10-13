export type SkillGapStatus = 'have' | 'partial' | 'missing';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type SourceType =
  | 'from sources'
  | 'AI-suggested'
  | 'CareerPilot Practice'
  | 'CareerPilot Mock Interview'
  | 'CareerPilot Quiz';

export interface RoadmapSourceItem {
  id?: string;
  url: string;
  title: string;
  fetchedAt: string;
}

export interface RoleRequirements {
  cacheId?: string;
  role: string;
  roleKey: string;
  fetchedAt: string;
  expiresAt: string;
  isLive: boolean;
  coreSkills: string[];
  niceToHaveSkills: string[];
  toolsAndFrameworks: string[];
  projectIdeas: Array<{
    title: string;
    description: string;
    skills: string[];
  }>;
  interviewTopics: string[];
  certifications: string[];
  fresherExpectations: string[];
  sources: RoadmapSourceItem[];
}

export interface SkillGapItem {
  skill: string;
  category: 'core' | 'tool' | 'framework' | 'interview';
  status: SkillGapStatus;
  evidence?: string;
  importance: TaskPriority;
}

export interface SkillGapAnalysis {
  role: string;
  matchScore: number; // 0 - 100
  totalRequired: number;
  haveCount: number;
  partialCount: number;
  missingCount: number;
  items: SkillGapItem[];
}

export interface RoadmapTask {
  id: string;
  phaseId: string;
  roadmapId: string;
  userId: string;
  title: string;
  description: string;
  estHours: number;
  priority: TaskPriority;
  linkedSkill: string;
  resourceUrl?: string;
  sourceType: SourceType;
  status: TaskStatus;
  dueWeek: number;
  completedAt?: string | null;
}

export interface RoadmapPhase {
  id: string;
  roadmapId: string;
  orderIndex: number;
  title: string;
  summary: string;
  tasks: RoadmapTask[];
}

export interface StudentRoadmap {
  id: string;
  userId: string;
  role: string;
  targetCompany?: string | null;
  timelineWeeks: number;
  status: 'active' | 'completed' | 'archived';
  generatedAt: string;
  basedOnCacheId?: string | null;
  phases: RoadmapPhase[];
  skillGap?: SkillGapAnalysis;
  sources?: RoadmapSourceItem[];
  progressPercent: number;
}
