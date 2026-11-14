import 'server-only';

import { createClient } from '@/utils/supabase/server';
import type { AdminUserContext } from './types';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface AuditEventInput {
  action: string;
  targetType?: string;
  targetId?: string | null;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function requestMeta(request?: Request | null): { ipAddress: string | null; userAgent: string | null } {
  if (!request) return { ipAddress: null, userAgent: null };
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  return {
    ipAddress: forwarded ? forwarded.split(',')[0].trim() : headers.get('x-real-ip'),
    userAgent: headers.get('user-agent'),
  };
}

export async function logAdminAudit(
  context: AdminUserContext,
  event: AuditEventInput,
  client?: SupabaseServerClient
): Promise<void> {
  try {
    const supabase = client ?? (await createClient());
    await supabase.from('admin_audit_log').insert({
      organization_id: context.organizationId,
      actor_user_id: context.isDevFallback ? null : context.userId,
      actor_role: context.role,
      action: event.action,
      target_type: event.targetType ?? null,
      target_id: event.targetId ?? null,
      target_user_id: event.targetUserId ?? null,
      metadata: event.metadata ?? {},
      ip_address: event.ipAddress ?? null,
      user_agent: event.userAgent ?? null,
    });
  } catch (error) {
    // Auditing must never break the primary operation, but must be visible in logs.
    console.error('[AdminAudit] Failed to append audit event:', error);
  }
}

export async function logStudentDrilldown(
  context: AdminUserContext,
  studentId: string,
  source: string,
  client?: SupabaseServerClient
): Promise<void> {
  await logAdminAudit(
    context,
    {
      action: 'student.drilldown_viewed',
      targetType: 'student',
      targetId: studentId,
      targetUserId: studentId,
      metadata: { source },
    },
    client
  );
}
