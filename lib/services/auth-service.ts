/**
 * Authentication Service
 * 
 * Bridges Supabase authentication with Prisma survey data management
 * Handles the critical link between auth.users.id and customer_surveys.user_id
 * 
 * DUAL DATABASE APPROACH:
 * - Supabase: User authentication, sessions, HIPAA consent
 * - Prisma: Survey data with user_id foreign key for data ownership
 */

import { PrismaClient } from '@prisma/client';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { 
  AuthState, 
  User, 
  UserSession,
  SurveyDraftState 
} from '@/types/auth-interfaces';
import type { CustomerData } from '@/types/interfaces';

const prisma = new PrismaClient();

export class AuthService {
  
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
      const supabase = createSupabaseServerClient();
      const { data: { user }, error } = await supabase.auth.getUser(sessionToken);

      if (error || !user) {
        logger.warn('Invalid session token', { error: error?.message });
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
    logger.error('Session validation error', error instanceof Error ? error : new Error(String(error)));
      return {
        isValid: false,
        user: null,
        userId: null,
        sessionType: 'anonymous'
      };
    }
  }

  /**
   * Create or update survey draft with proper user ownership
   * Handles both anonymous and authenticated users
   */
  static async createSurveyDraft(
    sessionId: string,
    userId: string | null,
    surveyData: Partial<CustomerData>,
    useCase?: string
  ): Promise<{ success: boolean; draftId?: string; error?: string }> {
    try {
      // Create survey draft in Prisma
      const survey = await prisma.customerSurvey.create({
        data: {
          userId: userId || null, // NULL for anonymous, user ID for authenticated
          sessionId,
          customerData: surveyData as any, // JSONB storage
          status: 'draft',
          completionPercentage: this.calculateCompletionPercentage(surveyData),
          detectedUseCase: useCase,
          source: 'web',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          // Extract key fields for indexing
          age: surveyData.age,
          biologicalSex: surveyData['biological-sex'],
          weight: surveyData.weight ? parseFloat(surveyData.weight.toString()) : null,
          activityLevel: surveyData['activity-level'],
          sweatLevel: surveyData['sweat-level']
        }
      });

      logger.info('Survey draft created', {
        draftId: survey.id,
        userId: userId || 'anonymous',
        sessionId: sessionId.substring(0, 8) + '...',
        completionPercentage: survey.completionPercentage
      });

      return { success: true, draftId: survey.id };

    } catch (error) {
      logger.error('Failed to create survey draft', error instanceof Error ? error : new Error(String(error)), {
        userId: userId || 'anonymous',
        sessionId: sessionId.substring(0, 8) + '...'
      });
      return { success: false, error: 'Failed to create survey draft' };
    }
  }

  /**
   * Load survey draft with ownership validation
   */
  static async loadSurveyDraft(
    draftId: string,
    sessionId: string,
    userId: string | null
  ): Promise<{ success: boolean; draft?: any; error?: string }> {
    try {
      // Query with ownership validation
      const survey = await prisma.customerSurvey.findFirst({
        where: {
          id: draftId,
          AND: [
            // Match either by userId (authenticated) or sessionId (anonymous)
            userId ? { userId } : { sessionId, userId: null }
          ]
        }
      });

      if (!survey) {
        logger.warn('Survey draft not found or access denied', {
          draftId,
          userId: userId || 'anonymous',
          sessionId: sessionId.substring(0, 8) + '...'
        });
        return { success: false, error: 'Survey draft not found or access denied' };
      }

      // Check if expired
      if (survey.expiresAt && new Date() > survey.expiresAt) {
        logger.info('Survey draft expired', {
          draftId,
          expiresAt: survey.expiresAt
        });
        return { success: false, error: 'Survey draft has expired' };
      }

      return { success: true, draft: survey };

    } catch (error) {
      logger.error('Failed to load survey draft', error instanceof Error ? error : new Error(String(error)), { draftId });
      return { success: false, error: 'Failed to load survey draft' };
    }
  }

  /**
   * Link anonymous survey data to authenticated user
   * Called when user logs in after starting a survey anonymously
   */
  static async linkAnonymousSurveyToUser(
    sessionId: string,
    userId: string
  ): Promise<{ success: boolean; linkedSurveys: number; error?: string }> {
    try {
      // Find all anonymous surveys for this session
      const anonymousSurveys = await prisma.customerSurvey.findMany({
        where: {
          sessionId,
          userId: null, // Anonymous surveys
          status: 'draft' // Only link drafts, not completed surveys
        }
      });

      if (anonymousSurveys.length === 0) {
        return { success: true, linkedSurveys: 0 };
      }

      // Update surveys to link them to the authenticated user
      const updateResult = await prisma.customerSurvey.updateMany({
        where: {
          sessionId,
          userId: null,
          status: 'draft'
        },
        data: {
          userId,
          // Update session ID to use authenticated format
          sessionId: `auth_${userId.substring(0, 8)}_${Date.now()}`
        }
      });

      logger.info('Anonymous surveys linked to authenticated user', {
        userId,
        originalSessionId: sessionId.substring(0, 8) + '...',
        linkedSurveys: updateResult.count
      });

      return { success: true, linkedSurveys: updateResult.count };

    } catch (error) {
      logger.error('Failed to link anonymous surveys to user', error instanceof Error ? error : new Error(String(error)), {
        sessionId: sessionId.substring(0, 8) + '...',
        userId
      });
      return { success: false, linkedSurveys: 0, error: 'Failed to link surveys' };
    }
  }

  /**
   * Get user's survey history (authenticated users only)
   */
  static async getUserSurveyHistory(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ success: boolean; surveys?: any[]; total?: number; error?: string }> {
    try {
      const [surveys, total] = await Promise.all([
        prisma.customerSurvey.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            status: true,
            completionPercentage: true,
            detectedUseCase: true,
            createdAt: true,
            updatedAt: true,
            expiresAt: true
          }
        }),
        prisma.customerSurvey.count({
          where: { userId }
        })
      ]);

      return { success: true, surveys, total };

    } catch (error) {
      logger.error('Failed to get user survey history', error instanceof Error ? error : new Error(String(error)), { userId });
      return { success: false, error: 'Failed to get survey history' };
    }
  }

  /**
   * Calculate survey completion percentage
   */
  private static calculateCompletionPercentage(data: Partial<CustomerData>): number {
    const requiredFields = [
      'age', 'biological-sex', 'weight', 'activity-level',
      'sodium-intake', 'potassium-intake', 'magnesium-intake', 'calcium-intake'
    ];
    
    const completedFields = requiredFields.filter(field => 
      data[field as keyof CustomerData] !== undefined && 
      data[field as keyof CustomerData] !== null && 
      data[field as keyof CustomerData] !== ''
    );

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  /**
   * Clean up expired anonymous surveys (maintenance task)
   */
  static async cleanupExpiredSurveys(): Promise<void> {
    try {
      const result = await prisma.customerSurvey.deleteMany({
        where: {
          expiresAt: {
            lte: new Date()
          },
          status: 'draft',
          userId: null // Only delete anonymous drafts
        }
      });

      logger.info('Expired anonymous survey drafts cleaned up', {
        deletedCount: result.count
      });

      } catch (error) {
    logger.error('Failed to cleanup expired surveys', error instanceof Error ? error : new Error(String(error)));
    }
  }
} 