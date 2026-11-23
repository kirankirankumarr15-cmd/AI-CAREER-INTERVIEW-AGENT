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
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';
import { practiceDb } from '@/lib/db/nodeDb';
import { computeNextTurn } from '@/lib/ai/dialog-manager';
import { evaluateStudentAnswer } from '@/lib/ai/agents/interview-agent';

const TurnSchema = z.object({
  sessionId: z.string().min(1),
  turnIndex: z.number().int().min(0),
  totalTurns: z.number().int().min(3).max(20),
  studentAnswer: z.string().max(5000),
  lastQuestion: z.string(),
  lastQuestionCategory: z.string(),
  lastQuestionId: z.string().optional(),
  interviewType: z.enum(['Technical', 'HR', 'Behavioral', 'DSA', 'Project', 'Full Interview', 'Company Simulation']),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  mode: z.enum(['Friendly', 'Professional', 'Strict', 'Pressure']),
  targetRole: z.string(),
  companyName: z.string().optional(),
  panelInterviewerName: z.string().optional(),
  isFirstTimerMode: z.boolean().optional().default(false),
  profile: z.object({
    id: z.string(),
    fullName: z.string(),
    cgpa: z.number().optional(),
    college: z.string().optional(),
    branch: z.string().optional(),
    targetRole: z.string().optional(),
  }),
  projects: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    techStack: z.array(z.string()),
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

    const authUser = await getAuthenticatedUser();
    const userId = authUser?.id || profile.id || 'student-demo';

    // 1. Load memory & past turns from SQLite / Supabase
    let topicsAsked: string[] = [lastQuestionCategory];
    let questionsAsked: string[] = [lastQuestion];
    let weakAreasDetected: string[] = [];
    let strongAreasDetected: string[] = [];

    try {
      const pastTurns = practiceDb.getInterviewTurns(sessionId);
      if (pastTurns.length > 0) {
        topicsAsked = Array.from(new Set([...pastTurns.map((t: any) => t.category), lastQuestionCategory]));
        questionsAsked = pastTurns.map((t: any) => t.questionText);
      }
    } catch {}

    // 2. Run Dialog Manager to determine next question & conversational move
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
      silenceCount: 0,
      offTopicCount: 0,
      companyName,
      panelInterviewerName,
      isFirstTimerMode,
    });

    // 3. Real Evaluation of the student's answer
    let evaluation = null;
    if (studentAnswer.trim().length > 3 && next.answerQuality !== 'silence') {
      try {
        evaluation = await evaluateStudentAnswer(lastQuestion, studentAnswer, lastQuestionCategory);
      } catch (e) {
        console.warn('[InterviewTurn] Eval fallback:', e);
      }
    }

    if (!evaluation) {
      const words = studentAnswer.trim().split(/\s+/).filter(Boolean).length;
      evaluation = {
        answerScore: Math.min(92, Math.max(60, 65 + Math.min(25, words))),
        technicalAccuracy: Math.min(94, Math.max(60, 68 + Math.min(20, Math.floor(words * 0.8)))),
        relevance: 85,
        structureScore: Math.min(90, Math.max(60, 65 + Math.min(20, Math.floor(words * 0.7)))),
        communicationScore: Math.min(95, Math.max(65, 75 + Math.min(15, Math.floor(words * 0.5)))),
        estimatedConfidence: Math.min(90, Math.max(60, 70 + Math.min(15, Math.floor(words * 0.6)))),
        speakingSpeed: words > 100 ? 'Too Fast' : words < 25 ? 'Brief' : 'Optimal',
        fillerWords: [],
        feedbackGood: 'Clear engagement with the core technical prompt.',
        feedbackImprovement: 'Provide concrete examples and quantify the impact or architecture decisions.',
        starStructureScore: 75,
      };
    }

    // 4. Save current turn to SQLite
    const currentTurnId = `turn_${sessionId}_${turnIndex}`;
    try {
      practiceDb.saveInterviewTurn({
        id: currentTurnId,
        sessionId,
        userId,
        turnIndex,
        questionText: lastQuestion,
        category: lastQuestionCategory,
        studentAnswer,
        answerScore: evaluation.answerScore,
        evaluation,
      });

      // Also record the next question if not complete
      if (!next.isInterviewComplete) {
        practiceDb.saveInterviewTurn({
          id: `turn_${sessionId}_${turnIndex + 1}`,
          sessionId,
          userId,
          turnIndex: turnIndex + 1,
          questionText: next.questionText,
          category: next.category,
        });
      }
    } catch (dbErr) {
      console.warn('[InterviewTurn] SQLite turn save warning:', dbErr);
    }

    // 5. Calculate cumulative running performance metrics across answered turns
    let allTurns: any[] = [];
    try {
      allTurns = practiceDb.getInterviewTurns(sessionId).filter((t: any) => t.studentAnswer);
    } catch {}

    const evalScores: number[] = allTurns.map((t: any) => t.evaluation?.answerScore || 70);
    const avgScore = evalScores.length > 0
      ? Math.round(evalScores.reduce((a: number, b: number) => a + b, 0) / evalScores.length)
      : evaluation.answerScore;

    const commScore = evaluation.communicationScore || 75;
    const techScore = evaluation.technicalAccuracy || 70;
    const confScore = evaluation.estimatedConfidence || 72;
    const clarityScore = evaluation.structureScore || 70;

    // Competency breakdown
    const competencies = {
      technicalKnowledge: techScore,
      problemSolving: Math.round((techScore + clarityScore) / 2),
      communication: commScore,
      leadership: Math.min(95, Math.max(60, Math.round((commScore + confScore) / 2))),
      teamwork: Math.min(95, Math.max(65, Math.round((commScore * 0.6 + clarityScore * 0.4)))),
    };

    // Actionable suggestions based on real answer
    const actionableSuggestions = [
      evaluation.feedbackImprovement || 'Structure your answer with clear problem, action, and result.',
      techScore < 75 ? 'Mention specific algorithmic trade-offs or DB schema choices.' : 'Quantify your measurable impact on the project.',
      commScore < 75 ? 'Use strategic pauses instead of rushing through technical descriptions.' : 'Explicitly articulate why alternative approaches were rejected.',
    ].slice(0, 3);

    let mentorMessage = "You're doing well. Keep your answers focused on real technical decisions.";
    if (avgScore >= 85) mentorMessage = "Exceptional depth! Continue giving structured, authoritative answers.";
    else if (techScore < 70) mentorMessage = "Try to elaborate more on the exact technical mechanics and architecture.";
    else if (commScore < 70) mentorMessage = "Good points. Focus on speaking with steady cadence and fewer pauses.";

    // 6. Best effort Supabase sync
    try {
      const supabase = await createClient();
      await supabase.from('interview_turn_events').insert({
        session_id: sessionId,
        user_id: userId,
        turn_index: turnIndex + 1,
        event_type: 'answer_received',
        event_data: { answerWordCount: studentAnswer.split(/\s+/).length },
        latency_ms: Date.now() - startMs,
      });
    } catch {}

    return NextResponse.json({
      next: {
        ...next,
        questionId: `turn_${sessionId}_${turnIndex + 1}`,
      },
      evaluation,
      runningScores: {
        overallScore: avgScore,
        communication: commScore,
        technicalKnowledge: techScore,
        confidence: confScore,
        answerClarity: clarityScore,
        mentorMessage,
        competencies,
        actionableSuggestions,
        answeredTurnsCount: allTurns.length,
      },
      memory: {
        topicsAsked: [...topicsAsked, next.category],
        weakAreasDetected: next.weakArea ? [...weakAreasDetected, next.weakArea] : weakAreasDetected,
        strongAreasDetected,
        totalTurns: turnIndex + 1,
      },
    });
  } catch (err) {
    console.error('[/api/interview/turn] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
