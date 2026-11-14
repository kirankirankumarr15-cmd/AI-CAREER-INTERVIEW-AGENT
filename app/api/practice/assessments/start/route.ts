/**
 * /api/practice/assessments/start
 *
 * Starts or resumes a timed assessment session with server-authoritative timing.
 * Generates started_at and deadline_at server-side.
 * Strictly delivers sanitized questions (correct answers and explanations are stripped).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { startAssessmentSession } from '@/lib/assessment/engine';

export const dynamic = 'force-dynamic';

const StartSchema = z.object({
  assessmentId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fallback user ID for local dev when auth server is offline
    const userId = user?.id || (process.env.NODE_ENV !== 'production' ? 'dev_student_user' : null);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = StartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { assessmentId } = parsed.data;
    const session = startAssessmentSession(assessmentId, userId);

    // If Supabase is available, sync attempt to database
    if (user) {
      try {
        await supabase.from('assessment_attempts').upsert({
          assessment_id: session.assessment.id,
          user_id: user.id,
          started_at: session.startedAt,
          deadline_at: session.deadlineAt,
          status: 'in_progress',
        });
      } catch {
        // Handled in resilient fallback
      }
    }

    return NextResponse.json({
      success: true,
      attemptId: session.attemptId,
      assessment: session.assessment,
      sections: session.sections,
      questions: session.questions, // Securely sanitized on the server
      startedAt: session.startedAt,
      deadlineAt: session.deadlineAt,
      remainingSeconds: session.remainingSeconds,
      tabSwitchCount: session.tabSwitchCount,
      savedAnswers: session.savedAnswers,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to start assessment', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
