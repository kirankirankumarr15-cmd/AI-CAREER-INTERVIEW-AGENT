import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin/context';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminPermission('audit.read');
    if (authResult.response) return authResult.response;
    const { context } = authResult;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = await createClient();

    let query = supabase
      .from('admin_audit_log')
      .select(`
        id,
        organization_id,
        actor_user_id,
        actor_role,
        action,
        target_type,
        target_id,
        target_user_id,
        metadata,
        ip_address,
        user_agent,
        created_at,
        profiles:actor_user_id (
          full_name,
          email
        )
      `, { count: 'exact' })
      .eq('organization_id', context.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action && action !== 'all') {
      query = query.eq('action', action);
    }
    if (role && role !== 'all') {
      query = query.eq('actor_role', role);
    }

    const { data: logs, count, error } = await query;

    if (error) {
      console.warn('[AdminAuditLog] Query fallback:', error.message);
      return NextResponse.json({
        dataSource: 'live',
        total: 0,
        logs: [],
        message: 'No audit records found or table is pending migration.',
      });
    }

    const formatted = (logs || []).map((l) => {
      const actor = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
      return {
        id: l.id,
        action: l.action,
        actorName: actor?.full_name || 'System / Admin',
        actorEmail: actor?.email || 'N/A',
        actorRole: l.actor_role,
        targetType: l.target_type,
        targetId: l.target_id,
        metadata: l.metadata,
        ipAddress: l.ip_address,
        createdAt: l.created_at,
      };
    });

    return NextResponse.json({
      dataSource: 'live',
      total: count ?? formatted.length,
      limit,
      offset,
      logs: formatted,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retrieve audit logs', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
