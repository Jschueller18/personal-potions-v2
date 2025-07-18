/**
 * Supabase Client Configuration
 * 
 * Single database approach: Supabase for authentication, surveys, and formulations
 * Complete schema access (auth + public) with secure session management and V1 framework compatibility
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// ================== CLIENT-SIDE SUPABASE ==================

/**
 * Browser client for authentication and survey operations
 * Used in React components and client-side operations
 * Access to both auth and public schemas with RLS enforcement
 */
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce', // More secure for SPAs
  },
  global: {
    headers: {
      'x-application-name': 'personal-potions-v2',
    },
  },
});

// ================== SERVER-SIDE SUPABASE ==================

/**
 * Server client for server-side operations with elevated privileges
 * Used in API routes and middleware for full database access
 * Bypasses RLS for system operations (use carefully)
 */
export function createSupabaseServerClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is required for server operations');
  }

  return createClient<Database>(supabaseUrl!, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-application-name': 'personal-potions-v2-server',
      },
    },
  });
}

/**
 * Create server client for Next.js request context
 * This handles cookies and proper session management for SSR
 * Enforces RLS for user-scoped operations
 */
export function createSupabaseRequestClient(request: Request) {
  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-application-name': 'personal-potions-v2-request',
        'Authorization': `Bearer ${extractTokenFromRequest(request)}`,
      },
    },
  });
}

/**
 * Helper function to extract auth token from request
 */
function extractTokenFromRequest(request: Request): string | undefined {
  const cookies = request.headers.get('cookie');
  if (!cookies) return undefined;
  
  const tokenMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (tokenMatch) {
    try {
      const tokenData = JSON.parse(decodeURIComponent(tokenMatch[1]));
      return tokenData.access_token;
    } catch {
      return undefined;
    }
  }
  
  return undefined;
}

// ================== AUTHENTICATION HELPERS ==================

/**
 * Get current user session (client-side)
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
}

/**
 * Get current session (client-side)
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting current session:', error);
    return null;
  }
  return session;
}

/**
 * Sign out user (client-side)
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Validate session server-side
 */
export async function validateServerSession(sessionToken: string) {
  const serverClient = createSupabaseServerClient();
  
  try {
    const { data: { user }, error } = await serverClient.auth.getUser(sessionToken);
    if (error || !user) {
      return { isValid: false, user: null, error };
    }
    
    return { isValid: true, user, error: null };
  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, user: null, error };
  }
} 