/**
 * /api/interview/start
 *
 * Initialises a new interview session in Supabase and returns the
 * interviewer's opening greeting. The AI ALWAYS speaks first.
 *
 * POST body (zod-validated):
 *   targetRole, interviewType, difficulty, mode, companyName?,
 *   profile, projects, isFirstTimerMode?, panelConfig?
 *
 * Returns:
 *   { sessionId, greeting: TurnOutput }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { computeGreeting } from '@/lib/ai/dialog-manager';
import type { InterviewType, InterviewDifficulty, InterviewMode } from '@/types';

const StartSchema = z.object({
  targetRole:       z.string().min(1).max(200),
  interviewType:    z.enum(['Technical','HR','Behavioral','DSA','Project','Full Interview','Company Simulation']),
  difficulty:       z.enum(['Beginner','Intermediate','Advanced']),
  mode:             z.enum(['Friendly','Professional','Strict','Pressure']),
  companyName:      z.string().max(200).optional(),
  totalTurns:       z.number().int().min(3).max(20).default(6),
  isFirstTimerMode: z.boolean().optional().default(false),
  sessionMode:      z.enum(['solo','panel','peer','first_timer']).optional().default('solo'),
  panelConfig:      z.array(z.object({ name: z.string(), role: z.string() })).optional(),
  profile: z.object({
    id:         z.string(),
    fullName:   z.string(),
    cgpa:       z.number().optional(),
    college:    z.string().optional(),
    branch:     z.string().optional(),
    targetRole: z.string().optional(),
  }),
  projects: z.array(z.object({
    id:            z.string(),
    title:         z.string(),
    description:   z.string(),
    techStack:     z.array(z.string()),
    verificationStatus: z.string().optional(),
  })).optional().default([]),
});

export async function POST(req: Request) {
  const startMs = Date.now();

  try {
    const body = await req.json();
    const parsed = StartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const {
      targetRole, interviewType, difficulty, mode,
      companyName, totalTurns, isFirstTimerMode, sessionMode,
      panelConfig, profile, projects,
    } = parsed.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Per-user AI quota check (max 20 interviews/day)
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('interview_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`);

    if ((count ?? 0) >= 20) {
      return NextResponse.json({ error: 'Daily interview limit reached (20/day).' }, { status: 429 });
    }

    // Determine panel interviewer name if panel mode
    const panelInterviewerName =
      sessionMode === 'panel' && panelConfig && panelConfig.length > 0
        ? panelConfig[0].name
        : undefined;

    // Generate greeting (AI speaks first)
    const greeting = await computeGreeting(
      profile as Parameters<typeof computeGreeting>[0],
      projects as Parameters<typeof computeGreeting>[1],
      targetRole,
      interviewType as InterviewType,
      difficulty as InterviewDifficulty,
      mode as InterviewMode,
      companyName,
      panelInterviewerName,
      isFirstTimerMode
    );

    // Create interview session
    const { data: session, error: sessionErr } = await supabase
      .from('interview_sessions')
      .insert({
        user_id:         user.id,
        target_role:     targetRole,
        interview_type:  interviewType,
        difficulty,
        interviewer_mode: mode,
        company_name:    companyName,
        status:          'In Progress',
        session_mode:    sessionMode,
        panel_config:    panelConfig ? JSON.stringify(panelConfig) : null,
        dialog_state:    'greeting',
        turn_count:      0,
        session_metadata: { totalTurns, isFirstTimerMode },
      })
      .select('id')
      .single();

    if (sessionErr || !session) {
      console.error('Session insert error:', sessionErr);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Create interview_memory record
    await supabase.from('interview_memory').insert({
      session_id:    session.id,
      user_id:       user.id,
      topics_asked:  [],
      questions_asked: [greeting.questionText],
      last_move:     'greeting',
      total_turns:   0,
      context_window: [{ role: 'interviewer', text: greeting.questionText }],
    });

    // Save the greeting question
    await supabase.from('interview_questions').insert({
      session_id:      session.id,
      user_id:         user.id,
      question_number: 1,
      question_text:   greeting.questionText,
      category:        greeting.category,
      expected_key_points: greeting.expectedKeyPoints || [],
      turn_index:      0,
      dialog_move:     'greeting',
      is_follow_up:    false,
    });

    // Log turn event
    await supabase.from('interview_turn_events').insert({
      session_id:  session.id,
      user_id:     user.id,
      turn_index:  0,
      event_type:  'question_delivered',
      event_data:  { move: 'greeting', category: greeting.category },
      latency_ms:  Date.now() - startMs,
    });

    return NextResponse.json({ sessionId: session.id, greeting });
  } catch (err) {
    console.error('[/api/interview/start] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
