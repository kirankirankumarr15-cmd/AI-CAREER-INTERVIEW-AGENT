import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionStatus = cookieStore.get('careerpilot_session')?.value;
  const userId = cookieStore.get('careerpilot_user_id')?.value;

  if (sessionStatus === 'active' && userId && userId.trim() !== '') {
    redirect('/dashboard');
  }

  redirect('/login');
}
