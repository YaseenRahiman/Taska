import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define role-based route patterns
const ROLE_ROUTES = {
  CLIENT: ['/client'],
  ARTISAN: ['/artisan'],
  ADMIN: ['/admin'],
  ASSESSOR: ['/admin'], // Assessors can access admin routes
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/artisan/register',
  '/about',
  '/browse',
  '/categories',
  '/contact',
  '/how-it-works',
  '/insurance',
  '/pricing',
  '/privacy',
  '/terms',
  '/safety',
  '/careers',
  '/press',
  '/resources',
  '/success-stories',
  '/post-job',
];

// Routes that authenticated users should not access
const AUTH_ONLY_ROUTES = [
  '/auth/login',
  '/auth/register',
];

interface JwtPayload {
  sub: string;
  email: string;
  role: 'CLIENT' | 'ARTISAN' | 'ADMIN' | 'ASSESSOR';
  verified: boolean;
  iat?: number;
  exp?: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without authentication
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    const token = request.cookies.get('accessToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (token && AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
      const payload = decodeJwt(token);

      if (payload && !isTokenExpired(payload)) {
        // Redirect to appropriate dashboard based on role
        const dashboardPath = payload.role === 'ARTISAN'
          ? '/artisan/dashboard'
          : payload.role === 'ADMIN' || payload.role === 'ASSESSOR'
          ? '/admin/dashboard'
          : '/client/dashboard';

        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }
    }

    return NextResponse.next();
  }

  // Only protect known role-specific route prefixes
  const isProtectedRoute = Object.values(ROLE_ROUTES).flat().some(route => pathname.startsWith(route));

  // For unknown routes (not public, not role-specific), let Next.js handle them (404, etc.)
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // For protected routes, verify authentication
  const token = request.cookies.get('accessToken')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    // Redirect to login with return URL
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode and validate token
  const payload = decodeJwt(token);

  if (!payload || isTokenExpired(payload)) {
    // Invalid or expired token, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    const response = NextResponse.redirect(loginUrl);

    // Clear invalid token
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');

    return response;
  }

  // Check if user's email is verified
  if (!payload.verified && !pathname.startsWith('/auth/verify-email')) {
    return NextResponse.redirect(new URL('/auth/verify-email', request.url));
  }

  // Check role-based access
  const userRole = payload.role;

  // Check if user is trying to access a role-specific route
  for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
    const hasAccess = routes.some(route => pathname.startsWith(route));

    if (hasAccess) {
      // Check if user has the required role
      if (userRole !== role && !(role === 'ADMIN' && userRole === 'ASSESSOR')) {
        // User doesn't have permission, redirect to their dashboard
        const dashboardPath = userRole === 'ARTISAN'
          ? '/artisan/dashboard'
          : userRole === 'ADMIN' || userRole === 'ASSESSOR'
          ? '/admin/dashboard'
          : '/client/dashboard';

        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }

      // User has access
      return NextResponse.next();
    }
  }

  // Default: allow access to other authenticated routes
  return NextResponse.next();
}

// Configure which routes should run the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.svg (favicon files)
     * - manifest.json, sw.js (PWA files must be publicly accessible)
     * - icons (PWA icon assets)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|manifest\\.json|sw\\.js|icons|public|api).*)',
  ],
};
