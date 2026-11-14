import type {
  AdminFilters,
  AdminUserContext,
  CohortData,
  CohortStudent,
  InstitutionSettings,
  ReadinessCategoryConfig,
  SelfReportedSkill,
  TopicScore,
} from './types';
import {
  average,
  computeProfileCompletion,
  computeReadiness,
  latestTopicScores,
  topWeakTopics,
} from './analytics';
import { loadInstitutionSettings, loadReadinessCategories, splitIntoChunks } from './filters';

type AnyClient = any;
const LOW_SIGNAL_WARNINGS = new Set<string>();

export async function safeSelect(
  supabase: AnyClient,
  table: string,
  columns: string,
  apply: (query: any) => any,
  warnings: string[]
): Promise<any[]> {
  try {
    const query = apply(supabase.from(table).select(columns));
    const { data, error } = await query;
    if (error) {
      const message = `${table}: ${error.message}`;
      if (!LOW_SIGNAL_WARNINGS.has(message)) warnings.push(message);
      return [];
    }
    return data || [];
  } catch (error) {
    warnings.push(`${table}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

export async function selectInChunks(
  supabase: AnyClient,
  table: string,
  columns: string,
  ids: string[],
  apply?: (query: any) => any,
  warnings: string[] = []
): Promise<any[]> {
  if (!ids.length) return [];
  const chunks = splitIntoChunks(ids, 250);
  const results = await Promise.all(
    chunks.map((chunk) =>
      safeSelect(
        supabase,
        table,
        columns,
        (query) => {
          const scoped = query.in('user_id', chunk);
          return apply ? apply(scoped) : scoped;
        },
        warnings
      )
    )
  );
  return results.flat();
}

function normalizeStatus(value: unknown): string {
  return String(value || '').toLowerCase();
}

function isCompleted(value: unknown): boolean {
  return normalizeStatus(value) === 'completed';
}

function withinRange(
  timestamp: string | null | undefined,
  from?: string | null,
  to?: string | null
): boolean {
  if (!timestamp) return !from && !to;
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) return true;
  if (from && value < new Date(from).getTime()) return false;
  if (to && value > new Date(to).getTime()) return false;
  return true;
}

export interface LoadCohortOptions {
  includeTopics?: boolean;
  includeConsent?: boolean;
  limit?: number;
  scopeDepartmentId?: string | null;
}

export interface LoadedCohort extends CohortData {
  settings: InstitutionSettings;
  categories: ReadinessCategoryConfig[];
  snapshots: Array<{ userId: string; overallScore: number; coverage: number; createdAt: string }>;
}

export async function loadCohort(
  supabase: AnyClient,
  context: AdminUserContext,
  filters: AdminFilters,
  options: LoadCohortOptions = {}
): Promise<LoadedCohort> {
  const warnings: string[] = [];
  const settings = await loadInstitutionSettings(supabase, context.organizationId);
  const categories = await loadReadinessCategories(supabase, context.organizationId);

  if (options.scopeDepartmentId === null) {
    return {
      dataSource: 'unavailable',
      generatedAt: new Date().toISOString(),
      students: [],
      totals: { profilesInScope: 0, studentsReturned: 0, truncated: false },
      warnings,
      error: 'No department is assigned to this account. Ask an institution administrator to assign a department.',
      settings,
      categories,
      snapshots: [],
    };
  }

  let profileQuery = supabase
    .from('profiles')
    .select(
      'id,email,full_name,phone,student_id_number,department_id,batch_name,course,academic_year,graduation_year,target_role,cgpa,verification_status,profile_verified,is_active,last_active_at,created_at,updated_at,branch,college,github_url,linkedin_url,role',
      { count: 'exact' }
    )
    .eq('organization_id', context.organizationId)
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 3000);

  const scopeDept = options.scopeDepartmentId;
  if (scopeDept) profileQuery = profileQuery.eq('department_id', scopeDept);
  if (filters.departmentId) profileQuery = profileQuery.eq('department_id', filters.departmentId);
  if (filters.batch) profileQuery = profileQuery.eq('batch_name', filters.batch);
  if (filters.course) profileQuery = profileQuery.eq('course', filters.course);
  if (filters.academicYear) profileQuery = profileQuery.eq('academic_year', filters.academicYear);
  if (filters.targetRole) profileQuery = profileQuery.eq('target_role', filters.targetRole);
  if (filters.from) profileQuery = profileQuery.gte('created_at', filters.from);

  const { data: profileRows, error: profileError, count } = await profileQuery;

  if (profileError) {
    return {
      dataSource: 'unavailable',
      generatedAt: new Date().toISOString(),
      students: [],
      totals: { profilesInScope: 0, studentsReturned: 0, truncated: false },
      warnings,
      error:
        (profileError as { code?: string }).code === '42P01' ||
        /does not exist/i.test(profileError.message)
          ? 'The Phase 5 migration has not been applied to this database yet.'
          : `Unable to load institution students: ${profileError.message}`,
      settings,
      categories,
      snapshots: [],
    };
  }

  const profiles = ((profileRows || []) as Array<Record<string, any>>).filter((profile) => {
    const role = String(profile.role || 'student');
    return role === 'student';
  });
  const ids = profiles.map((p) => String(p.id));
  const truncated = (count || profiles.length) > profiles.length;

  const [departments, assessmentAttempts, interviews, gds, resumeScores, atsAnalyses, resumeVersions, snapshotsRaw, skills, projects, education, learning, consentRecords, consentGrants] =
    await Promise.all([
      safeSelect(supabase, 'departments', 'id,name', (q) => q.eq('organization_id', context.organizationId), warnings),
      selectInChunks(supabase, 'assessment_attempts', '*', ids, (q) => q.order('created_at', { ascending: false }), warnings),
      selectInChunks(supabase, 'interview_sessions', '*', ids, (q) => q.order('created_at', { ascending: false }), warnings),
      selectInChunks(supabase, 'gd_sessions', '*', ids, (q) => q.order('created_at', { ascending: false }), warnings),
      selectInChunks(supabase, 'resume_scores', '*', ids, (q) => q.order('created_at', { ascending: false }), warnings),
      selectInChunks(supabase, 'ats_analyses', 'id,user_id,score_total,created_at', ids, (q) => q.order('created_at', { ascending: false }), warnings),
      selectInChunks(supabase, 'resume_versions', 'user_id,updated_at', ids, (q) => q.order('updated_at', { ascending: false }), warnings),
      selectInChunks(supabase, 'readiness_snapshots', '*', ids, (q) => q.order('created_at', { ascending: false }), warnings),
      selectInChunks(supabase, 'skills', 'user_id,name,proficiency,category', ids, undefined, warnings),
      selectInChunks(supabase, 'projects', 'user_id,title', ids, undefined, warnings),
      selectInChunks(supabase, 'education', 'user_id', ids, undefined, warnings),
      selectInChunks(supabase, 'learning_roadmaps', 'user_id,topic,status', ids, undefined, warnings),
      options.includeConsent
        ? selectInChunks(supabase, 'consent_records', 'user_id,purpose_code,status,created_at', ids, (q) => q.order('created_at', { ascending: false }), warnings)
        : Promise.resolve([]),
      options.includeConsent
        ? selectInChunks(supabase, 'consent_grants', 'user_id,granted_scopes,revoked_at,is_active', ids, undefined, warnings)
        : Promise.resolve([]),
    ]);

  const departmentNames = new Map<string, string>(
    (departments as Array<{ id: string; name: string }>).map((d) => [String(d.id), d.name])
  );

  // Latest snapshot per student
  const snapshotByUser = new Map<string, any>();
  for (const snapshot of snapshotsRaw as Array<Record<string, any>>) {
    const userId = String(snapshot.user_id);
    if (!snapshotByUser.has(userId)) snapshotByUser.set(userId, snapshot);
  }

  const completedAttempts = (assessmentAttempts as Array<Record<string, any>>).filter(
    (attempt) =>
      isCompleted(attempt.status) &&
      withinRange(attempt.submitted_at || attempt.created_at, filters.from, filters.to) &&
      (!filters.assessmentId || String(attempt.assessment_id) === filters.assessmentId)
  );

  const completedInterviews = (interviews as Array<Record<string, any>>).filter(
    (interview) =>
      isCompleted(interview.status) &&
      withinRange(interview.created_at, filters.from, filters.to)
  );

  const completedGds = (gds as Array<Record<string, any>>).filter((gd) => {
    const status = gd.status ? isCompleted(gd.status) : true;
    const score = gd.overall_score ?? gd.evaluation?.overallScore;
    return status && score !== undefined && withinRange(gd.created_at, filters.from, filters.to);
  });

  const attemptsByUser = new Map<string, any[]>();
  for (const attempt of completedAttempts) {
    const userId = String(attempt.user_id);
    attemptsByUser.set(userId, [...(attemptsByUser.get(userId) || []), attempt]);
  }

  const interviewsByUser = new Map<string, any[]>();
  for (const interview of completedInterviews) {
    const userId = String(interview.user_id);
    interviewsByUser.set(userId, [...(interviewsByUser.get(userId) || []), interview]);
  }

  const gdsByUser = new Map<string, any[]>();
  for (const gd of completedGds) {
    const userId = String(gd.user_id);
    gdsByUser.set(userId, [...(gdsByUser.get(userId) || []), gd]);
  }

  const resumeScoresByUser = new Map<string, any[]>();
  for (const score of resumeScores as Array<Record<string, any>>) {
    const userId = String(score.user_id);
    resumeScoresByUser.set(userId, [...(resumeScoresByUser.get(userId) || []), score]);
  }

  const atsByUser = new Map<string, any[]>();
  for (const ats of atsAnalyses as Array<Record<string, any>>) {
    const userId = String(ats.user_id);
    atsByUser.set(userId, [...(atsByUser.get(userId) || []), ats]);
  }

  const resumeVersionUsers = new Set((resumeVersions as Array<Record<string, any>>).map((r) => String(r.user_id)));

  const skillsByUser = new Map<string, SelfReportedSkill[]>();
  for (const skill of skills as Array<Record<string, any>>) {
    const userId = String(skill.user_id);
    const list = skillsByUser.get(userId) || [];
    list.push({
      name: String(skill.name),
      proficiency: String(skill.proficiency || 'Beginner'),
      category: String(skill.category || 'Technical'),
    });
    skillsByUser.set(userId, list);
  }

  const projectCounts = new Map<string, number>();
  for (const project of projects as Array<Record<string, any>>) {
    const userId = String(project.user_id);
    projectCounts.set(userId, (projectCounts.get(userId) || 0) + 1);
  }

  const educationCounts = new Map<string, number>();
  for (const edu of education as Array<Record<string, any>>) {
    const userId = String(edu.user_id);
    educationCounts.set(userId, (educationCounts.get(userId) || 0) + 1);
  }

  const learningByUser = new Map<string, Array<{ topic: string; status: string }>>();
  for (const item of learning as Array<Record<string, any>>) {
    const userId = String(item.user_id);
    const list = learningByUser.get(userId) || [];
    list.push({ topic: String(item.topic), status: String(item.status || 'To Learn') });
    learningByUser.set(userId, list);
  }

  // Topic scores from assessment answers (only completed attempts in scope)
  const topicScoresByUser = new Map<string, Array<{ topic: string; total: number; correct: number }>>();
  const attemptIdToUser = new Map(completedAttempts.map((attempt) => [String(attempt.id), String(attempt.user_id)]));
  if (options.includeTopics && attemptIdToUser.size > 0) {
    const attemptIds = Array.from(attemptIdToUser.keys());
    const answers: any[] = [];
    for (const chunk of splitIntoChunks(attemptIds, 200)) {
      const rows = await safeSelect(
        supabase,
        'assessment_answers',
        'attempt_id,question_id,is_correct',
        (q) => q.in('attempt_id', chunk),
        warnings
      );
      answers.push(...rows);
    }
    const questionIds = Array.from(new Set(answers.map((a) => String(a.question_id))));
    const questionTopics = new Map<string, string>();
    for (const chunk of splitIntoChunks(questionIds, 300)) {
      const rows = await safeSelect(
        supabase,
        'assessment_questions',
        'id,topic',
        (q) => q.in('id', chunk),
        warnings
      );
      for (const row of rows as Array<Record<string, any>>) {
        questionTopics.set(String(row.id), String(row.topic || 'General'));
      }
    }
    for (const answer of answers as Array<Record<string, any>>) {
      if (answer.is_correct === null || answer.is_correct === undefined) continue;
      const userId = attemptIdToUser.get(String(answer.attempt_id));
      if (!userId) continue;
      const topic = questionTopics.get(String(answer.question_id)) || 'General';
      const list = topicScoresByUser.get(userId) || [];
      list.push({ topic, total: 1, correct: answer.is_correct ? 1 : 0 });
      topicScoresByUser.set(userId, list);
    }
  }

  // Latest consent per purpose; fall back to legacy consent_grants.
  const consentByUser = new Map<string, boolean | null>();
  if (options.includeConsent) {
    const latest = new Map<string, Record<string, any>>();
    for (const record of consentRecords as Array<Record<string, any>>) {
      const key = `${record.user_id}:${record.purpose_code}`;
      if (!latest.has(key)) latest.set(key, record);
    }
    for (const record of latest.values()) {
      if (!['institutional_analytics', 'placement_services'].includes(String(record.purpose_code))) continue;
      const userId = String(record.user_id);
      const granted = String(record.status) === 'granted';
      if (granted) consentByUser.set(userId, true);
      else if (!consentByUser.has(userId)) consentByUser.set(userId, false);
    }
    for (const grant of consentGrants as Array<Record<string, any>>) {
      const userId = String(grant.user_id);
      if (consentByUser.get(userId) === true) continue;
      const scopes = Array.isArray(grant.granted_scopes) ? grant.granted_scopes : [];
      const active = grant.is_active !== false && !grant.revoked_at;
      if (active && scopes.some((s: string) => ['readiness_score', 'weak_areas', 'interview_count', 'all'].includes(s))) {
        consentByUser.set(userId, true);
      } else if (!consentByUser.has(userId)) {
        consentByUser.set(userId, false);
      }
    }
  }

  const students: CohortStudent[] = profiles.map((profile) => {
    const userId = String(profile.id);
    const studentAttempts = attemptsByUser.get(userId) || [];
    const studentInterviews = interviewsByUser.get(userId) || [];
    const studentGds = gdsByUser.get(userId) || [];
    const studentTopics = latestTopicScores(topicScoresByUser.get(userId) || []);
    const studentSkills = skillsByUser.get(userId) || [];
    const studentProjectCount = projectCounts.get(userId) || 0;
    const studentEducationCount = educationCounts.get(userId) || 0;

    const profileCompletion = computeProfileCompletion({
      fullName: profile.full_name,
      email: profile.email,
      departmentId: profile.department_id,
      branch: profile.branch,
      cgpa: profile.cgpa ? Number(profile.cgpa) : null,
      targetRole: profile.target_role,
      skillsCount: studentSkills.length,
      projectsCount: studentProjectCount,
      educationCount: studentEducationCount,
      hasLinks: Boolean(profile.github_url || profile.linkedin_url),
    });

    const assessmentScore = average(studentAttempts.map((a) => Number(a.percentage))) ?? null;
    const interviewScore = average(
      studentInterviews.map((i) => Number(i.overall_score ?? i.score ?? i.overallScore))
    ) ?? null;
    const technicalScore = average(
      studentInterviews.map((i) => Number(i.technical_score ?? i.technical_accuracy_score))
    ) ?? null;
    const communicationScore = average(
      studentInterviews.map((i) => Number(i.communication_score))
    ) ?? null;
    const gdScore = average(
      studentGds.map((g) => Number(g.overall_score ?? g.evaluation?.overallScore))
    ) ?? null;

    const latestAts = (atsByUser.get(userId) || [])[0];
    const latestResumeScore = (resumeScoresByUser.get(userId) || [])[0];
    const resumeScore =
      latestAts?.score_total !== undefined
        ? Number(latestAts.score_total)
        : latestResumeScore?.total_score !== undefined
          ? Number(latestResumeScore.total_score)
          : null;

    const snapshot = snapshotByUser.get(userId);
    const readiness = computeReadiness(
      {
        assessmentScore,
        resumeScore,
        interviewScore,
        gdScore,
        profileScore: profileCompletion,
      },
      settings.readiness_weights,
      settings.readiness_min_coverage,
      categories,
      snapshot
        ? {
            overallScore: Number(snapshot.overall_score),
            coverage: Number(snapshot.coverage_pct),
            createdAt: String(snapshot.created_at),
          }
        : null
    );

    const activityTimestamps = [
      profile.last_active_at,
      profile.updated_at,
      ...studentAttempts.map((a) => a.submitted_at || a.created_at),
      ...studentInterviews.map((i) => i.created_at),
      ...studentGds.map((g) => g.created_at),
      ...(resumeVersions as Array<Record<string, any>>)
        .filter((r) => String(r.user_id) === userId)
        .map((r) => r.updated_at),
    ].filter(Boolean) as string[];
    const lastActivityAt = activityTimestamps.length
      ? activityTimestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

    const flags: string[] = [];
    if (profileCompletion < 60) flags.push('incomplete_profile');
    if (!studentAttempts.length) flags.push('no_assessment');
    if (!studentInterviews.length) flags.push('no_interview');
    if (readiness.category === 'needs_improvement') flags.push('needs_preparation');
    if (readiness.category === 'insufficient_data') flags.push('insufficient_data');
    if (options.includeConsent && consentByUser.get(userId) !== true) flags.push('no_consent');

    return {
      id: userId,
      email: String(profile.email || ''),
      fullName: String(profile.full_name || profile.email || 'Student'),
      phone: profile.phone ? String(profile.phone) : null,
      studentIdNumber: profile.student_id_number ? String(profile.student_id_number) : null,
      departmentId: profile.department_id ? String(profile.department_id) : null,
      departmentName: profile.department_id ? departmentNames.get(String(profile.department_id)) || 'Unassigned' : 'Unassigned',
      batchName: profile.batch_name ? String(profile.batch_name) : null,
      course: profile.course ? String(profile.course) : null,
      academicYear: profile.academic_year ? String(profile.academic_year) : null,
      graduationYear: profile.graduation_year ? Number(profile.graduation_year) : null,
      targetRole: profile.target_role ? String(profile.target_role) : null,
      cgpa: profile.cgpa !== null && profile.cgpa !== undefined ? Number(profile.cgpa) : null,
      verificationStatus: String(profile.verification_status || 'Unverified'),
      profileVerified: Boolean(profile.profile_verified) || String(profile.verification_status) === 'Verified',
      isActive: profile.is_active !== false,
      createdAt: String(profile.created_at),
      lastActivityAt,
      profileCompletion,
      hasResume: Boolean(resumeVersionUsers.has(userId) || latestAts || latestResumeScore),
      assessmentCount: studentAttempts.length,
      avgAssessmentScore: assessmentScore,
      lastAssessmentAt: studentAttempts[0]?.submitted_at || studentAttempts[0]?.created_at || null,
      interviewCount: studentInterviews.length,
      avgInterviewScore: interviewScore,
      technicalScore,
      communicationScore,
      gdScore,
      resumeScore,
      topicScores: studentTopics,
      weakTopics: topWeakTopics(studentTopics, 3),
      selfReportedSkills: studentSkills,
      learningProgress: learningByUser.get(userId) || [],
      readiness,
      hasConsent: options.includeConsent ? (consentByUser.get(userId) ?? null) : null,
      flags,
    };
  });

  const snapshots: Array<{ userId: string; overallScore: number; coverage: number; createdAt: string }> = [];
  for (const snapshot of snapshotsRaw as Array<Record<string, any>>) {
    snapshots.push({
      userId: String(snapshot.user_id),
      overallScore: Number(snapshot.overall_score),
      coverage: Number(snapshot.coverage_pct),
      createdAt: String(snapshot.created_at),
    });
  }

  return {
    dataSource: 'live',
    generatedAt: new Date().toISOString(),
    students,
    totals: {
      profilesInScope: count ?? students.length,
      studentsReturned: students.length,
      truncated,
    },
    warnings,
    settings,
    categories,
    snapshots,
  };
}
