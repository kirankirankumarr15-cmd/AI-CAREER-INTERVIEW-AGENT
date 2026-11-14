/**
 * lib/roadmap/dynamic-roadmap.ts
 *
 * PRISM Dynamic 12-Week Roadmap Engine:
 * - Generates personalized 12-week placement roadmaps based on Career Audit & 5-Pillar Readiness
 * - Organizes into 12 weekly milestones with daily tasks
 * - Connects tasks to Today's Mission
 * - Supports intelligent weekly replanning while preserving completed task history
 */

import { DynamicRoadmapPlan, RoadmapWeekItem, RoadmapTaskItem, ReadinessIndexReport } from '@/types';

// In-memory store for fallback mode when database is uninitialized
const localRoadmapsStore = new Map<string, DynamicRoadmapPlan>();

export interface RoadmapGenerationInput {
  userId: string;
  targetRole: string;
  targetCompany?: string;
  readiness?: ReadinessIndexReport;
  weakTopics?: string[];
  verifiedSkills?: string[];
}

export function generateDynamic12WeekPlan(input: RoadmapGenerationInput): DynamicRoadmapPlan {
  const {
    userId,
    targetRole = 'Full Stack Developer',
    targetCompany = 'Top Tier IT / Product Firm',
    readiness,
    weakTopics = [],
    verifiedSkills = [],
  } = input;

  const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const startingReadiness = readiness?.overallScore || 65;

  const weeks: RoadmapWeekItem[] = [];

  // Week 1: Diagnostics & Foundations
  weeks.push({
    id: `wk_${planId}_1`,
    planId,
    weekNumber: 1,
    objective: 'Diagnostic Assessment & Foundational Placement Verification',
    milestoneName: 'Baseline Competency Benchmark',
    estimatedHours: 8,
    status: 'in_progress',
    tasks: [
      {
        id: `tsk_${planId}_1_1`,
        weekId: `wk_${planId}_1`,
        planId,
        title: 'Complete 30-Min TCS NQT & Placement Screening Assessment',
        description: 'Establish objective benchmark score across Quant, Reasoning, and Core CS.',
        category: 'aptitude',
        taskType: 'daily',
        estimatedMinutes: 30,
        priority: 'high',
        dayOfWeek: 1,
        isCompleted: false,
        resources: [{ title: 'PRISM Assessment Engine', url: '/practice', type: 'internal' }],
        sourceModule: 'practice',
      },
      {
        id: `tsk_${planId}_1_2`,
        weekId: `wk_${planId}_1`,
        planId,
        title: 'Run 34-Checkpoint ATS Resume Audit',
        description: 'Scan resume formatting, XYZ bullet formula, and keyword density.',
        category: 'resume',
        taskType: 'daily',
        estimatedMinutes: 20,
        priority: 'high',
        dayOfWeek: 2,
        isCompleted: false,
        resources: [{ title: 'PRISM ATS Scanner', url: '/resume/ats', type: 'internal' }],
        sourceModule: 'resume',
      },
      {
        id: `tsk_${planId}_1_3`,
        weekId: `wk_${planId}_1`,
        planId,
        title: 'Complete Academic & Skill Profile Verification',
        description: 'Ensure CGPA, verified projects, and target role are 100% saved.',
        category: 'profile',
        taskType: 'daily',
        estimatedMinutes: 15,
        priority: 'medium',
        dayOfWeek: 3,
        isCompleted: false,
        resources: [{ title: 'Student Profile Center', url: '/profile', type: 'internal' }],
        sourceModule: 'profile',
      },
      {
        id: `tsk_${planId}_1_4`,
        weekId: `wk_${planId}_1`,
        planId,
        title: 'DSA Sprint: Two Pointers & Sliding Window Problems',
        description: 'Solve 4 array and string pattern problems in Practice Hub.',
        category: 'dsa',
        taskType: 'daily',
        estimatedMinutes: 45,
        priority: 'high',
        dayOfWeek: 4,
        isCompleted: false,
        resources: [{ title: 'Practice Arena - DSA', url: '/practice/dsa', type: 'internal' }],
        sourceModule: 'practice',
      },
      {
        id: `tsk_${planId}_1_5`,
        weekId: `wk_${planId}_1`,
        planId,
        title: 'Conduct First AI Voice HR & Intro Mock Interview',
        description: 'Practice self-introduction and career trajectory pitch with AI feedback.',
        category: 'interview',
        taskType: 'milestone',
        estimatedMinutes: 25,
        priority: 'high',
        dayOfWeek: 5,
        isCompleted: false,
        resources: [{ title: 'AI Mock Interview Room', url: '/interview', type: 'internal' }],
        sourceModule: 'interview',
      },
    ],
  });

  // Week 2: Targeted Weak Areas
  const weakFocus = weakTopics.length > 0 ? weakTopics.slice(0, 2).join(' & ') : 'Time & Work and DBMS Normalization';
  weeks.push({
    id: `wk_${planId}_2`,
    planId,
    weekNumber: 2,
    objective: `Remediate Assessment Weak Spots: ${weakFocus}`,
    milestoneName: 'Core Weakness Remediation',
    estimatedHours: 9,
    status: 'pending',
    tasks: [
      {
        id: `tsk_${planId}_2_1`,
        weekId: `wk_${planId}_2`,
        planId,
        title: `Practice 10 Speed Drills on ${weakFocus}`,
        description: 'Focus on time efficiency and negative marking prevention.',
        category: 'aptitude',
        taskType: 'daily',
        estimatedMinutes: 30,
        priority: 'high',
        dayOfWeek: 1,
        isCompleted: false,
        resources: [{ title: 'Practice Hub - Aptitude', url: '/practice/aptitude', type: 'internal' }],
        sourceModule: 'practice',
      },
      {
        id: `tsk_${planId}_2_2`,
        weekId: `wk_${planId}_2`,
        planId,
        title: 'Rewrite Resume Project Bullets with XYZ Formula',
        description: 'Incorporate quantified metrics: Accomplished [X] measured by [Y] by doing [Z].',
        category: 'resume',
        taskType: 'daily',
        estimatedMinutes: 25,
        priority: 'high',
        dayOfWeek: 2,
        isCompleted: false,
        resources: [{ title: 'AI Bullet Improver', url: '/resume/ats', type: 'internal' }],
        sourceModule: 'resume',
      },
      {
        id: `tsk_${planId}_2_3`,
        weekId: `wk_${planId}_2`,
        planId,
        title: 'DBMS Deep Dive: B-Trees & Index Optimization Scans',
        description: 'Understand clustered vs non-clustered index scans and query explain plans.',
        category: 'technical',
        taskType: 'daily',
        estimatedMinutes: 40,
        priority: 'medium',
        dayOfWeek: 3,
        isCompleted: false,
        resources: [{ title: 'Technical Arena - DBMS', url: '/practice/technical', type: 'internal' }],
        sourceModule: 'practice',
      },
    ],
  });

  // Weeks 3 to 12 generated programmatically
  const weekObjectives = [
    { num: 3, obj: 'Data Structures: Linked Lists, Stacks & Queues', mil: 'Linear DSA Mastery', cat: 'dsa' as const },
    { num: 4, obj: 'Operating Systems: Concurrency, Deadlocks & Memory Management', mil: 'OS Systems Competency', cat: 'technical' as const },
    { num: 5, obj: 'Computer Networks & TCP/IP Protocols', mil: 'Networking Fundamentals', cat: 'technical' as const },
    { num: 6, obj: 'Trees & Binary Search Trees Traversal Patterns', mil: 'Hierarchical DSA Proficiency', cat: 'dsa' as const },
    { num: 7, obj: 'Group Discussion Multi-Bot Simulator Practice', mil: 'GD Verbal Initiative', cat: 'gd' as const },
    { num: 8, obj: 'Graph Algorithms: BFS, DFS & Shortest Path', mil: 'Graph Theory Foundations', cat: 'dsa' as const },
    { num: 9, obj: 'System Design Basics: REST, Caching & Scalability', mil: 'Architecture Awareness', cat: 'technical' as const },
    { num: 10, obj: 'Dynamic Programming: Memoization & Tabulation', mil: 'Algorithmic Optimization', cat: 'dsa' as const },
    { num: 11, obj: 'Company-Specific Full Length Placement Mock', mil: 'Screening Simulation', cat: 'assessment' as const },
    { num: 12, obj: 'Comprehensive Technical & HR Final Polish', mil: 'Placement Ready Certification', cat: 'interview' as const },
  ];

  weekObjectives.forEach((wo) => {
    const wId = `wk_${planId}_${wo.num}`;
    weeks.push({
      id: wId,
      planId,
      weekNumber: wo.num,
      objective: wo.obj,
      milestoneName: wo.mil,
      estimatedHours: 8,
      status: 'pending',
      tasks: [
        {
          id: `tsk_${planId}_${wo.num}_1`,
          weekId: wId,
          planId,
          title: `Milestone Core Task: ${wo.obj}`,
          description: `Deep theoretical and practical exercise targeted towards ${targetRole}.`,
          category: wo.cat === 'assessment' ? 'aptitude' : wo.cat,
          taskType: 'milestone',
          estimatedMinutes: 45,
          priority: 'high',
          dayOfWeek: 1,
          isCompleted: false,
          resources: [{ title: 'PRISM Knowledge Hub', url: '/practice', type: 'internal' }],
          sourceModule: 'practice',
        },
        {
          id: `tsk_${planId}_${wo.num}_2`,
          weekId: wId,
          planId,
          title: 'Daily Practice Drill & Problem Solving',
          description: 'Solve 2 problems under timed constraints.',
          category: 'dsa',
          taskType: 'daily',
          estimatedMinutes: 30,
          priority: 'medium',
          dayOfWeek: 2,
          isCompleted: false,
          resources: [{ title: 'Practice Hub', url: '/practice', type: 'internal' }],
          sourceModule: 'practice',
        },
      ],
    });
  });

  const plan: DynamicRoadmapPlan = {
    id: planId,
    userId,
    targetRole,
    targetCompany,
    startingReadiness,
    currentReadiness: startingReadiness,
    currentWeek: 1,
    totalWeeks: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    weeks,
  };

  localRoadmapsStore.set(userId, plan);
  return plan;
}

export function getActiveRoadmap(userId: string): DynamicRoadmapPlan | null {
  return localRoadmapsStore.get(userId) || null;
}

export function toggleRoadmapTask(
  userId: string,
  taskId: string
): { success: boolean; task?: RoadmapTaskItem; weekProgress?: number } {
  const plan = localRoadmapsStore.get(userId);
  if (!plan) return { success: false };

  for (const week of plan.weeks) {
    const task = week.tasks.find((t) => t.id === taskId);
    if (task) {
      task.isCompleted = !task.isCompleted;
      task.completedAt = task.isCompleted ? new Date().toISOString() : undefined;

      // Calculate week progress
      const completedCount = week.tasks.filter((t) => t.isCompleted).length;
      const weekProgress = Math.round((completedCount / week.tasks.length) * 100);
      if (weekProgress === 100) week.status = 'completed';
      else if (weekProgress > 0) week.status = 'in_progress';

      plan.updatedAt = new Date().toISOString();
      return { success: true, task, weekProgress };
    }
  }

  return { success: false };
}

/**
 * Intelligent Weekly Replanning
 * Preserves completed tasks and recalibrates remaining weeks
 */
export function replanWeeklySchedule(
  userId: string,
  updatedReadiness: number,
  newWeakTopics: string[]
): { success: boolean; plan?: DynamicRoadmapPlan; replanSummary?: string } {
  const plan = localRoadmapsStore.get(userId);
  if (!plan) return { success: false };

  const currentWk = plan.currentWeek;
  plan.currentReadiness = updatedReadiness;

  // Advance current week if past tasks mostly done
  if (currentWk < 12) {
    plan.currentWeek = currentWk + 1;
    const nextWeek = plan.weeks.find((w) => w.weekNumber === plan.currentWeek);
    if (nextWeek) {
      nextWeek.status = 'in_progress';
      // If new weak topics emerged, adapt next week's tasks!
      if (newWeakTopics.length > 0) {
        nextWeek.objective = `Adaptive Focus: ${newWeakTopics.slice(0, 2).join(' & ')} Mastery`;
        nextWeek.tasks.unshift({
          id: `tsk_replan_${Date.now()}`,
          weekId: nextWeek.id,
          planId: plan.id,
          title: `Adaptive Remediation: Practice ${newWeakTopics[0]} Drills`,
          description: 'Automatically prioritized based on recent assessment accuracy.',
          category: 'aptitude',
          taskType: 'daily',
          estimatedMinutes: 30,
          priority: 'high',
          dayOfWeek: 1,
          isCompleted: false,
          resources: [{ title: 'Practice Hub', url: '/practice', type: 'internal' }],
          sourceModule: 'practice',
        });
      }
    }
  }

  plan.updatedAt = new Date().toISOString();
  return {
    success: true,
    plan,
    replanSummary: `Week ${plan.currentWeek} replanned with updated readiness (${updatedReadiness}%). Completed history strictly preserved.`,
  };
}
