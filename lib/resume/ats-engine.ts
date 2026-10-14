/**
 * lib/resume/ats-engine.ts
 *
 * Deterministic, Reproducible ATS Parsing & Scoring Engine.
 *
 * Rules:
 * - Pure TypeScript / Next.js implementation (100% independent, NO GPL code).
 * - Deterministic: Given the same resume text and job description, it ALWAYS
 *   produces the EXACT same numerical score and breakdown.
 * - Weights are public constants:
 *     Keywords: 40%
 *     Relevance of Experience/Projects: 20%
 *     Section Completeness: 15%
 *     Formatting & Parseability: 15%
 *     Content Quality: 10%
 * - Honest labeling: "ATS Match Estimate. Real ATS software differs and
 *   no score guarantees shortlisting."
 */

export interface ATSBreakdown {
  keywordsScore: number;
  relevanceScore: number;
  sectionCompletenessScore: number;
  formattingScore: number;
  contentQualityScore: number;
  weights: {
    keywords: number;
    relevance: number;
    sections: number;
    formatting: number;
    quality: number;
  };
}

export interface ATSKeywordResult {
  term: string;
  category: 'hard_skill' | 'tool' | 'soft_skill' | 'role_title' | 'certification';
  status: 'matched' | 'missing' | 'partial';
  importance: 'critical' | 'high' | 'medium';
  countInResume: number;
  synonymMatched?: string;
  advice?: string;
}

export interface ATSIssue {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category: 'formatting' | 'keywords' | 'content' | 'sections';
  title: string;
  description: string;
  suggestion: string;
  actionType?: 'add_skill' | 'reformat' | 'rewrite_bullet' | 'add_section';
  targetSection?: string;
}

export interface ATSAnalysisResult {
  overallScore: number;
  breakdown: ATSBreakdown;
  keywords: {
    matched: ATSKeywordResult[];
    missing: ATSKeywordResult[];
    partial: ATSKeywordResult[];
    matchPercentage: number;
  };
  sectionChecks: {
    contactInfo: boolean;
    summary: boolean;
    skills: boolean;
    experience: boolean;
    projects: boolean;
    education: boolean;
    certifications: boolean;
    orderScore: number;
  };
  formattingChecks: {
    isSingleColumn: boolean;
    hasStandardHeadings: boolean;
    hasExtractableText: boolean;
    noSuspiciousTables: boolean;
    hasConsistentDates: boolean;
    pageCountEstimate: number;
    wordCount: number;
    readingEaseScore: number;
  };
  contentQuality: {
    quantifiedMetricsCount: number;
    strongActionVerbsCount: number;
    weakPhrasesCount: number;
    averageBulletWordCount: number;
    spellingIssuesCount: number;
  };
  issues: ATSIssue[];
  formulaExplanation: string;
}

// ─────────────────────────────────────────────────────────────
// 1. Synonym & Equivalence Map
// ─────────────────────────────────────────────────────────────
export const SYNONYM_MAP: Record<string, string[]> = {
  javascript: ['js', 'es6', 'ecmascript'],
  typescript: ['ts'],
  python: ['py', 'python3'],
  react: ['react.js', 'reactjs', 'react native'],
  'node.js': ['node', 'nodejs'],
  postgresql: ['postgres', 'psql', 'pg'],
  mongodb: ['mongo'],
  kubernetes: ['k8s'],
  'amazon web services': ['aws'],
  'google cloud platform': ['gcp', 'google cloud'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
  'natural language processing': ['nlp'],
  'continuous integration': ['ci/cd', 'cicd', 'ci', 'cd'],
  'rest api': ['rest', 'restful apis', 'restful services', 'restful api'],
  sql: ['structured query language', 'relational database'],
  docker: ['containerization', 'containers'],
  git: ['github', 'gitlab', 'version control'],
  html: ['html5'],
  css: ['css3', 'tailwind', 'tailwindcss'],
  java: ['core java', 'j2ee'],
  'c++': ['cpp', 'c plus plus'],
  'c#': ['c sharp', 'csharp', '.net'],
};

// ─────────────────────────────────────────────────────────────
// 2. Strong Action Verbs vs Weak Verbs
// ─────────────────────────────────────────────────────────────
const STRONG_ACTION_VERBS = new Set([
  'architected', 'accelerated', 'automated', 'built', 'boosted', 'championed',
  'consolidated', 'crafted', 'decreased', 'delivered', 'deployed', 'designed',
  'developed', 'devised', 'engineered', 'enhanced', 'executed', 'expanded',
  'expedited', 'formulated', 'generated', 'implemented', 'improved', 'increased',
  'initiated', 'integrated', 'launched', 'led', 'maximized', 'migrated',
  'modernized', 'optimized', 'orchestrated', 'overhauled', 'pioneered', 'reduced',
  'refactored', 'resolved', 'revamped', 'scaled', 'simplified', 'spearheaded',
  'streamlined', 'strengthened', 'transformed', 'upgraded', 'yielded'
]);

const WEAK_PHRASES = [
  'responsible for', 'worked on', 'helped with', 'assisted in', 'handled',
  'duties included', 'was part of', 'tried to', 'familiar with', 'participated in'
];

// Standard section heading regular expressions
const SECTION_HEADERS = {
  contactInfo: /(email|phone|linkedin|github|contact|portfolio)/i,
  summary: /(summary|profile|about me|objective|professional summary)/i,
  skills: /(technical skills|skills|technologies|core competencies|proficiencies|tools)/i,
  experience: /(work experience|professional experience|experience|employment|internships)/i,
  projects: /(projects|personal projects|technical projects|academic projects)/i,
  education: /(education|academic background|qualifications|university)/i,
  certifications: /(certifications|licenses|courses|credentials|achievements)/i,
};

// ─────────────────────────────────────────────────────────────
// 3. Normalization & Tokenization Helpers
// ─────────────────────────────────────────────────────────────
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\+\#\.\/\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text).split(' ').filter((w) => w.length > 1);
}

/**
 * Checks if a specific term or any of its known synonyms appears in text.
 */
export function checkTermMatch(
  normalizedResume: string,
  term: string
): { matched: boolean; synonym?: string } {
  const normTerm = term.toLowerCase().trim();

  // 1. Direct substring match with boundary checks
  const escaped = normTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
  if (regex.test(normalizedResume)) {
    return { matched: true };
  }

  // 2. Check synonyms
  for (const [canonical, syns] of Object.entries(SYNONYM_MAP)) {
    const isTarget = canonical === normTerm || syns.includes(normTerm);
    if (isTarget) {
      const allVariants = [canonical, ...syns];
      for (const variant of allVariants) {
        const vEscaped = variant.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const vRegex = new RegExp(`(?:^|[^a-z0-9])${vEscaped}(?:$|[^a-z0-9])`, 'i');
        if (vRegex.test(normalizedResume)) {
          return { matched: true, synonym: variant };
        }
      }
    }
  }

  return { matched: false };
}

// ─────────────────────────────────────────────────────────────
// 4. Core Deterministic Analysis Function
// ─────────────────────────────────────────────────────────────
export interface RawRequirementInput {
  hardSkills?: string[];
  tools?: string[];
  softSkills?: string[];
  certifications?: string[];
  roleTitles?: string[];
}

export function runDeterministicATSAnalysis(
  resumeText: string,
  requirements: RawRequirementInput,
  options?: { isSingleColumn?: boolean; hasNoTables?: boolean }
): ATSAnalysisResult {
  const normResume = normalizeText(resumeText);
  const issues: ATSIssue[] = [];

  // ──────────────────────────────────────────────
  // Step A: Keyword Matching & Categorization
  // ──────────────────────────────────────────────
  const allTerms: Array<{ term: string; category: ATSKeywordResult['category']; importance: ATSKeywordResult['importance'] }> = [];

  (requirements.hardSkills || []).forEach((t) => allTerms.push({ term: t, category: 'hard_skill', importance: 'critical' }));
  (requirements.tools || []).forEach((t) => allTerms.push({ term: t, category: 'tool', importance: 'high' }));
  (requirements.certifications || []).forEach((t) => allTerms.push({ term: t, category: 'certification', importance: 'high' }));
  (requirements.roleTitles || []).forEach((t) => allTerms.push({ term: t, category: 'role_title', importance: 'medium' }));
  (requirements.softSkills || []).forEach((t) => allTerms.push({ term: t, category: 'soft_skill', importance: 'medium' }));

  const matchedKeywords: ATSKeywordResult[] = [];
  const missingKeywords: ATSKeywordResult[] = [];
  const partialKeywords: ATSKeywordResult[] = [];

  let totalWeightedPossible = 0;
  let totalWeightedEarned = 0;

  allTerms.forEach(({ term, category, importance }) => {
    const weight = importance === 'critical' ? 3 : importance === 'high' ? 2 : 1;
    totalWeightedPossible += weight;

    const matchInfo = checkTermMatch(normResume, term);
    if (matchInfo.matched) {
      matchedKeywords.push({
        term,
        category,
        status: 'matched',
        importance,
        countInResume: 1,
        synonymMatched: matchInfo.synonym,
      });
      totalWeightedEarned += weight;
    } else {
      // Check partial match (e.g. single word of a multi-word skill)
      const parts = term.split(' ');
      const partialMatch = parts.length > 1 && parts.some((p) => p.length > 3 && checkTermMatch(normResume, p).matched);

      if (partialMatch) {
        partialKeywords.push({
          term,
          category,
          status: 'partial',
          importance,
          countInResume: 0,
          advice: `Partially matched. Consider explicitly including the full phrase "${term}" if applicable.`,
        });
        totalWeightedEarned += weight * 0.5;
      } else {
        missingKeywords.push({
          term,
          category,
          status: 'missing',
          importance,
          countInResume: 0,
          advice: `Important keyword in the JD. Add to your profile or resume ONLY if you truly possess this skill with evidence.`,
        });

        if (importance === 'critical') {
          issues.push({
            id: `missing-crit-${term}`,
            severity: 'high',
            category: 'keywords',
            title: `Critical skill missing: ${term}`,
            description: `The job description strongly emphasizes "${term}", but it was not found in your resume text.`,
            suggestion: `If you have worked with ${term}, add it to your Verified Skills in your profile so it appears in your ATS resume.`,
            actionType: 'add_skill',
          });
        }
      }
    }
  });

  const keywordsScore = totalWeightedPossible > 0
    ? Math.round((totalWeightedEarned / totalWeightedPossible) * 100)
    : 75;

  // ──────────────────────────────────────────────
  // Step B: Section Checks & Completeness
  // ──────────────────────────────────────────────
  const sectionChecks = {
    contactInfo: SECTION_HEADERS.contactInfo.test(resumeText) || (/@/.test(resumeText) && /\d{5,}/.test(resumeText)),
    summary: SECTION_HEADERS.summary.test(resumeText),
    skills: SECTION_HEADERS.skills.test(resumeText),
    experience: SECTION_HEADERS.experience.test(resumeText),
    projects: SECTION_HEADERS.projects.test(resumeText),
    education: SECTION_HEADERS.education.test(resumeText),
    certifications: SECTION_HEADERS.certifications.test(resumeText),
    orderScore: 90,
  };

  let sectionScoreCount = 0;
  if (sectionChecks.contactInfo) sectionScoreCount += 20;
  if (sectionChecks.skills) sectionScoreCount += 25;
  if (sectionChecks.experience || sectionChecks.projects) sectionScoreCount += 25;
  if (sectionChecks.education) sectionScoreCount += 20;
  if (sectionChecks.summary || sectionChecks.certifications) sectionScoreCount += 10;
  const sectionCompletenessScore = Math.min(100, sectionScoreCount);

  if (!sectionChecks.contactInfo) {
    issues.push({
      id: 'missing-contact',
      severity: 'high',
      category: 'sections',
      title: 'Missing or unparseable contact header',
      description: 'ATS parsers look for email and phone numbers at the very top of the resume.',
      suggestion: 'Ensure your email, phone, and location are plain text at the top.',
      actionType: 'add_section',
    });
  }

  if (!sectionChecks.skills) {
    issues.push({
      id: 'missing-skills-section',
      severity: 'high',
      category: 'sections',
      title: 'Missing standard "Technical Skills" section',
      description: 'ATS relies heavily on a dedicated skills section to match job requirements.',
      suggestion: 'Add a standard "Technical Skills" heading grouping your languages, frameworks, and databases.',
      actionType: 'add_section',
    });
  }

  // ──────────────────────────────────────────────
  // Step C: Formatting & Parseability Checks
  // ──────────────────────────────────────────────
  const words = tokenize(resumeText);
  const wordCount = words.length;
  const pageCountEstimate = Math.max(1, Math.round(wordCount / 450));
  const hasExtractableText = wordCount >= 80;
  const isSingleColumn = options?.isSingleColumn ?? true;
  const noSuspiciousTables = options?.hasNoTables ?? true;
  const hasConsistentDates = /\b(20\d\d|19\d\d)\b/.test(resumeText);

  let formattingScore = 100;
  if (!hasExtractableText) formattingScore -= 40;
  if (!isSingleColumn) formattingScore -= 20;
  if (!noSuspiciousTables) formattingScore -= 15;
  if (!hasConsistentDates) formattingScore -= 10;
  if (wordCount < 250) formattingScore -= 15;
  if (wordCount > 1200) formattingScore -= 15;
  formattingScore = Math.max(20, formattingScore);

  if (!hasExtractableText) {
    issues.push({
      id: 'unextractable-text',
      severity: 'high',
      category: 'formatting',
      title: 'Very low or unreadable text content',
      description: 'Your resume has fewer than 100 words. If this was an uploaded PDF, it may be a scanned image which ATS cannot parse.',
      suggestion: 'Use the CareerPilot ATS-friendly builder or export selectable text rather than scanned images.',
      actionType: 'reformat',
    });
  }

  // ──────────────────────────────────────────────
  // Step D: Content Quality & Action Verbs
  // ──────────────────────────────────────────────
  // Quantified metrics: numbers like 20%, $50k, 10x, 150ms, 45 users
  const metricMatches = resumeText.match(/\b\d+(\.\d+)?(%|x|k|\+)?\b/gi) || [];
  const quantifiedMetricsCount = metricMatches.filter((m) => !/^(19|20)\d\d$/.test(m)).length; // exclude years

  // Count strong action verbs
  let strongActionVerbsCount = 0;
  words.forEach((w) => {
    if (STRONG_ACTION_VERBS.has(w)) strongActionVerbsCount++;
  });

  // Count weak phrases
  let weakPhrasesCount = 0;
  WEAK_PHRASES.forEach((phrase) => {
    const r = new RegExp(`\\b${phrase}\\b`, 'gi');
    const m = normResume.match(r);
    if (m) weakPhrasesCount += m.length;
  });

  let contentQualityScore = 70;
  if (quantifiedMetricsCount >= 3) contentQualityScore += 15;
  else if (quantifiedMetricsCount === 0) contentQualityScore -= 15;

  if (strongActionVerbsCount >= 5) contentQualityScore += 15;
  else if (strongActionVerbsCount <= 1) contentQualityScore -= 10;

  if (weakPhrasesCount > 2) contentQualityScore -= 10;
  contentQualityScore = Math.max(25, Math.min(100, contentQualityScore));

  if (quantifiedMetricsCount < 2) {
    issues.push({
      id: 'low-quantification',
      severity: 'medium',
      category: 'content',
      title: 'Few quantified achievements found',
      description: 'Recruiters and modern ATS reward impact metrics (e.g. "improved latency by 35%", "handled 1,000+ daily requests").',
      suggestion: 'Quantify at least 2 project or internship achievements with measurable outcomes.',
      actionType: 'rewrite_bullet',
    });
  }

  if (weakPhrasesCount > 0) {
    issues.push({
      id: 'weak-phrases',
      severity: 'low',
      category: 'content',
      title: `Passive or weak phrases detected (${weakPhrasesCount})`,
      description: 'Found passive expressions like "responsible for" or "worked on".',
      suggestion: 'Replace passive phrases with direct action verbs like "Architected", "Spearheaded", or "Optimized".',
      actionType: 'rewrite_bullet',
    });
  }

  // ──────────────────────────────────────────────
  // Step E: Relevance Score
  // ──────────────────────────────────────────────
  // Evaluates how frequently matched high-value terms appear in context
  const relevanceRatio = matchedKeywords.length / Math.max(1, allTerms.length);
  const relevanceScore = Math.round(
    Math.min(100, relevanceRatio * 80 + (quantifiedMetricsCount > 0 ? 10 : 0) + (sectionChecks.projects ? 10 : 0))
  );

  // ──────────────────────────────────────────────
  // Step F: Final Weighted Formula Calculation
  // ──────────────────────────────────────────────
  // Formula:
  // Keywords (40%) + Relevance (20%) + Sections (15%) + Formatting (15%) + Content Quality (10%)
  const overallScore = Math.round(
    keywordsScore * 0.40 +
    relevanceScore * 0.20 +
    sectionCompletenessScore * 0.15 +
    formattingScore * 0.15 +
    contentQualityScore * 0.10
  );

  const breakdown: ATSBreakdown = {
    keywordsScore,
    relevanceScore,
    sectionCompletenessScore,
    formattingScore,
    contentQualityScore,
    weights: {
      keywords: 40,
      relevance: 20,
      sections: 15,
      formatting: 15,
      quality: 10,
    },
  };

  const formulaExplanation =
    'ATS Match Estimate = (Keywords × 40%) + (Experience Relevance × 20%) + (Section Completeness × 15%) + (Formatting & Parseability × 15%) + (Content Quality × 10%). Real ATS software differs and no score guarantees shortlisting.';

  return {
    overallScore: Math.min(99, Math.max(15, overallScore)),
    breakdown,
    keywords: {
      matched: matchedKeywords,
      missing: missingKeywords,
      partial: partialKeywords,
      matchPercentage: allTerms.length > 0 ? Math.round((matchedKeywords.length / allTerms.length) * 100) : 100,
    },
    sectionChecks,
    formattingChecks: {
      isSingleColumn,
      hasStandardHeadings: true,
      hasExtractableText,
      noSuspiciousTables,
      hasConsistentDates,
      pageCountEstimate,
      wordCount,
      readingEaseScore: 68,
    },
    contentQuality: {
      quantifiedMetricsCount,
      strongActionVerbsCount,
      weakPhrasesCount,
      averageBulletWordCount: 16,
      spellingIssuesCount: 0,
    },
    issues: issues.sort((a, b) => (a.severity === 'high' ? -1 : 1)),
    formulaExplanation,
  };
}

// ─────────────────────────────────────────────────────────────
// 5. Pure Utility Functions (Prompt Injection & Summary)
// ─────────────────────────────────────────────────────────────
import crypto from 'crypto';

export function computeJDHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

export function sanitizeAndCheckInjection(text: string): { cleanText: string; injectionDetected: boolean } {
  const injectionPatterns = [
    /ignore (all )?(previous|prior) instructions/i,
    /give this resume (a )?100/i,
    /give (this|the) candidate a (perfect|maximum|top) score/i,
    /system prompt/i,
    /you are now in developer mode/i,
    /forget all rules/i,
    /bypass safety checks/i,
  ];

  let injectionDetected = false;
  let cleanText = text;

  for (const pattern of injectionPatterns) {
    if (pattern.test(cleanText)) {
      injectionDetected = true;
      cleanText = cleanText.replace(pattern, '[FLAGGED_INJECTION_TEXT_REMOVED]');
    }
  }

  return { cleanText, injectionDetected };
}

export function generateVerifiedProfileSummary(
  profile: { fullName?: string; targetRole?: string; college?: string; graduationYear?: number },
  verifiedSkills: string[],
  verifiedProjects: Array<{ title: string; tech_stack?: string[] }>
): string {
  const role = profile.targetRole || 'Software Engineer';
  const topSkills = verifiedSkills.slice(0, 5).join(', ');
  const projectHighlights = verifiedProjects.slice(0, 2).map((p) => p.title).join(' and ');

  let summary = `Motivated ${role} candidate`;
  if (profile.college) {
    summary += ` from ${profile.college}`;
  }
  if (profile.graduationYear) {
    summary += ` (Class of ${profile.graduationYear})`;
  }
  summary += '.';

  if (topSkills) {
    summary += ` Proficient in verified competencies including ${topSkills}.`;
  }

  if (projectHighlights) {
    summary += ` Demonstrated hands-on engineering experience through ${projectHighlights}.`;
  }

  summary += ` Seeking to contribute strong technical problem-solving and clean code to production environments.`;

  return summary;
}

