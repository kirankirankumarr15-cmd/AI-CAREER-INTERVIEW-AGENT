/**
 * /api/resume/versions/route.ts
 *
 * GET  - List user's saved resume versions
 * POST - Save a new resume version
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { data: versions, error } = await supabase
      .from('resume_versions')
      .select('id, name, template, content, source, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Attach latest ATS analysis for each version
    const versionIds = (versions || []).map((v) => v.id);
    let latestAnalyses: Record<string, { score_total: number; created_at: string }> = {};

    if (versionIds.length > 0) {
      const { data: analyses } = await supabase
        .from('ats_analyses')
        .select('resume_version_id, score_total, created_at')
        .in('resume_version_id', versionIds)
        .order('created_at', { ascending: false });

      if (analyses) {
        analyses.forEach((a) => {
          if (a.resume_version_id && !latestAnalyses[a.resume_version_id]) {
            latestAnalyses[a.resume_version_id] = {
              score_total: a.score_total,
              created_at: a.created_at,
            };
          }
        });
      }
    }

    const enriched = (versions || []).map((v) => ({
      ...v,
      latestAtsScore: latestAnalyses[v.id]?.score_total || null,
    }));

    return NextResponse.json({ versions: enriched });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

const CreateVersionSchema = z.object({
  name: z.string().min(1, 'Version name is required').max(100),
  template: z.enum(['standard_single_column', 'modern_technical', 'compact_one_page']).default('standard_single_column'),
  content: z.record(z.string(), z.unknown()),
  source: z.enum(['builder', 'upload', 'tailored']).default('builder'),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateVersionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, template, content, source } = parsed.data;

    const { data: version, error } = await supabase
      .from('resume_versions')
      .insert({
        user_id: user.id,
        name,
        template,
        content,
        source,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, version });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
