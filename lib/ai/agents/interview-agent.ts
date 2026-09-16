import { callGeminiJSON } from '../gemini';
import {
  StudentProfile,
  ProjectItem,
  InterviewType,
  InterviewDifficulty,
  InterviewMode,
  InterviewQuestionItem,
  AnswerEvaluation
} from '@/types';

export interface NextQuestionResponse {
  questionText: string;
  category: string;
  expectedKeyPoints: string[];
  interviewerToneMessage?: string;
  isInterviewComplete: boolean;
}

export async function generateInitialInterviewQuestions(
  role: string,
  type: InterviewType,
  difficulty: InterviewDifficulty,
  mode: InterviewMode,
  profile: StudentProfile,
  projects: ProjectItem[],
  companyName?: string
): Promise<InterviewQuestionItem[]> {
  const companyPrefix = companyName ? `for ${companyName} ` : '';
  const firstProject = projects[0];

  const questions: InterviewQuestionItem[] = [
    {
      id: 'q-1',
      questionNumber: 1,
      questionText: companyName
        ? `Hello ${profile.fullName}, welcome to your ${difficulty} level ${type} interview at ${companyName}! To kick things off, please introduce yourself and tell us why you are interested in this ${role} position.`
        : `Hello ${profile.fullName}, welcome to your ${difficulty} level ${type} interview for the ${role} position! Let's start with a brief introduction of your technical background and key projects.`,
      category: type === 'HR' ? 'HR / Introduction' : 'Introduction',
    },
    {
      id: 'q-2',
      questionNumber: 2,
      questionText: firstProject
        ? `I noticed in your verified resume that you built "${firstProject.title}". Could you walk me through the overall architecture of this project and explain why you chose ${firstProject.techStack.slice(0, 2).join(' and ')}?`
        : `Could you describe a technical project you built recently, including the tech stack choices and system architecture?`,
      category: 'Project Architecture',
    },
    {
      id: 'q-3',
      questionNumber: 3,
      questionText: type === 'HR'
        ? `Tell me about a time when you faced a major technical challenge or team conflict during a project. How did you handle it and what was the outcome?`
        : `In database design, how do you handle concurrency control when multiple users try to update or book the exact same resource simultaneously? Can you explain indexing strategies as well?`,
      category: type === 'HR' ? 'Behavioral (STAR)' : 'Technical / DBMS',
    },
    {
      id: 'q-4',
      questionNumber: 4,
      questionText: `Let's discuss core concepts: Explain the difference between process vs thread, and how asynchronous event-driven I/O works under the hood in Node.js or JavaScript.`,
      category: 'OS & Async Programming',
    },
    {
      id: 'q-5',
      questionNumber: 5,
      questionText: `Great. To wrap up, if you were asked to scale your application from 1,000 active daily users to 100,000 concurrent users, what infrastructure or database optimizations would you implement first?`,
      category: 'System Design & Scalability',
    },
  ];

  return questions;
}

export async function generateDynamicFollowUp(
  currentQuestion: string,
  studentAnswerText: string,
  questionIndex: number,
  totalQuestions: number,
  profile: StudentProfile,
  targetRole: string,
  interviewType: InterviewType
): Promise<NextQuestionResponse> {
  const prompt = `
  You are a real senior engineering interviewer conducting a realistic human-like interview for role: "${targetRole}" (${interviewType} round).

  Current Question Asked: "${currentQuestion}"
  Student Answer Given: "${studentAnswerText}"
  Question Index: ${questionIndex + 1} of ${totalQuestions}

  Analyze the student's answer.
  - If the answer was vague or missing key technical depth, generate an insightful follow-up question digging deeper into their explanation!
  - If the answer was thorough, seamlessly acknowledge it and transition to the next technical/HR topic.

  Return JSON:
  {
    "questionText": "Follow-up question string",
    "category": "Technical",
    "expectedKeyPoints": ["Key point 1", "Key point 2"],
    "interviewerToneMessage": "Acknowledging comment",
    "isInterviewComplete": false
  }
  `;

  const isLast = questionIndex + 1 >= totalQuestions;

  const fallback: NextQuestionResponse = {
    questionText: isLast
      ? `Thank you ${profile.fullName}! That concludes our interview session. I'm now compiling your complete evaluation report.`
      : studentAnswerText.length < 50
        ? `You mentioned a broad concept, but can you elaborate specifically on the underlying mechanism? How did you handle edge cases and error boundaries in code?`
        : `That's a solid explanation. Following up on that topic, how would you measure performance bottlenecks and monitor server CPU usage in a production environment?`,
    category: isLast ? 'Conclusion' : 'Dynamic Follow-Up',
    expectedKeyPoints: ['Specific technical metrics', 'Error boundary handling', 'Performance monitoring'],
    interviewerToneMessage: 'Understood.',
    isInterviewComplete: isLast,
  };

  return callGeminiJSON<NextQuestionResponse>(prompt, fallback);
}

export async function evaluateStudentAnswer(
  questionText: string,
  answerText: string,
  category: string
): Promise<AnswerEvaluation> {
  const wordCount = answerText.trim().split(/\s+/).length;
  const lowerAnswer = answerText.toLowerCase();

  // Filler words detection
  const fillerRegex = /\b(um|uh|like|actually|basically|you know|right|so yeah)\b/gi;
  const matches = answerText.match(fillerRegex) || [];
  const fillerWords = Array.from(new Set(matches.map((m) => m.toLowerCase())));

  const prompt = `
  Evaluate this student's spoken interview answer.
  Question: "${questionText}"
  Category: "${category}"
  Answer: "${answerText}"

  Return JSON:
  {
    "answerScore": 82,
    "technicalAccuracy": 85,
    "relevance": 90,
    "structureScore": 75,
    "communicationScore": 78,
    "estimatedConfidence": 74,
    "speakingSpeed": "Optimal",
    "fillerWords": ["um", "basically"],
    "feedbackGood": "You clearly explained the core concept and technical choice.",
    "feedbackImprovement": "Quantify your impact and elaborate on the trade-offs of your approach.",
    "starStructureScore": 70
  }
  `;

  const fallback: AnswerEvaluation = {
    answerScore: Math.min(95, Math.max(55, 60 + Math.min(30, Math.floor(wordCount / 3)))),
    technicalAccuracy: lowerAnswer.includes('react') || lowerAnswer.includes('sql') || lowerAnswer.includes('api') ? 85 : 72,
    relevance: 88,
    structureScore: lowerAnswer.includes('because') || lowerAnswer.includes('result') ? 80 : 68,
    communicationScore: Math.max(50, 85 - fillerWords.length * 5),
    estimatedConfidence: Math.max(55, Math.min(92, 70 + Math.floor(wordCount / 4) - fillerWords.length * 4)),
    speakingSpeed: wordCount > 80 ? 'Too Fast' : wordCount < 20 ? 'Too Slow' : 'Optimal',
    fillerWords: fillerWords,
    feedbackGood: 'Great job maintaining clear relevance to the question asked.',
    feedbackImprovement: fillerWords.length > 0
      ? `Try reducing filler words like ${fillerWords.map(f => `"${f}"`).join(', ')}. Use strategic pauses instead.`
      : 'Include specific numerical metrics or benchmarking results to make your answer stand out.',
    starStructureScore: category.includes('HR') || category.includes('Behavioral') ? 75 : 85,
  };

  return callGeminiJSON<AnswerEvaluation>(prompt, fallback);
}
