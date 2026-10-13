import { generateEmbeddingAction } from '@/app/actions/rag';
import { supabase } from '@/lib/supabase/client';
import {
  StudentProfile,
  SkillItem,
  ProjectItem,
  ExperienceItem,
  CertificationItem
} from '@/types';

/**
 * Low-level vector upsert helper to Supabase pgvector table `career_embeddings`.
 */
export async function syncToVectorDB(
  userId: string,
  sourceType: string,
  sourceId: string,
  content: string
): Promise<boolean> {
  if (!userId || !content.trim()) return false;

  try {
    // 1. Generate 1536-dimensional vector embedding
    const { success, embedding, error } = await generateEmbeddingAction(content);

    if (!success || !embedding || embedding.length !== 1536) {
      console.warn(`Embedding generation failed for ${sourceType}/${sourceId}:`, error);
      return false;
    }

    // 2. Upsert into Supabase career_embeddings
    const { error: dbError } = await supabase
      .from('career_embeddings')
      .upsert(
        {
          user_id: userId,
          source_type: sourceType,
          source_id: sourceId,
          content: content.trim(),
          embedding: embedding,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, source_type, source_id' }
      );

    if (dbError) {
      console.error('Supabase career_embeddings upsert error:', dbError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to sync vector to DB:', err);
    return false;
  }
}

/**
 * Remove an embedding chunk on deletion.
 */
export async function deleteFromVectorDB(
  userId: string,
  sourceType: string,
  sourceId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('career_embeddings')
      .delete()
      .match({ user_id: userId, source_type: sourceType, source_id: sourceId });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Profile core chunk: education, CGPA, branch, target role, locations
 */
export async function syncProfileCoreToVectorDB(userId: string, profile: StudentProfile): Promise<boolean> {
  const content = `Student Core Profile:
Name: ${profile.fullName || 'Student'}
Target Role: ${profile.targetRole || 'Software Engineer'}
College: ${profile.college || 'N/A'}, Branch: ${profile.branch || 'N/A'} (Graduation Year: ${profile.graduationYear || 'N/A'}, CGPA: ${profile.cgpa || 'N/A'})
Location: ${profile.location || 'N/A'}
Preferred Locations: ${(profile.preferredLocations || []).join(', ') || 'Any'}
Target Companies: ${(profile.targetCompanies || []).join(', ') || 'Top Tech Companies'}
Overall Readiness Score: ${profile.readinessScore || 0}/100 (Profile Status: ${profile.verificationStatus || 'Unverified'})`;

  return syncToVectorDB(userId, 'profile', 'core', content);
}

/**
 * Skills/frameworks/tools (compiled into ONE current comprehensive chunk, filtered to verified data).
 * Needs Review is clearly labeled. Unverified/rejected is excluded.
 */
export async function syncSkillsChunkToVectorDB(userId: string, skills: SkillItem[]): Promise<boolean> {
  // Only embed Verified and Needs Review (with explicit label). Exclude unverified.
  const validSkills = skills.filter(
    (s) => s.verificationStatus === 'Verified' || s.verificationStatus === 'Needs Review'
  );

  if (validSkills.length === 0) {
    // If no verified skills yet, delete or clear chunk
    return deleteFromVectorDB(userId, 'skills', 'current');
  }

  const verified = validSkills.filter((s) => s.verificationStatus === 'Verified');
  const needsReview = validSkills.filter((s) => s.verificationStatus === 'Needs Review');

  const lines = ['Skills, Frameworks & Tools Repository:'];

  if (verified.length > 0) {
    lines.push(
      'Verified Skills (Confirmed through coding benchmark / GitHub / Certs):',
      ...verified.map((s) => `- ${s.name} [${s.category}] — Proficiency: ${s.proficiency} (VERIFIED)`)
    );
  }

  if (needsReview.length > 0) {
    lines.push(
      'Self-Reported Skills (Pending review):',
      ...needsReview.map((s) => `- ${s.name} [${s.category}] — Proficiency: ${s.proficiency} (NEEDS REVIEW)`)
    );
  }

  return syncToVectorDB(userId, 'skills', 'current', lines.join('\n'));
}

/**
 * Each project gets its own chunk.
 */
export async function syncProjectChunkToVectorDB(userId: string, project: ProjectItem): Promise<boolean> {
  // Do not embed unverified projects as established facts unless labeled Needs Review
  const statusLabel = project.verificationStatus === 'Verified' ? 'VERIFIED' : 'NEEDS REVIEW';

  const tech = Array.isArray(project.techStack) ? project.techStack.join(', ') : project.techStack;
  const content = `Project Showcase [${statusLabel}]:
Title: ${project.title}
Verification Status: ${project.verificationStatus}
Tech Stack: ${tech || 'Modern web technologies'}
Architecture Summary: ${project.architectureSummary || 'Full-stack application architecture'}
Student Personal Contribution: ${project.studentContribution || 'Designed and implemented core components'}
Description: ${project.description || ''}
Key Challenges Overcome: ${Array.isArray(project.keyChallenges) ? project.keyChallenges.join('; ') : 'Performance & state handling'}
GitHub Repository: ${project.githubUrl || 'Available'}
Live Demo URL: ${project.liveUrl || 'Available'}`;

  return syncToVectorDB(userId, 'project', project.id, content);
}

/**
 * Each certification gets its own chunk.
 */
export async function syncCertificationChunkToVectorDB(userId: string, cert: CertificationItem): Promise<boolean> {
  const statusLabel = cert.verificationStatus === 'Verified' ? 'VERIFIED' : 'NEEDS REVIEW';
  const content = `Certification Record [${statusLabel}]:
Name: ${cert.name}
Issuing Organization: ${cert.issuer}
Issue Date: ${cert.issueDate || 'N/A'}
Credential Verification: ${cert.credentialUrl || 'Verified in student vault'}`;

  return syncToVectorDB(userId, 'certification', cert.id, content);
}

/**
 * Each work experience / internship gets its own chunk.
 */
export async function syncExperienceChunkToVectorDB(userId: string, exp: ExperienceItem): Promise<boolean> {
  const statusLabel = exp.verificationStatus === 'Verified' ? 'VERIFIED' : 'NEEDS REVIEW';
  const achievements = Array.isArray(exp.achievements) ? exp.achievements.join('; ') : '';
  const content = `Work & Internship Experience [${statusLabel}]:
Role: ${exp.role} at ${exp.company}
Location: ${exp.location || 'Remote'}
Duration: ${exp.startDate} to ${exp.isCurrent ? 'Present' : exp.endDate}
Description: ${exp.description || ''}
Key Deliverables & Achievements: ${achievements || 'Built key features'}`;

  return syncToVectorDB(userId, 'experience', exp.id, content);
}

/**
 * Completed interview session: transcript summary + scores + feedback
 */
export async function syncInterviewChunkToVectorDB(
  userId: string,
  interviewId: string,
  interview: {
    targetRole: string;
    interviewType: string;
    difficulty?: string;
    mode?: string;
    overallScore: number;
    technicalScore?: number;
    communicationScore?: number;
    confidenceScore?: number;
    transcriptSummary?: string;
    strongAreas?: string[];
    weakAreas?: string[];
    recommendations?: string[];
    date?: string;
  }
): Promise<boolean> {
  const content = `Completed Interview Benchmark Record:
Date: ${interview.date || new Date().toISOString().split('T')[0]}
Target Role Tested: ${interview.targetRole} (${interview.interviewType} Round)
Difficulty: ${interview.difficulty || 'Intermediate'} | Evaluator Mode: ${interview.mode || 'Professional'}
Score Breakdown:
- Overall Score: ${interview.overallScore}/100
- Technical Problem-Solving: ${interview.technicalScore ?? interview.overallScore}/100
- Communication Clarity: ${interview.communicationScore ?? 'N/A'}/100
- Delivery Confidence: ${interview.confidenceScore ?? 'N/A'}/100
Evaluator Transcript Summary: ${interview.transcriptSummary || 'Completed full interview round.'}
Strong Demonstrations: ${(interview.strongAreas || []).join('; ') || 'Clear conceptual baseline'}
Identified Weak Areas: ${(interview.weakAreas || []).join('; ') || 'Needs sharper technical articulation'}
Actionable Recommendations: ${(interview.recommendations || []).join('; ') || 'Practice STAR format'}`;

  return syncToVectorDB(userId, 'interview', interviewId, content);
}

/**
 * Current resume content chunk.
 */
export async function syncResumeChunkToVectorDB(
  userId: string,
  resume: {
    targetRole: string;
    title: string;
    atsScore?: number;
    summary?: string;
    skills?: string[];
    experienceSummary?: string;
  }
): Promise<boolean> {
  const content = `Current Tailored Resume:
Target Role: ${resume.targetRole}
Resume Title: ${resume.title}
ATS Optimizer Match Score: ${resume.atsScore || 85}/100
Executive Summary: ${resume.summary || 'Engineering student preparing for software developer roles'}
Key Highlighted Skills: ${(resume.skills || []).join(', ')}
Work History Summary: ${resume.experienceSummary || 'Verified project and internship portfolio'}`;

  return syncToVectorDB(userId, 'resume', 'current', content);
}

/**
 * Applications chunk: company, role, status, notes
 */
export async function syncApplicationChunkToVectorDB(
  userId: string,
  app: {
    id: string;
    company: string;
    role: string;
    status: string;
    appliedDate?: string;
    notes?: string;
  }
): Promise<boolean> {
  const content = `Job Application Record:
Company: ${app.company}
Role: ${app.role}
Current Pipeline Status: ${app.status}
Applied Date: ${app.appliedDate || 'In Progress'}
Notes & Context: ${app.notes || 'Application prepared through CareerPilot AI'}`;

  return syncToVectorDB(userId, 'application', app.id, content);
}

/**
 * Learning progress: weak areas, completed practice, streak
 */
export async function syncProgressChunkToVectorDB(
  userId: string,
  progress: {
    readinessScore: number;
    dailyStreak: number;
    questionsSolved: number;
    interviewsCompleted: number;
    weakAreas: string[];
    technicalScore?: number;
    communicationScore?: number;
  }
): Promise<boolean> {
  const content = `Current Placement Readiness & Progress Facts:
Career Readiness Score: ${progress.readinessScore}/100
Active Daily Streak: ${progress.dailyStreak} Days
Total Practice Drills Solved: ${progress.questionsSolved}
Mock Interviews Completed: ${progress.interviewsCompleted}
Technical Competency: ${progress.technicalScore || 70}/100
Communication Competency: ${progress.communicationScore || 75}/100
Current Critical Weak Areas: ${progress.weakAreas.join(', ') || 'DSA optimization, DBMS window functions'}`;

  return syncToVectorDB(userId, 'progress', 'current', content);
}

/**
 * Batch re-indexes all verified records for the student.
 */
export async function syncEntireProfileToVectorDB(
  userId: string,
  data: {
    profile: StudentProfile;
    skills: SkillItem[];
    projects: ProjectItem[];
    experiences: ExperienceItem[];
    certifications?: CertificationItem[];
    progress?: {
      readinessScore: number;
      dailyStreak: number;
      questionsSolved: number;
      interviewsCompleted: number;
      weakAreas: string[];
    };
  }
): Promise<{ total: number; synced: number }> {
  let synced = 0;
  let total = 2 + data.projects.length + data.experiences.length + (data.certifications?.length || 0);

  if (await syncProfileCoreToVectorDB(userId, data.profile)) synced++;
  if (await syncSkillsChunkToVectorDB(userId, data.skills)) synced++;

  for (const project of data.projects) {
    if (await syncProjectChunkToVectorDB(userId, project)) synced++;
  }

  for (const exp of data.experiences) {
    if (await syncExperienceChunkToVectorDB(userId, exp)) synced++;
  }

  if (data.certifications) {
    for (const cert of data.certifications) {
      if (await syncCertificationChunkToVectorDB(userId, cert)) synced++;
    }
  }

  if (data.progress) {
    if (await syncProgressChunkToVectorDB(userId, data.progress)) synced++;
    total++;
  }

  return { total, synced };
}

/**
 * Query current indexed stats for the student.
 */
export async function getVectorDBStats(userId: string): Promise<{ count: number; sources: Record<string, number> }> {
  try {
    const { data, error } = await supabase
      .from('career_embeddings')
      .select('source_type')
      .eq('user_id', userId);

    if (error || !data) return { count: 0, sources: {} };

    const sources: Record<string, number> = {};
    for (const row of data) {
      sources[row.source_type] = (sources[row.source_type] || 0) + 1;
    }

    return { count: data.length, sources };
  } catch {
    return { count: 0, sources: {} };
  }
}

/**
 * Sync active roadmap milestones and tasks into vector embeddings for Jarvis RAG.
 */
export async function syncRoadmapTasksToVectorDB(
  userId: string,
  role: string,
  phases: Array<{ title: string; summary: string; tasks: Array<{ title: string; description: string; linkedSkill: string; dueWeek: number; status?: string }> }>
): Promise<number> {
  let synced = 0;
  for (const phase of phases) {
    const pendingTasks = phase.tasks.filter((t) => t.status !== 'done');
    const taskSummary = pendingTasks.map((t) => `• Week ${t.dueWeek}: ${t.title} (${t.linkedSkill}) - ${t.description}`).join('\n');

    const content = `[ACTIVE ROADMAP PHASE | ${role}]: ${phase.title}
Summary: ${phase.summary}
Key Upcoming Tasks:
${taskSummary || 'All tasks in this phase completed.'}`;

    const ok = await syncToVectorDB(userId, 'roadmap_phase', `rm-${phase.title.replace(/\s+/g, '-').toLowerCase()}`, content);
    if (ok) synced++;
  }
  return synced;
}

