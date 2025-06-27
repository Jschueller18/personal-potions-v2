/**
 * Authentication API Route: Session Validation
 * 
 * Validates current session and returns user authentication state
 * Used by client-side components to check auth status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRequestClient } from '@/lib/supabase/client';
import { withPerformanceMonitoring, addSecurityHeaders } from '@/lib/middleware';
import { getSessionFromHeaders } from '@/lib/auth';
import { logger } from '@/lib/logger';
import type { SessionValidationRequest, SessionValidationResponse } from '@/types/auth-api-contracts';

export async function GET(request: NextRequest) {
  return withPerformanceMonitoring('/api/auth/session', async () => {
    try {      
      // Get session info from middleware-set headers
      const { sessionId, userId, sessionType } = getSessionFromHeaders(request.headers);

      // If anonymous session
      if (sessionType === 'anonymous' || !userId) {
        return addSecurityHeaders(NextResponse.json({
          success: true,
          data: {
            isValid: true,
            isAuthenticated: false,
            sessionType: 'anonymous',
            sessionId,
            user: null,
            requiresRefresh: false,
            requiresMfa: false
          }
        }));
      }

      // For authenticated sessions, validate with Supabase
      const supabase = createSupabaseRequestClient(request);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        logger.warn('Session validation failed', {
          error: sessionError?.message,
          userId: userId?.substring(0, 8) + '...' || 'unknown'
        });

        return addSecurityHeaders(NextResponse.json({
          success: true,
          data: {
            isValid: false,
            isAuthenticated: false,
            sessionType: 'anonymous',
            sessionId,
            user: null,
            requiresRefresh: true,
            requiresMfa: false
          }
        }));
      }

      // Check if session is close to expiring
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const requiresRefresh = timeUntilExpiry < 10 * 60 * 1000; // Less than 10 minutes

      // Build user object from session
      const user = {
        id: session.user.id,
        email: session.user.email!,
        username: session.user.user_metadata.username,
        profile: {
          firstName: session.user.user_metadata.firstName,
          lastName: session.user.user_metadata.lastName,
          dateOfBirth: session.user.user_metadata.dateOfBirth ? new Date(session.user.user_metadata.dateOfBirth) : undefined,
          createdAt: new Date(session.user.created_at),
          lastLoginAt: session.user.last_sign_in_at ? new Date(session.user.last_sign_in_at) : undefined,
        },
        preferences: {
          language: session.user.user_metadata.language || 'en',
          timezone: session.user.user_metadata.timezone || 'UTC',
          notifications: session.user.user_metadata.notifications || {
            email: { enabled: true, security: true, marketing: false, surveyReminders: true },
            sms: { enabled: false, security: false, surveyReminders: false }
          }
        },
        hipaaConsent: session.user.user_metadata.hipaaConsent || {
          hasConsented: false,
          consentVersion: '1.0',
          consentDetails: {
            dataCollection: false,
            phiProcessing: false,
            dataRetention: false,
            dataSharing: false
          }
        }
      };

      // Log session validation for audit
      logger.info('Session validated', {
        userId: session.user.id,
        sessionId: sessionId?.substring(0, 8) + '...' || 'unknown',
        requiresRefresh,
        expiresAt
      });

      return addSecurityHeaders(NextResponse.json({
        success: true,
        data: {
          isValid: true,
          isAuthenticated: true,
          sessionType: 'authenticated',
          sessionId,
          user,
          requiresRefresh,
          requiresMfa: false, // MFA not implemented in this version
          expiresAt
        }
      } as SessionValidationResponse));

    } catch (error) {
      logger.error('Session validation endpoint error', error, {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return addSecurityHeaders(NextResponse.json(
        {
          success: false,
          error: {
            code: 'SESSION_VALIDATION_ERROR',
            message: 'An error occurred while validating session',
            timestamp: new Date()
          }
        } as SessionValidationResponse,
        { status: 500 }
      ));
    }
  });
}

export async function POST(request: NextRequest) {
  return withPerformanceMonitoring('/api/auth/session', async () => {
    try {
      const body: SessionValidationRequest = await request.json();
      const { sessionId, requiresFresh = false, requiresMfa = false } = body;

      // Validate the provided session ID
      const supabase = createSupabaseRequestClient(request);
      
      // If it's an anonymous session
      if (!sessionId || sessionId.startsWith('anon_')) {
        return addSecurityHeaders(NextResponse.json({
          success: true,
          data: {
            isValid: true,
            isAuthenticated: false,
            sessionType: 'anonymous',
            sessionId,
            user: null,
            requiresRefresh: false,
            requiresMfa: false
          }
        }));
      }

      // Validate authenticated session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return addSecurityHeaders(NextResponse.json({
          success: true,
          data: {
            isValid: false,
            isAuthenticated: false,
            sessionType: 'anonymous',
            sessionId,
            user: null,
            requiresRefresh: true,
            requiresMfa: false
          }
        }));
      }

      // Check freshness requirement
      if (requiresFresh) {
        const lastSignIn = new Date(session.user.last_sign_in_at!);
        const now = new Date();
        const timeSinceSignIn = now.getTime() - lastSignIn.getTime();
        const freshMinutes = 30 * 60 * 1000; // 30 minutes

        if (timeSinceSignIn > freshMinutes) {
          return addSecurityHeaders(NextResponse.json({
            success: true,
            data: {
              isValid: false,
              isAuthenticated: true,
              sessionType: 'authenticated',
              sessionId,
              user: null,
              requiresRefresh: true,
              requiresMfa: false,
              message: 'Session requires fresh authentication'
            }
          }));
        }
      }

      // Return successful validation
      return addSecurityHeaders(NextResponse.json({
        success: true,
        data: {
          isValid: true,
          isAuthenticated: true,
          sessionType: 'authenticated',
          sessionId,
          user: {
            id: session.user.id,
            email: session.user.email!
          },
          requiresRefresh: false,
          requiresMfa: requiresMfa && false // MFA not implemented yet
        }
      } as SessionValidationResponse));

    } catch (error) {
      logger.error('Session validation POST endpoint error', error);

      return addSecurityHeaders(NextResponse.json(
        {
          success: false,
          error: {
            code: 'SESSION_VALIDATION_ERROR',
            message: 'An error occurred while validating session',
            timestamp: new Date()
          }
        } as SessionValidationResponse,
        { status: 500 }
      ));
    }
  });
} 