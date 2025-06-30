/**
 * Authentication Service
 * 
 * Manages user authentication within single Supabase database
 * Handles session validation and delegates survey operations to SurveyService
 * 
 * SINGLE SUPABASE DATABASE APPROACH:
 * - Unified schema: auth.users + public.customer_surveys with proper FK constraints
 * - Row Level Security: RLS policies enforce data ownership and HIPAA compliance
 * - Clean separation of concerns: auth vs survey operations
 */

import { BaseService } from './base-service';
import { SurveyService } from './survey-service';
import type { 
  AuthState, 
  User, 
  UserSession,
  SurveyDraftState 
} from '@/types/auth-interfaces';
import type { CustomerData } from '@/types/interfaces';

export class AuthService extends BaseService {
  
  /**
   * Validate session and return user context
   * Used by API routes to determine authentication state
   */
  static async validateSession(sessionToken: string): Promise<{
    isValid: boolean;
    user: User | null;
    userId: string | null;
    sessionType: 'anonymous' | 'authenticated';
  }> {
    try {
      // Check if it's an anonymous session
      if (sessionToken.startsWith('anon_')) {
        return {
          isValid: true,
          user: null,
          userId: null,
          sessionType: 'anonymous'
        };
      }

      // Validate Supabase session
      const supabase = this.getSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser(sessionToken);

      if (error || !user) {
        this.handleDatabaseError('validate session token', error, { tokenPrefix: sessionToken.substring(0, 8) });
        return {
          isValid: false,
          user: null,
          userId: null,
          sessionType: 'anonymous'
        };
      }

      // Convert Supabase user to our User interface
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

      return {
        isValid: true,
        user: authUser,
        userId: user.id,
        sessionType: 'authenticated'
      };

    } catch (error) {
      this.handleDatabaseError('session validation', error);
      return {
        isValid: false,
        user: null,
        userId: null,
        sessionType: 'anonymous'
      };
    }
  }

  // ================== SURVEY OPERATIONS (DELEGATED) ==================
  // These methods maintain the exact same API while delegating to SurveyService
  // This preserves backward compatibility and prevents breaking changes

  /**
   * Create or update survey draft with proper user ownership
   * DELEGATED to SurveyService - maintains exact same API
   */
  static async createSurveyDraft(
    sessionId: string,
    userId: string | null,
    surveyData: Partial<CustomerData>,
    useCase?: string
  ): Promise<{ success: boolean; draftId?: string; error?: string }> {
    return SurveyService.createSurveyDraft(sessionId, userId, surveyData, useCase);
  }

  /**
   * Load survey draft with ownership validation
   * DELEGATED to SurveyService - maintains exact same API
   */
  static async loadSurveyDraft(
    draftId: string,
    sessionId: string,
    userId: string | null
  ): Promise<{ success: boolean; draft?: any; error?: string }> {
    return SurveyService.loadSurveyDraft(draftId, sessionId, userId);
  }

  /**
   * Link anonymous survey data to authenticated user
   * DELEGATED to SurveyService - maintains exact same API
   */
  static async linkAnonymousSurveyToUser(
    sessionId: string,
    userId: string
  ): Promise<{ success: boolean; linkedSurveys: number; error?: string }> {
    return SurveyService.linkAnonymousSurveyToUser(sessionId, userId);
  }

  /**
   * Get user's survey history (authenticated users only)
   * DELEGATED to SurveyService - maintains exact same API
   */
  static async getUserSurveyHistory(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ success: boolean; surveys?: any[]; total?: number; error?: string }> {
    return SurveyService.getUserSurveyHistory(userId, limit, offset);
  }

  /**
   * Clean up expired anonymous surveys (maintenance task)
   * DELEGATED to SurveyService - maintains exact same API
   */
  static async cleanupExpiredSurveys(): Promise<void> {
    return SurveyService.cleanupExpiredSurveys();
  }
} 