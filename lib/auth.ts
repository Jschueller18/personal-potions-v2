/**
 * Authentication Utilities
 * 
 * Core authentication functions for single Supabase database:
 * - Complete schema access with proper foreign key constraints
 * - Row Level Security enforcement for data protection
 */

import { createSupabaseServerClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { User } from '@/types/auth-interfaces';

/**
 * Extract session information from request headers (set by middleware)
 */
export function getSessionFromHeaders(headers: Headers): {
  sessionId: string | null;
  userId: string | null;
  sessionType: 'anonymous' | 'authenticated';
} {
  const sessionId = headers.get('x-session-id');
  const userId = headers.get('x-user-id');
  const sessionType = headers.get('x-session-type') as 'anonymous' | 'authenticated' || 'anonymous';

  return {
    sessionId,
    userId,
    sessionType
  };
}

/**
 * Validate server-side session token
 * Used by API routes for authentication
 */
export async function validateSessionToken(token: string): Promise<{
  isValid: boolean;
  user: User | null;
  userId: string | null;
}> {
  try {
    if (!token || token.startsWith('anon_')) {
      return { isValid: true, user: null, userId: null };
    }

    const supabase = createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid session token', { error: error?.message });
      return { isValid: false, user: null, userId: null };
    }

    const authUser: User = {
      id: user.id,
      email: user.email!,
      username: user.user_metadata.username,
      profile: {
        firstName: user.user_metadata.firstName,
        lastName: user.user_metadata.lastName,
        dateOfBirth: user.user_metadata.dateOfBirth ? new Date(user.user_metadata.dateOfBirth) : undefined,
        createdAt: new Date(user.created_at),
        lastLoginAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : undefined,
      },
      preferences: {
        language: user.user_metadata.language || 'en',
        timezone: user.user_metadata.timezone || 'UTC',
        notifications: user.user_metadata.notifications || {
          email: { enabled: true, security: true, marketing: false, surveyReminders: true },
          sms: { enabled: false, security: false, surveyReminders: false }
        }
      },
      hipaaConsent: user.user_metadata.hipaaConsent || {
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

    return { isValid: true, user: authUser, userId: user.id };

  } catch (error) {
    logger.error('Session validation error', error instanceof Error ? error : new Error(String(error)));
    return { isValid: false, user: null, userId: null };
  }
}

/**
 * Generate anonymous session ID
 */
export function generateAnonymousSessionId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if session is authenticated
 */
export function isAuthenticatedSession(sessionId: string): boolean {
  return !sessionId.startsWith('anon_');
} 