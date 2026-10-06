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
];

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase session (refreshes auth cookies)
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  // If hitting a protected route, we check if the user is logged in
  if (isProtected) {
    const { createServerClient } = await import('@supabase/ssr');
    
    // Create a temporary client just to check auth status synchronously via cookies
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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login page
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
};
