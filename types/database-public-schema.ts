/**
 * Supabase Public Schema Types
 * 
 * Focused module for survey and formulation database types
 * Part of the single Supabase database approach with V1 compatibility
 */

import type { Json } from './database-auth-schema';

// Database-specific enums (avoid conflicts with existing enums)
export type CustomerSurveyStatus = 'draft' | 'completed' | 'processed'
export type DataSource = 'web' | 'mobile' | 'api' | 'admin'
export type IntakeFormat = 'legacy' | 'numeric'
export type Electrolyte = 'sodium' | 'potassium' | 'magnesium' | 'calcium'

export interface PublicSchema {
  Tables: {
    customer_surveys: {
      Row: {
        id: string
        user_id: string | null
        session_id: string
        customer_data: Json
        age: number | null
        biological_sex: string | null
        weight: number | null
        activity_level: string | null
        sweat_level: string | null
        detected_use_case: string | null
        intake_formats: Json | null
        status: CustomerSurveyStatus
        completion_percentage: number | null
        created_at: string
        updated_at: string
        expires_at: string | null
        source: string | null
        ip_address: string | null
        user_agent: string | null
      }
      Insert: {
        id?: string
        user_id?: string | null
        session_id: string
        customer_data: Json
        age?: number | null
        biological_sex?: string | null
        weight?: number | null
        activity_level?: string | null
        sweat_level?: string | null
        detected_use_case?: string | null
        intake_formats?: Json | null
        status?: CustomerSurveyStatus
        completion_percentage?: number | null
        created_at?: string
        updated_at?: string
        expires_at?: string | null
        source?: string | null
        ip_address?: string | null
        user_agent?: string | null
      }
      Update: {
        id?: string
        user_id?: string | null
        session_id?: string
        customer_data?: Json
        age?: number | null
        biological_sex?: string | null
        weight?: number | null
        activity_level?: string | null
        sweat_level?: string | null
        detected_use_case?: string | null
        intake_formats?: Json | null
        status?: CustomerSurveyStatus
        completion_percentage?: number | null
        created_at?: string
        updated_at?: string
        expires_at?: string | null
        source?: string | null
        ip_address?: string | null
        user_agent?: string | null
      }
    }
    formulation_results: {
      Row: {
        id: string
        customer_survey_id: string
        formulation_result: Json
        use_case: string
        formula_version: string | null
        serving_size: string | null
        sodium_mg: number | null
        potassium_mg: number | null
        magnesium_mg: number | null
        calcium_mg: number | null
        price_cents: number | null
        formula_name: string | null
        created_at: string
        calculation_timestamp: string
      }
      Insert: {
        id?: string
        customer_survey_id: string
        formulation_result: Json
        use_case: string
        formula_version?: string | null
        serving_size?: string | null
        sodium_mg?: number | null
        potassium_mg?: number | null
        magnesium_mg?: number | null
        calcium_mg?: number | null
        price_cents?: number | null
        formula_name?: string | null
        created_at?: string
        calculation_timestamp?: string
      }
      Update: {
        id?: string
        customer_survey_id?: string
        formulation_result?: Json
        use_case?: string
        formula_version?: string | null
        serving_size?: string | null
        sodium_mg?: number | null
        potassium_mg?: number | null
        magnesium_mg?: number | null
        calcium_mg?: number | null
        price_cents?: number | null
        formula_name?: string | null
        created_at?: string
        calculation_timestamp?: string
      }
    }
    intake_conversions: {
      Row: {
        id: string
        customer_survey_id: string
        electrolyte: string
        original_value: string
        original_format: string
        converted_mg: number
        conversion_source: string
        created_at: string
      }
      Insert: {
        id?: string
        customer_survey_id: string
        electrolyte: string
        original_value: string
        original_format: string
        converted_mg: number
        conversion_source: string
        created_at?: string
      }
      Update: {
        id?: string
        customer_survey_id?: string
        electrolyte?: string
        original_value?: string
        original_format?: string
        converted_mg?: number
        conversion_source?: string
        created_at?: string
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

// ================== PUBLIC SCHEMA HELPER TYPES ==================

// Customer Surveys
export type CustomerSurvey = PublicSchema['Tables']['customer_surveys']['Row']
export type CustomerSurveyInsert = PublicSchema['Tables']['customer_surveys']['Insert']
export type CustomerSurveyUpdate = PublicSchema['Tables']['customer_surveys']['Update']

// Formulation Results (renamed to avoid conflict with existing FormulationResult interface)
export type FormulationResultRecord = PublicSchema['Tables']['formulation_results']['Row']
export type FormulationResultInsert = PublicSchema['Tables']['formulation_results']['Insert']
export type FormulationResultUpdate = PublicSchema['Tables']['formulation_results']['Update']

// Intake Conversions
export type IntakeConversion = PublicSchema['Tables']['intake_conversions']['Row']
export type IntakeConversionInsert = PublicSchema['Tables']['intake_conversions']['Insert']
export type IntakeConversionUpdate = PublicSchema['Tables']['intake_conversions']['Update'] 