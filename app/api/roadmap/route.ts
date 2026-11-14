import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getActiveRoadmapForUser, getCachedRoleRequirements } from '@/lib/roadmap/db';
import { analyzeSkillGaps } from '@/lib/roadmap/skillGap';
import { getDbClient } from '@/lib/auth/userService';
import { SkillItem, ProjectItem, CertificationItem } from '@/types';
import { getActiveRoadmap, generateDynamic12WeekPlan } from '@/lib/roadmap/dynamic-roadmap';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || (process.env.NODE_ENV !== 'production' ? 'dev_student_user' : 'd2760b39-2de1-4803-946b-f1f659063887');
    const { searchParams } = new URL(req.url);
    const roadmapId = searchParams.get('roadmapId') || undefined;

    // 1. Get or generate Dynamic 12-Week Roadmap
    let dynamic12WeekPlan = getActiveRoadmap(userId);
    if (!dynamic12WeekPlan) {
      dynamic12WeekPlan = generateDynamic12WeekPlan({
        userId,
        targetRole: 'Full Stack Developer',
        targetCompany: 'Top Tier Placement Drive',
      });
    }

    // 2. Fetch legacy roadmap for compatibility if available
    let roadmap = null;
    try {
      roadmap = await getActiveRoadmapForUser(userId, roadmapId);
    } catch {
      // Handled
    }

    return NextResponse.json({
      success: true,
      dynamicPlan: dynamic12WeekPlan,
      roadmap: roadmap ? { ...roadmap } : null,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching roadmap',
      },
      { status: 500 }
    );
  }
}
