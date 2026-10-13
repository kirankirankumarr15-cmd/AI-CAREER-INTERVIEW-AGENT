import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getOrResearchRole } from '@/lib/roadmap/researcher';
import { analyzeSkillGaps } from '@/lib/roadmap/skillGap';
import { generatePhasedRoadmap } from '@/lib/roadmap/generator';
import { saveNewStudentRoadmap, getActiveRoadmapForUser } from '@/lib/roadmap/db';
import { getDbClient } from '@/lib/auth/userService';
import { syncRoadmapTasksToVectorDB } from '@/lib/rag/sync';
import { SkillItem, ProjectItem, CertificationItem } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Default to student user ID if running in demo or session
    const userId = user?.id || 'd2760b39-2de1-4803-946b-f1f659063887';

    const body = await req.json();
    const role = (body?.role || '').trim();
    const targetCompany = body?.targetCompany?.trim() || null;
    const timelineWeeks = parseInt(body?.timelineWeeks, 10) || 12;
    const refreshResearch = Boolean(body?.refreshResearch);

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'A target role is required (e.g. "Full Stack Developer", "Data Analyst").' },
        { status: 400 }
      );
    }

    console.log(`[API /api/roadmap/generate] Starting generation for "${role}" (User: ${userId}, Timeline: ${timelineWeeks}w)`);

    // 1. Fetch student's verified profile data from Postgres
    let verifiedSkills: SkillItem[] = [];
    let verifiedProjects: ProjectItem[] = [];
    let verifiedCerts: CertificationItem[] = [];

    const db = getDbClient();
    try {
      await db.connect();
      const profRes = await db.query(
        'SELECT skills, projects, certifications, target_role FROM public.profiles WHERE id = $1',
        [userId]
      );

      if (profRes.rows.length > 0) {
        const row = profRes.rows[0];
        verifiedSkills = Array.isArray(row.skills) ? row.skills : [];
        verifiedProjects = Array.isArray(row.projects) ? row.projects : [];
        verifiedCerts = Array.isArray(row.certifications) ? row.certifications : [];
      }
      await db.end();
    } catch (dbErr) {
      console.warn('[API /api/roadmap/generate] DB profile fetch warning:', dbErr);
      try { await db.end(); } catch {}
    }

    // 2. Web Research (Checks 14-day cache first, runs live search if stale/refresh)
    const requirements = await getOrResearchRole(role, refreshResearch);

    // 3. Skill Gap Analysis (Compared strictly against verified profile items)
    const gapAnalysis = analyzeSkillGaps(requirements, {
      skills: verifiedSkills,
      projects: verifiedProjects,
      certifications: verifiedCerts,
    });

    // 4. Generate 6-Phase Milestone Curriculum
    const phases = await generatePhasedRoadmap({
      role,
      targetCompany,
      timelineWeeks,
      requirements,
      gapAnalysis,
      verifiedData: {
        skills: verifiedSkills,
        projects: verifiedProjects,
      },
    });

    // 5. Save Roadmap and Tasks Transactionally
    const roadmapId = await saveNewStudentRoadmap({
      userId,
      role,
      targetCompany,
      timelineWeeks,
      basedOnCacheId: requirements.cacheId || null,
      phases,
    });

    // 6. Sync active tasks to RAG Vector DB (asynchronous background index)
    syncRoadmapTasksToVectorDB(userId, role, phases).catch((ragErr) => {
      console.warn('[API /api/roadmap/generate] Vector embedding sync warning:', ragErr);
    });

    // 7. Retrieve the formatted active roadmap object
    const activeRoadmap = await getActiveRoadmapForUser(userId, roadmapId);

    return NextResponse.json({
      success: true,
      roadmapId,
      roadmap: {
        ...activeRoadmap,
        skillGap: gapAnalysis,
        sources: requirements.sources,
      },
      skillGap: gapAnalysis,
      sources: requirements.sources,
      cached: !refreshResearch,
      researchFetchedAt: requirements.fetchedAt,
    });
  } catch (error: unknown) {
    console.error('Error generating roadmap:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to generate personalized roadmap.';
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
