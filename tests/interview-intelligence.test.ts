import { describe, it, expect } from 'vitest';
import { evaluateAnswerIntelligently, computeAdaptiveNextQuestion } from '@/lib/ai/interview-intelligence';
import { getQuestionsForTrack } from '@/lib/interview/questionBank';

describe('PRISM Interview Intelligence & Adaptive Engine', () => {
  it('successfully retrieves targeted questions from the Question Bank', () => {
    const googleQuestions = getQuestionsForTrack('Software Developer (SDE)', 'Technical', 'Intermediate', 'Google');
    expect(googleQuestions.length).toBeGreaterThan(0);

    const first = googleQuestions[0];
    expect(first.role).toBe('Software Developer (SDE)');
    expect(first.expectedConcepts.length).toBeGreaterThan(0);
    expect(first.adaptiveHarder).toBeDefined();
    expect(first.adaptiveEasier).toBeDefined();
  });

  it('correctly scores an articulate, high-depth answer and escalates difficulty adaptively', async () => {
    const questions = getQuestionsForTrack('Software Developer (SDE)', 'Technical', 'Intermediate', 'Google');
    const sampleQ = questions[0];

    const strongAnswer = `
      For the URL shortening service, with 500 million URLs per month, we have a heavy read vs write ratio around 10:1.
      To generate unique short keys, we use Base62 encoding. A distributed Snowflake generator creates unique 64-bit IDs, which convert to a 7-character Base62 shortKey yielding 3.5 trillion unique combinations.
      For the database schema, we store id, shortKey as an index, longUrl, and createdAt timestamp.
      To guarantee low-latency redirection, we place Redis caching with an LRU eviction policy in front of the database and deploy CDN edge caching to handle hot redirect traffic.
    `;

    const evaluation = await evaluateAnswerIntelligently({
      questionText: sampleQ.questionText,
      category: sampleQ.category,
      studentAnswer: strongAnswer,
      difficulty: sampleQ.difficulty,
      targetRole: sampleQ.role,
      expectedConcepts: sampleQ.expectedConcepts,
      evaluationCriteria: sampleQ.evaluationCriteria,
    });

    expect(evaluation.overallScore).toBeGreaterThanOrEqual(75);
    expect(evaluation.technicalAccuracy).toBeGreaterThanOrEqual(75);
    expect(evaluation.relevance).toBeGreaterThanOrEqual(80);
    expect(evaluation.isExcelling).toBe(true);
    expect(evaluation.isStruggling).toBe(false);
    expect(evaluation.evidenceQuote).toBeTruthy();

    const adaptiveNext = await computeAdaptiveNextQuestion({
      targetRole: 'Software Developer (SDE)',
      interviewType: 'Technical',
      currentDifficulty: 'Intermediate',
      companyName: 'Google',
      lastQuestion: sampleQ.questionText,
      studentAnswer: strongAnswer,
      turnIndex: 1,
      totalTurns: 6,
      evaluation,
    });

    expect(adaptiveNext.currentDifficulty).toBe('Advanced');
    expect(adaptiveNext.nextQuestionText).toBeTruthy();
  });

  it('detects a struggling answer, reduces difficulty gracefully, and gives actionable guidance', async () => {
    const questions = getQuestionsForTrack('Software Developer (SDE)', 'Technical', 'Intermediate', 'Google');
    const sampleQ = questions[0];

    const weakAnswer = 'Indexes just make things fast. I think it uses trees but I am not really sure about how node splits or disk pages work.';

    const evaluation = await evaluateAnswerIntelligently({
      questionText: sampleQ.questionText,
      category: sampleQ.category,
      studentAnswer: weakAnswer,
      difficulty: 'Intermediate',
      targetRole: sampleQ.role,
      expectedConcepts: sampleQ.expectedConcepts,
      evaluationCriteria: sampleQ.evaluationCriteria,
    });

    expect(evaluation.overallScore).toBeLessThan(70);
    expect(evaluation.isStruggling).toBe(true);
    expect(evaluation.isExcelling).toBe(false);
    expect(evaluation.mentorMessage).toBeTruthy();

    const adaptiveNext = await computeAdaptiveNextQuestion({
      targetRole: 'Software Developer (SDE)',
      interviewType: 'Technical',
      currentDifficulty: 'Intermediate',
      companyName: 'Google',
      lastQuestion: sampleQ.questionText,
      studentAnswer: weakAnswer,
      turnIndex: 2,
      totalTurns: 6,
      evaluation,
    });

    expect(adaptiveNext.currentDifficulty).toBe('Beginner');
    expect(adaptiveNext.nextQuestionText).toBeTruthy();
  });

  it('penalizes completely irrelevant or off-topic responses', async () => {
    const questions = getQuestionsForTrack('Software Developer (SDE)', 'Technical', 'Intermediate', 'Google');
    const sampleQ = questions[0];

    const irrelevantAnswer = 'I like playing cricket on weekends and eating street food.';

    const evaluation = await evaluateAnswerIntelligently({
      questionText: sampleQ.questionText,
      category: sampleQ.category,
      studentAnswer: irrelevantAnswer,
      difficulty: 'Intermediate',
      targetRole: sampleQ.role,
      expectedConcepts: sampleQ.expectedConcepts,
    });

    expect(evaluation.relevance).toBeLessThanOrEqual(40);
    expect(evaluation.overallScore).toBeLessThan(50);
  });
});
