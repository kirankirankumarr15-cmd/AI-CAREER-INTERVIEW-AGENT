import { createClient } from '@/utils/supabase/client';

export async function clientLogout() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Non-blocking
  }

  if (typeof document !== 'undefined') {
    const cookieNames = [
      'careerpilot_session',
      'sb-careerpilot-auth-token',
      'careerpilot_user_id',
      'careerpilot_user_email',
      'careerpilot_user_role',
    ];

    for (const name of cookieNames) {
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('careerpilot_current_user');
    localStorage.removeItem('careerpilot-profile-store');
    localStorage.removeItem('careerpilot-practice-store');
  }
}
