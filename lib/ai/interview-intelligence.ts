import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { INTERVIEW_QUESTION_BANK, type InterviewBankQuestion, getQuestionsForTrack } from '../interview/questionBank';
import { practiceDb } from '../db/nodeDb';

// ─── Evaluation Rubric Schema ──────────────────────────────────────────────────
export const DetailedEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  technicalAccuracy: z.number().min(0).max(100),
  relevance: z.number().min(0).max(100),
  communicationClarity: z.number().min(0).max(100),
  answerStructure: z.number().min(0).max(100),
  problemSolving: z.number().min(0).max(100),
  conceptsIdentified: z.array(z.string()).default([]),
  conceptsMissed: z.array(z.string()).default([]),
  evidenceQuote: z.string().default(''),
  feedbackGood: z.string().default(''),
  feedbackImprovement: z.string().default(''),
  mentorMessage: z.string().optional(),
  recommendedNextDifficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  isStruggling: z.boolean(),
  isExcelling: z.boolean(),
});

export type DetailedEvaluation = z.infer<typeof DetailedEvaluationSchema>;

export interface AdaptiveTurnResult {
  nextQuestionText: string;
  category: string;
  currentDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  expectedConcepts: string[];
  interviewerComment?: string;
  isInterviewComplete: boolean;
  evaluation?: DetailedEvaluation;
}

// ─── Gemini Client Setup with Multi-Model Fallback ─────────────────────────────
const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.warn('[InterviewIntelligence] Gemini Init error:', e);
  }
}

const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.0-flash',
];

async function callGeminiWithRetry(prompt: string, timeoutMs: number = 7000): Promise<string | null> {
  if (!genAI || !apiKey) return null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs)),
      ]);

      clearTimeout(timer);
      const text = result?.response?.text();
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } catch {
      // Try next candidate model smoothly
    }
  }

  return null;
}

// ─── Grounded Answer Evaluation ────────────────────────────────────────────────
export async function evaluateAnswerIntelligently(params: {
  questionText: string;
  category: string;
  studentAnswer: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetRole: string;
  expectedConcepts?: string[];
  evaluationCriteria?: any;
}): Promise<DetailedEvaluation> {
  const {
    questionText,
    category,
    studentAnswer,
    difficulty,
    targetRole,
    expectedConcepts = [],
    evaluationCriteria,
  } = params;

  const trimmed = studentAnswer.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const lower = trimmed.toLowerCase();

  // 1. First-pass concept coverage calculation against ground-truth question bank
  const identifiedConcepts: string[] = [];
  const missedConcepts: string[] = [];

  for (const concept of expectedConcepts) {
    const conceptWords = concept.toLowerCase().split(/[\s,()\/]+/).filter(w => w.length > 3);
    const matches = conceptWords.some(w => lower.includes(w));
    if (matches) {
      identifiedConcepts.push(concept);
    } else {
      missedConcepts.push(concept);
    }
  }

  // 2. Prompt Gemini for real-time objective rubric evaluation
  const prompt = `
You are a senior hiring manager assessing a candidate for "${targetRole}".
Interview Round: ${category} (${difficulty} difficulty).

QUESTION ASKED:
"${questionText}"

EXPECTED CORE CONCEPTS:
${JSON.stringify(expectedConcepts)}

CANDIDATE'S SPOKEN/TYPED ANSWER:
"${trimmed}"

EVALUATION RUBRIC:
1. Technical Accuracy (0-100): Are the technical facts, data structures, and mechanics correct?
2. Relevance (0-100): Did the student directly address what was asked?
3. Communication Clarity (0-100): Is the phrasing concise, professional, and clear?
4. Answer Structure (0-100): Did they follow a logical sequence (e.g. definition -> implementation -> trade-offs / STAR)?
5. Problem Solving (0-100): Do they demonstrate analytical depth or trade-off evaluation?

INSTRUCTIONS:
- Score realistically: 90+ is exceptional, 75-89 is solid campus hire bar, 55-74 is developing, <55 is struggling/vague.
- Quote a specific sentence from the answer as "evidenceQuote".
- If the candidate answers accurately with high technical depth, set recommendedNextDifficulty to "Advanced".
- If the candidate is vague, incomplete, or off-topic, set recommendedNextDifficulty to "Beginner" and isStruggling to true.

Return ONLY a valid JSON object matching this schema:
{
  "overallScore": 82,
  "technicalAccuracy": 85,
  "relevance": 88,
  "communicationClarity": 80,
  "answerStructure": 78,
  "problemSolving": 80,
  "conceptsIdentified": ["concept 1"],
  "conceptsMissed": ["concept 2"],
  "evidenceQuote": "direct quote from answer",
  "feedbackGood": "strength of the answer",
  "feedbackImprovement": "specific actionable recommendation",
  "recommendedNextDifficulty": "Intermediate",
  "isStruggling": false,
  "isExcelling": false
}
`;

  try {
    const rawJSON = await callGeminiWithRetry(prompt, 6000);
    if (rawJSON) {
      const clean = rawJSON.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      const validated = DetailedEvaluationSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    }
  } catch (err) {
    console.warn('[InterviewIntelligence] LLM eval fallback engaged:', err);
  }

  // 3. Fallback: High-precision deterministic evaluation grounded in question bank rubrics
  const conceptRatio = expectedConcepts.length > 0 ? identifiedConcepts.length / expectedConcepts.length : 0.6;
  const hasStructure = lower.includes('because') || lower.includes('result') || lower.includes('first') || lower.includes('trade-off');

  const technicalAccuracy = Math.min(95, Math.max(30, Math.round(40 + conceptRatio * 45 + (wordCount > 30 ? 10 : 0))));
  const relevance = expectedConcepts.length > 0 && identifiedConcepts.length === 0
    ? Math.min(30, Math.round(15 + (wordCount > 5 ? 10 : 0)))
    : Math.min(95, Math.max(35, Math.round(50 + conceptRatio * 45)));
  const communicationClarity = wordCount < 15 ? 55 : Math.min(92, Math.max(60, 75 - (lower.match(/\b(um|uh|like|basically)\b/g)?.length || 0) * 5));
  const answerStructure = hasStructure ? 82 : 68;
  const problemSolving = Math.round((technicalAccuracy * 0.6 + answerStructure * 0.4));
  const overallScore = Math.round((technicalAccuracy * 0.35 + relevance * 0.2 + communicationClarity * 0.2 + answerStructure * 0.15 + problemSolving * 0.1));

  const isStruggling = overallScore < 70 || lower.includes("not really sure") || lower.includes("don't know") || lower.includes("not sure") || wordCount < 12;
  const isExcelling = overallScore >= 78 && conceptRatio >= 0.5 && !isStruggling;

  let nextDiff: 'Beginner' | 'Intermediate' | 'Advanced' = difficulty;
  if (isExcelling) nextDiff = 'Advanced';
  else if (isStruggling) nextDiff = 'Beginner';

  return {
    overallScore,
    technicalAccuracy,
    relevance,
    communicationClarity,
    answerStructure,
    problemSolving,
    conceptsIdentified: identifiedConcepts.length > 0 ? identifiedConcepts : expectedConcepts.slice(0, 1),
    conceptsMissed: missedConcepts.length > 0 ? missedConcepts : [],
    evidenceQuote: trimmed.length > 80 ? trimmed.substring(0, 80) + '...' : trimmed,
    feedbackGood: isExcelling
      ? 'Strong technical foundation with clear mention of core architectural concepts.'
      : 'Good engagement with the core technical prompt.',
    feedbackImprovement: isStruggling
      ? 'Provide more technical substance and cite specific mechanisms rather than general statements.'
      : 'Quantify your measurable impact and address performance trade-offs under scale.',
    mentorMessage: isStruggling
      ? 'Take your time. Let us step through the basic principles first before building to edge cases.'
      : 'Excellent explanation and terminology.',
    recommendedNextDifficulty: nextDiff,
    isStruggling,
    isExcelling,
  };
}

// ─── Adaptive Follow-up & Question Progression Engine ─────────────────────────
export async function computeAdaptiveNextQuestion(params: {
  sessionId?: string;
  turnIndex: number;
  totalTurns: number;
  targetRole: string;
  interviewType: string;
  companyName?: string;
  currentDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lastQuestion: string;
  lastQuestionCategory?: string;
  studentAnswer: string;
  questionsAsked?: string[];
  evaluation: DetailedEvaluation;
}): Promise<AdaptiveTurnResult> {
  const {
    sessionId = 'session-local',
    turnIndex,
    totalTurns,
    targetRole,
    interviewType,
    companyName,
    currentDifficulty,
    lastQuestion,
    lastQuestionCategory = 'Technical',
    studentAnswer,
    questionsAsked = [],
    evaluation,
  } = params;

  const isFinalTurn = turnIndex + 1 >= totalTurns;

  if (isFinalTurn) {
    return {
      nextQuestionText: `Thank you for sharing your technical background and problem-solving journey today! That concludes our interview round. I am now compiling your complete placement assessment report.`,
      category: 'Closing',
      currentDifficulty,
      expectedConcepts: ['closing remarks'],
      interviewerComment: 'Thank you.',
      isInterviewComplete: true,
      evaluation,
    };
  }

  // 1. Determine Adaptive Difficulty Direction
  let targetDifficulty: 'Beginner' | 'Intermediate' | 'Advanced' = currentDifficulty;
  if (evaluation.isExcelling) {
    targetDifficulty = 'Advanced';
  } else if (evaluation.isStruggling) {
    targetDifficulty = 'Beginner';
  }

  // 2. Try Gemini to generate an authentic conversational follow-up question
  const followUpPrompt = `
You are a senior technical interviewer conducting a live placement interview for "${targetRole}" at ${companyName || 'a top tech company'}.

PREVIOUS QUESTION:
"${lastQuestion}"

CANDIDATE'S ANSWER:
"${studentAnswer}"

EVALUATION INSIGHT:
- Score: ${evaluation.overallScore}/100
- Is Excelling: ${evaluation.isExcelling}
- Is Struggling: ${evaluation.isStruggling}
- Target Difficulty: ${targetDifficulty}

TASK:
- If the candidate excelled, acknowledge their strong point in 1 sentence and ask a deeper, challenging follow-up pushing into edge cases, scalability, or architecture constraints.
- If the candidate struggled or gave a brief answer, politely guide them back on track or ask a simpler foundational question to let them demonstrate their understanding.
- Keep your question under 45 words.
- Do NOT repeat questions already asked: ${JSON.stringify(questionsAsked.slice(-5))}

Return ONLY JSON:
{
  "nextQuestionText": "Your follow-up question",
  "category": "${lastQuestionCategory}",
  "interviewerComment": "Brief 1-sentence transition",
  "expectedConcepts": ["concept A", "concept B"]
}
`;

  try {
    const raw = await callGeminiWithRetry(followUpPrompt, 5000);
    if (raw) {
      const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.nextQuestionText && parsed.nextQuestionText.trim().length > 15) {
        return {
          nextQuestionText: parsed.nextQuestionText.trim(),
          category: parsed.category || lastQuestionCategory,
          currentDifficulty: targetDifficulty,
          expectedConcepts: parsed.expectedConcepts || ['architectural details', 'trade-offs'],
          interviewerComment: parsed.interviewerComment || 'Understood.',
          isInterviewComplete: false,
          evaluation,
        };
      }
    }
  } catch {}

  // 3. Fallback: Pull from Structured Question Bank with Adaptive Branching
  let availableBank = getQuestionsForTrack(targetRole, interviewType, targetDifficulty, companyName);
  
  // Find questions not yet asked
  let unasked = availableBank.filter(q => !questionsAsked.some(aq => aq.toLowerCase().includes(q.questionText.slice(0, 30).toLowerCase())));
  if (unasked.length === 0) {
    unasked = INTERVIEW_QUESTION_BANK.filter(q => !questionsAsked.includes(q.questionText));
  }

  const selectedBankQ = unasked[0] || INTERVIEW_QUESTION_BANK[0];

  let nextText = selectedBankQ.questionText;
  if (evaluation.isExcelling && selectedBankQ.adaptiveHarder) {
    nextText = selectedBankQ.adaptiveHarder;
  } else if (evaluation.isStruggling && selectedBankQ.adaptiveEasier) {
    nextText = selectedBankQ.adaptiveEasier;
  }

  return {
    nextQuestionText: nextText,
    category: selectedBankQ.category,
    currentDifficulty: targetDifficulty,
    expectedConcepts: selectedBankQ.expectedConcepts,
    interviewerComment: evaluation.isExcelling ? 'Great depth.' : 'Understood. Let us explore the next area.',
    isInterviewComplete: false,
    evaluation,
  };
}
