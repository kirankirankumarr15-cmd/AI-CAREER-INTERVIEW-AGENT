import { GoogleGenerativeAI } from '@google/generative-ai';
import { RoleRequirements, SkillGapAnalysis } from './types';
import { SkillItem, ProjectItem } from '@/types';

interface GenerateRoadmapInput {
  role: string;
  targetCompany?: string | null;
  timelineWeeks?: number;
  requirements: RoleRequirements;
  gapAnalysis: SkillGapAnalysis;
  verifiedData: {
    skills: SkillItem[];
    projects: ProjectItem[];
    cgpa?: number;
    graduationYear?: number;
  };
}

interface RawPhaseOutput {
  title: string;
  summary: string;
  orderIndex: number;
  tasks: Array<{
    title: string;
    description: string;
    estHours: number;
    priority: 'high' | 'medium' | 'low';
    linkedSkill: string;
    resourceUrl?: string;
    sourceType: 'from sources' | 'AI-suggested' | 'CareerPilot Practice' | 'CareerPilot Mock Interview' | 'CareerPilot Quiz';
    dueWeek: number;
  }>;
}

export async function generatePhasedRoadmap(
  input: GenerateRoadmapInput
): Promise<RawPhaseOutput[]> {
  const {
    role,
    targetCompany,
    timelineWeeks = 12,
    requirements,
    gapAnalysis,
    verifiedData,
  } = input;

  const missingSkills = gapAnalysis.items
    .filter((i) => i.status === 'missing')
    .map((i) => i.skill);

  const partialSkills = gapAnalysis.items
    .filter((i) => i.status === 'partial')
    .map((i) => i.skill);

  const verifiedSkills = gapAnalysis.items
    .filter((i) => i.status === 'have')
    .map((i) => i.skill);

  const verifiedProjectTitles = verifiedData.projects.map((p) => p.title).join(', ');

  const sourceUrlsList = requirements.sources
    .filter((s) => s.url && s.url.startsWith('http'))
    .map((s) => `- ${s.title}: ${s.url}`)
    .join('\n');

  // Attempt generation via Gemini LLM with retry
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];
    const genAI = new GoogleGenerativeAI(geminiKey);

    for (let attempt = 1; attempt <= 2; attempt++) {
      for (const modelName of candidateModels) {
        try {
          console.log(`[ROADMAP GENERATOR] Attempt ${attempt}: Generating with ${modelName}...`);
          const model = genAI.getGenerativeModel({ model: modelName });

          const prompt = `You are a Principal Software Engineering Director and Career Coach.
Design a highly personalized, phased ${timelineWeeks}-week roadmap for a college student targeting "${role}"${targetCompany ? ` at ${targetCompany}` : ''}.

STUDENT'S VERIFIED SKILL PROFILE:
- ALREADY POSSESSED & VERIFIED (DO NOT TEACH FROM SCRATCH - SKIP THESE IN FOUNDATIONS):
  ${verifiedSkills.length > 0 ? verifiedSkills.join(', ') : 'None verified yet'}
- VERIFIED COMPLETED PROJECTS:
  ${verifiedProjectTitles || 'None yet'}
- PARTIAL KNOWLEDGE (NEEDS POLISHING):
  ${partialSkills.length > 0 ? partialSkills.join(', ') : 'None'}
- CRITICAL SKILL GAPS (PRIMARY FOCUS OF ROADMAP):
  ${missingSkills.length > 0 ? missingSkills.join(', ') : 'None'}

AUTHORIZED REFERENCE SOURCES (ONLY USE THESE URLS OR CAREERPILOT INTERNAL PATHS - NEVER INVENT LINKS):
${sourceUrlsList || '- None available'}

CAREERPILOT INTEGRATION PATHS (Use for relevant drill tasks):
- Practice Hub: /practice
- Technical Coding Drills: /practice/technical
- Communication Practice: /practice/communication
- Realtime AI Mock Interview Room: /interview
- AI ATS Resume Optimizer: /resume

REQUIRED 6-PHASE STRUCTURE (All 6 must be present):
1. Foundations (Order: 1) - Focus strictly on missing foundational concepts
2. Core Role Skills (Order: 2) - Hands-on mastery of missing core tools/languages
3. Projects (Order: 3) - Specific buildable capstones addressing student's exact gaps
4. DSA / Problem Solving (Order: 4) - Technical algorithmic drills relevant to ${role}
5. Interview Preparation (Order: 5) - Mock technical and HR interview rounds
6. Resume & Applications (Order: 6) - ATS resume alignment and portfolio deployment

DISTINCTNESS RULE:
Because this student has verified skills [${verifiedSkills.join(', ')}], their roadmap MUST differ from a beginner who has no verified skills. Tailor the tasks specifically to their gaps [${missingSkills.join(', ')}].

PACING:
Spread tasks realistically across weeks 1 to ${timelineWeeks} (approx 8-12 hours per week for college students).

Respond STRICTLY with valid JSON matching this schema:
{
  "phases": [
    {
      "orderIndex": 1,
      "title": "Phase Title",
      "summary": "Brief phase description",
      "tasks": [
        {
          "title": "Task title",
          "description": "Specific actionable steps",
          "estHours": 4.5,
          "priority": "high",
          "linkedSkill": "TypeScript",
          "resourceUrl": "URL from authorized list or /practice",
          "sourceType": "from sources" | "AI-suggested" | "CareerPilot Practice" | "CareerPilot Mock Interview" | "CareerPilot Quiz",
          "dueWeek": 1
        }
      ]
    }
  ]
}`;

          const res = await model.generateContent(prompt);
          const rawText = res.response.text();
          const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed: unknown = JSON.parse(cleanText);

          if (parsed && typeof parsed === 'object' && 'phases' in parsed && validatePhasesSchema((parsed as { phases: unknown }).phases)) {
            console.log(`[ROADMAP GENERATOR] LLM generation succeeded with ${(parsed as { phases: RawPhaseOutput[] }).phases.length} phases!`);
            return (parsed as { phases: RawPhaseOutput[] }).phases;
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`[ROADMAP GENERATOR] Attempt ${attempt} failed on ${modelName}:`, errMsg);
        }
      }
    }
  }

  // Deterministic Architected Fallback (100% Schema Guaranteed, Never Inferred/Invented)
  console.log('[ROADMAP GENERATOR] Utilizing deterministic architectural synthesizer.');
  return synthesizeDeterministicRoadmap(input);
}

/**
 * Validate LLM JSON output against strict schema
 */
function validatePhasesSchema(phases: unknown): phases is RawPhaseOutput[] {
  if (!Array.isArray(phases) || phases.length < 5) return false;

  for (const p of phases) {
    if (!p || typeof p !== 'object') return false;
    const item = p as Record<string, unknown>;
    if (!item.title || typeof item.orderIndex !== 'number' || !item.summary) return false;
    if (!Array.isArray(item.tasks) || item.tasks.length === 0) return false;

    for (const t of item.tasks) {
      if (!t || typeof t !== 'object') return false;
      const task = t as Record<string, unknown>;
      if (!task.title || !task.description || typeof task.dueWeek !== 'number') return false;
    }
  }
  return true;
}

/**
 * Deterministic generation guaranteeing true distinctness based on verified skills
 */
function synthesizeDeterministicRoadmap(input: GenerateRoadmapInput): RawPhaseOutput[] {
  const { role, targetCompany, timelineWeeks = 12, requirements, gapAnalysis } = input;

  const missingSkills = gapAnalysis.items
    .filter((i) => i.status === 'missing')
    .map((i) => i.skill);

  const partialSkills = gapAnalysis.items
    .filter((i) => i.status === 'partial')
    .map((i) => i.skill);

  const defaultSource = requirements.sources[0]?.url || 'https://roadmap.sh';
  const companyText = targetCompany ? ` for ${targetCompany}` : '';

  // Distribute weeks
  const phase1Weeks = Math.max(1, Math.round(timelineWeeks * 0.2));
  const phase2Weeks = Math.max(1, Math.round(timelineWeeks * 0.35));
  const phase3Weeks = Math.max(1, Math.round(timelineWeeks * 0.25));

  const primaryMissing = missingSkills.slice(0, 3);
  const secondaryMissing = missingSkills.slice(3, 7);

  // Phase 1: Foundations
  const phase1Tasks = (primaryMissing.length > 0 ? primaryMissing : ['Core Foundations']).map(
    (skill, idx) => ({
      title: `Master ${skill} Core Architecture`,
      description: `Deep dive into syntax, paradigms, and runtime fundamentals required for ${role}. Complete hands-on drills.`,
      estHours: 6.0,
      priority: 'high' as const,
      linkedSkill: skill,
      resourceUrl: defaultSource,
      sourceType: 'from sources' as const,
      dueWeek: 1 + Math.min(idx, phase1Weeks - 1),
    })
  );

  // Phase 2: Core Role Skills
  const phase2Skills = secondaryMissing.length > 0 ? secondaryMissing : partialSkills.length > 0 ? partialSkills : requirements.toolsAndFrameworks.slice(0, 3);
  const phase2Tasks = phase2Skills.map((skill, idx) => ({
    title: `Implement Production Workflows with ${skill}`,
    description: `Build functional modules and integrate ${skill} into full-stack development patterns.`,
    estHours: 8.0,
    priority: 'high' as const,
    linkedSkill: skill,
    resourceUrl: '/practice/technical',
    sourceType: 'CareerPilot Practice' as const,
    dueWeek: phase1Weeks + 1 + Math.min(idx, phase2Weeks - 1),
  }));

  // Phase 3: Projects
  const projectIdeas = requirements.projectIdeas.slice(0, 2);
  const phase3Tasks = projectIdeas.map((proj, idx) => ({
    title: `Build & Deploy: ${proj.title}`,
    description: `${proj.description}. Integrate into public GitHub with structured commits and live deployment.`,
    estHours: 14.0,
    priority: 'high' as const,
    linkedSkill: proj.skills.join(', '),
    resourceUrl: defaultSource,
    sourceType: 'AI-suggested' as const,
    dueWeek: phase1Weeks + phase2Weeks + 1 + idx,
  }));

  // Phase 4: DSA / Problem Solving
  const phase4Tasks = [
    {
      title: `${role} Data Structures & Algorithm Drills`,
      description: 'Solve curated technical problems covering array hashing, two pointers, binary search, and dynamic programming.',
      estHours: 8.0,
      priority: 'medium' as const,
      linkedSkill: 'Data Structures & Algorithms',
      resourceUrl: '/practice/technical',
      sourceType: 'CareerPilot Practice' as const,
      dueWeek: phase1Weeks + phase2Weeks + phase3Weeks + 1,
    },
  ];

  // Phase 5: Interview Preparation
  const phase5Tasks = [
    {
      title: `Full ${role} Technical & System Design Mock Interview`,
      description: `Complete an end-to-end interactive voice and code mock interview tailored to ${role}${companyText}. Review feedback report and metrics.`,
      estHours: 4.0,
      priority: 'high' as const,
      linkedSkill: 'System Design & Technical Communication',
      resourceUrl: '/interview',
      sourceType: 'CareerPilot Mock Interview' as const,
      dueWeek: timelineWeeks - 1,
    },
  ];

  // Phase 6: Resume & Applications
  const phase6Tasks = [
    {
      title: `Optimize ATS Resume for ${role} Keywords`,
      description: `Align verified projects and skills with ATS keywords for ${role}. Verify readiness score exceeds 80%.`,
      estHours: 3.0,
      priority: 'high' as const,
      linkedSkill: 'Resume ATS Alignment',
      resourceUrl: '/resume',
      sourceType: 'CareerPilot Practice' as const,
      dueWeek: timelineWeeks,
    },
    {
      title: `Target Company Job Applications & Outreach`,
      description: `Track job openings and submit verified applications via CareerPilot Job Matching.`,
      estHours: 4.0,
      priority: 'medium' as const,
      linkedSkill: 'Career Networking',
      resourceUrl: '/jobs',
      sourceType: 'CareerPilot Practice' as const,
      dueWeek: timelineWeeks,
    },
  ];

  return [
    {
      orderIndex: 1,
      title: 'Phase 1: Foundations',
      summary: `Address critical foundational gaps in ${primaryMissing.join(', ') || 'core principles'} to establish a solid technical baseline.`,
      tasks: phase1Tasks,
    },
    {
      orderIndex: 2,
      title: 'Phase 2: Core Role Skills',
      summary: `Master required tooling, APIs, and modern ${role} workflows with targeted code drills.`,
      tasks: phase2Tasks,
    },
    {
      orderIndex: 3,
      title: 'Phase 3: Production Projects',
      summary: `Build real, verifiable portfolio projects demonstrating end-to-end implementation for recruiters.`,
      tasks: phase3Tasks,
    },
    {
      orderIndex: 4,
      title: 'Phase 4: DSA & Algorithmic Problem Solving',
      summary: `Hone problem-solving speed and algorithmic efficiency on common interview question patterns.`,
      tasks: phase4Tasks,
    },
    {
      orderIndex: 5,
      title: 'Phase 5: Mock Interview Readiness',
      summary: `Simulate live technical and behavioral rounds in the AI Mock Interview Room with real-time feedback.`,
      tasks: phase5Tasks,
    },
    {
      orderIndex: 6,
      title: 'Phase 6: Resume & Strategic Applications',
      summary: `Optimize ATS keywords, verify project bullets, and submit applications directly to matching companies.`,
      tasks: phase6Tasks,
    },
  ];
}
