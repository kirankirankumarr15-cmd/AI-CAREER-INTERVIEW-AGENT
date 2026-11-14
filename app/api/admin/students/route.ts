import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logAdminAudit } from '@/lib/admin/audit';
import { loadCohort } from '@/lib/admin/cohort';
import { requireAdminPermission, resolveDepartmentScope, scopeDenied } from '@/lib/admin/context';
import { loadFilterOptions, parseAdminFilters } from '@/lib/admin/filters';
import type { CohortStudent } from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

function matchesFilter(student: CohortStudent, filter: string | null): boolean {
  if (!filter || filter === 'all') return true;
  if (filter === 'no_consent') return student.hasConsent !== true;
  if (filter === 'needs_preparation') {
    return student.readiness.category === 'needs_improvement' || student.readiness.category === 'insufficient_data';
  }
  return student.flags.includes(filter);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = parseAdminFilters(params);
  const override = params.get('organizationId');
  const safeOverride = override && /^[0-9a-f-]{36}$/i.test(override) ? override : null;

  const auth = await requireAdminPermission('students.read', safeOverride);
  if (auth.response) return auth.response;
  const context = auth.context;

  const scopeDept = resolveDepartmentScope(context, filters.departmentId);
  if (scopeDenied(context)) {
    return NextResponse.json({ error: 'No department assigned to this account.' }, { status: 403 });
  }
  if (scopeDept) filters.departmentId = scopeDept;

  const client = await createClient();
  const [cohort, filterOptions] = await Promise.all([
    loadCohort(client, context, filters, { includeTopics: false, includeConsent: true, scopeDepartmentId: scopeDept }),
    loadFilterOptions(client, context.organizationId, scopeDept),
  ]);

  if (cohort.dataSource === 'unavailable') {
    return NextResponse.json(
      { dataSource: 'unavailable', error: cohort.error, warnings: cohort.warnings, students: [], total: 0 },
      { status: 200 }
    );
  }

  const filter = params.get('filter');
  const search = (filters.search || '').toLowerCase().trim();
  let students = cohort.students
    .filter((student) => matchesFilter(student, filter))
    .filter((student) => {
      if (!search) return true;
      return (
        student.fullName.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search) ||
        (student.studentIdNumber || '').toLowerCase().includes(search) ||
        (student.departmentName || '').toLowerCase().includes(search)
      );
    });

  const sort = params.get('sort') || 'name';
  students = [...students].sort((a, b) => {
    if (sort === 'readiness') return (b.readiness.score ?? -1) - (a.readiness.score ?? -1);
    if (sort === 'profile') return b.profileCompletion - a.profileCompletion;
    if (sort === 'activity') {
      return new Date(b.lastActivityAt || b.createdAt).getTime() - new Date(a.lastActivityAt || a.createdAt).getTime();
    }
    if (sort === 'assessment') return (b.avgAssessmentScore ?? -1) - (a.avgAssessmentScore ?? -1);
    return a.fullName.localeCompare(b.fullName);
  });

  const page = Math.max(1, Number(params.get('page') || 1));
  const pageSize = Math.min(100, Math.max(10, Number(params.get('pageSize') || 25)));
  const total = students.length;
  const paginated = students.slice((page - 1) * pageSize, page * pageSize);

  // Roster entries that have not registered yet.
  let pendingRoster: Array<Record<string, unknown>> = [];
  try {
    let rosterQuery = client
      .from('student_roster')
      .select('id,student_id_number,full_name,email,phone,batch_name,graduation_year,course,status,department_id,created_at')
      .eq('organization_id', context.organizationId)
      .in('status', ['pending', 'invited'])
      .order('created_at', { ascending: false })
      .limit(500);
    if (scopeDept) rosterQuery = rosterQuery.eq('department_id', scopeDept);
    const { data } = await rosterQuery;
    pendingRoster = data || [];
  } catch {
    // Roster is optional when the migration is not applied.
  }

  await logAdminAudit(context, {
    action: 'students.directory_viewed',
    targetType: 'cohort',
    metadata: { filter, page, pageSize, total, search: search || null },
  }, client);

  return NextResponse.json({
    dataSource: 'live',
    generatedAt: new Date().toISOString(),
    filters,
    filterOptions,
    students: paginated.map((student) => ({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      studentIdNumber: student.studentIdNumber,
      department: student.departmentName,
      departmentId: student.departmentId,
      batch: student.batchName,
      course: student.course,
      graduationYear: student.graduationYear,
      targetRole: student.targetRole,
      profileCompletion: student.profileCompletion,
      verificationStatus: student.verificationStatus,
      assessmentCount: student.assessmentCount,
      avgAssessmentScore: student.avgAssessmentScore,
      interviewCount: student.interviewCount,
      readinessScore: student.readiness.score,
      readinessCoverage: student.readiness.coverage,
      readinessCategory: student.readiness.category,
      lastActivityAt: student.lastActivityAt,
      hasConsent: student.hasConsent,
      flags: student.flags,
      isActive: student.isActive,
    })),
    pendingRoster,
    total,
    page,
    pageSize,
    scope: {
      role: context.role,
      departmentId: scopeDept || null,
      consentRequired: cohort.settings.require_consent_for_drilldown,
    },
    warnings: cohort.warnings,
  });
}
