/**
 * /api/practice/assessments
 *
 * GET: Lists active assessments with user attempt history, latest score,
 * and completion status.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SEED_ASSESSMENTS } from '@/lib/assessment/assessment-bank';
import { getUserAssessmentHistory } from '@/lib/assessment/engine';
import { AssessmentSummary } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || (process.env.NODE_ENV !== 'production' ? 'dev_student_user' : null);

    let assessments: AssessmentSummary[] = [...SEED_ASSESSMENTS];

    // Try fetching from database if available
    if (user) {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('id, title, description, category, difficulty, duration_minutes, total_marks, pass_marks, total_questions, negative_marking, status, is_active')
          .or('is_active.eq.true,status.eq.published');

        if (!error && data && data.length > 0) {
          assessments = data.map((d) => ({
            id: d.id,
            title: d.title,
            description: d.description || '',
            category: d.category,
            difficulty: (d.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
            durationMinutes: d.duration_minutes,
            totalMarks: Number(d.total_marks),
            passMarks: Number(d.pass_marks),
            totalQuestions: d.total_questions || 15,
            questionCount: d.total_questions || 15,
            negativeMarking: Boolean(d.negative_marking),
            status: (d.status as 'draft' | 'published' | 'archived') || 'published',
          }));
        }
      } catch {
        // Fall back to seed bank
      }
    }

    // Attach student's previous attempt history
    const userHistory = userId ? getUserAssessmentHistory(userId) : {};

    // Also attempt fetching latest attempts from Supabase if connected
    if (user) {
      try {
        const { data: attemptRows } = await supabase
          .from('assessment_attempts')
          .select('assessment_id, score, percentage, result_status, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (attemptRows && attemptRows.length > 0) {
          attemptRows.forEach((row) => {
            if (!userHistory[row.assessment_id]) {
              userHistory[row.assessment_id] = {
                count: 1,
                latestScore: Number(row.score || 0),
                latestPercentage: Number(row.percentage || 0),
                latestResultStatus: (row.result_status as 'passed' | 'failed' | 'pending') || 'pending',
              };
            } else {
              userHistory[row.assessment_id].count += 1;
            }
          });
        }
      } catch {
        // Handled
      }
    }

    const enrichedAssessments = assessments.map((asmt) => {
      const hist = userHistory[asmt.id];
      return {
        ...asmt,
        previousAttemptsCount: hist ? hist.count : 0,
        latestScore: hist ? hist.latestScore : undefined,
        latestPercentage: hist ? hist.latestPercentage : undefined,
        latestResultStatus: hist ? hist.latestResultStatus : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      assessments: enrichedAssessments,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch assessments', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
