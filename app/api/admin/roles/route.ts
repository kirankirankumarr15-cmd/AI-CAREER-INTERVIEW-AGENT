import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/rbac';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const RoleAssignSchema = z.object({
  targetUserId: z.string().uuid(),
  role: z.enum(['student', 'tpo', 'admin']),
  organizationId: z.string().uuid().optional(),
});

/**
 * GET /api/admin/roles
 * Staff/Admin only: Lists organization members and roles.
 * Students receive 403 Forbidden.
 */
export async function GET() {
  const { context, errorResponse } = await requireRole(['admin', 'tpo']);
  if (errorResponse) return errorResponse;

  try {
    const supabase = await createClient();
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('id, user_id, role, created_at, organization_id')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      caller: context,
      members: members || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roles
 * Admin only: Assigns or promotes a user's role.
 * Students receive 403 Forbidden.
 */
export async function POST(req: Request) {
  const { context, errorResponse } = await requireRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = RoleAssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { targetUserId, role, organizationId } = parsed.data;
    const supabase = await createClient();

    // Upsert into organization_members
    const { data, error } = await supabase
      .from('organization_members')
      .upsert(
        {
          user_id: targetUserId,
          role,
          organization_id: organizationId || '00000000-0000-0000-0000-000000000000',
          invited_by: context?.userId,
        },
        { onConflict: 'organization_id,user_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      membership: data,
      assignedBy: context?.userId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

