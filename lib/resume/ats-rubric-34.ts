/**
 * lib/resume/ats-rubric-34.ts
 *
 * PRISM 34-Checkpoint ATS Diagnostic Rubric.
 * Deterministic, transparent, and reproducible scoring.
 * 
 * Formula:
 *   Score = sum(checkpoint.weight * (status === 'pass' ? 1.0 : status === 'warn' ? 0.5 : 0.0))
 *   Total Max Points = 100.0
 *
 * Label: "ATS Match Estimate. Real ATS software differs and no score guarantees shortlisting."
 */

export type CheckpointCategory =
  | 'formatting'
  | 'contact'
  | 'keywords'
  | 'sections'
  | 'bullets'
  | 'readability';

export type CheckpointStatus = 'pass' | 'warn' | 'fail';

export type CheckpointActionType =
  | 'reformat'
  | 'add_contact'
  | 'add_keyword'
  | 'add_section'
  | 'improve_bullet'
  | 'fix_standard';

export interface CheckpointDefinition {
  id: string;
  category: CheckpointCategory;
  name: string;
  description: string;
  weight: number;
  checkType: 'deterministic' | 'llm_assisted';
  ruleDescription: string;
  fixSuggestion: string;
  actionType: CheckpointActionType;
}

export interface CheckpointEvaluationResult {
  checkpointId: string;
  category: CheckpointCategory;
  name: string;
  status: CheckpointStatus;
  pointsEarned: number;
  maxPoints: number;
  finding: string;
  fixSuggestion: string;
  actionType: CheckpointActionType;
}

export interface ATS34EvaluationReport {
  overallScore: number;
  categoryScores: Record<CheckpointCategory, { earned: number; max: number; percentage: number }>;
  checkpoints: CheckpointEvaluationResult[];
  passedCount: number;
  warnCount: number;
  failedCount: number;
  totalCheckpoints: 34;
  disclaimer: string;
}

export const ATS_34_CHECKPOINTS: CheckpointDefinition[] = [
  // ─── 1. Formatting & Parseability (6 checks, 14 pts) ──────────────────────────
  {
    id: 'FMT_PAGE_LENGTH',
    category: 'formatting',
    name: '1-Page Fresher Budget',
    description: 'Freshers and candidates with under 3 years experience must fit content onto a single page.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Word count should be between 300 and 750 words. Over 850 words risks spilling to page 2.',
    fixSuggestion: 'Trim verbose summaries and condense bullets so the document does not spill past page 1.',
    actionType: 'reformat',
  },
  {
    id: 'FMT_NO_TABLES',
    category: 'formatting',
    name: 'Tableless Layout',
    description: 'ATS parsers misread multi-cell tables and text boxes, often interweaving column text.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'No multi-column HTML/Word tables or floating graphical text boxes in content stream.',
    fixSuggestion: 'Replace tables with clean single-column block layout using standard tabs and margins.',
    actionType: 'reformat',
  },
  {
    id: 'FMT_STANDARD_FONTS',
    category: 'formatting',
    name: 'Standard ATS Typography',
    description: 'Ensure universally recognizable typography (Arial, Calibri, Helvetica, Times, Roboto).',
    weight: 2,
    checkType: 'deterministic',
    ruleDescription: 'Disallow decorative, handwriting, or custom web fonts that fail system glyph extraction.',
    fixSuggestion: 'Switch all font families to Arial, Calibri, or Roboto for guaranteed parser rendering.',
    actionType: 'reformat',
  },
  {
    id: 'FMT_FONT_SIZE',
    category: 'formatting',
    name: 'Proportional Font Sizing',
    description: 'Readable body sizing between 10pt and 12pt, with section headers 13pt to 16pt.',
    weight: 2,
    checkType: 'deterministic',
    ruleDescription: 'Body text below 9.5pt causes parser line-height collapse; headers above 18pt waste space.',
    fixSuggestion: 'Adjust base body typography to 10.5pt and section headings to 13pt.',
    actionType: 'reformat',
  },
  {
    id: 'FMT_MARGINS',
    category: 'formatting',
    name: 'Balanced Margins (0.5 to 1.0 inch)',
    description: 'Standard margins preserve printing boundary and parser bounding box detection.',
    weight: 2,
    checkType: 'deterministic',
    ruleDescription: 'Margins must be between 36pt (0.5 in) and 72pt (1.0 in).',
    fixSuggestion: 'Reset page margins to 0.75 inches (54pt) on top, bottom, left, and right.',
    actionType: 'reformat',
  },
  {
    id: 'FMT_NO_GRAPHICS',
    category: 'formatting',
    name: 'No Embedded Visual Glyphs',
    description: 'Icons, skill rating bars, and photo headshots corrupt raw text extraction.',
    weight: 2,
    checkType: 'deterministic',
    ruleDescription: 'No embedded icon graphics or progress bars within textual skill sections.',
    fixSuggestion: 'Remove percentage bars and rating stars. List proficiency using verified labels or projects.',
    actionType: 'reformat',
  },

  // ─── 2. Contact & Identity (4 checks, 12 pts) ───────────────────────────────
  {
    id: 'CNT_FULL_NAME',
    category: 'contact',
    name: 'Full Name Header',
    description: 'Clear candidate full name at top of document.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Full name must exist at the beginning and contain at least first and last name.',
    fixSuggestion: 'Place your full name prominently at the very top of your resume header in 16-18pt bold.',
    actionType: 'add_contact',
  },
  {
    id: 'CNT_PHONE_NUMBER',
    category: 'contact',
    name: 'Valid Phone Number',
    description: 'Standard 10-digit mobile number with or without international country code.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Matches standard telephone regex format (+91 or 10 consecutive digits).',
    fixSuggestion: 'Add your primary mobile number (e.g., +91 98765 43210) to the contact block.',
    actionType: 'add_contact',
  },
  {
    id: 'CNT_EMAIL_ADDRESS',
    category: 'contact',
    name: 'Professional Email Address',
    description: 'Professional or institutional email address.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Valid email regex. Flag informal or unprofessional handles.',
    fixSuggestion: 'Include your official college email (e.g. name@pesitm.edu.in) or professional gmail address.',
    actionType: 'add_contact',
  },
  {
    id: 'CNT_LINKEDIN_GITHUB',
    category: 'contact',
    name: 'LinkedIn / GitHub Links',
    description: 'Working profile link to GitHub repository or LinkedIn professional profile.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Contains valid URL or handle linking to linkedin.com/in or github.com.',
    fixSuggestion: 'Provide clean, unshortened links to your GitHub profile and LinkedIn profile.',
    actionType: 'add_contact',
  },

  // ─── 3. ATS Keywords & Alignment (8 checks, 25 pts) ─────────────────────────
  {
    id: 'KEY_TARGET_ROLE',
    category: 'keywords',
    name: 'Target Role Alignment',
    description: 'The exact job title or target engineering role appears in the summary or headline.',
    weight: 4,
    checkType: 'deterministic',
    ruleDescription: 'Target role title (e.g., "Full Stack Developer", "Software Engineer") present in first 150 words.',
    fixSuggestion: 'Explicitly state your target role in your professional summary header.',
    actionType: 'add_keyword',
  },
  {
    id: 'KEY_PRIMARY_LANG',
    category: 'keywords',
    name: 'Primary Programming Languages',
    description: 'Inclusion of core languages required by job description (Java, Python, C++, TypeScript).',
    weight: 4,
    checkType: 'deterministic',
    ruleDescription: 'At least 2 verified programming languages present in Skills or Experience.',
    fixSuggestion: 'List your proficient programming languages explicitly (e.g., Java, TypeScript, Python).',
    actionType: 'add_keyword',
  },
  {
    id: 'KEY_FRAMEWORKS',
    category: 'keywords',
    name: 'Modern Web / App Frameworks',
    description: 'Industry frameworks matching role (React, Next.js, Spring Boot, Node.js, Django).',
    weight: 4,
    checkType: 'deterministic',
    ruleDescription: 'Framework keywords extracted and mapped against target engineering domain.',
    fixSuggestion: 'Add relevant frameworks you built verified projects with (e.g., React.js, Express, Spring Boot).',
    actionType: 'add_keyword',
  },
  {
    id: 'KEY_DATABASES',
    category: 'keywords',
    name: 'Database & Storage Systems',
    description: 'Relational or NoSQL database management technologies (PostgreSQL, MySQL, MongoDB).',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Presence of at least one standard relational or NoSQL database keyword.',
    fixSuggestion: 'Cite database engines used in projects (e.g., PostgreSQL, Redis, MySQL).',
    actionType: 'add_keyword',
  },
  {
    id: 'KEY_CLOUD_DEVOPS',
    category: 'keywords',
    name: 'Cloud & Developer Tooling',
    description: 'Version control and deployment tooling (Git, Docker, AWS, Linux, CI/CD).',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Presence of modern developer workflows (Git/GitHub, Docker, cloud deployment).',
    fixSuggestion: 'Mention version control (Git) and deployment platforms (Docker, Vercel, AWS).',
    actionType: 'add_keyword',
  },
  {
    id: 'KEY_CORE_CS',
    category: 'keywords',
    name: 'Core CS Foundations',
    description: 'Placement-critical CS subjects (DSA, OOP, DBMS, OS, Computer Networks).',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'At least 2 CS fundamental competencies mentioned in skills or coursework.',
    fixSuggestion: 'List coursework competencies: Data Structures & Algorithms, OOP, Database Systems.',
    actionType: 'add_keyword',
  },
  {
    id: 'KEY_DENSITY',
    category: 'keywords',
    name: 'Healthy Keyword Density (1.5% - 4%)',
    description: 'Avoid keyword stuffing while maintaining strong match frequency.',
    weight: 2,
    checkType: 'deterministic',
    ruleDescription: 'Keyword occurrences divided by total words must be between 1.5% and 4.0%.',
    fixSuggestion: 'Distribute technical keywords naturally across project descriptions rather than a comma wall.',
    actionType: 'reformat',
  },
  {
    id: 'KEY_SOFT_SKILLS',
    category: 'keywords',
    name: 'Collaboration & Engineering Habits',
    description: 'Grounded soft skills (Agile, Team Collaboration, Code Review, Problem Solving).',
    weight: 2,
    checkType: 'deterministic',
    ruleDescription: 'Demonstrated collaboration habits in project or internship descriptions.',
    fixSuggestion: 'Incorporate collaborative delivery keywords (Agile sprints, code reviews, technical documentation).',
    actionType: 'add_keyword',
  },

  // ─── 4. Section Completeness (6 checks, 19 pts) ─────────────────────────────
  {
    id: 'SEC_SUMMARY',
    category: 'sections',
    name: 'Professional Summary',
    description: 'A focused 2-3 sentence overview highlighting degree, core stack, and focus area.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Header matching "Summary", "Professional Summary", or "Profile" present.',
    fixSuggestion: 'Add a concise 3-line Summary highlighting your technical core and placement objective.',
    actionType: 'add_section',
  },
  {
    id: 'SEC_EDUCATION',
    category: 'sections',
    name: 'Education Section with Degree & CGPA',
    description: 'Formal college degree, institution name, branch, graduation year, and CGPA.',
    weight: 4,
    checkType: 'deterministic',
    ruleDescription: 'Presence of degree title (B.E./B.Tech), institution, year, and GPA/CGPA format.',
    fixSuggestion: 'Format education clearly: B.E. in Computer Science, PESITM Shivamogga, 2026, CGPA: X.X/10.',
    actionType: 'add_section',
  },
  {
    id: 'SEC_EXPERIENCE',
    category: 'sections',
    name: 'Experience or Internships Section',
    description: 'Industrial internships, apprenticeships, or research assistantships.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Section heading for Experience / Internships with role, organization, and dates.',
    fixSuggestion: 'Include summer internships or formal project experience with organization name and duration.',
    actionType: 'add_section',
  },
  {
    id: 'SEC_PROJECTS',
    category: 'sections',
    name: 'Technical Projects Section (Min 2)',
    description: 'At least two engineering projects with dedicated stack mentions and bullet points.',
    weight: 4,
    checkType: 'deterministic',
    ruleDescription: 'Projects section present containing at least 2 distinct project items.',
    fixSuggestion: 'List at least 2 in-depth software engineering projects detailing your architecture and stack.',
    actionType: 'add_section',
  },
  {
    id: 'SEC_SKILLS',
    category: 'sections',
    name: 'Categorized Technical Skills',
    description: 'Skills partitioned into clear sub-buckets: Languages, Frameworks, Developer Tools, Databases.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Dedicated "Technical Skills" section with grouped categories.',
    fixSuggestion: 'Group skills by category: Languages, Web Technologies, Databases, Tools & Cloud.',
    actionType: 'add_section',
  },
  {
    id: 'SEC_CERTIFICATIONS',
    category: 'sections',
    name: 'Certifications & Achievements',
    description: 'Verified certifications, hackathon rankings, or competitive programming profiles.',
    weight: 2,
    checkType: 'deterministic',
    ruleDescription: 'Presence of Certifications, Achievements, or Honors section.',
    fixSuggestion: 'Add an Achievements/Certifications section with verifiable credentials or contest achievements.',
    actionType: 'add_section',
  },

  // ─── 5. Bullet Quality (XYZ Formula) (6 checks, 20 pts) ──────────────────────
  {
    id: 'BLT_ACTION_VERBS',
    category: 'bullets',
    name: 'Strong Past-Tense Action Verbs',
    description: 'Every project bullet begins with a commanding past-tense engineering verb.',
    weight: 4,
    checkType: 'deterministic',
    ruleDescription: 'Bullets start with verbs like "Engineered", "Implemented", "Architected", "Reduced", "Optimized".',
    fixSuggestion: 'Begin bullets with strong action verbs (e.g., "Engineered", "Automated", "Benchmarked").',
    actionType: 'improve_bullet',
  },
  {
    id: 'BLT_XYZ_METRICS',
    category: 'bullets',
    name: 'Quantified Metrics (XYZ Formula)',
    description: 'Google XYZ structure: Accomplished [X] as measured by [Y], by doing [Z].',
    weight: 5,
    checkType: 'deterministic',
    ruleDescription: 'At least 60% of project bullets contain quantified numbers, percentages, or scale metrics.',
    fixSuggestion: 'Quantify impact with real numbers: "Reduced latency by 35%", "Supporting 500+ active users".',
    actionType: 'improve_bullet',
  },
  {
    id: 'BLT_NO_FIRST_PERSON',
    category: 'bullets',
    name: 'No First-Person Pronouns',
    description: 'Eliminate subjective pronouns ("I", "my", "we", "our") in professional resume copy.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Zero instances of standalone "I", "me", "my", "we", "our" throughout bullets.',
    fixSuggestion: 'Remove first-person words ("I developed") in favor of direct active verbs ("Developed").',
    actionType: 'improve_bullet',
  },
  {
    id: 'BLT_CONCISE_LENGTH',
    category: 'bullets',
    name: 'Crisp Bullet Length (1-2 lines)',
    description: 'Bullets should not be short fragments (< 30 chars) or walls of paragraph text (> 240 chars).',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Average bullet character count between 70 and 220 characters.',
    fixSuggestion: 'Split long monolithic paragraphs into 2 crisp, impactful bullet points.',
    actionType: 'improve_bullet',
  },
  {
    id: 'BLT_TECH_STACK_CITED',
    category: 'bullets',
    name: 'Contextual Tech Stack Citation',
    description: 'Each project item specifies the core libraries, protocols, or tools used.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Project headlines or bullets cite specific technologies used (e.g., React, PostgreSQL, Docker).',
    fixSuggestion: 'Append a "Tech Stack: React, Node.js, PostgreSQL" sub-line beneath each project title.',
    actionType: 'improve_bullet',
  },
  {
    id: 'BLT_NO_PASSIVE_VOICE',
    category: 'bullets',
    name: 'Active Voice Construction',
    description: 'Avoid passive voice markers ("was responsible for", "helped in", "worked on").',
    weight: 2,
    checkType: 'deterministic',
    ruleDescription: 'Disallow weak phrases like "was responsible for", "worked on", "assisted with".',
    fixSuggestion: 'Replace "Was responsible for backend" with "Engineered REST APIs using Express and Node.js".',
    actionType: 'improve_bullet',
  },

  // ─── 6. Readability & Standards (4 checks, 10 pts) ──────────────────────────
  {
    id: 'STD_DATE_CONSISTENCY',
    category: 'readability',
    name: 'Uniform Date Formatting',
    description: 'Consistent date pattern across all entries (e.g., "Aug 2024 - Dec 2024").',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Dates adhere to a uniform format (MMM YYYY or MM/YYYY) without mixing styles.',
    fixSuggestion: 'Standardize all dates to "MMM YYYY - MMM YYYY" (e.g., "Jan 2024 - May 2024").',
    actionType: 'fix_standard',
  },
  {
    id: 'STD_REVERSE_CHRONO',
    category: 'readability',
    name: 'Reverse Chronological Ordering',
    description: 'Most recent experiences and educational milestones listed first.',
    weight: 3,
    checkType: 'deterministic',
    ruleDescription: 'Entries in Experience and Education ordered with latest end dates first.',
    fixSuggestion: 'Reorder entries so the most recent qualification or internship appears at the top.',
    actionType: 'fix_standard',
  },
  {
    id: 'STD_GRAMMAR_SPELL',
    category: 'readability',
    name: 'Zero Typographical & Spelling Errors',
    description: 'Clean spelling of technical nomenclature and industry terms.',
    weight: 2,
    checkType: 'deterministic',
    ruleDescription: 'Proper capitalization of technologies (e.g., "JavaScript" not "javascript", "GitHub" not "github").',
    fixSuggestion: 'Correct casing for developer tools: "JavaScript", "TypeScript", "PostgreSQL", "GitHub".',
    actionType: 'fix_standard',
  },
  {
    id: 'STD_HYPERLINKS',
    category: 'readability',
    name: 'Clean, Functional Hyperlinks',
    description: 'All URLs formatted cleanly without broken anchors or raw session tokens.',
    weight: 2,
    checkType: 'deterministic',
    ruleDescription: 'Links start with standard https:// and do not contain tracking query strings.',
    fixSuggestion: 'Clean URLs to root profile paths (e.g. https://github.com/username) without tracking parameters.',
    actionType: 'fix_standard',
  },
];

/**
 * Calculates deterministic score from 34 checkpoint results.
 */
export function calculateATS34Score(results: CheckpointEvaluationResult[]): ATS34EvaluationReport {
  let overallScore = 0;
  let passedCount = 0;
  let warnCount = 0;
  let failedCount = 0;

  const categoryScores: Record<CheckpointCategory, { earned: number; max: number; percentage: number }> = {
    formatting: { earned: 0, max: 0, percentage: 0 },
    contact: { earned: 0, max: 0, percentage: 0 },
    keywords: { earned: 0, max: 0, percentage: 0 },
    sections: { earned: 0, max: 0, percentage: 0 },
    bullets: { earned: 0, max: 0, percentage: 0 },
    readability: { earned: 0, max: 0, percentage: 0 },
  };

  for (const r of results) {
    categoryScores[r.category].max += r.maxPoints;
    categoryScores[r.category].earned += r.pointsEarned;
    overallScore += r.pointsEarned;

    if (r.status === 'pass') passedCount++;
    else if (r.status === 'warn') warnCount++;
    else failedCount++;
  }

  // Calculate percentages
  for (const cat of Object.keys(categoryScores) as CheckpointCategory[]) {
    const item = categoryScores[cat];
    item.percentage = item.max > 0 ? Math.round((item.earned / item.max) * 100) : 0;
  }

  return {
    overallScore: Math.min(100, Math.max(0, Math.round(overallScore))),
    categoryScores,
    checkpoints: results,
    passedCount,
    warnCount,
    failedCount,
    totalCheckpoints: 34,
    disclaimer: 'ATS Match Estimate based on published 34-checkpoint rubric. Real ATS software differs and no score guarantees shortlisting.',
  };
}

