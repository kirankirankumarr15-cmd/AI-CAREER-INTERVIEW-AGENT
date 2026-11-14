/**
 * /api/practice/assessments/[id]
 *
 * GET: Fetches specific assessment instructions, metadata, sections,
 * and proctoring disclosure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SEED_ASSESSMENTS, SEED_SECTIONS } from '@/lib/assessment/assessment-bank';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await context.params;
    const supabase = await createClient();

    // Check DB first
    let assessment = SEED_ASSESSMENTS.find((a) => a.id === assessmentId);
    let sections = SEED_SECTIONS[assessmentId] || [];

    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (!error && data) {
        assessment = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          category: data.category,
          difficulty: data.difficulty || 'Medium',
          durationMinutes: data.duration_minutes,
          totalMarks: Number(data.total_marks),
          passMarks: Number(data.pass_marks),
          totalQuestions: data.total_questions || 15,
          questionCount: data.total_questions || 15,
          negativeMarking: Boolean(data.negative_marking),
          status: data.status || 'published',
        };

        const { data: secData } = await supabase
          .from('assessment_sections')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('order_index', { ascending: true });

        if (secData && secData.length > 0) {
          sections = secData.map((s) => ({
            id: s.id,
            assessmentId: s.assessment_id,
            title: s.title,
            description: s.description || undefined,
            orderIndex: s.order_index,
            durationMinutes: s.duration_minutes || undefined,
            marksPerQuestion: Number(s.marks_per_question),
            negativeMarks: Number(s.negative_marks),
          }));
        }
      }
    } catch {
      // Fallback to in-memory bank
    }

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const instructions = [
      'Server-Authoritative Timer: The examination countdown is measured directly against server-generated timestamps. Refreshing, closing, or altering your local system clock will not prolong your allowed duration.',
      'Navigation & Palette: Use the question palette to jump between sections. You may save answers, mark questions for review, or clear responses at any point prior to final submission.',
      assessment.negativeMarking
        ? 'Negative Marking: Incorrect answers incur negative marking penalties. Unanswered questions do not affect your score.'
        : 'Scoring: No negative marking is applied for this assessment. Attempt all questions to maximize your score.',
      'Automatic Submission: When the timer expires, all saved answers are automatically locked, evaluated on the server, and results generated immediately.',
      'Integrity Monitoring: During this assessment, certain browser activity events may be recorded to support assessment integrity.',
    ];

    const proctoringDisclosure =
      'During this assessment, certain browser activity events may be recorded to support assessment integrity. Browser events are treated as review signals rather than automated disqualifications.';

    return NextResponse.json({
      success: true,
      assessment: {
        ...assessment,
        sections,
      },
      instructions,
      proctoringDisclosure,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch assessment details', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
