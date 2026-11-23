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
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';
import { practiceDb } from '@/lib/db/nodeDb';
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

    const authUser = await getAuthenticatedUser();
    const userId = authUser?.id || profile.id || 'student-demo';

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

    // Calculate server-authoritative timer values
    const durationSeconds = (totalTurns <= 4 ? 10 : totalTurns <= 6 ? 15 : 20) * 60;
    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + durationSeconds * 1000);
    const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Persistent disk storage via SQLite (guaranteed to work across restarts & offline)
    try {
      practiceDb.saveInterviewSession({
        id: sessionId,
        userId: userId,
        targetRole,
        interviewType,
        difficulty,
        mode,
        companyName,
        durationSeconds,
        startedAt: startedAt.toISOString(),
        deadlineAt: deadlineAt.toISOString(),
      });

      practiceDb.saveInterviewTurn({
        sessionId,
        userId,
        turnIndex: 0,
        questionText: greeting.questionText,
        category: greeting.category,
      });
    } catch (dbErr) {
      console.warn('[InterviewStart] SQLite save warning:', dbErr);
    }

    // 2. Best-effort Supabase sync
    try {
      const supabase = await createClient();
      await supabase.from('interview_sessions').insert({
        id: sessionId,
        user_id: userId,
        target_role: targetRole,
        interview_type: interviewType,
        difficulty,
        interviewer_mode: mode,
        company_name: companyName,
        status: 'In Progress',
        session_mode: sessionMode,
        panel_config: panelConfig ? JSON.stringify(panelConfig) : null,
        dialog_state: 'greeting',
        turn_count: 0,
        session_metadata: { totalTurns, isFirstTimerMode },
        started_at: startedAt.toISOString(),
        deadline_at: deadlineAt.toISOString(),
        duration_seconds: durationSeconds,
      });
    } catch {
      // Non-blocking fallback
    }

    return NextResponse.json({
      sessionId,
      greeting,
      startedAt: startedAt.toISOString(),
      deadlineAt: deadlineAt.toISOString(),
      durationSeconds,
    });
  } catch (err) {
    console.error('[/api/interview/start] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
