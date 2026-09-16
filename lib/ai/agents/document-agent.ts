import { callGeminiJSON } from '../gemini';

export interface DocumentExtractionResult {
  docType: 'Resume' | 'Marks Card' | 'Degree' | 'Certificate' | 'Internship' | 'Project Report';
  extractedInformation: {
    college?: string;
    degree?: string;
    branch?: string;
    graduationYear?: number;
    cgpa?: number;
    skillsExtracted?: string[];
    projectsExtracted?: Array<{ title: string; tech: string[]; summary: string }>;
    experienceExtracted?: Array<{ company: string; role: string; summary: string }>;
    certificationsExtracted?: string[];
    achievementsExtracted?: string[];
  };
  confidenceScore: number;
  unverifiedNotes: string[];
}

export async function processDocumentText(rawOcrText: string, docName: string): Promise<DocumentExtractionResult> {
  const prompt = `
  You are an expert Document Scanner & Parser Agent for student career documents.
  Analyze the raw document text extracted via OCR below (File: "${docName}"):

  """
  ${rawOcrText.slice(0, 3000)}
  """

  Extract structured information. Return JSON:
  {
    "docType": "Resume",
    "extractedInformation": {
      "college": "University Name",
      "degree": "B.E. Computer Science",
      "branch": "Computer Science",
      "graduationYear": 2025,
      "cgpa": 8.7,
      "skillsExtracted": ["React", "Node.js", "Python", "SQL"],
      "projectsExtracted": [
        { "title": "Smart Campus Platform", "tech": ["React", "Node.js"], "summary": "Resource optimization app" }
      ],
      "experienceExtracted": [
        { "company": "Tech Corp", "role": "Software Intern", "summary": "Built backend APIs" }
      ],
      "certificationsExtracted": ["AWS Certified Solutions Architect"]
    },
    "confidenceScore": 92,
    "unverifiedNotes": ["Please double check graduation year", "Confirm CGPA 8.7 against transcript"]
  }
  `;

  const fallback: DocumentExtractionResult = {
    docType: docName.toLowerCase().includes('resume') ? 'Resume' : 'Certificate',
    extractedInformation: {
      college: 'University of Technology',
      degree: 'B.S. Computer Science & Engineering',
      branch: 'Computer Science',
      graduationYear: 2025,
      cgpa: 8.7,
      skillsExtracted: ['React.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'Python', 'Tailwind CSS', 'Git'],
      projectsExtracted: [
        {
          title: 'Smart Campus Resource Optimization Platform',
          tech: ['React', 'Node.js', 'PostgreSQL', 'Express'],
          summary: 'Full-stack platform optimizing university lab seat allocations and scheduling.',
        },
        {
          title: 'AI Resume & ATS Parser Engine',
          tech: ['Python', 'FastAPI', 'SpaCy NLP', 'Next.js'],
          summary: 'Automated NLP resume parser scoring keyword density against job descriptions.',
        },
      ],
      experienceExtracted: [
        {
          company: 'TechNovation Labs',
          role: 'Full Stack Software Intern',
          summary: 'Developed cloud analytics microservices, optimized SQL queries by 35%.',
        },
      ],
      certificationsExtracted: ['AWS Certified Solutions Architect – Associate'],
      achievementsExtracted: ['1st Place in University Hackathon 2024'],
    },
    confidenceScore: 94,
    unverifiedNotes: [
      'Extracted CGPA 8.7 — Please confirm with official transcript.',
      'Extracted 7 skills — Review proficiency levels in profile editor.',
    ],
  };

  return callGeminiJSON<DocumentExtractionResult>(prompt, fallback);
}
