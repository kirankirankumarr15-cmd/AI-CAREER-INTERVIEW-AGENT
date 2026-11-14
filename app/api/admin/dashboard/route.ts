import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  requireAdminPermission,
  resolveDepartmentScope,
  scopeDenied,
} from '@/lib/admin/context';
import { loadCohort, safeSelect, selectInChunks } from '@/lib/admin/cohort';
import { loadFilterOptions, parseAdminFilters } from '@/lib/admin/filters';
import {
  average,
  buildAssessmentBuckets,
  buildDepartmentComparison,
  buildDistribution,
  buildProfileCompletionBuckets,
  percentage,
} from '@/lib/admin/analytics';
import type {
  AdminDashboardResponse,
  AdminFilters,
  AdminUserContext,
  FilterOptions,
} from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

function emptyFilterOptions(): FilterOptions {
  return { academicYears: [], departments: [], batches: [], courses: [], assessments: [], targetRoles: [] };
}

function unavailable(
  context: AdminUserContext,
  filters: AdminFilters,
  error: string,
  warnings: string[] = []
): AdminDashboardResponse {
  return {
    dataSource: 'unavailable',
    generatedAt: new Date().toISOString(),
    context: {
      organizationName: context.organizationName,
      organizationCode: context.organizationCode,
      academicYear: filters.academicYear || '—',
      departmentName: context.departmentName,
      role: context.role,
      userName: context.fullName,
    },
    filters,
    filterOptions: emptyFilterOptions(),
    stats: {
      totalStudents: 0,
      activeStudents: 0,
      verifiedProfiles: 0,
      completedResumes: 0,
      assessmentParticipation: { count: 0, percentage: 0 },
      interviewParticipation: { count: 0, percentage: 0 },
      avgTechnicalScore: null,
      avgInterviewScore: null,
      readinessMet: 0,
      needsPreparation: 0,
      readinessReliableCount: 0,
    },
    studentOverview: { registeredThisMonth: 0, profileCompletionBuckets: [], verifiedProfiles: 0, pendingRoster: 0 },
    readinessDistribution: [],
    assessmentPerformance: { avgScore: null, participationPercentage: 0, scoreBuckets: [], byAssessment: [] },
    interviewPerformance: { avgOverall: null, avgTechnical: null, avgCommunication: null, participationPercentage: 0 },
    departmentComparison: [],
    recentActivity: [],
    actionCenter: [],
    methodology: {
      readinessWeights: { assessments: 25, resume: 20, interview: 25, groupDiscussion: 15, profile: 15 },
      readinessThresholds: {},
      minimumCohortSize: 5,
      readinessMinCoverage: 40,
      sources: [],
    },
    warnings,
    error,
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = parseAdminFilters(params);
  const override = params.get('organizationId');
  const safeOverride = override && /^[0-9a-f-]{36}$/i.test(override) ? override : null;

  const auth = await requireAdminPermission('analytics.read', safeOverride);
  if (auth.response) return auth.response;
  const context = auth.context;

  const scopeDept = resolveDepartmentScope(context, filters.departmentId);
  if (scopeDenied(context)) {
    return NextResponse.json(
      { error: 'No department assigned', message: 'Ask an institution administrator to assign your department.' },
      { status: 403 }
    );
  }
  if (scopeDept) {
    filters.departmentId = scopeDept;
  }

  const client = await createClient();

  const [cohort, filterOptions] = await Promise.all([
    loadCohort(client, context, filters, {
      includeConsent: true,
      includeTopics: true,
      scopeDepartmentId: scopeDept,
    }),
    loadFilterOptions(client, context.organizationId, scopeDept),
  ]);

  if (cohort.dataSource === 'unavailable') {
    return NextResponse.json(unavailable(context, filters, cohort.error || 'Institution data unavailable.', cohort.warnings));
  }

  const students = cohort.students;

  // Pending roster (imported, not yet registered)
  let pendingRoster = 0;
  try {
    const { count } = await client
      .from('student_roster')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', context.organizationId)
      .eq('status', 'pending');
    pendingRoster = count || 0;
  } catch {
    // Optional metric when roster table is unavailable.
  }

  const now = Date.now();
  const activeStudents = students.filter((student) => {
    const timestamp = student.lastActivityAt || student.createdAt;
    return timestamp && now - new Date(timestamp).getTime() <= 30 * 24 * 3600 * 1000;
  }).length;

  const assessmentParticipants = students.filter((s) => s.assessmentCount > 0);
  const interviewParticipants = students.filter((s) => s.interviewCount > 0);
  const reliable = students.filter((s) => s.readiness.isReliable);
  const readinessMet = reliable.filter((s) => s.readiness.category === 'highly_prepared').length;
  const needsPreparation = students.filter(
    (s) => s.readiness.category === 'needs_improvement' || s.readiness.category === 'insufficient_data'
  ).length;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const registeredThisMonth = students.filter((s) => String(s.createdAt).slice(0, 7) === currentMonth).length;

  const departmentsWithCounts = filterOptions.departments.map((department) => ({
    ...department,
    studentCount: students.filter((s) => s.departmentId === department.id).length,
  }));

  // Assessment-level breakdown
  const warnings = [...cohort.warnings];
  const ids = students.map((s) => s.id);
  const [attemptRows, assessmentRows] = await Promise.all([
    selectInChunks(
      client,
      'assessment_attempts',
      'assessment_id,user_id,percentage,status,submitted_at,created_at',
      ids,
      undefined,
      warnings
    ),
    safeSelect(client, 'assessments', 'id,title', (q) => q.order('created_at', { ascending: false }).limit(200), warnings),
  ]);
  const assessmentTitles = new Map(
    (assessmentRows as Array<{ id: string; title: string }>).map((a) => [String(a.id), a.title])
  );
  const byAssessmentMap = new Map<string, { attempts: number; total: number }>();
  for (const attempt of attemptRows as Array<Record<string, unknown>>) {
    if (String(attempt.status).toLowerCase() !== 'completed') continue;
    const assessmentId = String(attempt.assessment_id);
    const current = byAssessmentMap.get(assessmentId) || { attempts: 0, total: 0 };
    current.attempts += 1;
    current.total += Number(attempt.percentage) || 0;
    byAssessmentMap.set(assessmentId, current);
  }

  // Recent activity feed
  const recentActivity: AdminDashboardResponse['recentActivity'] = [];
  for (const student of students.slice(0, 4)) {
    recentActivity.push({
      id: `student-${student.id}`,
      type: 'student_registered',
      title: 'Student profile registered',
      detail: `${student.fullName} · ${student.departmentName}`,
      timestamp: student.createdAt,
      href: `/admin/students?search=${encodeURIComponent(student.email)}`,
    });
  }
  const recentAttempts = (attemptRows as Array<Record<string, unknown>>)
    .filter((a) => String(a.status).toLowerCase() === 'completed')
    .sort((a, b) => new Date(String(b.submitted_at || b.created_at)).getTime() - new Date(String(a.submitted_at || a.created_at)).getTime())
    .slice(0, 4);
  for (const attempt of recentAttempts) {
    const student = students.find((s) => s.id === String(attempt.user_id));
    if (!student) continue;
    recentActivity.push({
      id: `attempt-${String(attempt.assessment_id)}-${student.id}`,
      type: 'assessment_completed',
      title: 'Assessment completed',
      detail: `${student.fullName} · ${assessmentTitles.get(String(attempt.assessment_id)) || 'Assessment'} · ${Number(attempt.percentage).toFixed(1)}%`,
      timestamp: String(attempt.submitted_at || attempt.created_at),
      href: '/admin/analytics/readiness',
    });
  }
  const recentInterviews = await selectInChunks(
    client,
    'interview_sessions',
    'id,user_id,overall_score,score,status,created_at',
    ids,
    (q) => q.order('created_at', { ascending: false }).limit(6),
    warnings
  );
  for (const interview of recentInterviews as Array<Record<string, unknown>>) {
    if (String(interview.status || '').toLowerCase() !== 'completed') continue;
    const student = students.find((s) => s.id === String(interview.user_id));
    if (!student) continue;
    recentActivity.push({
      id: `interview-${String(interview.id)}`,
      type: 'interview_completed',
      title: 'Mock interview completed',
      detail: `${student.fullName} · Score ${Number(interview.overall_score ?? interview.score ?? 0).toFixed(1)}%`,
      timestamp: String(interview.created_at),
      href: '/admin/analytics/readiness',
    });
  }
  try {
    const { data: importJobs } = await client
      .from('student_import_jobs')
      .select('id,filename,imported_rows,linked_rows,created_at')
      .eq('organization_id', context.organizationId)
      .order('created_at', { ascending: false })
      .limit(3);
    for (const job of (importJobs || []) as Array<Record<string, unknown>>) {
      recentActivity.push({
        id: `import-${String(job.id)}`,
        type: 'import_completed',
        title: 'Student CSV import',
        detail: `${String(job.filename)} · ${Number(job.imported_rows || 0)} created · ${Number(job.linked_rows || 0)} linked`,
        timestamp: String(job.created_at),
        href: '/admin/students/import?tab=history',
      });
    }
  } catch {
    // Import history is optional for the dashboard.
  }
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const incompleteProfiles = students.filter((s) => s.profileCompletion < 60).length;
  const noAssessment = students.filter((s) => s.assessmentCount === 0).length;
  const noInterview = students.filter((s) => s.interviewCount === 0).length;
  const noConsent = cohort.settings.require_consent_for_drilldown
    ? students.filter((s) => s.hasConsent !== true).length
    : 0;

  const actionCenter: AdminDashboardResponse['actionCenter'] = [
    {
      key: 'incomplete_profiles',
      label: 'Incomplete student profiles',
      description: 'Profiles below 60% completion are less discoverable to employers.',
      count: incompleteProfiles,
      href: '/admin/students?filter=incomplete_profile',
      severity: 'medium',
    },
    {
      key: 'no_assessment',
      label: 'No assessment attempt',
      description: 'Students without a completed assessment lack a technical readiness signal.',
      count: noAssessment,
      href: '/admin/students?filter=no_assessment',
      severity: 'high',
    },
    {
      key: 'needs_preparation',
      label: 'Needs additional preparation',
      description: 'Readiness is below the institutional threshold or has insufficient evidence.',
      count: needsPreparation,
      href: '/admin/analytics/readiness?segment=needs_preparation',
      severity: 'high',
    },
    {
      key: 'no_interview',
      label: 'Interview practice required',
      description: 'Students who have not completed a mock interview.',
      count: noInterview,
      href: '/admin/students?filter=no_interview',
      severity: 'medium',
    },
  ];
  if (cohort.settings.require_consent_for_drilldown) {
    actionCenter.push({
      key: 'no_consent',
      label: 'Consent not recorded',
      description: 'Student-level drilldown is suppressed until analytics consent is granted.',
      count: noConsent,
      href: '/admin/privacy?filter=not_granted',
      severity: 'medium',
    });
  }

  const response: AdminDashboardResponse = {
    dataSource: 'live',
    generatedAt: new Date().toISOString(),
    context: {
      organizationName: context.organizationName,
      organizationCode: context.organizationCode,
      academicYear: filters.academicYear || cohort.settings.academic_year,
      departmentName: filterOptions.departments.find((d) => d.id === filters.departmentId)?.name || context.departmentName,
      role: context.role,
      userName: context.fullName,
    },
    filters,
    filterOptions: { ...filterOptions, departments: departmentsWithCounts },
    stats: {
      totalStudents: cohort.totals.profilesInScope,
      activeStudents,
      verifiedProfiles: students.filter((s) => s.profileVerified).length,
      completedResumes: students.filter((s) => s.hasResume).length,
      assessmentParticipation: {
        count: assessmentParticipants.length,
        percentage: percentage(assessmentParticipants.length, students.length),
      },
      interviewParticipation: {
        count: interviewParticipants.length,
        percentage: percentage(interviewParticipants.length, students.length),
      },
      avgTechnicalScore: average(students.map((s) => s.avgAssessmentScore)),
      avgInterviewScore: average(students.map((s) => s.avgInterviewScore)),
      readinessMet,
      needsPreparation,
      readinessReliableCount: reliable.length,
    },
    studentOverview: {
      registeredThisMonth,
      profileCompletionBuckets: buildProfileCompletionBuckets(students),
      verifiedProfiles: students.filter((s) => s.profileVerified).length,
      pendingRoster,
    },
    readinessDistribution: buildDistribution(students, cohort.categories),
    assessmentPerformance: {
      avgScore: average(students.map((s) => s.avgAssessmentScore)),
      participationPercentage: percentage(assessmentParticipants.length, students.length),
      scoreBuckets: buildAssessmentBuckets(students),
      byAssessment: Array.from(byAssessmentMap.entries())
        .map(([id, value]) => ({
          id,
          title: assessmentTitles.get(id) || id,
          attempts: value.attempts,
          avgScore: value.attempts ? Number((value.total / value.attempts).toFixed(2)) : null,
        }))
        .sort((a, b) => b.attempts - a.attempts)
        .slice(0, 10),
    },
    interviewPerformance: {
      avgOverall: average(students.map((s) => s.avgInterviewScore)),
      avgTechnical: average(students.map((s) => s.technicalScore)),
      avgCommunication: average(students.map((s) => s.communicationScore)),
      participationPercentage: percentage(interviewParticipants.length, students.length),
    },
    departmentComparison: buildDepartmentComparison(students),
    recentActivity: recentActivity.slice(0, 10),
    actionCenter,
    methodology: {
      readinessWeights: cohort.settings.readiness_weights,
      readinessThresholds: cohort.settings.readiness_thresholds,
      minimumCohortSize: cohort.settings.minimum_cohort_size,
      readinessMinCoverage: cohort.settings.readiness_min_coverage,
      sources: [
        { metric: 'Assessments', source: 'assessment_attempts (completed)', weight: cohort.settings.readiness_weights.assessments, lastUpdated: new Date().toISOString() },
        { metric: 'Resume', source: 'ats_analyses / resume_scores (latest)', weight: cohort.settings.readiness_weights.resume, lastUpdated: new Date().toISOString() },
        { metric: 'Interview', source: 'interview_sessions (completed)', weight: cohort.settings.readiness_weights.interview, lastUpdated: new Date().toISOString() },
        { metric: 'Group Discussion', source: 'gd_sessions (completed)', weight: cohort.settings.readiness_weights.groupDiscussion, lastUpdated: new Date().toISOString() },
        { metric: 'Profile', source: 'verified profile completion', weight: cohort.settings.readiness_weights.profile, lastUpdated: new Date().toISOString() },
      ],
    },
    warnings: Array.from(new Set(warnings)),
  };

  return NextResponse.json(response);
}
