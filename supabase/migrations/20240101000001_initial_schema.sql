-- Personal Potions V2 - Supabase Database Schema Migration
-- Converts from dual database (Supabase auth + Prisma surveys) to single Supabase database
-- CRITICAL: Maintains V1 calculation framework compatibility with zero data loss

-- ================== CORE SURVEY DATA ==================

-- Main table storing complete V1 CustomerData with dual intake format support
CREATE TABLE public.customer_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- Proper FK constraint!
  session_id VARCHAR(255) NOT NULL,
  
  -- V1 Customer Data (JSONB for exact preservation)
  -- Complete CustomerData interface stored as JSONB - preserves all 26 fields exactly
  customer_data JSONB NOT NULL,
  
  -- Derived fields for performance (extracted from JSONB)
  age INTEGER,
  biological_sex TEXT,
  weight DECIMAL(5,2),
  activity_level TEXT,
  sweat_level TEXT,
  detected_use_case TEXT,
  
  -- CRITICAL: Intake format tracking for dual support
  -- Tracks whether each intake field used 'legacy' or 'numeric' format
  intake_formats JSONB,
  
  -- Status and metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'processed')),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- HIPAA audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  source TEXT DEFAULT 'web',
  ip_address INET,
  user_agent TEXT
);

-- ================== FORMULATION RESULTS ==================

-- Stores calculated V1 formulation outputs with metadata
CREATE TABLE public.formulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_survey_id UUID NOT NULL REFERENCES public.customer_surveys(id) ON DELETE CASCADE,
  
  -- V1 Formulation Result (exact structure preservation)
  -- Complete FormulationResult interface stored as JSONB
  formulation_result JSONB NOT NULL,
  
  -- Quick access fields (indexed for performance)
  use_case TEXT NOT NULL,
  formula_version TEXT DEFAULT '1.4',
  serving_size TEXT DEFAULT '16 fl oz (473ml)',
  
  -- Electrolyte amounts per serving (mg) - extracted for fast queries
  sodium_mg DECIMAL(8,3),
  potassium_mg DECIMAL(8,3),
  magnesium_mg DECIMAL(8,3),
  calcium_mg DECIMAL(8,3),
  
  -- Business fields
  price_cents INTEGER,
  formula_name TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  calculation_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ================== INTAKE CONVERSION AUDIT ==================

-- Tracks dual format intake conversions for audit and debugging
CREATE TABLE public.intake_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_survey_id UUID NOT NULL REFERENCES public.customer_surveys(id) ON DELETE CASCADE,
  
  -- Conversion tracking
  electrolyte TEXT NOT NULL CHECK (electrolyte IN ('sodium', 'potassium', 'magnesium', 'calcium')),
  original_value TEXT NOT NULL,
  original_format TEXT NOT NULL CHECK (original_format IN ('legacy', 'numeric')),
  converted_mg DECIMAL(8,3) NOT NULL,
  conversion_source TEXT NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================== PERFORMANCE INDEXES ==================

-- Core indexes for foreign keys and lookups
CREATE INDEX idx_customer_surveys_user_id ON public.customer_surveys(user_id);
CREATE INDEX idx_customer_surveys_session_id ON public.customer_surveys(session_id);
CREATE INDEX idx_customer_surveys_status ON public.customer_surveys(status);
CREATE INDEX idx_customer_surveys_age ON public.customer_surveys(age);
CREATE INDEX idx_customer_surveys_biological_sex ON public.customer_surveys(biological_sex);
CREATE INDEX idx_customer_surveys_use_case ON public.customer_surveys(detected_use_case);
CREATE INDEX idx_customer_surveys_created_at ON public.customer_surveys(created_at);

-- Formulation results indexes
CREATE INDEX idx_formulation_results_survey_id ON public.formulation_results(customer_survey_id);
CREATE INDEX idx_formulation_results_use_case ON public.formulation_results(use_case);
CREATE INDEX idx_formulation_results_created_at ON public.formulation_results(created_at);

-- Intake conversions indexes
CREATE INDEX idx_intake_conversions_survey_id ON public.intake_conversions(customer_survey_id);
CREATE INDEX idx_intake_conversions_electrolyte ON public.intake_conversions(electrolyte);
CREATE INDEX idx_intake_conversions_format ON public.intake_conversions(original_format);

-- GIN indexes for JSONB fields (for fast queries)
CREATE INDEX idx_customer_surveys_customer_data_gin ON public.customer_surveys USING GIN (customer_data);
CREATE INDEX idx_customer_surveys_intake_formats_gin ON public.customer_surveys USING GIN (intake_formats);
CREATE INDEX idx_formulation_results_formulation_gin ON public.formulation_results USING GIN (formulation_result);

-- ================== TABLE COMMENTS ==================

COMMENT ON TABLE public.customer_surveys IS 'Stores complete V1 CustomerData with exact field preservation and dual intake format support';
COMMENT ON COLUMN public.customer_surveys.customer_data IS 'Complete CustomerData interface as JSONB - preserves all 26 V1 fields exactly';
COMMENT ON COLUMN public.customer_surveys.intake_formats IS 'Tracks whether each intake field used legacy or numeric format: {"sodium": "legacy", "potassium": "numeric", ...}';

COMMENT ON TABLE public.formulation_results IS 'Stores calculated V1 formulation outputs with complete metadata preservation';
COMMENT ON COLUMN public.formulation_results.formulation_result IS 'Complete FormulationResult interface as JSONB - preserves all calculation metadata';

COMMENT ON TABLE public.intake_conversions IS 'Audit trail for dual format intake conversions - tracks legacy to mg mappings'; 