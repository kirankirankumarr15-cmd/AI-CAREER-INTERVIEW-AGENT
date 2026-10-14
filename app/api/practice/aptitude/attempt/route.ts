/**
 * /api/practice/aptitude/attempt
 *
 * POST  { attemptType, category?, topic?, questionIds[], answers[], negativeMarking }
 *       Saves the attempt and returns score, accuracy, time-per-question, weak topics.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

const AttemptSchema = z.object({
  attemptType:     z.enum(['drill', 'full_test']),
  category:        z.string().optional(),
  topic:           z.string().optional(),
  negativeMarking: z.boolean().default(false),
  timeTakenSecs:   z.number().int().min(0),
  answers: z.array(z.object({
    questionId:      z.string().uuid(),
    selectedOption:  z.string().nullable(),
    isCorrect:       z.boolean(),
    timeTakenSecs:   z.number().int().min(0),
    isMarkedReview:  z.boolean().default(false),
  })),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await req.json();
  const parsed = AttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { attemptType, category, topic, negativeMarking, timeTakenSecs, answers } = parsed.data;

  const totalQuestions = answers.length;
  const correctCount   = answers.filter((a) => a.isCorrect).length;
  const wrongCount     = answers.filter((a) => !a.isCorrect && a.selectedOption !== null).length;

  // Score with optional negative marking (−0.25 per wrong)
  const rawScore     = correctCount - (negativeMarking ? wrongCount * 0.25 : 0);
  const scorePercent = totalQuestions > 0
    ? Math.round((rawScore / totalQuestions) * 100 * 100) / 100
    : 0;

  // Save attempt
  const { data: attempt, error: attemptErr } = await supabase
    .from('aptitude_attempts')
    .insert({
      user_id:          user.id,
      attempt_type:     attemptType,
      category,
      topic,
      started_at:       new Date(Date.now() - timeTakenSecs * 1000).toISOString(),
      finished_at:      new Date().toISOString(),
      total_questions:  totalQuestions,
      correct_count:    correctCount,
      score_percent:    scorePercent,
      time_taken_secs:  timeTakenSecs,
      negative_marking: negativeMarking,
      status:           'completed',
    })
    .select('id')
    .single();

  if (attemptErr || !attempt) {
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 });
  }

  // Save individual answers
  const answerRows = answers.map((a) => ({
    attempt_id:      attempt.id,
    user_id:         user.id,
    question_id:     a.questionId,
    selected_option: a.selectedOption,
    is_correct:      a.isCorrect,
    is_marked_review: a.isMarkedReview,
    time_taken_secs: a.timeTakenSecs,
  }));

  await supabase.from('aptitude_answers').insert(answerRows);

  // Find weak topics: questions answered incorrectly → group by topic
  const incorrectIds = answers
    .filter((a) => !a.isCorrect)
    .map((a) => a.questionId);

  let weakTopics: string[] = [];
  if (incorrectIds.length > 0) {
    const { data: wrongQs } = await supabase
      .from('aptitude_questions')
      .select('topic')
      .in('id', incorrectIds);

    const topicCounts: Record<string, number> = {};
    (wrongQs ?? []).forEach((q: { topic: string }) => {
      topicCounts[q.topic] = (topicCounts[q.topic] ?? 0) + 1;
    });
    weakTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 5);
  }

  // Push weak topics to learning_roadmaps
  for (const wt of weakTopics) {
    const { data: existing } = await supabase
      .from('learning_roadmaps')
      .select('id')
      .eq('user_id', user.id)
      .eq('topic', wt)
      .single();

    if (!existing) {
      await supabase.from('learning_roadmaps').insert({
        user_id:            user.id,
        topic:              wt,
        category:           'Aptitude',
        status:             'To Learn',
        estimated_minutes:  20,
        resources:          JSON.stringify([]),
      });
    }
  }

  // Update user_progress.questions_solved
  try {
    const { error: rpcError } = await supabase.rpc('increment_questions_solved', {
      p_user_id: user.id,
      p_count:   correctCount,
    });
    if (rpcError) throw rpcError;
  } catch {
    // Fallback if RPC doesn't exist
    const { data } = await supabase
      .from('user_progress')
      .select('questions_solved')
      .eq('user_id', user.id)
      .single();

    if (data) {
      await supabase
        .from('user_progress')
        .update({ questions_solved: (data.questions_solved ?? 0) + correctCount })
        .eq('user_id', user.id);
    }
  }

  return NextResponse.json({
    attemptId:    attempt.id,
    totalQuestions,
    correctCount,
    wrongCount,
    scorePercent,
    weakTopics,
    timeTakenSecs,
  });
}
