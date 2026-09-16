import { callGeminiJSON } from '../gemini';
import { LearningTopic } from '@/types';

export async function generateLearningRoadmapForWeaknesses(
  weakAreas: string[],
  targetRole: string
): Promise<LearningTopic[]> {
  const prompt = `
  You are an AI Personalized Learning Engine.
  Convert these identified interview & profile weaknesses into actionable learning roadmap topics:
  Weaknesses: ${weakAreas.join(', ')}
  Target Role: ${targetRole}

  Return JSON list of LearningTopic objects:
  [
    {
      "id": "topic-1",
      "topic": "DBMS Joins & Indexing Optimization",
      "category": "Database",
      "estimatedMinutes": 25,
      "status": "To Learn",
      "resources": [
        { "title": "SQL Joins visual guide", "url": "#", "type": "Article" },
        { "title": "Indexing execution plans", "url": "#", "type": "Video" }
      ]
    }
  ]
  `;

  const fallback: LearningTopic[] = weakAreas.map((weakness, i) => ({
    id: `rt-${Date.now()}-${i}`,
    topic: weakness.includes('DBMS') || weakness.includes('SQL')
      ? 'SQL Joins, Indexing & Query Execution Plans'
      : weakness.includes('Confidence') || weakness.includes('Communication')
        ? 'Speech Rhythm & Strategic Silence Pausing'
        : weakness.includes('STAR') || weakness.includes('Behavioral')
          ? 'STAR Method Masterclass for Behavioral HR Rounds'
          : `Deep Dive: ${weakness}`,
    category: weakness.includes('DBMS') ? 'Technical' : weakness.includes('STAR') ? 'HR' : 'Communication',
    estimatedMinutes: 20 + i * 5,
    status: i === 0 ? 'In Progress' : 'To Learn',
    resources: [
      { title: `Core Concepts Guide: ${weakness}`, url: '#', type: 'Article' },
      { title: `Video Breakdown: Master ${weakness} in 15 Minutes`, url: '#', type: 'Video' },
      { title: `Interactive Practice Drills: ${weakness}`, url: '#', type: 'Practice' },
    ],
  }));

  return callGeminiJSON<LearningTopic[]>(prompt, fallback);
}
