/**
 * /api/practice/assessments/results/[attemptId]
 *
 * GET: Fetches the evaluation results, breakdown, and correct explanations
 * for a completed or expired attempt.
 * Validates authentication and student ownership.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAttemptEvaluation } from '@/lib/assessment/engine';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || (process.env.NODE_ENV !== 'production' ? 'dev_student_user' : null);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Try retrieving from engine local store
    let evaluation = getAttemptEvaluation(attemptId, userId);

    // If not found in engine local store, query Supabase database
    if (!evaluation && user) {
      try {
        const { data: attemptRow, error } = await supabase
          .from('assessment_attempts')
          .select('*')
          .eq('id', attemptId)
          .eq('user_id', user.id)
          .single();

        if (!error && attemptRow && (attemptRow.status === 'completed' || attemptRow.status === 'expired')) {
          const { data: answersRows } = await supabase
            .from('assessment_answers')
            .select('*')
            .eq('attempt_id', attemptId);

          const { data: assessmentRow } = await supabase
            .from('assessments')
            .select('title, pass_marks')
            .eq('id', attemptRow.assessment_id)
            .single();

          evaluation = {
            id: attemptRow.id,
            assessmentId: attemptRow.assessment_id,
            assessmentTitle: assessmentRow?.title || 'Placement Assessment',
            startedAt: attemptRow.started_at,
            deadlineAt: attemptRow.deadline_at,
            submittedAt: attemptRow.submitted_at || attemptRow.created_at,
            status: attemptRow.status,
            resultStatus: attemptRow.result_status || 'pending',
            timeTakenSecs: attemptRow.time_taken_secs || 0,
            score: Number(attemptRow.score || 0),
            totalMarks: Number(attemptRow.total_marks || 0),
            passMarks: Number(assessmentRow?.pass_marks || 0),
            percentage: Number(attemptRow.percentage || 0),
            tabSwitchCount: attemptRow.tab_switch_count || 0,
            totalQuestions: answersRows?.length || 0,
            correctCount: answersRows?.filter((a) => a.is_correct).length || 0,
            incorrectCount: answersRows?.filter((a) => !a.is_correct && a.selected_option).length || 0,
            unansweredCount: answersRows?.filter((a) => !a.selected_option).length || 0,
            sectionBreakdown: attemptRow.summary?.sectionBreakdown || [],
            topicBreakdown: attemptRow.summary?.topicBreakdown || [],
            weakTopics: attemptRow.summary?.weakTopics || [],
            recommendations: attemptRow.summary?.recommendations || [],
            proctorEvents: [],
            answers: answersRows || [],
          };
        }
      } catch {
        // Fallback handled
      }
    }

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found or still in progress' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retrieve assessment results', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
