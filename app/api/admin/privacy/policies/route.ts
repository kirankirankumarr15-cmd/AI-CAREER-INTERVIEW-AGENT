import { NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin/context';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authResult = await requireAdminPermission('consent.read');
    if (authResult.response) return authResult.response;
    const { context } = authResult;

    const supabase = await createClient();

    // Query active consent purposes
    const { data: purposes } = await supabase
      .from('consent_purposes')
      .select('*')
      .eq('organization_id', context.organizationId)
      .order('created_at', { ascending: true });

    // Query total students and consented students
    const { count: totalStudents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', context.organizationId);

    const { count: grantedConsents } = await supabase
      .from('consent_records')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', context.organizationId)
      .eq('status', 'granted');

    return NextResponse.json({
      success: true,
      institution: {
        organizationId: context.organizationId,
        organizationName: context.organizationName,
        dpoName: 'Prof. Ramesh Rao (Designated Data Protection Officer)',
        dpoEmail: 'dpo@pesitm.edu.in',
        dpoPhone: '+91 8182 234567',
        policyVersion: 'PESITM-DPDP-2026-v1.4',
        lastRevisedAt: '2026-11-01T00:00:00Z',
        framework: 'Digital Personal Data Protection Act, 2023 (DPDP Act)',
      },
      purposes: (purposes && purposes.length > 0) ? purposes : [
        {
          code: 'institutional_analytics',
          title: 'Institutional Placement Analytics',
          description: 'Aggregate readiness analytics for department training. Individual drilldowns audited.',
          legal_basis: 'consent',
          is_required: false,
          retention_days: 730,
          version: '2026-11',
        },
        {
          code: 'placement_services',
          title: 'Placement Services & Coordination',
          description: 'Processing academic records for drive shortlisting and eligibility checks.',
          legal_basis: 'consent',
          is_required: true,
          retention_days: 730,
          version: '2026-11',
        },
        {
          code: 'employer_sharing',
          title: 'Employer Profile Sharing',
          description: 'Sharing verified resumes and assessment scores with recruiting organizations.',
          legal_basis: 'consent',
          is_required: false,
          retention_days: 365,
          version: '2026-11',
        },
        {
          code: 'ai_processing',
          title: 'AI-Assisted Career Preparation',
          description: 'AI evaluation of practice interviews and mock assessments without using student data for model training.',
          legal_basis: 'consent',
          is_required: true,
          retention_days: 365,
          version: '2026-11',
        },
      ],
      complianceStats: {
        totalStudents: totalStudents ?? 0,
        consentedCount: grantedConsents ?? 0,
        complianceRate: totalStudents && totalStudents > 0
          ? Math.min(100, Math.round(((grantedConsents ?? 0) / (totalStudents * 4)) * 100))
          : 100,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retrieve privacy policies', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
