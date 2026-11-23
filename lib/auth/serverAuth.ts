import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export interface AuthUserInfo {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export async function getAuthenticatedUser(): Promise<AuthUserInfo | null> {
  // 1. Try Supabase Auth
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id) {
      return {
        id: user.id,
        email: user.email || '',
        role: (user.user_metadata?.role as string) || 'student',
        fullName: (user.user_metadata?.full_name as string) || (user.email ? user.email.split('@')[0] : 'Student'),
      };
    }
  } catch {}

  // 2. Fallback to session cookies
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('careerpilot_user_id')?.value;
    const userEmailCookie = cookieStore.get('careerpilot_user_email')?.value;
    const userRoleCookie = cookieStore.get('careerpilot_user_role')?.value;

    if (userIdCookie) {
      const email = userEmailCookie ? decodeURIComponent(userEmailCookie) : '';
      return {
        id: decodeURIComponent(userIdCookie),
        email,
        role: userRoleCookie ? decodeURIComponent(userRoleCookie) : 'student',
        fullName: email ? email.split('@')[0] : 'Student',
      };
    }
  } catch {}

  return null;
}
