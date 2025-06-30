/**
 * Survey Service
 * 
 * Handles survey draft operations within single Supabase database
 * Focused on survey CRUD operations with proper ownership validation
 */

import { BaseService } from './base-service';
import type { CustomerData } from '@/types/interfaces';
import type { 
  CustomerSurveyInsert,
  CustomerSurveyUpdate
} from '@/types/database';

export class SurveyService extends BaseService {

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
      const supabase = this.getSupabaseClient();
      
      // Create survey draft data with snake_case field names
      const surveyInsert: CustomerSurveyInsert = {
        user_id: userId || null,
        session_id: sessionId,
        customer_data: surveyData as any,
        status: 'draft',
        completion_percentage: this.calculateCompletionPercentage(surveyData),
        detected_use_case: useCase,
        source: 'web',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        age: surveyData.age,
        biological_sex: surveyData['biological-sex'],
        weight: surveyData.weight ? parseFloat(surveyData.weight.toString()) : null,
        activity_level: surveyData['activity-level'],
        sweat_level: surveyData['sweat-level']
      };

      const { data: survey, error } = await supabase
        .from('customer_surveys')
        .insert(surveyInsert)
        .select()
        .single();

      if (error) {
        return this.handleDatabaseError('create survey draft', error, {
          userId: userId || 'anonymous',
          sessionId: this.maskSessionId(sessionId)
        });
      }

      this.handleDatabaseSuccess('create survey draft', {
        draftId: survey.id,
        userId: userId || 'anonymous',
        sessionId: this.maskSessionId(sessionId),
        completionPercentage: survey.completion_percentage
      });

      return { success: true, draftId: survey.id };

    } catch (error) {
      return this.handleDatabaseError('create survey draft', error, {
        userId: userId || 'anonymous',
        sessionId: this.maskSessionId(sessionId)
      });
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
      const supabase = this.getSupabaseClient();
      
      // Build query with ownership validation
      let query = supabase
        .from('customer_surveys')
        .select('*')
        .eq('id', draftId);

      // Add ownership filter
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('session_id', sessionId).is('user_id', null);
      }

      const { data: survey, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Survey draft not found or access denied' };
        }
        return this.handleDatabaseError('load survey draft', error, { draftId });
      }

      // Check if expired
      if (survey.expires_at && new Date() > new Date(survey.expires_at)) {
        return { success: false, error: 'Survey draft has expired' };
      }

      return { success: true, draft: survey };

    } catch (error) {
      return this.handleDatabaseError('load survey draft', error, { draftId });
    }
  }

  /**
   * Link anonymous survey data to authenticated user
   */
  static async linkAnonymousSurveyToUser(
    sessionId: string,
    userId: string
  ): Promise<{ success: boolean; linkedSurveys: number; error?: string }> {
    try {
      const supabase = this.getSupabaseClient();
      
      // Find all anonymous surveys for this session
      const { data: anonymousSurveys, error: findError } = await supabase
        .from('customer_surveys')
        .select('id')
        .eq('session_id', sessionId)
        .is('user_id', null)
        .eq('status', 'draft');

      if (findError) {
        this.handleDatabaseError('find anonymous surveys', findError, {
          sessionId: this.maskSessionId(sessionId),
          userId
        });
        return { success: false, linkedSurveys: 0, error: 'Failed to find surveys' };
      }

      if (anonymousSurveys.length === 0) {
        return { success: true, linkedSurveys: 0 };
      }

      // Update surveys to link them to the authenticated user
      const updateData: CustomerSurveyUpdate = {
        user_id: userId,
        session_id: `auth_${userId.substring(0, 8)}_${Date.now()}`
      };

      const { data: updatedSurveys, error: updateError } = await supabase
        .from('customer_surveys')
        .update(updateData)
        .eq('session_id', sessionId)
        .is('user_id', null)
        .eq('status', 'draft')
        .select('id');

      if (updateError) {
        this.handleDatabaseError('link surveys to user', updateError, {
          sessionId: this.maskSessionId(sessionId),
          userId
        });
        return { success: false, linkedSurveys: 0, error: 'Failed to link surveys' };
      }

      const linkedCount = updatedSurveys?.length || 0;

      this.handleDatabaseSuccess('link anonymous surveys to user', {
        userId,
        originalSessionId: this.maskSessionId(sessionId),
        linkedSurveys: linkedCount
      });

      return { success: true, linkedSurveys: linkedCount };

    } catch (error) {
      this.handleDatabaseError('link anonymous surveys to user', error, {
        sessionId: this.maskSessionId(sessionId),
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
      const supabase = this.getSupabaseClient();
      
      // Get surveys with pagination
      const { data: surveys, error: surveysError } = await supabase
        .from('customer_surveys')
        .select(`
          id,
          status,
          completion_percentage,
          detected_use_case,
          created_at,
          updated_at,
          expires_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (surveysError) {
        this.handleDatabaseError('get user survey history', surveysError, { userId });
        return { success: false, error: 'Failed to get survey history' };
      }

      // Get total count
      const { count: total, error: countError } = await supabase
        .from('customer_surveys')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        this.handleDatabaseError('count user surveys', countError, { userId });
        return { success: false, error: 'Failed to get survey count' };
      }

      return { success: true, surveys, total: total || 0 };

    } catch (error) {
      this.handleDatabaseError('get user survey history', error, { userId });
      return { success: false, error: 'Failed to get survey history' };
    }
  }

  /**
   * Clean up expired anonymous surveys (maintenance task)
   */
  static async cleanupExpiredSurveys(): Promise<void> {
    try {
      const supabase = this.getSupabaseClient();
      
      const { data: deletedSurveys, error } = await supabase
        .from('customer_surveys')
        .delete()
        .lte('expires_at', new Date().toISOString())
        .eq('status', 'draft')
        .is('user_id', null)
        .select('id');

      if (error) {
        this.handleDatabaseError('cleanup expired surveys', error);
        return;
      }

      const deletedCount = deletedSurveys?.length || 0;
      this.handleDatabaseSuccess('cleanup expired surveys', { deletedCount });

    } catch (error) {
      this.handleDatabaseError('cleanup expired surveys', error);
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
} 