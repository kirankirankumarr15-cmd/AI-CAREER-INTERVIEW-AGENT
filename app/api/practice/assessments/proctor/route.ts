/**
 * /api/practice/assessments/proctor
 *
 * Logs browser-based proctoring events:
 * - tab_hidden (visibilitychange)
 * - window_blur (focus lost)
 * - window_focus (focus regained)
 *
 * Does not disqualify students automatically; records evidence for review.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { logProctoringEvent } from '@/lib/assessment/engine';
import { ProctorEventType } from '@/types';

export const dynamic = 'force-dynamic';

const ProctorSchema = z.object({
  attemptId: z.string().min(1),
  eventType: z.enum(['tab_hidden', 'window_blur', 'window_focus', 'fullscreen_exit', 'paste_attempt']),
  details: z.record(z.string(), z.unknown()).optional(),
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
    const parsed = ProctorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { attemptId, eventType, details } = parsed.data;

    const result = logProctoringEvent(attemptId, userId, eventType as ProctorEventType, details);

    return NextResponse.json({
      success: true,
      logged: result.logged,
      currentTabSwitches: result.currentTabSwitches,
      shouldAutoSubmit: result.shouldAutoSubmit,
      warningMessage:
        result.currentTabSwitches === 1
          ? 'Notice: Window blur/tab switch detected. Please remain on the assessment screen.'
          : result.currentTabSwitches >= 3
          ? `Warning: ${result.currentTabSwitches} focus changes recorded. Exam integrity policy is enforced.`
          : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to record proctor event', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
