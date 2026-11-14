import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logAdminAudit } from '@/lib/admin/audit';
import { loadCohort } from '@/lib/admin/cohort';
import { requireAdminPermission, resolveDepartmentScope, scopeDenied } from '@/lib/admin/context';
import { parseAdminFilters } from '@/lib/admin/filters';
import { buildSkillDrilldown, maskStudentId } from '@/lib/admin/analytics';
import type { SkillCatalogItem, SkillDrilldownResponse } from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const skillId = params.get('skillId');
  if (!skillId) {
    return NextResponse.json({ error: 'skillId is required' }, { status: 400 });
  }

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
  const [{ data: skillRow, error: skillError }, cohort] = await Promise.all([
    client.from('skill_catalog').select('*').eq('id', skillId).maybeSingle(),
    loadCohort(client, context, filters, { includeTopics: true, includeConsent: true, scopeDepartmentId: scopeDept }),
  ]);

  if (skillError || !skillRow) {
    return NextResponse.json({ error: 'Skill not found in the institutional catalogue.' }, { status: 404 });
  }
  if (cohort.dataSource === 'unavailable') {
    const empty: SkillDrilldownResponse = {
      dataSource: 'unavailable',
      generatedAt: new Date().toISOString(),
      skill: skillRow as SkillCatalogItem,
      threshold: 60,
      minEvidence: 2,
      students: [],
      counts: { proficient: 0, needs_improvement: 0, not_assessed: 0, insufficient_evidence: 0 },
      warning: cohort.error,
    };
    return NextResponse.json(empty);
  }

  const skill = skillRow as SkillCatalogItem;
  const drilldown = buildSkillDrilldown(
    cohort.students,
    skill,
    cohort.settings.skill_proficiency_threshold,
    cohort.settings.skill_min_evidence
  );

  const consentRequired = cohort.settings.require_consent_for_drilldown;
  const redacted = drilldown.rows.filter((row) => consentRequired && cohort.students.find((s) => s.id === row.id)?.hasConsent !== true).length;
  const rows = drilldown.rows.map((row) => {
    const student = cohort.students.find((s) => s.id === row.id);
    const canIdentify = !consentRequired || student?.hasConsent === true;
    return {
      ...row,
      id: canIdentify ? row.id : null,
      maskedId: maskStudentId(row.id),
      name: canIdentify ? row.name : null,
    };
  });

  await logAdminAudit(context, {
    action: 'skill.drilldown_viewed',
    targetType: 'skill',
    targetId: skill.id,
    metadata: {
      skill: skill.name,
      students: rows.length,
      redacted,
      filters,
    },
  }, client);

  const response: SkillDrilldownResponse = {
    dataSource: 'live',
    generatedAt: new Date().toISOString(),
    skill,
    threshold: cohort.settings.skill_proficiency_threshold,
    minEvidence: cohort.settings.skill_min_evidence,
    students: rows,
    counts: drilldown.counts,
    warning:
      redacted > 0
        ? `${redacted} student${redacted === 1 ? '' : 's'} are shown pseudonymously because institutional analytics consent is not recorded.`
        : undefined,
  };

  return NextResponse.json(response);
}
