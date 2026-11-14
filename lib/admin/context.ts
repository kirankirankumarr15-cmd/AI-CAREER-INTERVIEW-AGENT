import 'server-only';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { buildPermissions, isStaffRole, normalizeAdminRole } from './permissions';
import type { AdminRole, AdminUserContext, Permission } from './types';

export type AdminContextFailureReason =
  | 'unauthenticated'
  | 'forbidden'
  | 'database_unavailable'
  | 'no_institution';

export interface AdminContextFailure {
  reason: AdminContextFailureReason;
  message: string;
}

export type AdminContextResult =
  | { context: AdminUserContext; error: null }
  | { context: null; error: AdminContextFailure };

const DEV_ORG_ID = '00000000-0000-0000-0000-0000000000a5';

function fail(reason: AdminContextFailureReason, message: string): AdminContextResult {
  return { context: null, error: { reason, message } };
}

async function buildDevFallback(): Promise<AdminContextResult> {
  const cookieStore = await cookies();
  const hasDemoSession = cookieStore.getAll().some((c) => c.name === 'careerpilot_session');
  const hasStaffDemo = cookieStore.getAll().some((c) => c.name === 'careerpilot_staff_demo');
  if (process.env.NODE_ENV === 'production' || !hasDemoSession || !hasStaffDemo) {
    return fail('unauthenticated', 'Authentication required.');
  }

  const { permissions, scopes } = buildPermissions('institution_admin');
  return {
    context: {
      userId: 'dev_admin_user',
      email: 'admin@pesitm.edu.in',
      fullName: 'Development Administrator',
      role: 'institution_admin',
      organizationId: DEV_ORG_ID,
      organizationName: 'CareerPilot Demo Institution',
      organizationCode: 'DEMO',
      departmentId: null,
      departmentName: null,
      permissions,
      scopes,
      isSuperAdmin: false,
      isDevFallback: true,
    },
    error: null,
  };
}

function orderMemberRows(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return [...rows].sort((a, b) => {
    const rank = (r: Record<string, unknown>) =>
      ['super_admin', 'institution_admin', 'admin', 'tpo', 'department_coordinator', 'faculty'].includes(
        String(r.role || '')
      )
        ? 0
        : 1;
    return rank(a) - rank(b);
  });
}

/**
 * Resolves the administrative identity from the server session.
 * The role is never read from client headers, localStorage or query strings.
 */
export async function getAdminContext(organizationOverride?: string | null): Promise<AdminContextResult> {
  const supabase = await createClient();

  let user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = {
        id: data.user.id,
        email: data.user.email ?? null,
        user_metadata: (data.user.user_metadata as Record<string, unknown>) ?? {},
      };
    }
  } catch {
    user = null;
  }

  if (!user) {
    return buildDevFallback();
  }

  const [membershipRes, profileRes] = await Promise.all([
    supabase.from('organization_members').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
  ]);

  if (membershipRes.error && !membershipRes.error.message.toLowerCase().includes('no rows')) {
    const code = (membershipRes.error as { code?: string }).code;
    if (code === '42P01' || /does not exist/i.test(membershipRes.error.message)) {
      return fail(
        'database_unavailable',
        'The Phase 5 database migration has not been applied. Run the migration before using the admin portal.'
      );
    }
  }

  if (profileRes.error) {
    const code = (profileRes.error as { code?: string }).code;
    if (code === '42P01' || /does not exist/i.test(profileRes.error.message)) {
      return fail(
        'database_unavailable',
        'The institution schema is not available. Apply the Phase 5 migration first.'
      );
    }
  }

  const profile = (profileRes.data || {}) as Record<string, unknown>;
  const memberships = orderMemberRows((membershipRes.data || []) as Array<Record<string, unknown>>);
  const membership = memberships[0] || {};

  const role = normalizeAdminRole(
    (membership.role as string) || (profile.role as string) || 'student'
  );

  if (!isStaffRole(role)) {
    return fail('forbidden', 'This account does not have institutional administrator access.');
  }

  let organizationId =
    (membership.organization_id as string) ||
    (membership.org_id as string) ||
    (profile.organization_id as string) ||
    null;

  if (role === 'super_admin' && organizationOverride) {
    organizationId = organizationOverride;
  }

  if (!organizationId) {
    const { data: firstOrg } = await supabase
      .from('organizations')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    organizationId = firstOrg?.id || null;
  }

  if (!organizationId) {
    return fail('no_institution', 'No institution is configured for this account.');
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, code, short_code')
    .eq('id', organizationId)
    .maybeSingle();

  const departmentId =
    (membership.department_id as string) || (profile.department_id as string) || null;

  let departmentName: string | null = null;
  if (departmentId) {
    const { data: dept } = await supabase
      .from('departments')
      .select('name')
      .eq('id', departmentId)
      .maybeSingle();
    departmentName = dept?.name || null;
  }

  const { data: overrides } = await supabase
    .from('role_permissions')
    .select('permission, allowed')
    .eq('organization_id', organizationId)
    .eq('role', role);

  const { permissions, scopes } = buildPermissions(
    role,
    (overrides || []) as Array<{ permission: string; allowed: boolean }>
  );

  const fullName =
    (profile.full_name as string) ||
    ((user.user_metadata?.full_name as string) ?? '') ||
    (user.email ? user.email.split('@')[0] : 'Administrator');

  return {
    context: {
      userId: user.id,
      email: user.email || (profile.email as string) || '',
      fullName,
      role,
      organizationId,
      organizationName:
        (organization?.name as string) ||
        (organization?.short_code as string) ||
        'Institution',
      organizationCode: (organization?.code as string) || (organization?.short_code as string) || undefined,
      departmentId,
      departmentName,
      permissions,
      scopes,
      isSuperAdmin: role === 'super_admin',
    },
    error: null,
  };
}

export function contextFailureResponse(error: AdminContextFailure): NextResponse {
  const status =
    error.reason === 'unauthenticated'
      ? 401
      : error.reason === 'forbidden'
        ? 403
        : error.reason === 'no_institution'
          ? 409
          : 503;
  return NextResponse.json(
    { error: error.message, reason: error.reason },
    { status }
  );
}

export async function requireAdminPermission(
  permission: Permission,
  organizationOverride?: string | null
): Promise<
  | { context: AdminUserContext; response: null }
  | { context: null; response: NextResponse }
> {
  const result = await getAdminContext(organizationOverride);
  if (!result.context) {
    return { context: null, response: contextFailureResponse(result.error) };
  }
  if (!result.context.permissions[permission]) {
    return {
      context: null,
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: `Your role (${result.context.role}) does not include the ${permission} permission.`,
        },
        { status: 403 }
      ),
    };
  }
  return { context: result.context, response: null };
}

/**
 * Department-scoped roles can never widen their scope through query parameters.
 * Returns `null` when the caller has no department assignment and must be denied.
 */
export function resolveDepartmentScope(
  context: AdminUserContext,
  requestedDepartmentId?: string | null
): string | null | undefined {
  if (context.role === 'department_coordinator' || context.role === 'faculty') {
    return context.departmentId || null;
  }
  if (requestedDepartmentId) return requestedDepartmentId;
  return undefined;
}

export function scopeDenied(context: AdminUserContext): boolean {
  return (
    (context.role === 'department_coordinator' || context.role === 'faculty') &&
    !context.departmentId
  );
}

export function roleLabel(role: AdminRole): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
