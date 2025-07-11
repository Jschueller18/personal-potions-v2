/**
 * Supabase Auth Schema Types
 * 
 * Focused module for authentication-related database types
 * Part of the single Supabase database approach
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AuthSchema {
  Tables: {
    users: {
      Row: {
        id: string
        aud: string
        role: string
        email: string
        email_confirmed_at: string | null
        phone: string | null
        confirmed_at: string | null
        last_sign_in_at: string | null
        app_metadata: Json
        user_metadata: Json
        is_super_admin: boolean
        created_at: string
        updated_at: string
        phone_confirmed_at: string | null
        phone_change: string | null
        phone_change_token: string | null
        phone_change_sent_at: string | null
        email_change: string | null
        email_change_token_new: string | null
        email_change_token_current: string | null
        email_change_sent_at: string | null
        recovery_token: string | null
        recovery_sent_at: string | null
        email_change_confirm_status: number | null
        banned_until: string | null
        reauthentication_token: string | null
        reauthentication_sent_at: string | null
        is_sso_user: boolean
        deleted_at: string | null
      }
      Insert: {
        id?: string
        aud?: string
        role?: string
        email: string
        email_confirmed_at?: string | null
        phone?: string | null
        confirmed_at?: string | null
        last_sign_in_at?: string | null
        app_metadata?: Json
        user_metadata?: Json
        is_super_admin?: boolean
        created_at?: string
        updated_at?: string
        phone_confirmed_at?: string | null
        phone_change?: string | null
        phone_change_token?: string | null
        phone_change_sent_at?: string | null
        email_change?: string | null
        email_change_token_new?: string | null
        email_change_token_current?: string | null
        email_change_sent_at?: string | null
        recovery_token?: string | null
        recovery_sent_at?: string | null
        email_change_confirm_status?: number | null
        banned_until?: string | null
        reauthentication_token?: string | null
        reauthentication_sent_at?: string | null
        is_sso_user?: boolean
        deleted_at?: string | null
      }
      Update: {
        id?: string
        aud?: string
        role?: string
        email?: string
        email_confirmed_at?: string | null
        phone?: string | null
        confirmed_at?: string | null
        last_sign_in_at?: string | null
        app_metadata?: Json
        user_metadata?: Json
        is_super_admin?: boolean
        created_at?: string
        updated_at?: string
        phone_confirmed_at?: string | null
        phone_change?: string | null
        phone_change_token?: string | null
        phone_change_sent_at?: string | null
        email_change?: string | null
        email_change_token_new?: string | null
        email_change_token_current?: string | null
        email_change_sent_at?: string | null
        recovery_token?: string | null
        recovery_sent_at?: string | null
        email_change_confirm_status?: number | null
        banned_until?: string | null
        reauthentication_token?: string | null
        reauthentication_sent_at?: string | null
        is_sso_user?: boolean
        deleted_at?: string | null
      }
    }
  }
  Views: {
    [_ in never]: never
  }
  Functions: {
    [_ in never]: never
  }
  Enums: {
    [_ in never]: never
  }
  CompositeTypes: {
    [_ in never]: never
  }
}

// ================== AUTH HELPER TYPES ==================

export type AuthUser = AuthSchema['Tables']['users']['Row']
export type AuthUserInsert = AuthSchema['Tables']['users']['Insert']
export type AuthUserUpdate = AuthSchema['Tables']['users']['Update'] 