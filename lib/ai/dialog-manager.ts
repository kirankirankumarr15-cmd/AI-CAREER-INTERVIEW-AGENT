/**
 * lib/ai/dialog-manager.ts
 *
 * Server-side Dialog Manager for the Interactive Interviewer Engine (F21).
 * Determines the correct dialog "move" each turn based on:
 *   - The student's answer quality
 *   - Interview memory (what has been asked, weak areas)
 *   - Turn index and total question budget
 *   - Session mode (solo, panel, first_timer)
 *
 * This module ONLY produces structured JSON — TTS/STT are handled client-side.
 * No scores are shown mid-interview; analysis is saved but not surfaced to the student.
 */

import { callGeminiJSON } from './gemini';
import type { StudentProfile, ProjectItem, InterviewType, InterviewDifficulty, InterviewMode } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DialogMove =
  | 'greeting'
  | 'ask'
  | 'follow_up'
  | 'clarify'
  | 'acknowledge'
  | 'probe'
  | 'transition'
  | 'closing'
  | 'nudge';

export type AnswerQuality =
  | 'strong'
  | 'partial'
  | 'weak'
  | 'off_topic'
  | 'silence'
  | 'one_word'
  | 'rambling'
  | 'false_claim'
  | 'repeat';

export interface TurnInput {
  sessionId: string;
  turnIndex: number;
  totalTurns: number;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  mode: InterviewMode;
  targetRole: string;
  profile: StudentProfile;
  projects: ProjectItem[];
  lastQuestion: string;
  lastQuestionCategory: string;
  studentAnswer: string;
  topicsAsked: string[];
  questionsAsked: string[];    // dedup guard: exact question texts already delivered
  weakAreasDetected: string[];
  strongAreasDetected: string[];
  isFirstTurn: boolean;
  silenceCount: number;
  offTopicCount: number;
  companyName?: string;
  panelInterviewerName?: string;  // for panel mode
  isFirstTimerMode?: boolean;
}

export interface TurnOutput {
  move: DialogMove;
  questionText: string;
  category: string;
  expectedKeyPoints: string[];
  toneNote: string;            // internal note, NOT shown to student
  answerQuality: AnswerQuality;
  weakArea?: string;           // if detected
  falseClaimDetected?: string; // if a verifiable false claim was made
  isInterviewComplete: boolean;
  silenceNudge?: string;       // only if move=nudge
}

// ─── Persona configurations ────────────────────────────────────────────────────

const PERSONA_PROMPTS: Record<InterviewMode, string> = {
  Friendly: `
    You are a warm, encouraging interviewer. Use supportive language.
    When the student hesitates, offer a gentle hint framed as "thinking aloud".
    Never use harsh language. Keep a conversational tone.`,
  Professional: `
    You are a senior engineer conducting a realistic corporate interview.
    Be neutral — neither overly warm nor harsh. Ask precise questions.
    Acknowledge answers with brief transitions like "Got it." or "Understood."`,
  Strict: `
    You are a demanding technical interviewer. Demand exact terminology.
    Do not accept vague or hand-wavy answers — probe until precise.
    Use short acknowledgements like "Noted." or "Let's go deeper."`,
  Pressure: `
    You are a high-pressure interviewer. Ask rapid follow-ups.
    If the student drifts, say "That's not quite what I asked —" and redirect.
    Simulate stress scenarios like "We're running out of time, give me the core answer."`,
};

// ─── Dialog Manager Core ────────────────────────────────────────────────────────

/**
 * Decide the next dialog move and generate the interviewer's next utterance.
 * Called on every student turn (except the very first greeting).
 */
export async function computeNextTurn(input: TurnInput): Promise<TurnOutput> {
  const {
    turnIndex,
    totalTurns,
    interviewType,
    difficulty,
    mode,
    targetRole,
    profile,
    projects,
    lastQuestion,
    lastQuestionCategory,
    studentAnswer,
    topicsAsked,
    questionsAsked,
    weakAreasDetected,
    isFirstTurn,
    silenceCount,
    offTopicCount,
    companyName,
    panelInterviewerName,
    isFirstTimerMode,
  } = input;

  const isLastTwoTurns = turnIndex >= totalTurns - 2;
  const answerWordCount = studentAnswer.trim().split(/\s+/).filter(Boolean).length;
  const isSilence = answerWordCount < 3;
  const isOneWord = answerWordCount <= 5;
  const isRambling = answerWordCount > 350;

  // ── Silent / one-word nudge path ────────────────────────────────────────────
  if (isSilence || (isOneWord && silenceCount >= 1)) {
    return buildNudge(input, isSilence ? 'silence' : 'one_word', mode, isFirstTimerMode);
  }

  // ── Build LLM prompt ────────────────────────────────────────────────────────
  const personaInstructions = PERSONA_PROMPTS[mode] || PERSONA_PROMPTS.Professional;
  const projectContext = projects
    .slice(0, 2)
    .map((p) => `- "${p.title}" (${p.techStack.slice(0, 3).join(', ')})`)
    .join('\n');

  const alreadyAsked = questionsAsked.slice(-10).join('\n- ');
  const weakContext = weakAreasDetected.length
    ? `Student's weak areas so far: ${weakAreasDetected.join(', ')}.`
    : '';

  const closing = isLastTwoTurns
    ? 'The interview is near its end. If this is the last question, set isInterviewComplete=true and use closing move.'
    : '';

  const firstTimerHint = isFirstTimerMode
    ? 'This is a first-timer mode: use slower pacing, supportive language, and never ask more than one concept at once.'
    : '';

  const panelHint = panelInterviewerName
    ? `You are panel interviewer "${panelInterviewerName}".`
    : '';

  const prompt = `
You are an expert ${interviewType} interviewer for the role of "${targetRole}"${companyName ? ` at ${companyName}` : ''}.
${panelHint}
${personaInstructions}
${firstTimerHint}

STUDENT PROFILE:
- Name: ${profile.fullName}
- CGPA: ${profile.cgpa ?? 'N/A'}
- College: ${profile.college ?? 'N/A'}
- Skills: (from verified profile only)
- Projects:
${projectContext || '  (no projects listed)'}

CURRENT TURN: ${turnIndex + 1} of ${totalTurns}
LAST QUESTION ASKED: "${lastQuestion}"
CATEGORY: ${lastQuestionCategory}
STUDENT'S ANSWER: "${studentAnswer}"

CONTEXT:
- Topics/categories already covered: ${topicsAsked.join(', ') || 'none yet'}
- Do NOT repeat any of these exact questions:
  - ${alreadyAsked || 'none yet'}
- ${weakContext}
- Answer word count: ${answerWordCount}
- Off-topic count this session: ${offTopicCount}
${closing}

INSTRUCTIONS:
1. Classify the student's answer as one of: strong, partial, weak, off_topic, one_word, rambling, false_claim, repeat.
2. Choose ONE dialog move:
   - "follow_up": if answer was partial/weak — ask a targeted follow-up on what was missing
   - "probe": if answer was vague — ask for a concrete example or number
   - "acknowledge": if answer was strong — briefly affirm and move to the NEXT topic
   - "clarify": if answer was off_topic — politely redirect
   - "transition": if topic is covered and no weak areas remain — move to a new topic
   - "closing": if this is the final turn
   - "nudge": if silence or one-word (should have been handled above, include as fallback)
3. Generate ONE question only — direct, specific, not compound.
4. The question MUST be new (not in the "already asked" list above).
5. NEVER reveal scores, star ratings, or percentage feedback mid-interview.
6. If the student made a verifiable false claim (e.g. "I built 10M DAU systems"), set falseClaimDetected.

Return ONLY valid JSON matching this schema exactly:
{
  "move": "follow_up",
  "questionText": "Can you explain the specific indexing strategy you used for that query?",
  "category": "Technical / Databases",
  "expectedKeyPoints": ["B-tree index", "composite index trade-offs"],
  "toneNote": "Student gave a surface-level answer, no specifics on index type.",
  "answerQuality": "partial",
  "weakArea": "Indexing Strategies",
  "falseClaimDetected": null,
  "isInterviewComplete": false,
  "silenceNudge": null
}
`;

  const fallback = buildFallback(input, isLastTwoTurns, isRambling, offTopicCount);

  return callGeminiJSON<TurnOutput>(prompt, fallback);
}

/**
 * Generate the interviewer's opening greeting.
 * The interviewer ALWAYS speaks first.
 */
export async function computeGreeting(
  profile: StudentProfile,
  projects: ProjectItem[],
  targetRole: string,
  interviewType: InterviewType,
  difficulty: InterviewDifficulty,
  mode: InterviewMode,
  companyName?: string,
  panelInterviewerName?: string,
  isFirstTimerMode?: boolean
): Promise<TurnOutput> {
  const personaInstructions = PERSONA_PROMPTS[mode] || PERSONA_PROMPTS.Professional;
  const firstName = (profile.fullName || 'there').split(' ')[0];
  const projectMention =
    projects.length > 0
      ? `I can see you've worked on "${projects[0].title}" — we'll dive into that.`
      : '';

  const prompt = `
You are a ${interviewType} interviewer${companyName ? ` at ${companyName}` : ''} for the "${targetRole}" role.
${panelInterviewerName ? `Your name is ${panelInterviewerName}.` : `Your name is Ava.`}
${personaInstructions}
${isFirstTimerMode ? 'This is the student\'s first ever mock interview. Be especially warm and calming.' : ''}

Generate a natural, welcoming OPENING GREETING that:
1. Greets the student by first name: "${firstName}"
2. Briefly sets the stage (role, type, rough duration ~15 minutes)
3. ${projectMention}
4. Ends with ONE clear opening question (e.g. "Please start by introducing yourself and your top project.")
5. Keep it under 80 words total.
6. Do NOT mention scores, ratings, or evaluation criteria.

Return ONLY valid JSON:
{
  "move": "greeting",
  "questionText": "Hi ${firstName}, welcome! ...",
  "category": "Introduction",
  "expectedKeyPoints": ["background summary", "key project highlight"],
  "toneNote": "Opening greeting",
  "answerQuality": "strong",
  "weakArea": null,
  "falseClaimDetected": null,
  "isInterviewComplete": false,
  "silenceNudge": null
}
`;

  const fallback: TurnOutput = {
    move: 'greeting',
    questionText: `Hi ${firstName}, welcome to your ${difficulty} ${interviewType} interview${companyName ? ` at ${companyName}` : ''}! I'm Ava, your interviewer today. This session will take about 15 minutes. ${projectMention} Let's start — please introduce yourself and walk me through your most significant technical project.`,
    category: 'Introduction',
    expectedKeyPoints: ['personal background', 'project overview', 'tech stack choice'],
    toneNote: 'Opening greeting fallback',
    answerQuality: 'strong',
    isInterviewComplete: false,
  };

  return callGeminiJSON<TurnOutput>(prompt, fallback);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildNudge(
  input: TurnInput,
  quality: AnswerQuality,
  mode: InterviewMode,
  isFirstTimerMode?: boolean
): TurnOutput {
  const { lastQuestion, profile } = input;
  const firstName = (profile.fullName || 'there').split(' ')[0];

  const nudgeMap: Record<InterviewMode, string> = {
    Friendly: isFirstTimerMode
      ? `No worries, ${firstName}! Take a breath and try again — even a few sentences is fine.`
      : `Take your time, ${firstName}. Could you try to give me even a brief answer to: "${lastQuestion}"?`,
    Professional: `I didn't catch a full response. Let's try once more — ${lastQuestion}`,
    Strict: `I need a substantive answer. Please respond to: "${lastQuestion}"`,
    Pressure: `We need to keep moving. Please answer directly: "${lastQuestion}"`,
  };

  return {
    move: 'nudge',
    questionText: nudgeMap[mode] || nudgeMap.Professional,
    category: 'Nudge',
    expectedKeyPoints: [],
    toneNote: `Student was ${quality}. Sending nudge.`,
    answerQuality: quality,
    isInterviewComplete: false,
    silenceNudge: nudgeMap[mode],
  };
}

function buildFallback(
  input: TurnInput,
  isLastTwoTurns: boolean,
  isRambling: boolean,
  offTopicCount: number
): TurnOutput {
  const { profile, targetRole, interviewType } = input;
  const firstName = (profile.fullName || 'there').split(' ')[0];

  if (isLastTwoTurns) {
    return {
      move: 'closing',
      questionText: `Thank you, ${firstName}. That was a comprehensive session! Before we wrap up — is there anything about the ${targetRole} role or this interview you'd like to revisit?`,
      category: 'Closing',
      expectedKeyPoints: [],
      toneNote: 'Closing turn',
      answerQuality: 'strong',
      isInterviewComplete: true,
    };
  }

  if (isRambling || offTopicCount >= 2) {
    return {
      move: 'clarify',
      questionText: `That's interesting context. Let me refocus — in ${interviewType} interviews, we look for concise, specific answers. Could you give me a more targeted response focusing on the core technical aspect?`,
      category: 'Clarify',
      expectedKeyPoints: ['concise technical answer'],
      toneNote: 'Student rambling or off-topic.',
      answerQuality: offTopicCount >= 2 ? 'off_topic' : 'rambling',
      isInterviewComplete: false,
    };
  }

  return {
    move: 'follow_up',
    questionText: `Good start. Can you elaborate on the specific implementation details and the trade-offs you considered?`,
    category: 'Technical Follow-Up',
    expectedKeyPoints: ['implementation specifics', 'trade-off analysis'],
    toneNote: 'Generic follow-up (AI fallback)',
    answerQuality: 'partial',
    isInterviewComplete: false,
  };
}
