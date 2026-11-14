/**
 * /api/practice/assessments/submit
 *
 * Submits an assessment attempt, computes server-side scoring,
 * section breakdowns, weak topics, and recommendations.
 * Returns full evaluation including correct options and explanations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { finalizeAssessmentAttempt } from '@/lib/assessment/engine';

export const dynamic = 'force-dynamic';

const SubmitSchema = z.object({
  attemptId: z.string().min(1),
  isAutoSubmit: z.boolean().default(false),
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
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { attemptId, isAutoSubmit } = parsed.data;

    const evaluation = finalizeAssessmentAttempt(attemptId, userId, isAutoSubmit);

    // If Supabase is connected, persist completion result
    if (user) {
      try {
        await supabase
          .from('assessment_attempts')
          .update({
            status: evaluation.status,
            submitted_at: evaluation.submittedAt,
            time_taken_secs: evaluation.timeTakenSecs,
            score: evaluation.score,
            total_marks: evaluation.totalMarks,
            percentage: evaluation.percentage,
            tab_switch_count: evaluation.tabSwitchCount,
            summary: {
              weakTopics: evaluation.weakTopics,
              recommendations: evaluation.recommendations,
              sectionBreakdown: evaluation.sectionBreakdown,
            },
          })
          .eq('user_id', user.id);
      } catch {
        // Handled in dev fallback
      }
    }

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to submit assessment', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
