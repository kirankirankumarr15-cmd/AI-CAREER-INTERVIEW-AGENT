/**
 * /api/practice/aptitude/questions
 *
 * GET  ?category=Quantitative&topic=Time+%26+Work&difficulty=Medium&count=10
 *      Returns questions for a drill.
 *
 * POST (generate) — generates AI questions for a topic and stores them.
 *      Body: { category, topic, difficulty, count }
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { callGeminiJSON } from '@/lib/ai/gemini';

interface AptitudeQuestion {
  id: string;
  category: string;
  topic: string;
  difficulty: string;
  question_text: string;
  options: Array<{ label: string; text: string }>;
  correct_option: string;
  explanation: string;
  source_type: string;
  confidence: number;
  flagged_review: boolean;
  solve_verified: boolean;
}

const GenerateSchema = z.object({
  category:   z.enum(['Quantitative', 'Logical', 'Verbal']),
  topic:      z.string().min(1).max(100),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  count:      z.number().int().min(1).max(20).default(10),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category   = searchParams.get('category');
  const topic      = searchParams.get('topic');
  const difficulty = searchParams.get('difficulty');
  const count      = Math.min(parseInt(searchParams.get('count') ?? '10', 10), 30);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  let query = supabase
    .from('aptitude_questions')
    .select('*')
    .eq('flagged_review', false)
    .limit(count);

  if (category)   query = query.eq('category', category);
  if (topic)      query = query.eq('topic', topic);
  if (difficulty) query = query.eq('difficulty', difficulty);

  const { data: questions, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If not enough questions exist, generate them on-the-fly
  if (!questions || questions.length < Math.min(count, 5)) {
    const generated = await generateQuestions(
      (category as 'Quantitative' | 'Logical' | 'Verbal') || 'Quantitative',
      topic || 'General',
      (difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
      count
    );

    if (generated.length > 0) {
      // Save to DB (solve-verify before flagging)
      const toInsert = generated.map((q) => ({
        category:        q.category,
        topic:           q.topic,
        difficulty:      q.difficulty,
        question_text:   q.question_text,
        options:         q.options,
        correct_option:  q.correct_option,
        explanation:     q.explanation,
        source_type:     'AI-generated',
        confidence:      q.confidence ?? 0.85,
        flagged_review:  (q.confidence ?? 0.85) < 0.7,
        solve_verified:  false,
      }));

      const { data: inserted } = await supabase
        .from('aptitude_questions')
        .insert(toInsert)
        .select();

      return NextResponse.json({ questions: inserted ?? generated });
    }
  }

  return NextResponse.json({ questions: questions ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await req.json();
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { category, topic, difficulty, count } = parsed.data;
  const questions = await generateQuestions(category, topic, difficulty, count);

  return NextResponse.json({ questions });
}

async function generateQuestions(
  category: 'Quantitative' | 'Logical' | 'Verbal',
  topic: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  count: number
): Promise<AptitudeQuestion[]> {
  const prompt = `
You are an expert aptitude test creator for Indian engineering campus placements.
Generate ${count} UNIQUE ${difficulty} ${category} aptitude questions on the topic: "${topic}".

RULES:
1. Each question must be a genuine ${category} reasoning question with 4 options.
2. The correct answer must be mathematically/logically verifiable.
3. Include a clear, step-by-step explanation.
4. Assign a confidence score (0.0–1.0) reflecting how certain you are the answer is correct.
5. Flag any question with confidence < 0.7 as needing review.
6. NEVER copy real exam questions. Mark source_type as "AI-generated".
7. Questions labeled "Quantitative" are: time/work, percentages, speed, profit/loss, averages.
   "Logical" are: series, analogy, blood relations, seating, coding-decoding.
   "Verbal" are: synonyms/antonyms, sentence correction, reading comprehension.

Return ONLY valid JSON array:
[
  {
    "category": "${category}",
    "topic": "${topic}",
    "difficulty": "${difficulty}",
    "question_text": "If 6 workers complete a task in 8 days, how many days will 4 workers take?",
    "options": [
      {"label": "A", "text": "10 days"},
      {"label": "B", "text": "12 days"},
      {"label": "C", "text": "14 days"},
      {"label": "D", "text": "16 days"}
    ],
    "correct_option": "B",
    "explanation": "Work = 6 × 8 = 48 worker-days. Time = 48/4 = 12 days.",
    "confidence": 0.98,
    "flagged_review": false
  }
]
`;

  const fallback: AptitudeQuestion[] = [{
    id: 'fallback-1',
    category,
    topic,
    difficulty,
    question_text: `Sample ${difficulty} ${category} question on ${topic}. [AI not configured — add GEMINI_API_KEY]`,
    options: [
      { label: 'A', text: 'Option A' },
      { label: 'B', text: 'Option B' },
      { label: 'C', text: 'Option C' },
      { label: 'D', text: 'Option D' },
    ],
    correct_option: 'A',
    explanation: 'AI key not configured. Questions not available.',
    source_type: 'AI-generated',
    confidence: 0.0,
    flagged_review: true,
    solve_verified: false,
  }];

  return callGeminiJSON<AptitudeQuestion[]>(prompt, fallback);
}
