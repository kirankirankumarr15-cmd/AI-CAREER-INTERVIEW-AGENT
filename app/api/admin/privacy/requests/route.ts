import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin/context';
import { createClient } from '@/utils/supabase/server';
import { logAdminAudit, requestMeta } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminPermission('consent.read');
    if (authResult.response) return authResult.response;
    const { context } = authResult;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const requestType = searchParams.get('type');

    const supabase = await createClient();

    let query = supabase
      .from('privacy_requests')
      .select(`
        id,
        organization_id,
        user_id,
        request_type,
        details,
        status,
        resolution_note,
        assigned_to,
        due_at,
        resolved_at,
        created_at,
        updated_at,
        profiles:user_id (
          full_name,
          email,
          usn,
          department_id
        )
      `)
      .eq('organization_id', context.organizationId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (requestType && requestType !== 'all') {
      query = query.eq('request_type', requestType);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.warn('[AdminPrivacyRequests] Database query fallback:', error.message);
      return NextResponse.json({
        dataSource: 'live',
        requests: [],
        counts: { total: 0, pending: 0, in_progress: 0, completed: 0, rejected: 0, overdue: 0 },
        message: 'No privacy requests found or table is pending migration.',
      });
    }

    const now = new Date();
    const counts = {
      total: requests?.length ?? 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      rejected: 0,
      overdue: 0,
    };

    const formattedRequests = (requests || []).map((r) => {
      const isOverdue = r.status === 'pending' && r.due_at && new Date(r.due_at) < now;
      if (r.status === 'pending') counts.pending++;
      else if (r.status === 'in_progress') counts.in_progress++;
      else if (r.status === 'completed') counts.completed++;
      else if (r.status === 'rejected') counts.rejected++;
      if (isOverdue) counts.overdue++;

      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;

      return {
        id: r.id,
        userId: r.user_id,
        studentName: profile?.full_name || 'Anonymous Student',
        studentEmail: profile?.email || 'N/A',
        studentUsn: profile?.usn || 'N/A',
        requestType: r.request_type,
        details: r.details,
        status: r.status,
        resolutionNote: r.resolution_note,
        assignedTo: r.assigned_to,
        dueAt: r.due_at,
        resolvedAt: r.resolved_at,
        createdAt: r.created_at,
        isOverdue,
      };
    });

    return NextResponse.json({
      dataSource: 'live',
      requests: formattedRequests,
      counts,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retrieve privacy requests', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAdminPermission('consent.write');
    if (authResult.response) return authResult.response;
    const { context } = authResult;

    const body = await req.json();
    const { requestId, status, resolutionNote } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: 'requestId and status are required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {
      status,
      resolution_note: resolutionNote ?? null,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed' || status === 'rejected') {
      updatePayload.resolved_at = new Date().toISOString();
      updatePayload.assigned_to = context.userId;
    }

    const { data: updated, error } = await supabase
      .from('privacy_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .eq('organization_id', context.organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Database update failed', details: error.message }, { status: 500 });
    }

    const meta = requestMeta(req);
    await logAdminAudit(
      context,
      {
        action: 'privacy.request_resolved',
        targetType: 'privacy_request',
        targetId: requestId,
        targetUserId: updated?.user_id,
        metadata: {
          previousStatus: updated?.status,
          newStatus: status,
          resolutionNote: resolutionNote ?? '',
        },
        ...meta,
      },
      supabase
    );

    return NextResponse.json({
      success: true,
      request: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update privacy request', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
