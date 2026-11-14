/**
 * /api/roadmap/replan
 *
 * Intelligent Weekly Replanning:
 * - Analyzes completed tasks
 * - Recalculates remaining weeks based on recent assessment accuracy & readiness gaps
 * - Strictly PRESERVES completed task history (never deleted)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { replanWeeklySchedule } from '@/lib/roadmap/dynamic-roadmap';

export const dynamic = 'force-dynamic';

const ReplanSchema = z.object({
  updatedReadiness: z.number().min(0).max(100).default(70),
  weakTopics: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || (process.env.NODE_ENV !== 'production' ? 'dev_student_user' : null);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ReplanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { updatedReadiness, weakTopics } = parsed.data;

    const result = replanWeeklySchedule(userId, updatedReadiness, weakTopics);

    if (!result.success || !result.plan) {
      return NextResponse.json({ error: 'No active roadmap found to replan.' }, { status: 404 });
    }

    // Persist replan log to database if connected
    if (user) {
      try {
        await supabase.from('roadmap_replans').insert({
          plan_id: result.plan.id.startsWith('plan_') ? undefined : result.plan.id,
          user_id: user.id,
          week_number: result.plan.currentWeek,
          trigger_reason: 'Weekly performance review and readiness recalibration',
          new_priorities: weakTopics,
        });
      } catch {
        // Handled in dev
      }
    }

    return NextResponse.json({
      success: true,
      plan: result.plan,
      replanSummary: result.replanSummary,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Replanning failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

