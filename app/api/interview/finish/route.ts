/**
 * /api/interview/finish
 *
 * PRISM Phase 3 InterviewAI Evaluation:
 *   1. Loads all answered questions and transcript from DB/request
 *   2. Generates 4-metric scores:
 *      - Communication
 *      - Technical Accuracy
 *      - Structure
 *      - Estimated Interview Confidence (strictly observable signals)
 *   3. Generates per-question model answers marked as "AI-suggested example"
 *   4. Compares with student's previous interview attempts
 *   5. Saves to interview_sessions and user_progress
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';
import { practiceDb } from '@/lib/db/nodeDb';
import { generatePrismJSON } from '@/lib/ai/claude';

export interface MetricEvaluation {
  score: number;
  evidence: string;
  howToImprove: string;
}

export interface QuestionModelAnswer {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  category: string;
  score: number;
  feedback: string;
  modelAnswer: string; // "AI-suggested example"
}

export interface PrismFinalReport {
  overallScore: number;
  communication: MetricEvaluation;
  technicalAccuracy: MetricEvaluation;
  structure: MetricEvaluation;
  estimatedConfidence: MetricEvaluation;
  strongAreas: string[];
  weakAreas: string[];
  recommendations: string[];
  questionEvaluations: QuestionModelAnswer[];
  totalTurns: number;
  completedAt: string;
  previousAttemptsComparison?: {
    attemptCount: number;
    scoreTrend: Array<{ date: string; score: number; role: string }>;
    changeFromLast: number;
  };
}

const FinishSchema = z.object({
  sessionId: z.string(),
  transcript: z.array(z.object({
    role: z.enum(['ai', 'user']),
    text: z.string(),
    questionId: z.string().optional(),
    category: z.string().optional(),
  })).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = FinishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { sessionId, transcript: clientTranscript } = parsed.data;
    const authUser = await getAuthenticatedUser();
    const userId = authUser?.id || 'student-demo';

    // 1. Fetch session info from SQLite and Supabase
    let sessionRole = 'Software Developer (SDE)';
    let sessionType = 'Technical';
    let previousSessions: Array<{ created_at: string; overall_score: number; target_role: string }> = [];
    let dbTurns: any[] = [];

    try {
      const sqliteSession = practiceDb.getInterviewSession(sessionId);
      if (sqliteSession) {
        sessionRole = sqliteSession.targetRole || sessionRole;
        sessionType = sqliteSession.interviewType || sessionType;
      }
      dbTurns = practiceDb.getInterviewTurns(sessionId);
      const prevs = practiceDb.getUserInterviewSessions(userId);
      previousSessions = prevs.map((p: any) => ({
        created_at: p.createdAt || p.completedAt || new Date().toISOString(),
        overall_score: p.overallScore || 70,
        target_role: p.targetRole,
      }));
    } catch {}

    // 2. Build complete transcript
    const turns = clientTranscript || [];
    const formattedTranscript = turns
      .map((t) => `${t.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${t.text}`)
      .join('\n\n');

    // Extract questions and student answers
    const questionTurns: Array<{ qText: string; aText: string; category: string; qId: string }> = [];
    for (let i = 0; i < turns.length; i++) {
      if (turns[i].role === 'ai') {
        const nextUserTurn = turns.slice(i + 1).find((t) => t.role === 'user');
        questionTurns.push({
          qId: turns[i].questionId || `q-${i}`,
          qText: turns[i].text,
          category: turns[i].category || 'Technical',
          aText: nextUserTurn ? nextUserTurn.text : '(No spoken or typed response)',
        });
      }
    }

    // 3. AI Evaluation Prompt with strict 4-metric schema and per-question model answers
    const evalPrompt = `
You are the PRISM Senior Placement Assessment Lead evaluating a mock interview for the role of "${sessionRole}" (${sessionType} round).

TRANSCRIPT:
${formattedTranscript || 'No student turns recorded.'}

TASK:
1. Evaluate candidate objectively on exactly 4 metrics (0-100 score, evidence quote from transcript, actionable improvement tip):
   - "communication": clarity, articulation, concise delivery without excessive verbal filler.
   - "technicalAccuracy": precision of concepts, correct algorithms/system terminology, no false assertions.
   - "structure": logical sequencing (e.g. STAR method for HR, problem -> approach -> complexity for technical).
   - "estimatedConfidence": observable signals only (fluency, hesitation, pauses, self-corrections, definitive phrasing).
2. For each question asked, produce:
   - Score (0-100)
   - Diagnostic feedback (strengths & misses in student's answer)
   - "modelAnswer": an ideal, exemplary answer (under 120 words) for that question and role. Do not invent facts for the candidate; demonstrate textbook structure and technical depth. Marked as "AI-suggested example".
3. Identify top 3 strong areas, top 3 weak areas, and 3 high-impact practice recommendations.

Return ONLY valid JSON matching this schema:
{
  "overallScore": 75,
  "communication": {
    "score": 78,
    "evidence": "Candidate explained their approach clearly without drifting into tangential topics.",
    "howToImprove": "Eliminate filler phrases like 'basically' when beginning technical explanations."
  },
  "technicalAccuracy": {
    "score": 72,
    "evidence": "Correctly identified B-tree indexing complexity as O(log N) but hesitated on write amplification.",
    "howToImprove": "Review disk I/O implications and WAL buffering for relational databases."
  },
  "structure": {
    "score": 76,
    "evidence": "Organized answer from core principle to concrete implementation tradeoff.",
    "howToImprove": "State assumptions explicitly before diving into architectural choices."
  },
  "estimatedConfidence": {
    "score": 74,
    "evidence": "Paced delivery with minimal mid-sentence backtracking; firm concluding remarks.",
    "howToImprove": "Maintain steady tempo when addressing unexpected follow-up edge cases."
  },
  "strongAreas": ["Data Structures", "Clear Articulation", "Analytical Reasoning"],
  "weakAreas": ["Distributed Systems Scaling", "Database Index Internals"],
  "recommendations": [
    "Practice B-tree and LSM-tree trade-offs in the Practice Hub.",
    "Do 2 timed technical mock rounds under 15-minute constraints."
  ],
  "questionEvaluations": [
    {
      "questionId": "q-0",
      "questionText": "Question text here",
      "studentAnswer": "Candidate answer here",
      "category": "Technical",
      "score": 75,
      "feedback": "Specific feedback on student response",
      "modelAnswer": "An exemplary response illustrating optimal depth and structure."
    }
  ]
}
`;

    const turnsWithEval = dbTurns.filter((t: any) => t.evaluation && typeof t.evaluation.overallScore === 'number');
    const hasEvaluations = turnsWithEval.length > 0;

    const baseTech = hasEvaluations
      ? Math.round(turnsWithEval.reduce((sum: number, t: any) => sum + (t.evaluation.technicalAccuracy ?? 70), 0) / turnsWithEval.length)
      : 70;
    const baseComm = hasEvaluations
      ? Math.round(turnsWithEval.reduce((sum: number, t: any) => sum + (t.evaluation.communicationClarity ?? 72), 0) / turnsWithEval.length)
      : 72;
    const baseStruct = hasEvaluations
      ? Math.round(turnsWithEval.reduce((sum: number, t: any) => sum + (t.evaluation.answerStructure ?? 70), 0) / turnsWithEval.length)
      : 70;
    const baseConfidence = hasEvaluations
      ? Math.round(turnsWithEval.reduce((sum: number, t: any) => sum + (t.evaluation.problemSolving ?? 70), 0) / turnsWithEval.length)
      : 70;
    const baseOverall = hasEvaluations
      ? Math.round(turnsWithEval.reduce((sum: number, t: any) => sum + (t.evaluation.overallScore ?? 70), 0) / turnsWithEval.length)
      : (questionTurns.length > 0 ? 70 : 50);

    const firstEvidence = turnsWithEval.find((t: any) => t.evaluation?.evidenceQuote)?.evaluation?.evidenceQuote || 'Candidate answered questions in a comprehensible manner.';
    const firstImprovement = turnsWithEval.find((t: any) => t.evaluation?.constructiveImprovement)?.evaluation?.constructiveImprovement || 'Deepen knowledge of underlying mechanics and edge-case behaviors.';
    const accumulatedTips = Array.from(new Set(turnsWithEval.flatMap((t: any) => t.evaluation?.actionableSuggestions || []))).slice(0, 3);

    const fallbackReport: PrismFinalReport = {
      overallScore: baseOverall,
      communication: {
        score: baseComm,
        evidence: firstEvidence,
        howToImprove: 'Provide more structured framing before detailing technical points.',
      },
      technicalAccuracy: {
        score: baseTech,
        evidence: firstEvidence,
        howToImprove: firstImprovement,
      },
      structure: {
        score: baseStruct,
        evidence: 'Followed a sequential progression from problem to solution.',
        howToImprove: 'Use the STAR technique for behavioral answers and state complexity upfront.',
      },
      estimatedConfidence: {
        score: baseConfidence,
        evidence: 'Observable steady pace with moderate pauses between questions.',
        howToImprove: 'Reduce hesitation pauses when formulating system design trade-offs.',
      },
      strongAreas: ['Core Concepts', 'Clear Communication'],
      weakAreas: ['Edge-case Analysis', 'Quantitative Trade-offs'],
      recommendations: accumulatedTips.length > 0 ? accumulatedTips : [
        'Review core fundamentals in the Practice Hub before your next session.',
        'Practice aloud to build fluent phrasing under countdown pressure.',
      ],
      questionEvaluations: questionTurns.map((qt, idx) => {
        const matchingDbTurn = turnsWithEval.find((t: any) => t.turnIndex === idx || t.questionText === qt.qText);
        return {
          questionId: qt.qId,
          questionText: qt.qText,
          studentAnswer: qt.aText,
          category: qt.category,
          score: matchingDbTurn ? matchingDbTurn.evaluation.overallScore : baseOverall,
          feedback: matchingDbTurn?.evaluation?.constructiveImprovement || 'Good fundamental attempt. Could be reinforced with concrete performance metrics.',
          modelAnswer: `For ${sessionRole}, an ideal answer articulates the core principle, specifies concrete trade-offs, and validates runtime efficiency with O(N) or architectural boundaries.`,
        };
      }),
      totalTurns: questionTurns.length,
      completedAt: new Date().toISOString(),
    };

    let evaluationResult = fallbackReport;
    try {
      const aiGenerated = await generatePrismJSON<PrismFinalReport>({
        systemPrompt: 'You are the PRISM Senior Technical Interview Evaluator. Evaluate strictly with evidence-based scoring and per-question model answers.',
        userPrompt: evalPrompt,
      });

      if (aiGenerated && typeof aiGenerated.overallScore === 'number') {
        evaluationResult = {
          ...aiGenerated,
          totalTurns: questionTurns.length,
          completedAt: new Date().toISOString(),
          questionEvaluations: (aiGenerated.questionEvaluations && aiGenerated.questionEvaluations.length > 0)
            ? aiGenerated.questionEvaluations
            : fallbackReport.questionEvaluations,
        };
      }
    } catch (err) {
      console.warn('[Interview Finish API] AI evaluation fallback triggered:', err);
    }

    // 4. Compute Historical Comparison
    const scoreTrend = previousSessions.map((s) => ({
      date: new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      score: s.overall_score || 0,
      role: s.target_role,
    }));

    const lastScore = previousSessions.length > 0 ? previousSessions[0].overall_score : null;
    const changeFromLast = lastScore !== null ? evaluationResult.overallScore - lastScore : 0;

    evaluationResult.previousAttemptsComparison = {
      attemptCount: previousSessions.length + 1,
      scoreTrend,
      changeFromLast,
    };

    // 5. Update Database Record in SQLite
    try {
      practiceDb.updateInterviewSession(sessionId, {
        status: 'Completed',
        overallScore: evaluationResult.overallScore,
        communicationScore: evaluationResult.communication.score,
        technicalAccuracyScore: evaluationResult.technicalAccuracy.score,
        structureScore: evaluationResult.structure.score,
        confidenceScore: evaluationResult.estimatedConfidence.score,
        feedbackSummary: evaluationResult,
        transcript: questionTurns,
        completedAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('[InterviewFinish] SQLite update warning:', dbErr);
    }

    // 6. Best effort Supabase sync
    try {
      const supabase = await createClient();
      await supabase
        .from('interview_sessions')
        .update({
          status: 'Completed',
          overall_score: evaluationResult.overallScore,
          communication_score: evaluationResult.communication.score,
          technical_accuracy_score: evaluationResult.technicalAccuracy.score,
          structure_score: evaluationResult.structure.score,
          confidence_score: evaluationResult.estimatedConfidence.score,
          feedback_summary: JSON.stringify({
            communication: evaluationResult.communication,
            technicalAccuracy: evaluationResult.technicalAccuracy,
            structure: evaluationResult.structure,
            estimatedConfidence: evaluationResult.estimatedConfidence,
            modelAnswers: evaluationResult.questionEvaluations,
            recommendations: evaluationResult.recommendations,
          }),
          session_history: questionTurns,
        })
        .eq('id', sessionId);
    } catch {}

    return NextResponse.json({
      report: evaluationResult,
      sessionId,
    });
  } catch (err) {
    console.error('[Interview Finish API] Fatal error:', err);
    return NextResponse.json({ error: 'Failed to finalize interview evaluation' }, { status: 500 });
  }
}
