import { createClient } from '@/utils/supabase/client';

export async function clientLogout() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Non-blocking
  }

  if (typeof document !== 'undefined') {
    document.cookie = 'careerpilot_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'sb-careerpilot-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('careerpilot_current_user');
  }
}

