/**
 * /api/chat/tools/execute/route.ts
 *
 * POST - Executes a sensitive action ONLY after explicit student confirmation in the UI.
 * Never called silently.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { executeConfirmedAction } from '@/lib/ai/chat-tools';

const ExecuteActionSchema = z.object({
  actionName: z.string(),
  args: z.record(z.string(), z.unknown()),
  actionId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ExecuteActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { actionName, args } = parsed.data;
    const result = await executeConfirmedAction(actionName, args, user.id, supabase);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
