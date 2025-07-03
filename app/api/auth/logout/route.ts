/**
 * Authentication API Route: Logout
 * 
 * Handles user logout and session cleanup
 * Clears both Supabase session and application cookies
 * 
 * TODO: Migrate to use AuthService.logout() when method is implemented
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { withPerformanceMonitoring, addSecurityHeaders } from '@/lib/middleware';
import { logger } from '@/lib/logger';
import type { LogoutRequest, LogoutResponse } from '@/types/auth-api-contracts';

export async function POST(request: NextRequest) {
  return withPerformanceMonitoring('/api/auth/logout', async () => {
    try {
      const body: LogoutRequest = await request.json().catch(() => ({}));
      const { sessionId, allDevices = false } = body;

      // Get current session from cookies
      const accessToken = request.cookies.get('sb-access-token')?.value;
      const refreshToken = request.cookies.get('sb-refresh-token')?.value;

      if (!accessToken) {
        // No active session, but still clear cookies
        const response = addSecurityHeaders(NextResponse.json({
          success: true,
          data: {
            loggedOut: true,
            sessionsTerminated: 0
          }
        } as LogoutResponse));

        // Clear all auth cookies
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        response.cookies.delete('pp-session-id');

        return response;
      }

      // TODO: Replace with AuthService.logout() when implemented
      // Create Supabase server client
      const supabase = createSupabaseServerClient();

      // Get user info before logging out for audit log
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      const userId = user?.id;

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.warn('Supabase logout failed', {
          error: error.message,
          userId: userId || 'unknown'
        });
        // Continue with cookie cleanup even if Supabase logout fails
      }

      // Log successful logout
      logger.info('User logged out successfully', {
        userId: userId || 'unknown',
        sessionId: sessionId?.substring(0, 8) + '...' || 'unknown',
        allDevices,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });

      // Prepare response
      const response = addSecurityHeaders(NextResponse.json({
        success: true,
        data: {
          loggedOut: true,
          sessionsTerminated: allDevices ? 1 : 1 // For now, we only handle single session
        }
      } as LogoutResponse));

      // Clear authentication cookies
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      
      // Generate new anonymous session ID
      const newSessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      response.cookies.set('pp-session-id', newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });

      return response;

    } catch (error) {
      logger.error('Logout endpoint error', error instanceof Error ? error : new Error(String(error)), {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return addSecurityHeaders(NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOGOUT_ERROR',
            message: 'An error occurred during logout',
            timestamp: new Date()
          }
        } as LogoutResponse,
        { status: 500 }
      ));
    }
  });
} 