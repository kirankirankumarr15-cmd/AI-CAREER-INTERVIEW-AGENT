import { callGeminiJSON } from '../gemini';

export interface CommunicationAnalysisResult {
  communicationScore: number;
  clarityScore: number;
  fluencyScore: number;
  estimatedConfidence: number;
  grammarScore: number;
  vocabularyScore: number;
  speakingSpeed: 'Too Slow' | 'Optimal' | 'Too Fast';
  wordCount: number;
  fillerWordCount: number;
  fillerWordsList: string[];
  structureScore: number;
  starCompliancePercentage: number;
  tone: 'Casual' | 'Professional' | 'Overly Formal' | 'Hesitant';
  strengths: string[];
  weaknesses: string[];
  actionPlan: string[];
}

export async function analyzeCommunicationSpeech(
  transcript: string,
  questionContext?: string
): Promise<CommunicationAnalysisResult> {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const fillerRegex = /\b(um|uh|actually|basically|like|you know|sort of|kind of|i mean)\b/gi;
  const matches = transcript.match(fillerRegex) || [];
  const fillerWordsList = Array.from(new Set(matches.map((m) => m.toLowerCase())));
  const fillerWordCount = matches.length;

  const prompt = `
  You are an expert AI Communication Coach.
  Analyze the spoken interview response below:

  Context Question: "${questionContext || 'General Interview Response'}"
  Transcribed Speech: "${transcript}"

  Return JSON:
  {
    "communicationScore": 76,
    "clarityScore": 82,
    "fluencyScore": 73,
    "estimatedConfidence": 68,
    "grammarScore": 85,
    "vocabularyScore": 80,
    "speakingSpeed": "Optimal",
    "wordCount": ${wordCount},
    "fillerWordCount": ${fillerWordCount},
    "fillerWordsList": ${JSON.stringify(fillerWordsList)},
    "structureScore": 65,
    "starCompliancePercentage": 70,
    "tone": "Professional",
    "strengths": ["Clear pronunciation", "Professional tech vocabulary"],
    "weaknesses": ["Frequent filler words (basically, like)", "Abrupt answer ending"],
    "actionPlan": [
      "Pause for 1 second before answering complex technical queries",
      "Adopt Situation -> Action -> Result structure for project descriptions"
    ]
  }
  `;

  const fallback: CommunicationAnalysisResult = {
    communicationScore: Math.max(50, Math.min(95, 82 - fillerWordCount * 4)),
    clarityScore: 82,
    fluencyScore: Math.max(45, 78 - fillerWordCount * 5),
    estimatedConfidence: Math.max(50, Math.min(90, 72 - fillerWordCount * 3 + Math.min(15, Math.floor(wordCount / 5)))),
    grammarScore: 85,
    vocabularyScore: 80,
    speakingSpeed: wordCount > 100 ? 'Too Fast' : wordCount < 25 ? 'Too Slow' : 'Optimal',
    wordCount,
    fillerWordCount,
    fillerWordsList,
    structureScore: transcript.toLowerCase().includes('result') || transcript.toLowerCase().includes('outcome') ? 85 : 68,
    starCompliancePercentage: transcript.toLowerCase().includes('situation') || transcript.toLowerCase().includes('task') ? 80 : 60,
    tone: fillerWordCount > 4 ? 'Hesitant' : 'Professional',
    strengths: [
      'Strong technical term usage and precise vocabulary',
      'Good baseline articulation of key engineering points',
    ],
    weaknesses: fillerWordCount > 0
      ? [`Detected ${fillerWordCount} filler words (${fillerWordsList.join(', ')})`]
      : ['Answer could benefit from a more explicit concluding summary'],
    actionPlan: [
      'Practice silence pauses instead of "um" or "like" when formulating thoughts',
      'Use the STAR method (Situation, Task, Action, Result) for behavioral questions',
    ],
  };

  return callGeminiJSON<CommunicationAnalysisResult>(prompt, fallback);
}
