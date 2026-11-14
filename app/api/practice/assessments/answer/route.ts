/**
 * /api/practice/assessments/answer
 *
 * Saves a student's answer for a specific question.
 * Validates attempt ownership and server deadline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { recordQuestionAnswer } from '@/lib/assessment/engine';

export const dynamic = 'force-dynamic';

const AnswerSchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOption: z.string().nullable(),
  isMarkedReview: z.boolean().default(false),
  timeSpentSecs: z.number().int().min(0).default(0),
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
    const parsed = AnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { attemptId, questionId, selectedOption, isMarkedReview, timeSpentSecs } = parsed.data;

    const result = recordQuestionAnswer(attemptId, userId, questionId, selectedOption, isMarkedReview, timeSpentSecs);

    if (result.isExpired) {
      return NextResponse.json(
        { error: 'Assessment time has expired. Submissions are closed.', isExpired: true },
        { status: 410 } // HTTP 410 Gone
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: 'Attempt not found or invalid ownership' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      questionId,
      selectedOption,
      isMarkedReview,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to record answer', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
