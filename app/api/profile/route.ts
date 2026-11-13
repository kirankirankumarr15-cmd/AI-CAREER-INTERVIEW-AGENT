import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

const ProfileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  college: z.string().min(2).optional(),
  branch: z.string().min(2, 'Branch is required').optional(),
  year: z.number().int().min(1).max(5).optional(),
  cgpa: z.number().min(0).max(10).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  targetRole: z.string().min(2).optional(),
  targetRoles: z.array(z.string()).optional(),
  targetCompanies: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

function calculateCompletion(data: {
  fullName?: string;
  email?: string;
  branch?: string;
  cgpa?: number;
  targetRole?: string;
  targetRoles?: string[];
  skills?: string[];
}): number {
  let score = 0;
  if (data.fullName && data.email) score += 20;
  if (data.branch) score += 20;
  if (data.cgpa && data.cgpa > 0) score += 10;
  if (data.targetRole || (data.targetRoles && data.targetRoles.length > 0)) score += 20;
  if (data.skills && data.skills.length >= 3) score += 20;
  else if (data.skills && data.skills.length > 0) score += 10;
  score += 10; // Baseline engagement
  return Math.min(100, Math.max(15, score));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required. Database connection or active session missing.' },
          { status: 401 }
        );
      }
      // Gated development-only fallback when remote DB is offline
      return NextResponse.json({
        success: true,
        isDemo: true,
        devFallback: true,
        profile: {
          id: 'demo-student-id',
          email: 'alex.dev@pesitm.edu.in',
          fullName: 'Alex Morgan',
          role: 'student',
          college: 'PESITM Shivamogga',
          branch: 'Computer Science & Engineering',
          year: 4,
          cgpa: 8.75,
          targetRole: 'Software Developer',
          targetRoles: ['Software Developer', 'Full Stack Developer'],
          targetCompanies: ['Google', 'Microsoft', 'Infosys'],
          skills: ['TypeScript', 'React', 'Node.js', 'Python', 'SQL'],
          profileCompletionPercentage: 80,
          readinessScore: 78,
        },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: profile || {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || 'Student',
        role: 'student',
        profileCompletionPercentage: 30,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error fetching profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = ProfileUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          issues: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const validData = validation.data;
    const completion = calculateCompletion(validData);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required. Production builds read and write only the database.' },
          { status: 401 }
        );
      }
      // Return updated profile in mock/demo mode for local development
      return NextResponse.json({
        success: true,
        message: 'Profile updated (Dev Sandbox Mode)',
        devFallback: true,
        profile: {
          ...validData,
          profileCompletionPercentage: completion,
        },
      });
    }

    const dbPayload: Record<string, unknown> = {
      profile_completion_percentage: completion,
      updated_at: new Date().toISOString(),
    };

    if (validData.fullName) dbPayload.full_name = validData.fullName;
    if (validData.college) dbPayload.college = validData.college;
    if (validData.branch) dbPayload.branch = validData.branch;
    if (validData.year) dbPayload.year = validData.year;
    if (validData.cgpa) dbPayload.cgpa = validData.cgpa;
    if (validData.phone) dbPayload.phone = validData.phone;
    if (validData.location) dbPayload.location = validData.location;
    if (validData.targetRole) dbPayload.target_role = validData.targetRole;
    if (validData.targetRoles) dbPayload.target_roles = validData.targetRoles;
    if (validData.targetCompanies) dbPayload.target_companies = validData.targetCompanies;
    if (validData.skills) dbPayload.skills = validData.skills;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(dbPayload)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error updating profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

