import { NextRequest, NextResponse } from 'next/server';
import { nodeDb } from '@/lib/db/nodeDb';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in to record progress.' },
        { status: 401 }
      );
    }

    // Sync user into DB
    nodeDb.syncUser({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    const body = await req.json();
    const { questionId, selectedAnswer, timeTakenSeconds = 0, isCodingOrText = false } = body;

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required.' },
        { status: 400 }
      );
    }

    const question = nodeDb.getQuestionById(questionId);
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found.' },
        { status: 404 }
      );
    }

    let isCorrect = false;

    if (question.questionType === 'mcq' && !isCodingOrText) {
      const cleanSelected = (selectedAnswer || '').toString().trim().toUpperCase();
      const cleanCorrect = (question.correctAnswer || '').toString().trim().toUpperCase();
      isCorrect = cleanSelected === cleanCorrect;
    } else {
      // Coding or conceptual text: student submitted / marked solved
      isCorrect = true;
    }

    // Record attempt in database with unique constraint (user_id, question_id) upsert
    const updatedProgress = nodeDb.recordAttempt({
      userId: user.id,
      questionId: question.id,
      subjectId: question.subjectId,
      isCorrect,
      selectedAnswer: selectedAnswer ? selectedAnswer.toString() : null,
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
    });

    // Mirror to Supabase if reachable (non-blocking, best-effort)
    try {
      const supabase = await createClient();
      void Promise.resolve(
        supabase.from('practice_attempts').upsert(
          {
            user_id: user.id,
            question_id: question.id,
            subject_id: question.subjectId,
            is_correct: isCorrect,
            selected_answer: selectedAnswer ? selectedAnswer.toString() : null,
            time_taken_seconds: Number(timeTakenSeconds) || 0,
            attempted_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,question_id' }
        )
      ).catch(() => {});
    } catch {}

    return NextResponse.json({
      success: true,
      isCorrect,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      progress: updatedProgress,
    });
  } catch (error) {
    console.error('Error submitting practice answer:', error);
    const msg = error instanceof Error ? error.message : 'Server error recording answer';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
