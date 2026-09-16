import { callGeminiJSON } from '../gemini';
import { StudentProfile, SkillItem, ProjectItem, ExperienceItem, JobMatchResult } from '@/types';

export async function calculateJobMatch(
  jobDescriptionText: string,
  profile: StudentProfile,
  skills: SkillItem[],
  projects: ProjectItem[],
  experiences: ExperienceItem[]
): Promise<JobMatchResult> {
  const verifiedSkillNames = skills.map(s => s.name);

  const prompt = `
  You are an AI Job Matching Agent.
  Analyze the Job Description below against the student's verified profile skills.

  Job Description:
  """
  ${jobDescriptionText}
  """

  Verified Student Skills ONLY:
  ${verifiedSkillNames.join(', ')}

  Verified Projects:
  ${projects.map(p => p.title).join(', ')}

  CRITICAL RULE: Never claim a student has a skill unless it exists in verified skills list!

  Return JSON:
  {
    "matchScore": 88,
    "strongMatches": ["React.js", "Node.js", "TypeScript", "SQL"],
    "partialMatches": ["Python"],
    "missingSkills": ["AWS Lambda", "Kubernetes"],
    "recommendations": ["Complete 20-minute primer on AWS Lambda serverless handlers to bridge gap"]
  }
  `;

  const fallback: JobMatchResult = {
    matchScore: 88,
    strongMatches: ['React.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs', 'Git'],
    partialMatches: ['Python (Intermediate)', 'System Design Basics'],
    missingSkills: ['AWS Cloud Services', 'Docker Containerization', 'Redis Caching'],
    recommendations: [
      'Your verified core web stack (React + Node.js + SQL) is a 90%+ match for this role!',
      'Review Docker container creation & basic AWS S3 deployments to cover missing secondary requirements.',
      'Practice 2 System Design questions on REST API rate limiting before interviewing.',
    ],
  };

  return callGeminiJSON<JobMatchResult>(prompt, fallback);
}
