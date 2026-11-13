import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { computeDeterministicCareerAudit } from '@/lib/career/benchmark-data';
import { StudentProfile, ProjectItem, CareerAuditResult } from '@/types';

const AuditRequestSchema = z.object({
  targetRole: z.string().min(1).max(200),
  forceRefresh: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required. Production reads only the real database.' },
        { status: 401 }
      );
    }

    if (!user) {
      // In offline / local demo session
      return NextResponse.json({
        audits: [],
        currentAudit: null,
      });
    }

    const { data: audits, error } = await supabase
      .from('career_audits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[CareerAudit API] Fetch error:', error.message);
      return NextResponse.json({ audits: [], currentAudit: null });
    }

    return NextResponse.json({
      audits: audits || [],
      currentAudit: audits && audits.length > 0 ? audits[0] : null,
    });
  } catch (err) {
    console.error('[CareerAudit API] GET failed:', err);
    return NextResponse.json({ error: 'Failed to retrieve career audits' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = AuditRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { targetRole, forceRefresh } = parsed.data;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required. Production reads only the real database.' },
        { status: 401 }
      );
    }

    // 1. Check for 14-day cache if not forcing refresh
    if (!forceRefresh && user) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from('career_audits')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_role', targetRole)
        .gte('created_at', fourteenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        return NextResponse.json({
          audit: {
            id: cached.id,
            targetRole: cached.target_role,
            researchedAt: cached.created_at,
            sectorAlignment: cached.sector_alignment,
            skillGaps: cached.skill_gaps,
            expectedSalaryRange: cached.expected_salary_range,
            competitivenessSummary: cached.competitiveness_summary,
            radarScores: cached.radar_scores,
            createdAt: cached.created_at,
          },
          isCached: true,
          lastResearchedOn: cached.created_at,
        });
      }
    }

    // 2. Fetch student's verified profile and projects
    let profileData: StudentProfile = {
      id: user?.id || 'demo-user',
      email: user?.email || 'student@pesitm.edu',
      fullName: 'PESITM Student',
      branch: 'Computer Science & Engineering',
      college: 'PESITM Shivamogga',
      cgpa: 8.2,
      targetRole,
      targetCompanies: ['Infosys', 'TCS Digital', 'Accenture', 'Stripe'],
      skills: ['Java', 'Data Structures & Algorithms', 'SQL', 'Git', 'React', 'HTML/CSS'],
      preferredLocations: ['Bengaluru'],
      readinessScore: 68,
      profileCompletionPercentage: 75,
      verificationStatus: 'Verified',
    };

    let projectsData: ProjectItem[] = [];

    if (user) {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (p) {
        profileData = {
          ...profileData,
          fullName: p.full_name || profileData.fullName,
          branch: p.branch || profileData.branch,
          college: p.college || profileData.college,
          cgpa: p.cgpa ?? profileData.cgpa,
          skills: p.skills || profileData.skills,
          targetCompanies: p.target_companies || profileData.targetCompanies,
          profileCompletionPercentage: p.profile_completion_percentage ?? profileData.profileCompletionPercentage,
          readinessScore: p.readiness_score ?? profileData.readinessScore,
        };
      }

      const { data: projs } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (projs && projs.length > 0) {
        projectsData = projs.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          techStack: item.tech_stack || [],
          verificationStatus: 'Verified',
        }));
      }
    }

    // 3. Compute deterministic audit
    const audit: CareerAuditResult = computeDeterministicCareerAudit(targetRole, profileData, projectsData);

    // 4. Store versioned audit in Supabase
    if (user) {
      const { data: inserted, error: insertError } = await supabase
        .from('career_audits')
        .insert({
          user_id: user.id,
          target_role: audit.targetRole,
          sector_alignment: audit.sectorAlignment,
          skill_gaps: audit.skillGaps,
          expected_salary_range: audit.expectedSalaryRange,
          competitiveness_summary: audit.competitivenessSummary,
          radarScores: audit.radarScores,
        })
        .select()
        .single();

      if (!insertError && inserted) {
        audit.id = inserted.id;
      }
    }

    return NextResponse.json({
      audit,
      isCached: false,
      lastResearchedOn: audit.researchedAt,
    });
  } catch (err) {
    console.error('[CareerAudit API] POST failed:', err);
    return NextResponse.json({ error: 'Failed to process career audit' }, { status: 500 });
  }
}

