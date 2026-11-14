/**
 * /api/practice/assessments
 *
 * GET: Lists active assessments and student attempt history.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SEED_ASSESSMENTS } from '@/lib/assessment/assessment-bank';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check database if available
    let dbAssessments: typeof SEED_ASSESSMENTS = [];
    if (user) {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('id, title, description, category, duration_minutes, total_marks, pass_marks, negative_marking, is_active')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          dbAssessments = data.map((d) => ({
            id: d.id,
            title: d.title,
            description: d.description || '',
            category: d.category,
            durationMinutes: d.duration_minutes,
            totalMarks: Number(d.total_marks),
            passMarks: Number(d.pass_marks),
            negativeMarking: d.negative_marking,
            questionCount: 15,
          }));
        }
      } catch {
        // Fall back to seed assessments
      }
    }

    const assessments = dbAssessments.length > 0 ? dbAssessments : SEED_ASSESSMENTS;

    return NextResponse.json({
      success: true,
      assessments,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch assessments', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
