import { updateSession } from '@/utils/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/documents',
  '/resume',
  '/jobs',
  '/interview',
  '/learn',
  '/applications',
  '/career',
  '/practice',
  '/progress',
  '/onboarding',
  '/roadmap',
  '/settings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast-path: public auth routes never need session refresh
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password')
  ) {
    return NextResponse.next();
  }

  // Root route check: unauthenticated requests go to /login, active sessions go to /dashboard
  if (pathname === '/') {
    const sessionCookie = request.cookies.get('careerpilot_session')?.value;
    const userIdCookie = request.cookies.get('careerpilot_user_id')?.value;
    if (sessionCookie === 'active' && userIdCookie && userIdCookie.trim() !== '') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  // If hitting a protected route, verify valid authentication
  if (isProtected) {
    // 1. Check verified local session
    const sessionCookie = request.cookies.get('careerpilot_session')?.value;
    const userIdCookie = request.cookies.get('careerpilot_user_id')?.value;
    const hasValidLocalSession =
      sessionCookie === 'active' && Boolean(userIdCookie && userIdCookie.trim() !== '');

    if (hasValidLocalSession) {
      return NextResponse.next();
    }

    // 2. Check for genuine Supabase auth cookie
    const cookies = request.cookies.getAll();
    const hasSupabaseCookie = cookies.some(
      (c) =>
        c.name.startsWith('sb-') &&
        c.name.includes('-auth-token') &&
        c.name !== 'sb-careerpilot-auth-token' &&
        Boolean(c.value && c.value.trim() !== '' && c.value !== 'demo')
    );

    // Fast-path: without auth cookies, redirect to login immediately without network delay
    if (!hasSupabaseCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    try {
      const { createServerClient } = await import('@supabase/ssr');
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {},
          },
        }
      );

      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase auth timeout')), 1500)
      );
      const res = (await Promise.race([userPromise, timeoutPromise])) as {
        data: { user: unknown };
      };

      if (!res.data?.user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Refresh Supabase session if needed on other routes
  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
};
