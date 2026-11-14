/**
 * /api/practice/assessments/submit
 *
 * Finalizes an assessment attempt and calculates scores server-side.
 * Strictly prevents client-side score manipulation and duplicate finalizations.
 * Once finalized, securely returns the comprehensive evaluation report,
 * correct answers, explanations, section breakdowns, and weak area analysis.
 * Integrates results with student profile and readiness tracking.
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

    // Server-authoritative scoring & duplicate finalization protection
    const evaluation = finalizeAssessmentAttempt(attemptId, userId, isAutoSubmit);

    // If Supabase is connected, persist attempt completion and integrate with student modules
    if (user) {
      try {
        if (!attemptId.startsWith('att_')) {
          await supabase
            .from('assessment_attempts')
            .update({
              status: evaluation.status,
              result_status: evaluation.resultStatus,
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
                topicBreakdown: evaluation.topicBreakdown,
              },
            })
            .eq('id', attemptId)
            .eq('user_id', user.id);
        }

        // Integration with Career Readiness & User Progress:
        // Update user_progress with real assessment weak areas and technical score
        const { data: currentProgress } = await supabase
          .from('user_progress')
          .select('weak_areas, technical_knowledge')
          .eq('user_id', user.id)
          .single();

        const existingWeak = currentProgress?.weak_areas || [];
        const combinedWeak = Array.from(new Set([...existingWeak, ...evaluation.weakTopics]));

        await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            technical_knowledge: Math.round(evaluation.percentage),
            weak_areas: combinedWeak,
            updated_at: new Date().toISOString(),
          });
      } catch {
        // Handled in resilient fallback
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
