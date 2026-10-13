import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { allQuestions } from '@/lib/practice/questions';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      questionId,
      userAnswer,
      passed,
      score,
      hintsUsed,
      studentWeakAreas,
    } = body as {
      questionId: string;
      userAnswer: string;
      passed: boolean;
      score: number;
      hintsUsed: number;
      category?: string;
      difficulty?: string;
      studentWeakAreas?: string[];
    };

    const question = allQuestions.find(q => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    if (!apiKey) {
      // Return a structured fallback explanation
      return NextResponse.json({
        feedback: generateFallbackExplanation(question, passed, score, hintsUsed),
        followUp: generateFollowUp(question),
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = buildExplanationPrompt(question, userAnswer, passed, score, hintsUsed, studentWeakAreas);

    const models = ['gemini-3.8-flash', 'gemini-2.5-pro', 'gemini-flash-latest'];
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) {
          return NextResponse.json({
            feedback: text,
            followUp: generateFollowUp(question),
          });
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`Model ${modelName} failed:`, errMsg);
        continue;
      }
    }

    // All models failed, use fallback
    return NextResponse.json({
      feedback: generateFallbackExplanation(question, passed, score, hintsUsed),
      followUp: generateFollowUp(question),
    });
  } catch (err: unknown) {
    console.error('Explanation API error:', err);
    const errMsg = err instanceof Error ? err.message : 'Failed to generate explanation';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

function buildExplanationPrompt(
  question: ReturnType<typeof allQuestions['find']>,
  userAnswer: string,
  passed: boolean,
  score: number,
  hintsUsed: number,
  weakAreas?: string[]
): string {
  if (!question) return '';
  return `You are CareerPilot's AI feedback engine for a placement preparation platform.

A student just attempted this question:

QUESTION: ${question.title}
CATEGORY: ${question.category.toUpperCase()} — ${question.topic}
DIFFICULTY: ${question.difficulty}
DESCRIPTION: ${question.description}

REFERENCE SOLUTION:
${question.solution}

STUDENT'S ANSWER:
${userAnswer || '(No answer submitted)'}

RESULT: ${passed ? '✅ PASSED' : '❌ FAILED'} — Score: ${score}/100
Hints used: ${hintsUsed}
${weakAreas?.length ? `Student's known weak areas: ${weakAreas.join(', ')}` : ''}

Please provide:
1. **Why their answer ${passed ? 'passed' : 'failed'}** — specific, honest assessment
2. **Key concepts they need to understand** — explain the core idea clearly
3. **What they missed** (if failed) or **what they did well** (if passed)
4. **Common interview mistakes** for this type of question
5. **Best approach** — explain the optimal solution clearly
6. **Interview follow-up questions** they should prepare for

Format your response in clear sections. Be direct, educational, and encouraging.
Do NOT fabricate. Only explain based on the reference solution provided.
Keep total response under 400 words.`;
}

function generateFallbackExplanation(
  question: ReturnType<typeof allQuestions['find']>,
  passed: boolean,
  score: number,
  hintsUsed: number
): string {
  if (!question) return 'Question not found.';

  const status = passed ? '✅ Passed' : '❌ Not Yet';

  return `## AI Feedback — ${question.title}

**Result: ${status} | Score: ${score}/100**

### Concept
${question.explanation}

### Key Points
${question.hints.map((h, i) => `${i + 1}. ${h.text}`).join('\n')}

### Reference Solution
\`\`\`
${question.solution}
\`\`\`

${passed
    ? '### What You Did Well\nYou successfully solved this problem! ' + (hintsUsed === 0 ? 'Excellent — no hints needed!' : `Review the hints you used to solidify your understanding.`)
    : '### What to Focus On\nStudy the reference solution above. Understand each step before moving on. Try again without hints.'}

### Expected Complexity
${question.expectedComplexity || 'Not specified for this question type.'}

### Interview Tip
Companies like ${question.companies.slice(0, 3).join(', ')} commonly ask this type of question. Make sure you can explain your approach out loud.`;
}

function generateFollowUp(question: ReturnType<typeof allQuestions['find']>): string[] {
  if (!question) return [];

  const followUps: Record<string, string[]> = {
    sql: [
      'What is the difference between RANK() and DENSE_RANK()?',
      'How would this query perform with 10 million rows?',
      'How would you add an index to optimize this query?',
      'What is the difference between WHERE and HAVING?',
      'Explain the query execution order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY',
    ],
    coding: [
      'What is the time and space complexity of your solution?',
      'Can you solve this with O(1) space?',
      'How would you handle edge cases like empty input or duplicates?',
      'Can you code this iteratively instead of recursively?',
      'How would you test this function?',
    ],
    conceptual: [
      'Can you give a real-world example?',
      'How does this apply to distributed systems?',
      'What are the trade-offs?',
      'How would you explain this to a non-technical person?',
    ],
    aptitude: [
      'Can you solve this using a different method?',
      'How would you solve this faster under exam conditions?',
    ],
    hr: [
      'Can you give a specific example from your project?',
      'What would you do differently?',
      'How did this experience shape your approach?',
    ],
  };

  const qFollowUps = followUps[question.type] || followUps.conceptual;
  return qFollowUps.slice(0, 3);
}
