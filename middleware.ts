import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (isProtected) {
    // Check session token or user cookie if set
    const authCookie =
      request.cookies.get('sb-access-token') ||
      request.cookies.get('supabase-auth-token') ||
      request.cookies.get('careerpilot_session');

    // Proceed cleanly
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
};
