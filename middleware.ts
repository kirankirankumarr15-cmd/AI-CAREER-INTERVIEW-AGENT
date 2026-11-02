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
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast-path: public auth routes never need Supabase session refresh
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password')
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  // If hitting a protected route, check auth status
  if (isProtected) {
    const cookies = request.cookies.getAll();
    const hasLocalSession = cookies.some(
      (c) => c.name === 'careerpilot_session' || c.name === 'sb-careerpilot-auth-token'
    );

    // Fast-path for verified local / demo session: allow immediately
    if (hasLocalSession) {
      return NextResponse.next();
    }

    const hasSupabaseCookie = cookies.some(
      (c) =>
        c.name.startsWith('sb-') &&
        c.name.includes('-auth-token') &&
        c.name !== 'sb-careerpilot-auth-token'
    );

    // Fast-path: without auth cookies, redirect to login immediately without network delay
    if (!hasSupabaseCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

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

    try {
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
