import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getActiveRoadmapForUser, getCachedRoleRequirements } from '@/lib/roadmap/db';
import { analyzeSkillGaps } from '@/lib/roadmap/skillGap';
import { getDbClient } from '@/lib/auth/userService';
import { SkillItem, ProjectItem, CertificationItem } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || 'd2760b39-2de1-4803-946b-f1f659063887';
    const { searchParams } = new URL(req.url);
    const roadmapId = searchParams.get('roadmapId') || undefined;

    const roadmap = await getActiveRoadmapForUser(userId, roadmapId);

    if (!roadmap) {
      return NextResponse.json({
        success: true,
        roadmap: null,
      });
    }

    // Attach fresh skill gap analysis
    let skillGap = undefined;
    const requirements = await getCachedRoleRequirements(roadmap.role);

    if (requirements) {
      const db = getDbClient();
      let verifiedSkills: SkillItem[] = [];
      let verifiedProjects: ProjectItem[] = [];
      let verifiedCerts: CertificationItem[] = [];

      try {
        await db.connect();
        const profRes = await db.query(
          'SELECT skills, projects, certifications FROM public.profiles WHERE id = $1',
          [userId]
        );
        if (profRes.rows.length > 0) {
          const row = profRes.rows[0];
          verifiedSkills = Array.isArray(row.skills) ? row.skills : [];
          verifiedProjects = Array.isArray(row.projects) ? row.projects : [];
          verifiedCerts = Array.isArray(row.certifications) ? row.certifications : [];
        }
        await db.end();
      } catch {
        try { await db.end(); } catch {}
      }

      skillGap = analyzeSkillGaps(requirements, {
        skills: verifiedSkills,
        projects: verifiedProjects,
        certifications: verifiedCerts,
      });
    }

    return NextResponse.json({
      success: true,
      roadmap: {
        ...roadmap,
        skillGap: skillGap || roadmap.skillGap,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching roadmap:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to fetch roadmap.';
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
