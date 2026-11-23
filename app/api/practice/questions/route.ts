import { NextRequest, NextResponse } from 'next/server';
import { nodeDb } from '@/lib/db/nodeDb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subject') || undefined;
    const topic = searchParams.get('topic') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;

    // stripAnswers = true ensures client never receives the correct answer before submission
    const questions = nodeDb.getQuestions(subjectId, topic, difficulty, true);

    return NextResponse.json({
      success: true,
      questions,
      total: questions.length,
    });
  } catch (error) {
    console.error('Error fetching practice questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
