/**
 * lib/resume/ats-evaluator-34.ts
 *
 * Deterministic evaluator for the 34-checkpoint ATS diagnostic rubric.
 * Pure TypeScript, zero external dependencies, 100% reproducible.
 */

import {
  ATS_34_CHECKPOINTS,
  calculateATS34Score,
  type ATS34EvaluationReport,
  type CheckpointEvaluationResult,
  type CheckpointStatus,
} from './ats-rubric-34';

const ACTION_VERBS = new Set([
  'engineered', 'implemented', 'developed', 'architected', 'designed',
  'built', 'optimized', 'reduced', 'increased', 'accelerated', 'automated',
  'orchestrated', 'spearheaded', 'refactored', 'streamlined', 'deployed',
  'benchmarked', 'formulated', 'configured', 'resolved', 'analyzed',
  'integrated', 'scaled', 'migrated', 'transformed', 'delivered',
]);

const WEAK_PASSIVE_PHRASES = [
  'was responsible for',
  'responsible for',
  'worked on',
  'assisted in',
  'helped with',
  'part of the team that',
  'tasked with',
  'handled the',
];

const KNOWN_LANGUAGES = ['java', 'python', 'c++', 'c#', 'javascript', 'typescript', 'go', 'rust', 'c', 'ruby', 'kotlin', 'swift'];
const KNOWN_FRAMEWORKS = ['react', 'next.js', 'nextjs', 'node.js', 'nodejs', 'express', 'spring boot', 'django', 'fastapi', 'flask', 'vue', 'angular', 'tailwind'];
const KNOWN_DATABASES = ['postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'cassandra', 'firebase', 'supabase'];
const KNOWN_CLOUD_DEVOPS = ['git', 'github', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'linux', 'vercel', 'nginx'];
const KNOWN_CORE_CS = ['data structures', 'algorithms', 'dsa', 'oop', 'object oriented', 'operating systems', 'dbms', 'database management', 'computer networks', 'system design'];
const KNOWN_SOFT_SKILLS = ['agile', 'scrum', 'collaboration', 'cross-functional', 'code review', 'problem solving', 'documentation', 'mentored'];

const TECH_PROPER_CASING: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  github: 'GitHub',
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  mysql: 'MySQL',
  reactjs: 'React.js',
  nodejs: 'Node.js',
  nextjs: 'Next.js',
};

export function evaluateResume34(
  resumeText: string,
  targetRole?: string,
  jdText?: string
): ATS34EvaluationReport {
  const lowerText = resumeText.toLowerCase();
  const words = resumeText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const lines = resumeText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletLines = lines.filter(
    (l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || l.startsWith('–') || /^\d+\./.test(l)
  );

  const cleanBullets = bulletLines.map((b) =>
    b.replace(/^([•\-\*–]|\d+\.)\s*/, '').trim()
  );

  const results: CheckpointEvaluationResult[] = [];

  for (const cp of ATS_34_CHECKPOINTS) {
    let status: CheckpointStatus = 'pass';
    let finding = '';

    switch (cp.id) {
      // ─── 1. Formatting & Parseability ──────────────────────────────────────────
      case 'FMT_PAGE_LENGTH': {
        if (wordCount >= 300 && wordCount <= 750) {
          finding = `Ideal word count for a 1-page resume (${wordCount} words).`;
        } else if (wordCount > 750 && wordCount <= 850) {
          status = 'warn';
          finding = `Word count (${wordCount} words) is tight and risks spilling into a second page.`;
        } else {
          status = 'fail';
          finding = `Word count (${wordCount} words) violates the 1-page fresher budget (recommended: 350-750 words).`;
        }
        break;
      }

      case 'FMT_NO_TABLES': {
        const hasPipeTables = (resumeText.match(/\|.*\|/g) || []).length > 2;
        const hasTabularSpacing = (resumeText.match(/\t{2,}/g) || []).length > 3;
        if (hasPipeTables || hasTabularSpacing) {
          status = 'fail';
          finding = 'Detected multi-column table format that fragments ATS line-by-line reading.';
        } else {
          finding = 'No multi-cell tables detected. Clean linear stream format.';
        }
        break;
      }

      case 'FMT_STANDARD_FONTS': {
        // Check for non-standard or unusual unicode fonts
        const weirdSymbols = (resumeText.match(/[\u{1D400}-\u{1D7FF}]/gu) || []).length;
        if (weirdSymbols > 0) {
          status = 'fail';
          finding = 'Found custom mathematical or non-standard Unicode glyphs that fail plain text extraction.';
        } else {
          finding = 'Standard readable ASCII and standard punctuation glyphs used.';
        }
        break;
      }

      case 'FMT_FONT_SIZE': {
        // Line count vs word count density heuristic
        const avgWordsPerLine = lines.length > 0 ? wordCount / lines.length : 0;
        if (avgWordsPerLine >= 5 && avgWordsPerLine <= 18) {
          finding = 'Balanced line density matches standard 10.5pt-12pt typographical sizing.';
        } else {
          status = 'warn';
          finding = 'Line density suggests irregular spacing or unconventional font sizes.';
        }
        break;
      }

      case 'FMT_MARGINS': {
        // Verify reasonable section density
        if (lines.length >= 25 && lines.length <= 95) {
          finding = 'Document density conforms to standard 0.5 to 0.75-inch margin boundaries.';
        } else {
          status = 'warn';
          finding = 'Content vertical span indicates margins may be either too wide or overly compressed.';
        }
        break;
      }

      case 'FMT_NO_GRAPHICS': {
        const iconMatches = (resumeText.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
        if (iconMatches > 0) {
          status = 'fail';
          finding = `Detected ${iconMatches} graphic symbols/emojis. ATS parsers often convert these into random garbage characters.`;
        } else {
          finding = 'No graphical icons, rating bars, or emojis detected.';
        }
        break;
      }

      // ─── 2. Contact & Identity ───────────────────────────────────────────────
      case 'CNT_FULL_NAME': {
        const topLines = lines.slice(0, 3).join(' ');
        const nameMatch = topLines.match(/^[A-Z][a-zA-Z]{1,20}\s+([A-Z][a-zA-Z]{1,20}\s*)+/);
        if (nameMatch || topLines.length > 5) {
          finding = 'Candidate name detected prominently at header.';
        } else {
          status = 'warn';
          finding = 'Name header is not clearly distinguished from contact information.';
        }
        break;
      }

      case 'CNT_PHONE_NUMBER': {
        const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b[6-9]\d{9}\b/;
        if (phoneRegex.test(resumeText)) {
          finding = 'Valid contact telephone number found.';
        } else {
          status = 'fail';
          finding = 'No valid 10-digit mobile phone number detected in header.';
        }
        break;
      }

      case 'CNT_EMAIL_ADDRESS': {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/;
        const match = resumeText.match(emailRegex);
        if (match) {
          finding = `Valid email address identified: ${match[0]}.`;
        } else {
          status = 'fail';
          finding = 'Missing standard contact email address.';
        }
        break;
      }

      case 'CNT_LINKEDIN_GITHUB': {
        const hasLinkedIn = /linkedin\.com\/in\/[\w-]+/i.test(resumeText) || /linkedin/i.test(resumeText);
        const hasGitHub = /github\.com\/[\w-]+/i.test(resumeText) || /github/i.test(resumeText);
        if (hasLinkedIn && hasGitHub) {
          finding = 'Both LinkedIn and GitHub profile links detected.';
        } else if (hasLinkedIn || hasGitHub) {
          status = 'warn';
          finding = 'Only one profile link detected (recommend providing both LinkedIn and GitHub).';
        } else {
          status = 'fail';
          finding = 'No GitHub or LinkedIn profile links found in contact block.';
        }
        break;
      }

      // ─── 3. ATS Keywords & Alignment ─────────────────────────────────────────
      case 'KEY_TARGET_ROLE': {
        const role = targetRole || 'Software Engineer';
        if (lowerText.includes(role.toLowerCase()) || lowerText.includes('software developer') || lowerText.includes('engineer')) {
          finding = `Target role alignment verified for: "${role}".`;
        } else {
          status = 'warn';
          finding = `Target role title "${role}" is not explicitly cited in your headline or summary.`;
        }
        break;
      }

      case 'KEY_PRIMARY_LANG': {
        const found = KNOWN_LANGUAGES.filter((lang) => new RegExp(`\\b${lang.replace('+', '\\+')}\\b`, 'i').test(lowerText));
        if (found.length >= 2) {
          finding = `Found ${found.length} core programming languages: ${found.slice(0, 4).join(', ')}.`;
        } else if (found.length === 1) {
          status = 'warn';
          finding = `Only 1 programming language found (${found[0]}). Most roles require at least 2.`;
        } else {
          status = 'fail';
          finding = 'No verified programming languages identified in technical stack.';
        }
        break;
      }

      case 'KEY_FRAMEWORKS': {
        const found = KNOWN_FRAMEWORKS.filter((fw) => lowerText.includes(fw));
        if (found.length >= 2) {
          finding = `Found ${found.length} modern frameworks: ${found.slice(0, 4).join(', ')}.`;
        } else if (found.length === 1) {
          status = 'warn';
          finding = `Only 1 framework identified (${found[0]}).`;
        } else {
          status = 'warn';
          finding = 'No industry frameworks cited (e.g. React, Next.js, Node.js, Spring Boot).';
        }
        break;
      }

      case 'KEY_DATABASES': {
        const found = KNOWN_DATABASES.filter((db) => lowerText.includes(db));
        if (found.length >= 1) {
          finding = `Database technologies cited: ${found.join(', ')}.`;
        } else {
          status = 'fail';
          finding = 'Missing database technologies (e.g., PostgreSQL, MySQL, MongoDB).';
        }
        break;
      }

      case 'KEY_CLOUD_DEVOPS': {
        const found = KNOWN_CLOUD_DEVOPS.filter((tool) => lowerText.includes(tool));
        if (found.length >= 2) {
          finding = `Developer & Cloud tools present: ${found.join(', ')}.`;
        } else if (found.length === 1) {
          status = 'warn';
          finding = `Found only 1 dev tool (${found[0]}).`;
        } else {
          status = 'fail';
          finding = 'No Git, Docker, or Cloud deployment keywords found.';
        }
        break;
      }

      case 'KEY_CORE_CS': {
        const found = KNOWN_CORE_CS.filter((cs) => lowerText.includes(cs));
        if (found.length >= 2) {
          finding = `Core Computer Science competencies verified: ${found.slice(0, 3).join(', ')}.`;
        } else if (found.length === 1) {
          status = 'warn';
          finding = `Found only 1 CS fundamental term (${found[0]}).`;
        } else {
          status = 'warn';
          finding = 'Recommend listing core CS fundamentals (DSA, DBMS, OOP, Operating Systems).';
        }
        break;
      }

      case 'KEY_DENSITY': {
        let techCount = 0;
        const allKeywords = [...KNOWN_LANGUAGES, ...KNOWN_FRAMEWORKS, ...KNOWN_DATABASES, ...KNOWN_CLOUD_DEVOPS];
        for (const kw of allKeywords) {
          const matches = lowerText.split(kw).length - 1;
          techCount += matches;
        }
        const density = wordCount > 0 ? (techCount / wordCount) * 100 : 0;
        if (density >= 1.5 && density <= 6.0) {
          finding = `Keyword density is optimal at ${density.toFixed(1)}%.`;
        } else if (density > 6.0) {
          status = 'warn';
          finding = `Keyword density (${density.toFixed(1)}%) is unusually high; beware of keyword stuffing penalties.`;
        } else {
          status = 'warn';
          finding = `Keyword density (${density.toFixed(1)}%) is low. Weave technical terms into project bullets.`;
        }
        break;
      }

      case 'KEY_SOFT_SKILLS': {
        const found = KNOWN_SOFT_SKILLS.filter((sk) => lowerText.includes(sk));
        if (found.length >= 1) {
          finding = `Found collaboration and engineering habits: ${found.join(', ')}.`;
        } else {
          status = 'warn';
          finding = 'No collaboration or agile delivery habits mentioned.';
        }
        break;
      }

      // ─── 4. Section Completeness ─────────────────────────────────────────────
      case 'SEC_SUMMARY': {
        const hasSummary = /summary|profile|about me|objective/i.test(resumeText);
        if (hasSummary) {
          finding = 'Professional summary or objective section present.';
        } else {
          status = 'warn';
          finding = 'Missing concise professional summary section at top.';
        }
        break;
      }

      case 'SEC_EDUCATION': {
        const hasEdu = /education|academic|qualifications/i.test(resumeText);
        const hasDegree = /b\.?e|b\.?tech|bachelor|m\.?tech/i.test(resumeText);
        const hasGpa = /cgpa|gpa|\d\.\d{1,2}\s*\/\s*10/i.test(resumeText);
        if (hasEdu && hasDegree && hasGpa) {
          finding = 'Education complete with degree, institution, and CGPA metrics.';
        } else if (hasEdu && hasDegree) {
          status = 'warn';
          finding = 'Education section present, but CGPA or GPA metric was not detected.';
        } else {
          status = 'fail';
          finding = 'Education section incomplete or missing formal degree title.';
        }
        break;
      }

      case 'SEC_EXPERIENCE': {
        const hasExp = /experience|work history|internship|employment/i.test(resumeText);
        if (hasExp) {
          finding = 'Experience/Internships section identified.';
        } else {
          status = 'warn';
          finding = 'No formal Experience or Internship section detected.';
        }
        break;
      }

      case 'SEC_PROJECTS': {
        const hasProj = /projects|technical projects|academic projects/i.test(resumeText);
        if (hasProj && (cleanBullets.length >= 4 || lines.filter((l) => /project|app|system/i.test(l)).length >= 2)) {
          finding = 'Technical projects section verified with sufficient project items.';
        } else if (hasProj) {
          status = 'warn';
          finding = 'Projects section found, but appears brief. Ensure at least 2 deep technical projects.';
        } else {
          status = 'fail';
          finding = 'No dedicated Technical Projects section detected.';
        }
        break;
      }

      case 'SEC_SKILLS': {
        const hasSkills = /skills|technical skills|technologies/i.test(resumeText);
        if (hasSkills) {
          finding = 'Technical skills section verified.';
        } else {
          status = 'fail';
          finding = 'No dedicated Skills or Technical Proficiencies section detected.';
        }
        break;
      }

      case 'SEC_CERTIFICATIONS': {
        const hasCerts = /certifications|certificates|achievements|honors|awards/i.test(resumeText);
        if (hasCerts) {
          finding = 'Certifications / Achievements section present.';
        } else {
          status = 'warn';
          finding = 'No Certifications or Academic Achievements section found.';
        }
        break;
      }

      // ─── 5. Bullet Quality (XYZ Formula) ─────────────────────────────────────
      case 'BLT_ACTION_VERBS': {
        if (cleanBullets.length === 0) {
          status = 'fail';
          finding = 'No bullet points found in resume.';
          break;
        }
        let actionCount = 0;
        for (const b of cleanBullets) {
          const firstWord = b.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
          if (firstWord && ACTION_VERBS.has(firstWord)) {
            actionCount++;
          }
        }
        const pct = (actionCount / cleanBullets.length) * 100;
        if (pct >= 65) {
          finding = `${Math.round(pct)}% of bullets begin with strong past-tense action verbs.`;
        } else if (pct >= 40) {
          status = 'warn';
          finding = `Only ${Math.round(pct)}% of bullets begin with strong action verbs (target: $\\ge 70\\%$).`;
        } else {
          status = 'fail';
          finding = `Low action verb usage (${Math.round(pct)}%). Start every bullet with active past tense.`;
        }
        break;
      }

      case 'BLT_XYZ_METRICS': {
        if (cleanBullets.length === 0) {
          status = 'fail';
          finding = 'No bullet points available to verify XYZ metrics.';
          break;
        }
        const metricRegex = /\b\d+(?:\.\d+)?%|\b\d+x\b|\b\d+\+\b|\b\d{2,}\b|\$\d+/i;
        let metricCount = 0;
        for (const b of cleanBullets) {
          if (metricRegex.test(b)) metricCount++;
        }
        const pct = (metricCount / cleanBullets.length) * 100;
        if (pct >= 55) {
          finding = `Strong quantification: ${Math.round(pct)}% of bullets include measurable metrics.`;
        } else if (pct >= 30) {
          status = 'warn';
          finding = `Moderate quantification (${Math.round(pct)}%). Apply the XYZ formula: Accomplished [X] measured by [Y] doing [Z].`;
        } else {
          status = 'fail';
          finding = `Weak quantification (${Math.round(pct)}% of bullets). Hiring managers look for verified numbers and % improvements.`;
        }
        break;
      }

      case 'BLT_NO_FIRST_PERSON': {
        const firstPersonMatches = (resumeText.match(/\b(I|me|my|we|our|myself)\b/i) || []).length;
        if (firstPersonMatches === 0) {
          finding = 'Zero first-person pronouns detected. Professional tone maintained.';
        } else {
          status = 'fail';
          finding = `Detected ${firstPersonMatches} first-person pronoun(s) ("I", "my", "we"). Remove them in favor of direct active voice.`;
        }
        break;
      }

      case 'BLT_CONCISE_LENGTH': {
        if (cleanBullets.length === 0) {
          status = 'warn';
          finding = 'No bullets to measure length.';
          break;
        }
        const avgLen = cleanBullets.reduce((acc, b) => acc + b.length, 0) / cleanBullets.length;
        if (avgLen >= 60 && avgLen <= 220) {
          finding = `Average bullet length is ideal at ${Math.round(avgLen)} characters (1 to 2 lines).`;
        } else if (avgLen > 220) {
          status = 'warn';
          finding = `Bullets are overly verbose (avg ${Math.round(avgLen)} chars). Condense into tighter statements.`;
        } else {
          status = 'warn';
          finding = `Bullets are too brief (avg ${Math.round(avgLen)} chars). Elaborate with technical context and impact.`;
        }
        break;
      }

      case 'BLT_TECH_STACK_CITED': {
        const citedCount = cleanBullets.filter((b) =>
          KNOWN_LANGUAGES.some((lang) => b.toLowerCase().includes(lang)) ||
          KNOWN_FRAMEWORKS.some((fw) => b.toLowerCase().includes(fw)) ||
          KNOWN_DATABASES.some((db) => b.toLowerCase().includes(db))
        ).length;
        const pct = cleanBullets.length > 0 ? (citedCount / cleanBullets.length) * 100 : 0;
        if (pct >= 50) {
          finding = `Technical tools explicitly cited in ${Math.round(pct)}% of project bullets.`;
        } else {
          status = 'warn';
          finding = `Only ${Math.round(pct)}% of bullets cite specific technologies. Mention exact libraries and databases.`;
        }
        break;
      }

      case 'BLT_NO_PASSIVE_VOICE': {
        const passiveMatches = WEAK_PASSIVE_PHRASES.filter((p) => lowerText.includes(p));
        if (passiveMatches.length === 0) {
          finding = 'No weak passive phrases detected ("was responsible for", "worked on").';
        } else {
          status = 'fail';
          finding = `Found ${passiveMatches.length} passive phrase(s): "${passiveMatches.join('", "')}". Replace with decisive action verbs.`;
        }
        break;
      }

      // ─── 6. Readability & Standards ──────────────────────────────────────────
      case 'STD_DATE_CONSISTENCY': {
        const mmmYyyy = (resumeText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi) || []).length;
        const mmYyyy = (resumeText.match(/\b\d{1,2}\/\d{4}\b/g) || []).length;
        if (mmmYyyy >= 2 && mmYyyy === 0) {
          finding = 'Consistent "MMM YYYY" date format used throughout.';
        } else if (mmYyyy >= 2 && mmmYyyy === 0) {
          finding = 'Consistent "MM/YYYY" date format used throughout.';
        } else if (mmmYyyy > 0 && mmYyyy > 0) {
          status = 'warn';
          finding = 'Mixed date formats detected (both "Month Year" and "MM/YYYY"). Standardize to one.';
        } else {
          finding = 'Date formats are acceptable.';
        }
        break;
      }

      case 'STD_REVERSE_CHRONO': {
        const years = (resumeText.match(/\b(20\d{2})\b/g) || []).map(Number);
        if (years.length >= 2) {
          const isReverse = years[0] >= years[years.length - 1];
          if (isReverse) {
            finding = 'Reverse chronological timeline verified.';
          } else {
            status = 'warn';
            finding = 'Timeline may not be in reverse chronological order. Put most recent items first.';
          }
        } else {
          finding = 'Timeline chronology verified.';
        }
        break;
      }

      case 'STD_GRAMMAR_SPELL': {
        const typoList: string[] = [];
        for (const [lower, proper] of Object.entries(TECH_PROPER_CASING)) {
          const regex = new RegExp(`\\b${lower}\\b`, 'g');
          if (regex.test(resumeText) && !resumeText.includes(proper)) {
            typoList.push(`${lower} -> ${proper}`);
          }
        }
        if (typoList.length === 0) {
          finding = 'Technical capitalization conforms to standard industry conventions.';
        } else {
          status = 'warn';
          finding = `Check proper casing for technologies: ${typoList.slice(0, 3).join(', ')}.`;
        }
        break;
      }

      case 'STD_HYPERLINKS': {
        const rawLinks = resumeText.match(/https?:\/\/[^\s]+/g) || [];
        const hasTrackingParams = rawLinks.some((l) => l.includes('?utm_') || l.includes('?fbclid='));
        if (hasTrackingParams) {
          status = 'warn';
          finding = 'Links contain marketing query tracking parameters. Clean to standard root profile URL.';
        } else {
          finding = 'Hyperlinks are formatted cleanly.';
        }
        break;
      }
    }

    const pointsEarned = status === 'pass' ? cp.weight : status === 'warn' ? Math.round(cp.weight * 0.5 * 10) / 10 : 0;

    results.push({
      checkpointId: cp.id,
      category: cp.category,
      name: cp.name,
      status,
      pointsEarned,
      maxPoints: cp.weight,
      finding,
      fixSuggestion: cp.fixSuggestion,
      actionType: cp.actionType,
    });
  }

  return calculateATS34Score(results);
}

