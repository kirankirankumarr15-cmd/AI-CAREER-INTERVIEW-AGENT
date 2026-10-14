/**
 * /api/interview/turn
 *
 * Processes one student turn:
 *   1. Validates the answer
 *   2. Runs the Dialog Manager to decide next move + generate next question
 *   3. Saves question + answer to DB
 *   4. Updates interview_memory
 *   5. Logs the turn event
 *
 * POST body (zod-validated):
 *   sessionId, turnIndex, studentAnswer, lastQuestion, lastQuestionCategory,
 *   lastQuestionId, totalTurns, profile, projects, interviewType, difficulty,
 *   mode, targetRole, companyName?, panelInterviewerName?, isFirstTimerMode?
 *
 * Returns:
 *   { next: TurnOutput, memory: { topicsAsked, weakAreasDetected } }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { computeNextTurn } from '@/lib/ai/dialog-manager';
import { evaluateStudentAnswer } from '@/lib/ai/agents/interview-agent';

const TurnSchema = z.object({
  sessionId:           z.string().uuid(),
  turnIndex:           z.number().int().min(0),
  totalTurns:          z.number().int().min(3).max(20),
  studentAnswer:       z.string().max(5000),
  lastQuestion:        z.string(),
  lastQuestionCategory: z.string(),
  lastQuestionId:      z.string().optional(),
  interviewType:       z.enum(['Technical','HR','Behavioral','DSA','Project','Full Interview','Company Simulation']),
  difficulty:          z.enum(['Beginner','Intermediate','Advanced']),
  mode:                z.enum(['Friendly','Professional','Strict','Pressure']),
  targetRole:          z.string(),
  companyName:         z.string().optional(),
  panelInterviewerName: z.string().optional(),
  isFirstTimerMode:    z.boolean().optional().default(false),
  profile: z.object({
    id:         z.string(),
    fullName:   z.string(),
    cgpa:       z.number().optional(),
    college:    z.string().optional(),
    branch:     z.string().optional(),
    targetRole: z.string().optional(),
  }),
  projects: z.array(z.object({
    id:          z.string(),
    title:       z.string(),
    description: z.string(),
    techStack:   z.array(z.string()),
    verificationStatus: z.string().optional(),
  })).optional().default([]),
});

export async function POST(req: Request) {
  const startMs = Date.now();

  try {
    const body = await req.json();
    const parsed = TurnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const {
      sessionId, turnIndex, totalTurns, studentAnswer,
      lastQuestion, lastQuestionCategory, lastQuestionId,
      interviewType, difficulty, mode, targetRole,
      companyName, panelInterviewerName, isFirstTimerMode,
      profile, projects,
    } = parsed.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Verify session ownership
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('id, status, dialog_state, silence_count, off_topic_count')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!session || session.status !== 'In Progress') {
      return NextResponse.json({ error: 'Session not found or already completed' }, { status: 404 });
    }

    // Load memory
    const { data: memory } = await supabase
      .from('interview_memory')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    const topicsAsked: string[] = memory?.topics_asked ?? [];
    const questionsAsked: string[] = memory?.questions_asked ?? [];
    const weakAreasDetected: string[] = memory?.weak_areas_detected ?? [];
    const strongAreasDetected: string[] = memory?.strong_areas_detected ?? [];
    const contextWindow: Array<{role:string;text:string}> = memory?.context_window ?? [];

    // Run Dialog Manager
    const next = await computeNextTurn({
      sessionId,
      turnIndex,
      totalTurns,
      interviewType: interviewType as Parameters<typeof computeNextTurn>[0]['interviewType'],
      difficulty: difficulty as Parameters<typeof computeNextTurn>[0]['difficulty'],
      mode: mode as Parameters<typeof computeNextTurn>[0]['mode'],
      targetRole,
      profile: profile as Parameters<typeof computeNextTurn>[0]['profile'],
      projects: projects as Parameters<typeof computeNextTurn>[0]['projects'],
      lastQuestion,
      lastQuestionCategory,
      studentAnswer,
      topicsAsked,
      questionsAsked,
      weakAreasDetected,
      strongAreasDetected,
      isFirstTurn: turnIndex === 0,
      silenceCount: session.silence_count ?? 0,
      offTopicCount: session.off_topic_count ?? 0,
      companyName,
      panelInterviewerName,
      isFirstTimerMode,
    });

    // Background: evaluate the student's answer (stored, NOT shown mid-interview)
    let evaluation = null;
    if (studentAnswer.trim().length > 5 && next.answerQuality !== 'silence') {
      evaluation = await evaluateStudentAnswer(lastQuestion, studentAnswer, lastQuestionCategory).catch(() => null);
    }

    // Save the student's answer to the previous question
    if (lastQuestionId) {
      await supabase
        .from('interview_questions')
        .update({
          student_answer:      studentAnswer,
          answer_score:        evaluation?.answerScore,
          technical_accuracy:  evaluation?.technicalAccuracy,
          relevance:           evaluation?.relevance,
          structure_score:     evaluation?.structureScore,
          communication_score: evaluation?.communicationScore,
          estimated_confidence: evaluation?.estimatedConfidence,
          speaking_speed:      evaluation?.speakingSpeed,
          filler_words_detected: evaluation?.fillerWords ?? [],
          feedback_good:       evaluation?.feedbackGood,
          feedback_improvement: evaluation?.feedbackImprovement,
          answer_quality:      next.answerQuality,
          updated_at:          new Date().toISOString(),
        })
        .eq('id', lastQuestionId)
        .eq('user_id', user.id);
    }

    // Save next question (only if not closing/complete)
    let nextQuestionId: string | null = null;
    if (!next.isInterviewComplete) {
      const { data: savedQ } = await supabase
        .from('interview_questions')
        .insert({
          session_id:      sessionId,
          user_id:         user.id,
          question_number: turnIndex + 2,
          question_text:   next.questionText,
          category:        next.category,
          expected_key_points: next.expectedKeyPoints ?? [],
          turn_index:      turnIndex + 1,
          dialog_move:     next.move,
          is_follow_up:    ['follow_up','probe','clarify'].includes(next.move),
          parent_question_id: lastQuestionId || null,
          ai_tone_note:    next.toneNote,
        })
        .select('id')
        .single();

      nextQuestionId = savedQ?.id ?? null;
    }

    // Update memory
    const newTopics = [...new Set([...topicsAsked, next.category])];
    const newQuestions = [...questionsAsked, next.questionText].slice(-30);
    const newWeak = next.weakArea
      ? [...new Set([...weakAreasDetected, next.weakArea])]
      : weakAreasDetected;
    const newStrong = next.answerQuality === 'strong' && next.category
      ? [...new Set([...strongAreasDetected, next.category])]
      : strongAreasDetected;
    const newContext = [
      ...contextWindow,
      { role: 'student', text: studentAnswer },
      { role: 'interviewer', text: next.questionText },
    ].slice(-20); // keep last 20 messages in context window

    await supabase
      .from('interview_memory')
      .update({
        topics_asked:        newTopics,
        questions_asked:     newQuestions,
        weak_areas_detected: newWeak,
        strong_areas_detected: newStrong,
        total_turns:         turnIndex + 1,
        last_move:           next.move,
        context_window:      newContext,
        updated_at:          new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    // Update session state
    const newSilenceCount = next.answerQuality === 'silence'
      ? (session.silence_count ?? 0) + 1
      : 0;
    const newOffTopicCount = next.answerQuality === 'off_topic'
      ? (session.off_topic_count ?? 0) + 1
      : session.off_topic_count ?? 0;

    await supabase
      .from('interview_sessions')
      .update({
        turn_count:      turnIndex + 1,
        dialog_state:    next.isInterviewComplete ? 'closing' : next.move,
        silence_count:   newSilenceCount,
        off_topic_count: newOffTopicCount,
      })
      .eq('id', sessionId);

    // Log turn event
    const eventType = next.answerQuality === 'silence' ? 'silence_nudge'
      : next.answerQuality === 'off_topic' ? 'off_topic_detected'
      : ['follow_up','probe'].includes(next.move) ? 'follow_up_triggered'
      : 'answer_received';

    await supabase.from('interview_turn_events').insert({
      session_id:  sessionId,
      user_id:     user.id,
      question_id: nextQuestionId,
      turn_index:  turnIndex + 1,
      event_type:  eventType,
      event_data: {
        answerQuality:        next.answerQuality,
        move:                 next.move,
        weakArea:             next.weakArea,
        falseClaimDetected:   next.falseClaimDetected,
        answerWordCount:      studentAnswer.trim().split(/\s+/).filter(Boolean).length,
      },
      latency_ms: Date.now() - startMs,
    });

    return NextResponse.json({
      next: {
        ...next,
        questionId: nextQuestionId,
      },
      memory: {
        topicsAsked: newTopics,
        weakAreasDetected: newWeak,
        strongAreasDetected: newStrong,
        totalTurns: turnIndex + 1,
      },
    });
  } catch (err) {
    console.error('[/api/interview/turn] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
