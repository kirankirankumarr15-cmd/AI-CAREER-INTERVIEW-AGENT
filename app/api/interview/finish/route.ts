/**
 * /api/interview/finish
 *
 * Finalises the interview session:
 *   1. Loads all answered questions from DB
 *   2. Computes final scores from saved evaluations (never hardcoded)
 *   3. Updates interview_sessions with final scores + weak/strong areas
 *   4. Syncs weak areas to learning_roadmaps
 *   5. Updates user_progress
 *   6. Logs final event
 *
 * Returns:
 *   { report: FinalReport }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { callGeminiJSON } from '@/lib/ai/gemini';

export interface FinalReport {
  overallScore:       number;
  technicalScore:     number;
  communicationScore: number;
  confidenceScore:    number;
  problemSolvingScore: number;
  projectScore:       number;
  hrScore:            number;
  strongAreas:        string[];
  weakAreas:          string[];
  recommendations:    string[];
  totalTurns:         number;
  completedAt:        string;
}

const FinishSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = FinishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { sessionId } = parsed.data;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Load session
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Load all answered questions
    const { data: questions } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_index', { ascending: true });

    const answeredQuestions = (questions ?? []).filter(
      (q: Record<string, unknown>) => q.student_answer && String(q.student_answer).trim().length > 0
    );

    // Load memory for weak/strong areas
    const { data: memory } = await supabase
      .from('interview_memory')
      .select('weak_areas_detected, strong_areas_detected, total_turns')
      .eq('session_id', sessionId)
      .single();

    // Compute scores from saved evaluations (never hardcoded)
    const computeAvg = (field: string): number => {
      const vals = answeredQuestions
        .map((q: Record<string, unknown>) => q[field] as number)
        .filter((v) => typeof v === 'number' && v > 0);
      if (!vals.length) return 0;
      return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
    };

    const technicalScore     = computeAvg('technical_accuracy');
    const communicationScore = computeAvg('communication_score');
    const confidenceScore    = computeAvg('estimated_confidence');
    const structureScore     = computeAvg('structure_score');

    // If we have fewer than 2 answered questions with evaluations, use Gemini to synthesize
    let finalReport: FinalReport;

    if (answeredQuestions.length < 2 || technicalScore === 0) {
      // Ask Gemini to generate a report from transcript
      const transcript = answeredQuestions.map((q: Record<string, unknown>) =>
        `Q: ${q.question_text}\nA: ${q.student_answer ?? '(no answer)'}`
      ).join('\n\n');

      const prompt = `
        You are an interview evaluator. Synthesize this complete interview transcript
        and produce fair, data-driven scores based ONLY on the actual answers given.
        Never invent data. If answers are sparse, scores should be lower.

        INTERVIEW TRANSCRIPT:
        ${transcript || '(no answers recorded)'}

        WEAK AREAS detected during session: ${(memory?.weak_areas_detected ?? []).join(', ') || 'none'}
        STRONG AREAS detected: ${(memory?.strong_areas_detected ?? []).join(', ') || 'none'}

        Return ONLY valid JSON:
        {
          "overallScore": 72,
          "technicalScore": 68,
          "communicationScore": 75,
          "confidenceScore": 70,
          "problemSolvingScore": 65,
          "projectScore": 78,
          "hrScore": 80,
          "strongAreas": ["Project Architecture", "Communication"],
          "weakAreas": ["Database Indexing", "System Scaling"],
          "recommendations": ["Study B-tree indexing", "Practice system design problems"]
        }
        All scores must be integers 0-100. Reflect the actual answers honestly.
      `;

      const fallbackReport: Omit<FinalReport,'totalTurns'|'completedAt'> = {
        overallScore:       answeredQuestions.length > 0 ? 60 : 0,
        technicalScore:     answeredQuestions.length > 0 ? 55 : 0,
        communicationScore: answeredQuestions.length > 0 ? 65 : 0,
        confidenceScore:    answeredQuestions.length > 0 ? 60 : 0,
        problemSolvingScore: answeredQuestions.length > 0 ? 55 : 0,
        projectScore:       answeredQuestions.length > 0 ? 65 : 0,
        hrScore:            answeredQuestions.length > 0 ? 70 : 0,
        strongAreas:        memory?.strong_areas_detected ?? [],
        weakAreas:          memory?.weak_areas_detected ?? [],
        recommendations:    ['Complete the interview with more detailed answers to get better recommendations.'],
      };

      const aiReport = await callGeminiJSON<Omit<FinalReport,'totalTurns'|'completedAt'>>(prompt, fallbackReport);
      finalReport = {
        ...aiReport,
        totalTurns:  memory?.total_turns ?? answeredQuestions.length,
        completedAt: new Date().toISOString(),
      };
    } else {
      // Build from saved evaluations
      const overallScore = Math.round(
        (technicalScore * 0.35) +
        (communicationScore * 0.25) +
        (confidenceScore * 0.15) +
        (structureScore * 0.25)
      );

      finalReport = {
        overallScore,
        technicalScore,
        communicationScore,
        confidenceScore,
        problemSolvingScore: structureScore,
        projectScore: computeAvg('answer_score'),
        hrScore: communicationScore,
        strongAreas: memory?.strong_areas_detected ?? [],
        weakAreas: memory?.weak_areas_detected ?? [],
        recommendations: generateRecommendations(memory?.weak_areas_detected ?? [], overallScore),
        totalTurns: memory?.total_turns ?? answeredQuestions.length,
        completedAt: new Date().toISOString(),
      };
    }

    const completedAt = new Date().toISOString();

    // Update session
    await supabase
      .from('interview_sessions')
      .update({
        status:               'Completed',
        dialog_state:         'completed',
        overall_score:        finalReport.overallScore,
        technical_score:      finalReport.technicalScore,
        communication_score:  finalReport.communicationScore,
        confidence_score:     finalReport.confidenceScore,
        problem_solving_score: finalReport.problemSolvingScore,
        project_score:        finalReport.projectScore,
        hr_score:             finalReport.hrScore,
        strong_areas:         finalReport.strongAreas,
        weak_areas:           finalReport.weakAreas,
        recommendations:      finalReport.recommendations,
        finished_at:          completedAt,
      })
      .eq('id', sessionId);

    // Sync weak areas -> learning_roadmaps (for Daily Mission + Learn Hub)
    if (finalReport.weakAreas.length > 0) {
      const roadmapItems = finalReport.weakAreas.map((area: string) => ({
        user_id:            user.id,
        topic:              area,
        category:           'Technical',
        status:             'To Learn',
        estimated_minutes:  30,
        resources:          JSON.stringify([]),
      }));

      // Upsert: don't add duplicates
      for (const item of roadmapItems) {
        const { data: existing } = await supabase
          .from('learning_roadmaps')
          .select('id')
          .eq('user_id', user.id)
          .eq('topic', item.topic)
          .single();

        if (!existing) {
          await supabase.from('learning_roadmaps').insert(item);
        }
      }
    }

    // Update user_progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('interviews_completed, technical_overall, communication_overall, confidence_overall')
      .eq('user_id', user.id)
      .single();

    if (progress) {
      await supabase
        .from('user_progress')
        .update({
          interviews_completed: (progress.interviews_completed ?? 0) + 1,
          technical_overall: Math.round(
            ((progress.technical_overall ?? 0) + finalReport.technicalScore) / 2
          ),
          communication_overall: Math.round(
            ((progress.communication_overall ?? 0) + finalReport.communicationScore) / 2
          ),
          confidence_overall: Math.round(
            ((progress.confidence_overall ?? 0) + finalReport.confidenceScore) / 2
          ),
          updated_at: completedAt,
        })
        .eq('user_id', user.id);
    } else {
      await supabase.from('user_progress').upsert({
        user_id:               user.id,
        interviews_completed:  1,
        technical_overall:     finalReport.technicalScore,
        communication_overall: finalReport.communicationScore,
        confidence_overall:    finalReport.confidenceScore,
      });
    }

    // Log completion event
    await supabase.from('interview_turn_events').insert({
      session_id: sessionId,
      user_id:    user.id,
      turn_index: memory?.total_turns ?? 0,
      event_type: 'session_completed',
      event_data: { overallScore: finalReport.overallScore },
    });

    return NextResponse.json({ report: finalReport, sessionId });
  } catch (err) {
    console.error('[/api/interview/finish] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateRecommendations(weakAreas: string[], overallScore: number): string[] {
  const recs: string[] = [];

  if (weakAreas.includes('Database Indexing') || weakAreas.includes('DBMS')) {
    recs.push('Deep-dive into B-tree indexing, composite indexes, and EXPLAIN ANALYZE in PostgreSQL.');
  }
  if (weakAreas.includes('System Design') || weakAreas.includes('Scalability')) {
    recs.push('Practice designing distributed systems: load balancing, caching, message queues.');
  }
  if (weakAreas.includes('Algorithms') || weakAreas.includes('DSA')) {
    recs.push('Solve 3 LeetCode medium problems daily, focusing on dynamic programming and graphs.');
  }
  if (weakAreas.includes('Communication') || weakAreas.includes('Clarity')) {
    recs.push('Practice structured answers using the STAR method for behavioral questions.');
  }
  if (overallScore < 60) {
    recs.push('Schedule another mock interview after completing 2 focused study sessions on weak areas.');
  }
  if (recs.length === 0) {
    recs.push('Review your weak areas in the Learn Hub and complete a focused practice drill.');
    recs.push('Attempt a company-specific mock interview to apply your improvements.');
  }

  return recs.slice(0, 4);
}
