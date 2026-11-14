import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logAdminAudit } from '@/lib/admin/audit';
import { loadCohort } from '@/lib/admin/cohort';
import { requireAdminPermission, resolveDepartmentScope, scopeDenied } from '@/lib/admin/context';
import { loadFilterOptions, parseAdminFilters } from '@/lib/admin/filters';
import { buildSkillHeatmap } from '@/lib/admin/analytics';
import type {
  AdminFilters,
  AdminUserContext,
  SkillCatalogItem,
  SkillGapResponse,
} from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

function emptyResponse(
  context: AdminUserContext,
  filters: AdminFilters,
  error: string,
  warnings: string[] = []
): SkillGapResponse {
  return {
    dataSource: 'unavailable',
    generatedAt: new Date().toISOString(),
    filters,
    groupBy: filters.groupBy || 'department',
    filterOptions: { academicYears: [], departments: [], batches: [], courses: [], assessments: [], targetRoles: [] },
    cohorts: [],
    skills: [],
    weakest: [],
    strongest: [],
    privacy: { minimumCohortSize: 5, threshold: 60, minEvidence: 2, suppressedCells: 0 },
    warnings,
    error,
  };
}

async function loadSkillCatalog(
  client: any,
  organizationId: string
): Promise<{ skills: SkillCatalogItem[]; errors: string[] }> {
  const errors: string[] = [];
  const [globalRes, orgRes] = await Promise.all([
    client
      .from('skill_catalog')
      .select('*')
      .is('organization_id', null)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    client
      .from('skill_catalog')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  if (globalRes.error) errors.push(`skill_catalog: ${globalRes.error.message}`);
  if (orgRes.error) errors.push(`skill_catalog (institution): ${orgRes.error.message}`);

  const merged = new Map<string, SkillCatalogItem>();
  for (const skill of (globalRes.data || []) as SkillCatalogItem[]) {
    merged.set(skill.name.toLowerCase(), skill);
  }
  for (const skill of (orgRes.data || []) as SkillCatalogItem[]) {
    merged.set(skill.name.toLowerCase(), skill);
  }
  return {
    skills: Array.from(merged.values()).sort((a, b) => {
      if (a.category !== b.category) return a.category === 'technical' ? -1 : 1;
      return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
    }),
    errors,
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = parseAdminFilters(params);
  const override = params.get('organizationId');
  const safeOverride = override && /^[0-9a-f-]{36}$/i.test(override) ? override : null;

  const auth = await requireAdminPermission('skillgaps.read', safeOverride);
  if (auth.response) return auth.response;
  const context = auth.context;

  const scopeDept = resolveDepartmentScope(context, filters.departmentId);
  if (scopeDenied(context)) {
    return NextResponse.json({ error: 'No department assigned to this account.' }, { status: 403 });
  }
  if (scopeDept) filters.departmentId = scopeDept;

  const client = await createClient();
  const [cohort, filterOptions, catalog] = await Promise.all([
    loadCohort(client, context, filters, { includeTopics: true, includeConsent: true, scopeDepartmentId: scopeDept }),
    loadFilterOptions(client, context.organizationId, scopeDept),
    loadSkillCatalog(client, context.organizationId),
  ]);

  if (cohort.dataSource === 'unavailable') {
    return NextResponse.json(emptyResponse(context, filters, cohort.error || 'Institution data unavailable.', cohort.warnings));
  }
  if (!catalog.skills.length) {
    return NextResponse.json(
      emptyResponse(
        context,
        filters,
        'The skill catalogue is empty. Apply the Phase 5 migration or add skills in institution settings.',
        [...cohort.warnings, ...catalog.errors]
      )
    );
  }

  const students = cohort.students;
  const groupBy = filters.groupBy === 'batch' ? 'batch' : 'department';
  const groupMap = new Map<string, { key: string; label: string; students: typeof students }>();
  for (const student of students) {
    const key = groupBy === 'department'
      ? student.departmentId || 'unassigned'
      : student.batchName || 'unassigned';
    const label = groupBy === 'department'
      ? student.departmentName || 'Unassigned'
      : student.batchName || 'Unassigned batch';
    const existing = groupMap.get(key) || { key, label, students: [] };
    existing.students.push(student);
    groupMap.set(key, existing);
  }
  const cohorts = Array.from(groupMap.values()).sort((a, b) => a.label.localeCompare(b.label));

  const category = filters.skillCategory;
  const skills = category ? catalog.skills.filter((skill) => skill.category === category) : catalog.skills;
  const heatmap = buildSkillHeatmap(
    students,
    skills,
    cohorts,
    cohort.settings.skill_proficiency_threshold,
    cohort.settings.skill_min_evidence,
    cohort.settings.minimum_cohort_size
  );

  const measured = heatmap
    .filter((row) => !row.overall.suppressed && row.overall.value !== null)
    .map((row) => ({
      skill: row.skill,
      category: row.category,
      value: Number(row.overall.value),
      assessedCount: row.overall.assessedCount || 0,
    }));

  const suppressedCells = heatmap.reduce(
    (sum, row) => sum + Object.values(row.cells).filter((cell) => cell.suppressed).length,
    0
  );

  await logAdminAudit(context, {
    action: 'analytics.skill_gaps_viewed',
    targetType: 'cohort',
    metadata: {
      filters,
      cohorts: cohorts.map((c) => ({ label: c.label, students: c.students.length })),
      suppressedCells,
    },
  }, client);

  const response: SkillGapResponse = {
    dataSource: 'live',
    generatedAt: new Date().toISOString(),
    filters,
    groupBy,
    filterOptions,
    cohorts: cohorts.map((cohort) => ({
      key: cohort.key,
      label: cohort.label,
      studentCount: cohort.students.length,
    })),
    skills: heatmap,
    weakest: [...measured].sort((a, b) => a.value - b.value).slice(0, 6),
    strongest: [...measured].sort((a, b) => b.value - a.value).slice(0, 6),
    privacy: {
      minimumCohortSize: cohort.settings.minimum_cohort_size,
      threshold: cohort.settings.skill_proficiency_threshold,
      minEvidence: cohort.settings.skill_min_evidence,
      suppressedCells,
    },
    warnings: [...new Set([...cohort.warnings, ...catalog.errors])],
  };

  return NextResponse.json(response);
}
