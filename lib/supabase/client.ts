/**
 * Supabase Client Configuration
 * 
 * Dual database approach: Supabase for authentication, Prisma for survey data
 * This ensures secure session management while maintaining V1 calculation framework compatibility
 */

import { createClient, createServerClient } from '@supabase/supabase-js';
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
 * Browser client for authentication and user session management
 * Used in React components and client-side operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce', // More secure for SPAs
  },
  db: {
    schema: 'auth', // Only use auth schema, not public
  },
  global: {
    headers: {
      'x-application-name': 'personal-potions-v2',
    },
  },
});

// ================== SERVER-SIDE SUPABASE ==================

/**
 * Server client for server-side authentication validation
 * Used in API routes and middleware for session validation
 */
export function createSupabaseServerClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is required for server operations');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'auth',
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
 */
export function createSupabaseRequestClient(request: Request) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        // Extract cookie from request headers
        const cookies = request.headers.get('cookie');
        if (!cookies) return undefined;
        
        const cookieMatch = cookies.match(new RegExp(`(^| )${name}=([^;]+)`));
        return cookieMatch ? decodeURIComponent(cookieMatch[2]) : undefined;
      },
      set() {
        // Not implemented for request context - handled by response
      },
      remove() {
        // Not implemented for request context - handled by response
      },
    },
    auth: {
      flowType: 'pkce',
    },
  });
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