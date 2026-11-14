/**
 * /api/practice/assessments/questions
 *
 * GET: Secure Question Delivery.
 * Strictly returns only the sanitized fields necessary to display the assessment.
 * Correct answers, keys, explanations, and hidden scoring parameters are strictly stripped.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SEED_QUESTIONS } from '@/lib/assessment/assessment-bank';
import { sanitizeQuestionsForClient } from '@/lib/assessment/engine';
import { AssessmentQuestionFull } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get('assessmentId') || 'asmt-tcs-nqt-full';

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const dbQuestions: AssessmentQuestionFull[] = SEED_QUESTIONS[assessmentId] || [];

    if (user) {
      try {
        const { data, error } = await supabase
          .from('assessment_questions')
          .select('id, assessment_id, section_id, question_text, question_type, options, topic, difficulty, marks, negative_marks, order_index')
          .eq('assessment_id', assessmentId)
          .order('order_index', { ascending: true });

        if (!error && data && data.length > 0) {
          // Note: Notice correct_option and explanation were not even selected from the DB!
          return NextResponse.json({
            success: true,
            questions: data.map((q) => ({
              id: q.id,
              assessmentId: q.assessment_id,
              sectionId: q.section_id,
              questionText: q.question_text,
              questionType: q.question_type,
              options: q.options,
              topic: q.topic,
              difficulty: q.difficulty,
              marks: Number(q.marks),
              negativeMarks: Number(q.negative_marks),
              orderIndex: q.order_index,
            })),
          });
        }
      } catch {
        // Fall back to seed bank
      }
    }

    // Strip answers from seed bank
    const safeQuestions = sanitizeQuestionsForClient(dbQuestions);

    return NextResponse.json({
      success: true,
      questions: safeQuestions,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retrieve questions', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
