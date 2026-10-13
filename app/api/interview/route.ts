import { NextResponse } from 'next/server';
import { generateInitialInterviewQuestions, generateDynamicFollowUp, evaluateStudentAnswer } from '@/lib/ai/agents/interview-agent';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'generateInitial') {
      const { targetRole, type, difficulty, mode, profile, projects, companyName } = payload;
      const questions = await generateInitialInterviewQuestions(
        targetRole, type, difficulty, mode, profile, projects, companyName
      );
      return NextResponse.json({ questions });
    }

    if (action === 'generateFollowUp') {
      const { currentQuestion, studentAnswerText, questionIndex, totalQuestions, profile, targetRole, interviewType } = payload;
      const followUp = await generateDynamicFollowUp(
        currentQuestion, studentAnswerText, questionIndex, totalQuestions, profile, targetRole, interviewType
      );
      return NextResponse.json({ followUp });
    }

    if (action === 'evaluateAnswer') {
      const { questionText, answerText, category } = payload;
      const evaluation = await evaluateStudentAnswer(questionText, answerText, category);
      return NextResponse.json({ evaluation });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
