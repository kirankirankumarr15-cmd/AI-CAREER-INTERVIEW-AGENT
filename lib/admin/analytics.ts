import type {
  CohortStudent,
  InstitutionSettings,
  ReadinessCategoryConfig,
  ReadinessResult,
  SkillCatalogItem,
  SkillCell,
  SkillHeatmapRow,
  SkillStatus,
  TopicScore,
} from './types';

export function clampScore(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Math.min(100, Math.max(0, Number(value)));
}

/** Same methodology as the student profile completion, expressed against institutional data. */
export function computeProfileCompletion(input: {
  fullName?: string | null;
  email?: string | null;
  departmentId?: string | null;
  branch?: string | null;
  cgpa?: number | null;
  targetRole?: string | null;
  skillsCount: number;
  projectsCount: number;
  educationCount: number;
  hasLinks: boolean;
}): number {
  let score = 0;
  if (input.fullName && input.email) score += 20;
  if (input.departmentId || input.branch || input.educationCount > 0) score += 20;
  if (input.cgpa && input.cgpa > 0) score += 10;
  if (input.targetRole) score += 20;
  if (input.skillsCount >= 3) score += 20;
  else if (input.skillsCount > 0) score += 10;
  if (input.projectsCount > 0 || input.hasLinks) score += 10;
  return Math.min(100, Math.max(0, score));
}

export function average(values: Array<number | null | undefined>): number | null {
  const clean = values.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(Number(v))).map(Number);
  if (!clean.length) return null;
  return Number((clean.reduce((sum, value) => sum + value, 0) / clean.length).toFixed(2));
}

export function percentage(count: number, total: number): number {
  if (!total) return 0;
  return Number(((count / total) * 100).toFixed(1));
}

export function categorizeReadiness(
  score: number | null,
  coverage: number,
  categories: ReadinessCategoryConfig[],
  minCoverage: number
): string {
  if (score === null || coverage < minCoverage) return 'insufficient_data';
  const ordered = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  for (const category of ordered) {
    if (category.category_key === 'insufficient_data') continue;
    const min = category.min_score ?? -1;
    const max = category.max_score ?? 100.01;
    if (score >= min && score <= max && coverage >= category.min_coverage) {
      return String(category.category_key);
    }
  }
  return 'insufficient_data';
}

export interface ReadinessInputs {
  assessmentScore: number | null;
  resumeScore: number | null;
  interviewScore: number | null;
  gdScore: number | null;
  profileScore: number | null;
}

/**
 * Computes a transparent, configurable readiness index.
 * Missing pillars are excluded from the denominator (never treated as zero).
 * A result below the configured coverage threshold is explicitly marked unreliable.
 */
export function computeReadiness(
  inputs: ReadinessInputs,
  weights: InstitutionSettings['readiness_weights'],
  minCoverage: number,
  categories: ReadinessCategoryConfig[] = [],
  snapshot?: { overallScore: number; coverage: number; createdAt: string } | null
): ReadinessResult {
  if (snapshot && clampScore(snapshot.overallScore) !== null) {
    const score = clampScore(snapshot.overallScore)!;
    const coverage = clampScore(snapshot.coverage) ?? 0;
    return {
      score,
      coverage,
      assessedPillars: coverage >= minCoverage ? ['snapshot'] : [],
      missingPillars: coverage >= minCoverage ? [] : ['sufficient_coverage'],
      category: categorizeReadiness(score, coverage, categories, minCoverage),
      isReliable: coverage >= minCoverage,
      source: coverage >= minCoverage ? 'snapshot' : 'insufficient_data',
      calculatedAt: snapshot.createdAt,
      evidence: {
        snapshot: { score, weight: 100, assessed: true, source: 'readiness_snapshots' },
      },
    };
  }

  const pillars: Array<{
    key: keyof InstitutionSettings['readiness_weights'];
    label: string;
    score: number | null;
    weight: number;
    source: string;
  }> = [
    { key: 'assessments', label: 'Assessments', score: clampScore(inputs.assessmentScore), weight: Number(weights.assessments), source: 'completed assessment attempts' },
    { key: 'resume', label: 'Resume', score: clampScore(inputs.resumeScore), weight: Number(weights.resume), source: 'ATS analyses / resume scores' },
    { key: 'interview', label: 'Interview', score: clampScore(inputs.interviewScore), weight: Number(weights.interview), source: 'completed mock interviews' },
    { key: 'groupDiscussion', label: 'Group Discussion', score: clampScore(inputs.gdScore), weight: Number(weights.groupDiscussion), source: 'completed group discussions' },
    { key: 'profile', label: 'Profile', score: clampScore(inputs.profileScore), weight: Number(weights.profile), source: 'verified profile completion' },
  ];

  const assessed = pillars.filter((p) => p.score !== null && p.weight > 0);
  const assessedWeight = assessed.reduce((sum, p) => sum + p.weight, 0);
  const weighted = assessed.reduce((sum, p) => sum + (p.score as number) * p.weight, 0);
  const coverage = Number(assessedWeight.toFixed(1));
  const score = assessedWeight > 0 ? Number((weighted / assessedWeight).toFixed(2)) : null;

  const evidence = Object.fromEntries(
    pillars.map((p) => [
      p.key,
      {
        score: p.score,
        weight: p.weight,
        assessed: p.score !== null,
        source: p.source,
      },
    ])
  );

  const reliable = score !== null && assessed.length >= 2 && coverage >= minCoverage;
  const category = reliable
    ? categorizeReadiness(score, coverage, categories, minCoverage)
    : 'insufficient_data';

  return {
    score: reliable ? score : score,
    coverage,
    assessedPillars: assessed.map((p) => p.key),
    missingPillars: pillars.filter((p) => p.score === null).map((p) => p.key),
    category,
    isReliable: reliable,
    source: reliable ? 'computed' : 'insufficient_data',
    calculatedAt: new Date().toISOString(),
    evidence,
  };
}

export function buildDistribution(
  students: CohortStudent[],
  categories: ReadinessCategoryConfig[]
): Array<{ key: string; label: string; color: string; count: number; percentage: number }> {
  const counts = new Map<string, number>();
  for (const student of students) {
    counts.set(student.readiness.category, (counts.get(student.readiness.category) || 0) + 1);
  }
  return categories.map((category) => ({
    key: String(category.category_key),
    label: category.label,
    color: category.color,
    count: counts.get(String(category.category_key)) || 0,
    percentage: percentage(counts.get(String(category.category_key)) || 0, students.length),
  }));
}

export function buildDepartmentComparison(students: CohortStudent[]) {
  const groups = new Map<
    string,
    { departmentId: string | null; department: string; students: CohortStudent[] }
  >();
  for (const student of students) {
    const key = student.departmentId || 'unassigned';
    const group = groups.get(key) || {
      departmentId: student.departmentId,
      department: student.departmentName || 'Unassigned',
      students: [],
    };
    group.students.push(student);
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => {
      const reliable = group.students.filter((s) => s.readiness.isReliable);
      const assessed = group.students.filter((s) => s.assessmentCount > 0);
      const interviewed = group.students.filter((s) => s.interviewCount > 0);
      return {
        departmentId: group.departmentId,
        department: group.department,
        students: group.students.length,
        assessed: reliable.length,
        avgReadiness: average(reliable.map((s) => s.readiness.score)),
        avgAssessment: average(assessed.map((s) => s.avgAssessmentScore)),
        avgInterview: average(interviewed.map((s) => s.avgInterviewScore)),
        readinessMet: reliable.filter((s) => s.readiness.category === 'highly_prepared').length,
        distribution: reliable.reduce<Record<string, number>>((acc, student) => {
          acc[student.readiness.category] = (acc[student.readiness.category] || 0) + 1;
          return acc;
        }, {}),
      };
    })
    .sort((a, b) => a.department.localeCompare(b.department));
}

export function buildBatchComparison(students: CohortStudent[]) {
  const groups = new Map<string, CohortStudent[]>();
  for (const student of students) {
    const key = student.batchName || 'Unassigned batch';
    groups.set(key, [...(groups.get(key) || []), student]);
  }
  return Array.from(groups.entries())
    .map(([batch, group]) => {
      const reliable = group.filter((s) => s.readiness.isReliable);
      return {
        batch,
        students: group.length,
        assessed: reliable.length,
        avgReadiness: average(reliable.map((s) => s.readiness.score)),
      };
    })
    .sort((a, b) => a.batch.localeCompare(b.batch));
}

export function buildMonthlyTrends(
  snapshots: Array<{ userId: string; overallScore: number; coverage: number; createdAt: string }>,
  months = 6
): Array<{ month: string; avgReadiness: number | null; coverage: number | null; snapshotCount: number }> {
  const now = new Date();
  const buckets = new Map<string, Array<{ score: number; coverage: number }>>();
  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(date.toISOString().slice(0, 7), []);
  }
  for (const snapshot of snapshots) {
    const month = String(snapshot.createdAt).slice(0, 7);
    if (!buckets.has(month)) continue;
    buckets.get(month)!.push({ score: snapshot.overallScore, coverage: snapshot.coverage });
  }
  return Array.from(buckets.entries()).map(([month, values]) => ({
    month,
    avgReadiness: average(values.map((v) => v.score)),
    coverage: average(values.map((v) => v.coverage)),
    snapshotCount: values.length,
  }));
}

export function buildProfileCompletionBuckets(students: CohortStudent[]) {
  const buckets = [
    { label: '0–25%', min: 0, max: 25 },
    { label: '26–50%', min: 26, max: 50 },
    { label: '51–75%', min: 51, max: 75 },
    { label: '76–100%', min: 76, max: 100 },
  ];
  return buckets.map((bucket) => ({
    label: bucket.label,
    count: students.filter((s) => s.profileCompletion >= bucket.min && s.profileCompletion <= bucket.max).length,
  }));
}

export function buildAssessmentBuckets(students: CohortStudent[]) {
  const buckets = [
    { label: '0–39%', min: 0, max: 39.99 },
    { label: '40–59%', min: 40, max: 59.99 },
    { label: '60–74%', min: 60, max: 74.99 },
    { label: '75–100%', min: 75, max: 100 },
  ];
  return buckets.map((bucket) => ({
    label: bucket.label,
    count: students.filter(
      (s) => s.avgAssessmentScore !== null && s.avgAssessmentScore >= bucket.min && s.avgAssessmentScore <= bucket.max
    ).length,
  }));
}

export function latestTopicScores(
  scores: Array<{ topic: string; total: number; correct: number }>
): TopicScore[] {
  const byTopic = new Map<string, { total: number; correct: number }>();
  for (const score of scores) {
    if (!score.topic) continue;
    const existing = byTopic.get(score.topic) || { total: 0, correct: 0 };
    existing.total += score.total;
    existing.correct += score.correct;
    byTopic.set(score.topic, existing);
  }
  return Array.from(byTopic.entries())
    .map(([topic, value]) => ({
      topic,
      total: value.total,
      correct: value.correct,
      percentage: value.total ? Number(((value.correct / value.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => a.percentage - b.percentage);
}

export function topWeakTopics(scores: TopicScore[], limit = 3): string[] {
  return scores
    .filter((score) => score.total > 0 && score.percentage < 60)
    .slice(0, limit)
    .map((score) => score.topic);
}

// ============================================================================
// Skill evidence
// ============================================================================

export function normalizeSkillName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesSkill(text: string, skill: Pick<SkillCatalogItem, 'name' | 'aliases'>): boolean {
  const normalizedText = normalizeSkillName(text);
  const candidates = [skill.name, ...(skill.aliases || [])].map(normalizeSkillName).filter(Boolean);
  const textTokens = new Set(normalizedText.split(' '));

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.length <= 3 && !candidate.includes('+') && !candidate.includes('.')) {
      if (textTokens.has(candidate)) return true;
    } else if (normalizedText.includes(candidate)) {
      return true;
    }
  }
  return false;
}

const PROFICIENCY_SCORE: Record<string, number> = {
  beginner: 35,
  intermediate: 60,
  advanced: 80,
  expert: 95,
};

export function proficiencyToScore(proficiency: string): number {
  return PROFICIENCY_SCORE[proficiency.toLowerCase()] ?? 50;
}

export interface SkillEvaluation {
  status: SkillStatus;
  score: number | null;
  source: 'assessment' | 'interview' | 'self_report' | 'none';
  evidenceCount: number;
}

export function evaluateSkillForStudent(
  student: CohortStudent,
  skill: SkillCatalogItem,
  threshold: number,
  minEvidence: number
): SkillEvaluation {
  const matchingTopics = student.topicScores.filter((topic) => matchesSkill(topic.topic, skill));
  const totalQuestions = matchingTopics.reduce((sum, topic) => sum + topic.total, 0);
  const correctQuestions = matchingTopics.reduce((sum, topic) => sum + topic.correct, 0);

  if (totalQuestions >= minEvidence) {
    const score = Number(((correctQuestions / totalQuestions) * 100).toFixed(1));
    return {
      status: score >= threshold ? 'proficient' : 'needs_improvement',
      score,
      source: 'assessment',
      evidenceCount: totalQuestions,
    };
  }

  if (skill.category === 'professional' && student.interviewCount > 0) {
    let score: number | null = null;
    if (/communication/i.test(skill.name)) {
      score = student.communicationScore;
    } else if (/problem solving/i.test(skill.name) || /logical/i.test(skill.name)) {
      score = student.technicalScore;
    } else if (/group|discussion|gd/i.test(skill.name)) {
      score = student.gdScore;
    } else {
      score = student.avgInterviewScore;
    }
    if (score !== null && score !== undefined) {
      return {
        status: score >= threshold ? 'proficient' : 'needs_improvement',
        score,
        source: 'interview',
        evidenceCount: student.interviewCount,
      };
    }
  }

  const selfReported = student.selfReportedSkills.find((s) => matchesSkill(s.name, skill));
  if (selfReported) {
    const score = proficiencyToScore(selfReported.proficiency);
    return {
      status: score >= threshold ? 'proficient' : 'needs_improvement',
      score,
      source: 'self_report',
      evidenceCount: 1,
    };
  }

  if (totalQuestions > 0) {
    const score = Number(((correctQuestions / totalQuestions) * 100).toFixed(1));
    return {
      status: 'insufficient_evidence',
      score,
      source: 'assessment',
      evidenceCount: totalQuestions,
    };
  }

  return { status: 'not_assessed', score: null, source: 'none', evidenceCount: 0 };
}

function emptyCell(): SkillCell {
  return {
    value: null,
    assessedCount: null,
    proficientCount: null,
    needsImprovementCount: null,
    notAssessedCount: null,
    insufficientCount: null,
    suppressed: true,
  };
}

export function aggregateSkillCell(
  students: CohortStudent[],
  skill: SkillCatalogItem,
  threshold: number,
  minEvidence: number,
  minimumCohortSize: number
): SkillCell {
  if (students.length < minimumCohortSize) return emptyCell();

  const evaluations = students.map((student) => evaluateSkillForStudent(student, skill, threshold, minEvidence));
  const proficient = evaluations.filter((e) => e.status === 'proficient');
  const needs = evaluations.filter((e) => e.status === 'needs_improvement');
  const insufficient = evaluations.filter((e) => e.status === 'insufficient_evidence');
  const notAssessed = evaluations.filter((e) => e.status === 'not_assessed');
  const assessed = [...proficient, ...needs];

  if (assessed.length < minimumCohortSize) {
    return {
      ...emptyCell(),
      suppressed: true,
      notAssessedCount: notAssessed.length,
      insufficientCount: insufficient.length,
    };
  }

  return {
    value: average(assessed.map((e) => e.score)),
    assessedCount: assessed.length,
    proficientCount: proficient.length,
    needsImprovementCount: needs.length,
    notAssessedCount: notAssessed.length,
    insufficientCount: insufficient.length,
    suppressed: false,
  };
}

export function buildSkillHeatmap(
  students: CohortStudent[],
  skills: SkillCatalogItem[],
  cohorts: Array<{ key: string; label: string; students: CohortStudent[] }>,
  threshold: number,
  minEvidence: number,
  minimumCohortSize: number
): SkillHeatmapRow[] {
  return skills.map((skill) => {
    const cells = Object.fromEntries(
      cohorts.map((cohort) => [
        cohort.key,
        aggregateSkillCell(cohort.students, skill, threshold, minEvidence, minimumCohortSize),
      ])
    );
    return {
      skillId: skill.id,
      skill: skill.name,
      category: skill.category,
      cells,
      overall: aggregateSkillCell(students, skill, threshold, minEvidence, minimumCohortSize),
    };
  });
}

export function practiceTopicsForSkill(skill: SkillCatalogItem): string[] {
  const specific: Record<string, string[]> = {
    'data structures': ['Arrays, strings and hashing', 'Trees, graphs and traversal', 'Stacks, queues and heaps'],
    algorithms: ['Complexity analysis', 'Sorting and searching', 'Dynamic programming patterns'],
    dbms: ['Normalization and keys', 'Joins and subqueries', 'Transactions and indexing'],
    sql: ['SELECT and JOIN practice', 'Aggregation and window functions', 'Query optimization basics'],
    'operating systems': ['Processes and scheduling', 'Memory management', 'Deadlocks and synchronization'],
    'computer networks': ['OSI and TCP/IP layers', 'TCP handshake and congestion control', 'DNS, HTTP and security'],
    communication: ['STAR answer structure', 'Concise technical explanations', 'Active listening drills'],
    'problem solving': ['Structured problem decomposition', 'Estimation and constraints', 'Debugging walkthroughs'],
    'interview skills': ['Behavioral question bank', 'Project deep-dive practice', 'Mock interview with feedback'],
    'logical reasoning': ['Series and patterns', 'Syllogisms and deductions', 'Data interpretation'],
  };
  const key = normalizeSkillName(skill.name);
  return specific[key] || [
    `${skill.name} fundamentals`,
    `${skill.name} guided practice set`,
    `${skill.name} interview questions`,
  ];
}

export function maskStudentId(id: string): string {
  const suffix = id.replace(/-/g, '').slice(-4).toUpperCase();
  return `STU-****${suffix}`;
}

export function buildSkillDrilldown(
  students: CohortStudent[],
  skill: SkillCatalogItem,
  threshold: number,
  minEvidence: number
) {
  const rows = students.map((student) => {
    const evaluation = evaluateSkillForStudent(student, skill, threshold, minEvidence);
    const learning = student.learningProgress.find((item) => matchesSkill(item.topic, skill));
    return {
      id: student.id,
      maskedId: maskStudentId(student.id),
      name: student.fullName,
      department: student.departmentName,
      batch: student.batchName,
      status: evaluation.status,
      score: evaluation.score,
      source: evaluation.source,
      evidenceCount: evaluation.evidenceCount,
      learningStatus: learning?.status || null,
      practiceTopics: practiceTopicsForSkill(skill),
    };
  });

  const counts: Record<SkillStatus, number> = {
    proficient: rows.filter((r) => r.status === 'proficient').length,
    needs_improvement: rows.filter((r) => r.status === 'needs_improvement').length,
    not_assessed: rows.filter((r) => r.status === 'not_assessed').length,
    insufficient_evidence: rows.filter((r) => r.status === 'insufficient_evidence').length,
  };

  return { rows, counts };
}
