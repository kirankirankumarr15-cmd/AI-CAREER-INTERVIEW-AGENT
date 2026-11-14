/**
 * /api/practice/assessments/proctor
 *
 * Logs browser-based proctoring events:
 * - tab visibility changes (tab_hidden, tab_visible)
 * - window focus changes (window_blur, window_focus)
 * - fullscreen exit and enter (fullscreen_exit, fullscreen_enter)
 * - copy and paste events (copy_attempt, paste_attempt)
 * - navigation events
 * - repeated activity
 *
 * Integrity events are treated as review signals, never as automatic disqualification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { logProctoringEvent } from '@/lib/assessment/engine';
import { ProctorEventType } from '@/types';

export const dynamic = 'force-dynamic';

const ProctorSchema = z.object({
  attemptId: z.string().min(1),
  eventType: z.enum([
    'tab_hidden',
    'tab_visible',
    'window_blur',
    'window_focus',
    'fullscreen_exit',
    'fullscreen_enter',
    'copy_attempt',
    'paste_attempt',
    'navigation_event',
    'repeated_activity',
    'suspicious_shortcut',
  ]),
  details: z.object({}).catchall(z.unknown()).optional(),
  metadata: z.object({}).catchall(z.unknown()).optional(),
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

    const { attemptId, eventType, details, metadata } = parsed.data;

    const mergedDetails = { ...(details || {}), ...(metadata || {}) };
    const result = logProctoringEvent(attemptId, userId, eventType as ProctorEventType, mergedDetails);

    // If Supabase is available, record event in database
    if (user && !attemptId.startsWith('att_')) {
      try {
        await supabase.from('proctor_events').insert({
          attempt_id: attemptId,
          user_id: user.id,
          event_type: eventType,
          severity: result.severity,
          review_status: 'pending',
          metadata: mergedDetails,
          details: mergedDetails,
        });
      } catch {
        // Handled in resilient fallback
      }
    }

    return NextResponse.json({
      success: true,
      logged: result.logged,
      currentTabSwitches: result.currentTabSwitches,
      severity: result.severity,
      warningMessage: result.warningMessage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to record proctor event', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
