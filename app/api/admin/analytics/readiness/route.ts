import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logAdminAudit } from '@/lib/admin/audit';
import { loadCohort } from '@/lib/admin/cohort';
import {
  requireAdminPermission,
  resolveDepartmentScope,
  scopeDenied,
} from '@/lib/admin/context';
import { loadFilterOptions, parseAdminFilters } from '@/lib/admin/filters';
import {
  buildBatchComparison,
  buildDepartmentComparison,
  buildDistribution,
  buildMonthlyTrends,
  maskStudentId,
  percentage,
} from '@/lib/admin/analytics';
import type { AdminFilters, AdminUserContext, ReadinessAnalyticsResponse } from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

function emptyResponse(
  context: AdminUserContext,
  filters: AdminFilters,
  error: string,
  warnings: string[] = []
): ReadinessAnalyticsResponse {
  return {
    dataSource: 'unavailable',
    generatedAt: new Date().toISOString(),
    filters,
    filterOptions: { academicYears: [], departments: [], batches: [], courses: [], assessments: [], targetRoles: [] },
    methodology: {
      weights: { assessments: 25, resume: 20, interview: 25, groupDiscussion: 15, profile: 15 },
      thresholds: {},
      minCoverage: 40,
      categories: [],
      sources: [],
    },
    distribution: [],
    departmentComparison: [],
    batchComparison: [],
    monthlyTrends: [],
    participation: {
      assessment: { count: 0, percentage: 0 },
      interview: { count: 0, percentage: 0 },
      resume: { count: 0, percentage: 0 },
    },
    students: [],
    totals: { students: 0, assessed: 0, insufficientData: 0, consentSuppressed: 0 },
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
    return NextResponse.json({ error: 'No department assigned to this account.' }, { status: 403 });
  }
  if (scopeDept) filters.departmentId = scopeDept;

  const client = await createClient();
  const [cohort, filterOptions] = await Promise.all([
    loadCohort(client, context, filters, { includeTopics: true, includeConsent: true, scopeDepartmentId: scopeDept }),
    loadFilterOptions(client, context.organizationId, scopeDept),
  ]);

  if (cohort.dataSource === 'unavailable') {
    return NextResponse.json(emptyResponse(context, filters, cohort.error || 'Institution data unavailable.', cohort.warnings));
  }

  const students = cohort.students;
  const segment = params.get('segment');
  let drilldownStudents = students;
  if (segment === 'needs_preparation') {
    drilldownStudents = students.filter(
      (s) => s.readiness.category === 'needs_improvement' || s.readiness.category === 'insufficient_data'
    );
  } else if (segment && segment !== 'all') {
    drilldownStudents = students.filter((s) => s.readiness.category === segment || s.flags.includes(segment));
  }

  const consentRequired = cohort.settings.require_consent_for_drilldown;
  const consentSuppressed = students.filter((s) => s.hasConsent !== true).length;

  const studentRows = drilldownStudents.map((student) => {
    const consentGranted = student.hasConsent === true;
    const canIdentify = !consentRequired || consentGranted;
    return {
      id: canIdentify ? student.id : null,
      maskedId: maskStudentId(student.id),
      name: canIdentify ? student.fullName : null,
      department: student.departmentName,
      batch: student.batchName,
      graduationYear: student.graduationYear,
      course: student.course,
      profileCompletion: student.profileCompletion,
      assessmentCount: student.assessmentCount,
      interviewCount: student.interviewCount,
      readinessScore: student.readiness.score,
      readinessCoverage: student.readiness.coverage,
      readinessCategory: student.readiness.category,
      weakTopics: student.weakTopics,
      consentGranted: consentRequired ? consentGranted : null,
      consentRequired,
    };
  });

  if (drilldownStudents.length > 0) {
    await logAdminAudit(context, {
      action: 'analytics.readiness_drilldown_viewed',
      targetType: 'cohort',
      metadata: {
        students: drilldownStudents.length,
        filters,
        consentSuppressed,
        segment: segment || 'all',
      },
    }, client);
  }

  const deptComparison = buildDepartmentComparison(students).map((d) => ({
    departmentId: d.departmentId,
    department: d.department,
    students: d.students,
    assessed: d.assessed,
    avgReadiness: d.avgReadiness,
    distribution: d.distribution,
  }));

  const response: ReadinessAnalyticsResponse = {
    dataSource: 'live',
    generatedAt: new Date().toISOString(),
    filters,
    filterOptions,
    methodology: {
      weights: cohort.settings.readiness_weights,
      thresholds: cohort.settings.readiness_thresholds,
      minCoverage: cohort.settings.readiness_min_coverage,
      categories: cohort.categories,
      sources: [
        { metric: 'Assessments', source: 'assessment_attempts', weight: cohort.settings.readiness_weights.assessments, description: 'Average percentage of completed timed assessments, last 5 attempts.' },
        { metric: 'Resume', source: 'ats_analyses / resume_scores', weight: cohort.settings.readiness_weights.resume, description: 'Latest ATS analysis score, falling back to the latest resume score. Missing resumes are excluded, not scored zero.' },
        { metric: 'Interview', source: 'interview_sessions', weight: cohort.settings.readiness_weights.interview, description: 'Average overall score of completed mock interviews, last 3 sessions.' },
        { metric: 'Group Discussion', source: 'gd_sessions', weight: cohort.settings.readiness_weights.groupDiscussion, description: 'Average overall score of completed group discussions.' },
        { metric: 'Profile', source: 'profiles, skills, projects, education', weight: cohort.settings.readiness_weights.profile, description: 'Transparent profile completion checklist (identity, academics, target role, skills, projects).' },
      ],
    },
    distribution: buildDistribution(students, cohort.categories),
    departmentComparison: deptComparison,
    batchComparison: buildBatchComparison(students),
    monthlyTrends: buildMonthlyTrends(cohort.snapshots, 6),
    participation: {
      assessment: {
        count: students.filter((s) => s.assessmentCount > 0).length,
        percentage: percentage(students.filter((s) => s.assessmentCount > 0).length, students.length),
      },
      interview: {
        count: students.filter((s) => s.interviewCount > 0).length,
        percentage: percentage(students.filter((s) => s.interviewCount > 0).length, students.length),
      },
      resume: {
        count: students.filter((s) => s.hasResume).length,
        percentage: percentage(students.filter((s) => s.hasResume).length, students.length),
      },
    },
    students: studentRows,
    totals: {
      students: students.length,
      assessed: students.filter((s) => s.readiness.isReliable).length,
      insufficientData: students.filter((s) => !s.readiness.isReliable).length,
      consentSuppressed,
    },
    warnings: cohort.warnings,
  };

  return NextResponse.json(response);
}
