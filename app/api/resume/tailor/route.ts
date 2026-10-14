/**
 * /api/resume/tailor/route.ts
 *
 * Job-Specific Resume Tailoring Engine.
 * 
 * Rules:
 * - Reorders and emphasizes relevant verified projects & skills.
 * - Suggests rewording of bullets using verified facts only.
 * - Student approves each change; NOTHING is auto-applied silently.
 * - Rewrites NEVER invent skills, experiences, or numbers absent from verified data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { extractJDRequirements } from '@/lib/resume/jd-extractor';

export const dynamic = 'force-dynamic';

const TailorRequestSchema = z.object({
  versionId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  jdText: z.string().min(30),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = TailorRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { versionId, jobId, jdText } = parsed.data;

    // 1. Extract requirements from JD
    const requirements = await extractJDRequirements(jdText, supabase);
    const targetTerms = new Set([
      ...(requirements.hardSkills || []).map((s) => s.toLowerCase()),
      ...(requirements.tools || []).map((t) => t.toLowerCase()),
    ]);

    // 2. Fetch verified student profile data
    const [skillsRes, projectsRes, profRes] = await Promise.all([
      supabase.from('skills').select('*').eq('user_id', user.id).eq('verified', true),
      supabase.from('projects').select('*').eq('user_id', user.id).eq('verified', true),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    ]);

    const verifiedSkills = skillsRes.data || [];
    const verifiedProjects = projectsRes.data || [];

    // 3. Reorder skills: matched skills moved to top
    const tailoredSkills = [...verifiedSkills].sort((a, b) => {
      const aMatch = targetTerms.has(a.name.toLowerCase()) ? 1 : 0;
      const bMatch = targetTerms.has(b.name.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });

    // 4. Reorder projects: projects using matched technologies moved to top
    const tailoredProjects = [...verifiedProjects].sort((a, b) => {
      const aMatches = (a.tech_stack || []).filter((t: string) => targetTerms.has(t.toLowerCase())).length;
      const bMatches = (b.tech_stack || []).filter((t: string) => targetTerms.has(t.toLowerCase())).length;
      return bMatches - aMatches;
    });

    // 5. Generate proposed bullet optimizations (strengthening verbs without inventing claims)
    const bulletSuggestions = tailoredProjects.slice(0, 3).map((p) => {
      const orig = p.description || `${p.title} built with ${(p.tech_stack || []).join(', ')}.`;
      let improved = orig;
      // Replace passive openings
      if (/^worked on/i.test(improved)) {
        improved = improved.replace(/^worked on/i, 'Architected and developed');
      } else if (!/^[A-Z][a-z]+ed\b/.test(improved)) {
        improved = `Engineered ${improved.charAt(0).toLowerCase() + improved.slice(1)}`;
      }

      return {
        projectId: p.id,
        projectTitle: p.title,
        originalBullet: orig,
        proposedBullet: improved,
        reason: 'Strengthened with direct action verb for ATS impact.',
      };
    });

    return NextResponse.json({
      success: true,
      proposal: {
        targetRole: requirements.roleTitle || profRes.data?.target_role || 'Software Engineer',
        skillsOrder: tailoredSkills.map((s) => s.name),
        projectsOrder: tailoredProjects.map((p) => p.title),
        bulletSuggestions,
        matchedKeywords: Array.from(targetTerms).filter((term) =>
          verifiedSkills.some((s) => s.name.toLowerCase() === term)
        ),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
