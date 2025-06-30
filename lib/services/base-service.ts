/**
 * Base Service Class
 * 
 * Provides common database operations and error handling patterns
 * Eliminates code duplication across service classes
 */

import { createSupabaseServerClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/database';

export abstract class BaseService {
  /**
   * Get Supabase client instance
   * Centralizes client creation to eliminate duplication
   */
  protected static getSupabaseClient() {
    return createSupabaseServerClient();
  }

  /**
   * Standard error handler for database operations
   * Provides consistent error logging and response formatting
   */
  protected static handleDatabaseError(
    operation: string,
    error: any,
    context?: Record<string, any>
  ): { success: false; error: string } {
    logger.error(`Database operation failed: ${operation}`, error instanceof Error ? error : new Error(String(error)), context);
    return { success: false, error: `Failed to ${operation}` };
  }

  /**
   * Standard success handler for database operations
   * Provides consistent success logging
   */
  protected static handleDatabaseSuccess(
    operation: string,
    context?: Record<string, any>
  ): void {
    logger.info(`Database operation succeeded: ${operation}`, context);
  }

  /**
   * Mask sensitive session ID for logging
   */
  protected static maskSessionId(sessionId: string): string {
    return sessionId.substring(0, 8) + '...';
  }
} 