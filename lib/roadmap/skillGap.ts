import { SkillItem, ProjectItem, CertificationItem } from '@/types';
import { RoleRequirements, SkillGapAnalysis, SkillGapItem, SkillGapStatus } from './types';

export function analyzeSkillGaps(
  requirements: RoleRequirements,
  verifiedData: {
    skills: SkillItem[];
    projects: ProjectItem[];
    certifications?: CertificationItem[];
  }
): SkillGapAnalysis {
  // STRICT RULE: Only consider items with verificationStatus === 'Verified'
  const verifiedSkills = (verifiedData.skills || []).filter(
    (s) => s.verificationStatus === 'Verified'
  );
  const verifiedProjects = (verifiedData.projects || []).filter(
    (p) => p.verificationStatus === 'Verified'
  );
  const verifiedCerts = (verifiedData.certifications || []).filter(
    (c) => c.verificationStatus === 'Verified'
  );

  const gapItems: SkillGapItem[] = [];

  // 1. Evaluate Core Skills (High Importance)
  requirements.coreSkills.forEach((reqSkill) => {
    const { status, evidence } = evaluateSingleSkill(
      reqSkill,
      verifiedSkills,
      verifiedProjects,
      verifiedCerts
    );
    gapItems.push({
      skill: reqSkill,
      category: 'core',
      status,
      evidence,
      importance: 'high',
    });
  });

  // 2. Evaluate Tools & Frameworks (Medium Importance)
  requirements.toolsAndFrameworks.forEach((tool) => {
    // Avoid duplicate check if already in core skills
    if (!gapItems.some((g) => isFuzzyMatch(g.skill, tool))) {
      const { status, evidence } = evaluateSingleSkill(
        tool,
        verifiedSkills,
        verifiedProjects,
        verifiedCerts
      );
      gapItems.push({
        skill: tool,
        category: 'tool',
        status,
        evidence,
        importance: 'medium',
      });
    }
  });

  // 3. Evaluate Nice-to-have Skills (Low Importance)
  requirements.niceToHaveSkills.forEach((skill) => {
    if (!gapItems.some((g) => isFuzzyMatch(g.skill, skill))) {
      const { status, evidence } = evaluateSingleSkill(
        skill,
        verifiedSkills,
        verifiedProjects,
        verifiedCerts
      );
      gapItems.push({
        skill,
        category: 'framework',
        status,
        evidence,
        importance: 'low',
      });
    }
  });

  // Calculate Match Score
  let totalWeight = 0;
  let earnedWeight = 0;
  let haveCount = 0;
  let partialCount = 0;
  let missingCount = 0;

  gapItems.forEach((item) => {
    const weight = item.importance === 'high' ? 3 : item.importance === 'medium' ? 2 : 1;
    totalWeight += weight;

    if (item.status === 'have') {
      earnedWeight += weight;
      haveCount++;
    } else if (item.status === 'partial') {
      earnedWeight += weight * 0.5;
      partialCount++;
    } else {
      missingCount++;
    }
  });

  const matchScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return {
    role: requirements.role,
    matchScore,
    totalRequired: gapItems.length,
    haveCount,
    partialCount,
    missingCount,
    items: gapItems,
  };
}

function evaluateSingleSkill(
  targetSkill: string,
  verifiedSkills: SkillItem[],
  verifiedProjects: ProjectItem[],
  verifiedCerts: CertificationItem[]
): { status: SkillGapStatus; evidence?: string } {
  // Check direct verified skills
  const skillMatch = verifiedSkills.find((s) => isFuzzyMatch(s.name, targetSkill));
  if (skillMatch) {
    if (skillMatch.proficiency === 'Advanced' || skillMatch.proficiency === 'Expert') {
      return {
        status: 'have',
        evidence: `Verified Skill: ${skillMatch.name} (${skillMatch.proficiency})`,
      };
    }
    return {
      status: 'partial',
      evidence: `Verified Skill: ${skillMatch.name} (${skillMatch.proficiency})`,
    };
  }

  // Check verified projects
  const projectMatch = verifiedProjects.find((p) => {
    const hasInStack = (p.techStack || []).some((tech) => isFuzzyMatch(tech, targetSkill));
    const hasInDesc =
      p.description && p.description.toLowerCase().includes(targetSkill.toLowerCase());
    return hasInStack || hasInDesc;
  });

  if (projectMatch) {
    return {
      status: 'have',
      evidence: `Verified Project: "${projectMatch.title}"`,
    };
  }

  // Check verified certifications
  const certMatch = verifiedCerts.find((c) =>
    c.name.toLowerCase().includes(targetSkill.toLowerCase())
  );
  if (certMatch) {
    return {
      status: 'have',
      evidence: `Verified Certification: "${certMatch.name}" (${certMatch.issuer})`,
    };
  }

  return {
    status: 'missing',
    evidence: undefined,
  };
}

function isFuzzyMatch(a: string, b: string): boolean {
  const normA = a.toLowerCase().trim().replace(/[\.\-_]/g, '');
  const normB = b.toLowerCase().trim().replace(/[\.\-_]/g, '');
  return normA.includes(normB) || normB.includes(normA);
}
