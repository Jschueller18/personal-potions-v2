/**
 * Supabase Database Types - Main Export
 * 
 * Complete schema types for single Supabase database (auth + surveys + formulations)
 * Maintains V1 calculation framework compatibility with exact field preservation
 * 
 * Composed from focused modules to follow 200-300 line rule
 */

// Import focused schema modules
import type { AuthSchema, Json } from './database-auth-schema';
import type { PublicSchema } from './database-public-schema';

// Main database interface combining both schemas
export interface Database {
  auth: AuthSchema;
  public: PublicSchema;
}

// Re-export all types for convenience
export * from './database-auth-schema';
export * from './database-public-schema';

// Export Json type at top level (commonly used)
export type { Json };

// Helper types are re-exported from the focused modules above
// This keeps the main file clean and under the 200-300 line limit 