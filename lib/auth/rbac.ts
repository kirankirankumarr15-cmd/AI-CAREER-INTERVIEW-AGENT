import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export type UserRole = 'student' | 'tpo' | 'admin';

export interface AuthenticatedUserContext {
  userId: string;
  email: string;
  role: UserRole;
  isStaff: boolean;
  isAdmin: boolean;
}

/**
 * Server-authoritative role resolution.
 * NEVER trusts client headers, localStorage, or cookies for role determination.
 * Resolves role directly from the database (organization_members -> profiles).
 */
export async function getAuthoritativeUserContext(): Promise<AuthenticatedUserContext | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // 1. Query organization_members for primary institutional role
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    let resolvedRole: UserRole = 'student';

    if (orgMember?.role && ['student', 'tpo', 'admin'].includes(orgMember.role)) {
      resolvedRole = orgMember.role as UserRole;
    } else {
      // 2. Query profiles table as secondary source
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role && ['student', 'tpo', 'admin'].includes(profile.role)) {
        resolvedRole = profile.role as UserRole;
      }
    }

    return {
      userId: user.id,
      email: user.email || '',
      role: resolvedRole,
      isStaff: resolvedRole === 'tpo' || resolvedRole === 'admin',
      isAdmin: resolvedRole === 'admin',
    };
  } catch (err) {
    console.error('[RBAC] Error resolving authoritative user role:', err);
    return null;
  }
}

/**
 * Enforces role restriction on server route handlers.
 * If user lacks required role, immediately returns 403 Forbidden Response.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<{
  context: AuthenticatedUserContext | null;
  errorResponse?: NextResponse;
}> {
  const context = await getAuthoritativeUserContext();

  if (!context) {
    return {
      context: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(context.role)) {
    return {
      context,
      errorResponse: NextResponse.json(
        {
          error: 'Forbidden',
          message: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}. Your role: ${context.role}`,
        },
        { status: 403 }
      ),
    };
  }

  return { context };
}

