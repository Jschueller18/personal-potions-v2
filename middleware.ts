/**
 * Next.js Middleware for Authentication & Session Management
 * 
 * CRITICAL: Dual Database Approach
 * - Supabase: Authentication & session management
 * - Prisma: Survey data with user_id linking
 * 
 * Handles:
 * 1. Anonymous survey users (sessionId only)
 * 2. Authenticated users (auth.users.id -> customer_surveys.user_id)
 * 3. Session validation & refresh
 * 4. Route protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRequestClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/api/user',
  '/api/surveys/user'
];

// Routes that should redirect authenticated users
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register'
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/user',
  '/api/surveys/user'
];

// Anonymous survey routes (no auth required)
const ANONYMOUS_SURVEY_ROUTES = [
  '/survey',
  '/api/formula/calculate',
  '/api/intake'
];

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next();

    // Skip middleware for static files, _next, and health checks
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/_next/') ||
      pathname.includes('.') ||
      pathname === '/health' ||
      pathname === '/api/health'
    ) {
      return response;
    }

    // Initialize Supabase client for this request
    const supabase = createSupabaseRequestClient(request);

    // Get session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Generate or get session ID for anonymous users
    let sessionId = request.cookies.get('pp-session-id')?.value;
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    // Set session ID cookie for anonymous users
    if (!sessionId || sessionId.startsWith('anon_')) {
      response.cookies.set('pp-session-id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });
    }

    // Authentication state
    const isAuthenticated = !!session && !sessionError;
    const userId = session?.user?.id || null;

    // Add user context headers for API routes and pages
    if (isAuthenticated && userId) {
      response.headers.set('x-user-id', userId);
      response.headers.set('x-user-email', session.user.email || '');
      response.headers.set('x-session-type', 'authenticated');
      
      // Use authenticated session ID instead of anonymous
      response.cookies.set('pp-session-id', session.access_token.substring(0, 32), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/'
      });
    } else {
      response.headers.set('x-session-type', 'anonymous');
    }

    response.headers.set('x-session-id', sessionId);

    // Log authentication context for debugging
    logger.info('Middleware: Request processed', {
      pathname,
      isAuthenticated,
      userId: userId || 'anonymous',
      sessionId: sessionId.substring(0, 8) + '...',
      userAgent: request.headers.get('user-agent')?.substring(0, 50) || 'unknown'
    });

    // ROUTE PROTECTION LOGIC

    // 1. Protected routes - require authentication
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      if (!isAuthenticated) {
        logger.warn('Unauthorized access attempt to protected route', {
          pathname,
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        });

        // Redirect to login for page routes
        if (!pathname.startsWith('/api/')) {
          const loginUrl = new URL('/auth/login', request.url);
          loginUrl.searchParams.set('redirect', pathname);
          return NextResponse.redirect(loginUrl);
        }

        // Return 401 for API routes
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Authentication required to access this resource',
              timestamp: new Date()
            }
          },
          { status: 401 }
        );
      }
    }

    // 2. Auth routes - redirect authenticated users to dashboard
    if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
      if (isAuthenticated) {
        logger.info('Authenticated user redirected from auth route', {
          pathname,
          userId
        });
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // 3. Protected API routes - require authentication
    if (PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))) {
      if (!isAuthenticated) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Authentication required for this API endpoint',
              timestamp: new Date()
            }
          },
          { status: 401 }
        );
      }
    }

    // 4. Anonymous survey routes - allow both anonymous and authenticated
    if (ANONYMOUS_SURVEY_ROUTES.some(route => pathname.startsWith(route))) {
      // These routes work for both anonymous and authenticated users
      // The API handlers will determine data ownership based on user_id presence
      
      if (isAuthenticated) {
        logger.info('Authenticated user accessing survey', {
          pathname,
          userId,
          sessionId: sessionId.substring(0, 8) + '...'
        });
      } else {
        logger.info('Anonymous user accessing survey', {
          pathname,
          sessionId: sessionId.substring(0, 8) + '...'
        });
      }
    }

    // 5. Session refresh for authenticated users
    if (isAuthenticated && session) {
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      // Refresh token if it expires within 10 minutes
      if (timeUntilExpiry < 10 * 60 * 1000) {
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            logger.warn('Session refresh failed', {
              userId,
              error: refreshError.message
            });
            
            // Clear invalid session cookies
            response.cookies.delete('sb-access-token');
            response.cookies.delete('sb-refresh-token');
          } else if (refreshData.session) {
            logger.info('Session refreshed successfully', {
              userId,
              newExpiresAt: new Date(refreshData.session.expires_at! * 1000)
            });
            
            // Update cookies with new tokens
            response.cookies.set('sb-access-token', refreshData.session.access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 24 * 60 * 60,
              path: '/'
            });
            
            response.cookies.set('sb-refresh-token', refreshData.session.refresh_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 24 * 60 * 60,
              path: '/'
            });
          }
        } catch (refreshErr) {
          logger.error('Session refresh error', refreshErr, { userId });
        }
      }
    }

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;

  } catch (error) {
    logger.error('Middleware error', error, {
      pathname: request.nextUrl.pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    // Continue processing - don't break the app due to middleware errors
    return NextResponse.next();
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 