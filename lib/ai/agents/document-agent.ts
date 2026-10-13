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
      skillsExtracted: [],
      projectsExtracted: [],
      experienceExtracted: [],
      certificationsExtracted: [],
    },
    confidenceScore: 50,
    unverifiedNotes: [
      'Document uploaded to private storage. Please review and confirm extracted fields manually.',
    ],
  };

  return callGeminiJSON<DocumentExtractionResult>(prompt, fallback);
}
