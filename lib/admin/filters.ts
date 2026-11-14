import type { AdminFilters, FilterOptions, InstitutionSettings, ReadinessCategoryConfig } from './types';

export const DEFAULT_SETTINGS: InstitutionSettings = {
  organization_id: '',
  academic_year: '2026-2027',
  readiness_weights: {
    assessments: 25,
    resume: 20,
    interview: 25,
    groupDiscussion: 15,
    profile: 15,
  },
  readiness_thresholds: { highly_prepared: 75, moderately_prepared: 50 },
  minimum_cohort_size: 5,
  readiness_min_coverage: 40,
  require_consent_for_drilldown: true,
  skill_proficiency_threshold: 60,
  skill_min_evidence: 2,
  consent_notice_version: '2026-11',
  data_retention_months: 24,
  allow_staff_export: true,
};

export function parseAdminFilters(searchParams: URLSearchParams): AdminFilters {
  const pick = (key: string): string | undefined => {
    const value = searchParams.get(key);
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 200) : undefined;
  };
  return {
    academicYear: pick('academicYear'),
    departmentId: pick('departmentId'),
    batch: pick('batch'),
    course: pick('course'),
    assessmentId: pick('assessmentId'),
    from: pick('from'),
    to: pick('to'),
    targetRole: pick('targetRole'),
    search: pick('search'),
    skillCategory:
      pick('skillCategory') === 'professional' || pick('skillCategory') === 'technical'
        ? (pick('skillCategory') as 'technical' | 'professional')
        : undefined,
    groupBy: pick('groupBy') === 'batch' ? 'batch' : 'department',
    skillId: pick('skillId'),
  };
}

export function parseDate(value?: string, endOfDay = false): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export function filtersToSearchParams(filters: AdminFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params;
}

export function splitIntoChunks<T>(items: T[], size = 300): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function loadInstitutionSettings(
  supabase: any,
  organizationId: string
): Promise<InstitutionSettings> {
  const { data } = await supabase
    .from('institution_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!data) return { ...DEFAULT_SETTINGS, organization_id: organizationId };

  return {
    ...DEFAULT_SETTINGS,
    ...data,
    readiness_weights: {
      ...DEFAULT_SETTINGS.readiness_weights,
      ...(data.readiness_weights || {}),
    },
    readiness_thresholds: {
      ...DEFAULT_SETTINGS.readiness_thresholds,
      ...(data.readiness_thresholds || {}),
    },
    organization_id: organizationId,
  };
}

export async function loadReadinessCategories(
  supabase: any,
  organizationId: string
): Promise<ReadinessCategoryConfig[]> {
  const { data } = await supabase
    .from('readiness_category_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!data?.length) {
    return [
      { category_key: 'highly_prepared', label: 'Highly prepared', min_score: 75, max_score: 100, min_coverage: 40, color: '#2563EB', sort_order: 1 },
      { category_key: 'moderately_prepared', label: 'Moderately prepared', min_score: 50, max_score: 74.99, min_coverage: 40, color: '#0EA5E9', sort_order: 2 },
      { category_key: 'needs_improvement', label: 'Needs improvement', min_score: 0, max_score: 49.99, min_coverage: 40, color: '#F59E0B', sort_order: 3 },
      { category_key: 'insufficient_data', label: 'Not enough assessment data', min_score: null, max_score: null, min_coverage: 0, color: '#94A3B8', sort_order: 4 },
    ];
  }
  return data as ReadinessCategoryConfig[];
}

export async function loadFilterOptions(
  supabase: any,
  organizationId: string,
  scopeDepartmentId?: string | null
): Promise<FilterOptions> {
  let profileQuery = supabase
    .from('profiles')
    .select('department_id, batch_name, course, academic_year, target_role')
    .eq('organization_id', organizationId)
    .limit(5000);

  if (scopeDepartmentId) profileQuery = profileQuery.eq('department_id', scopeDepartmentId);

  const [profilesRes, departmentsRes, assessmentsRes, settings] = await Promise.all([
    profileQuery,
    supabase
      .from('departments')
      .select('id, name, code')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('assessments')
      .select('id, title')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100),
    loadInstitutionSettings(supabase, organizationId),
  ]);

  const rows = (profilesRes.data || []) as Array<Record<string, string | null>>;
  const unique = (values: Array<string | null | undefined>) =>
    Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort();

  const departments = (departmentsRes.data || []).filter((d: { id: string }) =>
    scopeDepartmentId ? d.id === scopeDepartmentId : true
  );

  return {
    academicYears: unique([settings.academic_year, ...rows.map((r) => r.academic_year)]),
    departments,
    batches: unique(rows.map((r) => r.batch_name)),
    courses: unique(rows.map((r) => r.course)),
    assessments: (assessmentsRes.data || []) as Array<{ id: string; title: string }>,
    targetRoles: unique(rows.map((r) => r.target_role)),
  };
}

export function applyProfileFilters(
  query: any,
  filters: AdminFilters,
  scopeDepartmentId?: string | null
): any {
  let next = query;
  if (scopeDepartmentId) next = next.eq('department_id', scopeDepartmentId);
  if (filters.departmentId) next = next.eq('department_id', filters.departmentId);
  if (filters.batch) next = next.eq('batch_name', filters.batch);
  if (filters.course) next = next.eq('course', filters.course);
  if (filters.academicYear) next = next.eq('academic_year', filters.academicYear);
  if (filters.targetRole) next = next.eq('target_role', filters.targetRole);
  return next;
}
