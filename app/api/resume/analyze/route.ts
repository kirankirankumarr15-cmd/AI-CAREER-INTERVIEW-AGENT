/**
 * /api/resume/analyze/route.ts
 *
 * Core ATS Match & Parser Audit API.
 * 
 * Pipeline:
 * 1. Zod input validation
 * 2. Supabase auth and RLS check
 * 3. Sanitizes input & defends against prompt injection
 * 4. Extracts requirements via SHA-256 cached extractor
 * 5. Runs pure deterministic scoring engine (same input -> exact same score)
 * 6. Generates verified-data profile summary rewrite
 * 7. Records audit into ats_analyses table for history & trend tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { runDeterministicATSAnalysis } from '@/lib/resume/ats-engine';
import { extractJDRequirements, computeJDHash, generateVerifiedProfileSummary } from '@/lib/resume/jd-extractor';

export const dynamic = 'force-dynamic';

const AnalyzeRequestSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters').max(30000),
  jdText: z.string().min(30, 'Job description must be at least 30 characters').max(30000),
  resumeVersionId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  isSingleColumn: z.boolean().optional().default(true),
  hasNoTables: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthenticated. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = AnalyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { resumeText, jdText, resumeVersionId, jobId, isSingleColumn, hasNoTables } = parsed.data;

    // 1. Extract requirements (cached by JD hash)
    const requirements = await extractJDRequirements(jdText, supabase);
    const jdHash = computeJDHash(jdText);

    // 2. Run deterministic ATS scoring engine
    const analysis = runDeterministicATSAnalysis(resumeText, requirements, {
      isSingleColumn,
      hasNoTables,
    });

    // 3. Fetch verified profile data to generate truthful profile summary rewrite
    let profileSummaryRewrite = '';
    try {
      const [profRes, skillsRes, projRes] = await Promise.all([
        supabase.from('profiles').select('fullName, target_role, college, graduation_year').eq('id', user.id).maybeSingle(),
        supabase.from('skills').select('name, verified').eq('user_id', user.id).eq('verified', true),
        supabase.from('projects').select('title, tech_stack, verified').eq('user_id', user.id).eq('verified', true),
      ]);

      const verifiedSkills = (skillsRes.data || []).map((s) => s.name);
      const verifiedProjects = (projRes.data || []).map((p) => ({ title: p.title, tech_stack: p.tech_stack }));

      profileSummaryRewrite = generateVerifiedProfileSummary(
        profRes.data || {},
        verifiedSkills,
        verifiedProjects
      );
    } catch (profErr) {
      console.warn('Could not load profile for summary rewrite:', profErr);
    }

    // 4. Record audit in ats_analyses table
    try {
      await supabase.from('ats_analyses').insert({
        user_id: user.id,
        resume_version_id: resumeVersionId || null,
        job_id: jobId || null,
        jd_text: jdText.slice(0, 5000),
        jd_hash: jdHash,
        score_total: analysis.overallScore,
        breakdown: analysis.breakdown,
        keywords: analysis.keywords,
        issues: analysis.issues,
        suggestions: {
          profileSummaryRewrite,
          injectionAttemptDetected: requirements.injectionAttemptDetected,
        },
        model_info: 'deterministic_engine_v1 + jd_cache',
      });
    } catch (dbErr) {
      console.warn('Could not persist ats_analyses record:', dbErr);
    }

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        profileSummaryRewrite,
        injectionAttemptDetected: requirements.injectionAttemptDetected,
        jdHash,
      },
    });
  } catch (err: unknown) {
    console.error('Error in /api/resume/analyze:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
