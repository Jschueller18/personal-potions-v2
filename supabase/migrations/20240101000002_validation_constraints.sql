-- Personal Potions V2 - Validation Constraints Migration
-- Adds business logic validation constraints from V1 framework
-- Converted from Prisma constraints to work with Supabase schema

-- ================== CUSTOMER SURVEYS CONSTRAINTS ==================

-- Age validation (from V1 VALIDATION_LIMITS)
-- Extract age from JSONB and validate range 13-120
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_age 
CHECK (
  age IS NULL OR 
  (age >= 13 AND age <= 120)
);

-- Also validate age within customer_data JSONB
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_customer_data_age 
CHECK (
  customer_data->>'age' IS NULL OR 
  (customer_data->>'age')::INTEGER BETWEEN 13 AND 120
);

-- Weight validation (from V1 VALIDATION_LIMITS) 
-- Extract weight from JSONB and validate range 80-400 lbs
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_weight 
CHECK (
  weight IS NULL OR 
  (weight >= 80 AND weight <= 400)
);

-- Also validate weight within customer_data JSONB
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_customer_data_weight 
CHECK (
  customer_data->>'weight' IS NULL OR 
  (customer_data->>'weight')::NUMERIC BETWEEN 80 AND 400
);

-- Biological sex validation (from V1 enum)
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_biological_sex 
CHECK (
  biological_sex IS NULL OR 
  biological_sex IN ('male', 'female')
);

-- Also validate biological sex within customer_data JSONB
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_customer_data_biological_sex 
CHECK (
  customer_data->>'biological-sex' IS NULL OR
  customer_data->>'biological-sex' IN ('male', 'female')
);

-- Activity level validation (from V1 enum)
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_activity_level 
CHECK (
  activity_level IS NULL OR 
  activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very-active')
);

-- Sweat level validation (from V1 enum)
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_sweat_level 
CHECK (
  sweat_level IS NULL OR 
  sweat_level IN ('none', 'light', 'moderate', 'heavy')
);

-- Detected use case validation (from V1 UseCase enum)
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_detected_use_case 
CHECK (
  detected_use_case IS NULL OR 
  detected_use_case IN ('daily', 'sweat', 'bedtime', 'menstrual', 'hangover')
);

-- Completion percentage validation
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_completion_percentage 
CHECK (
  completion_percentage IS NULL OR 
  (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- Intake formats validation (must track all 4 electrolytes when present)
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_intake_formats 
CHECK (
  intake_formats IS NULL OR (
    intake_formats ? 'sodium-intake' AND 
    intake_formats ? 'potassium-intake' AND 
    intake_formats ? 'magnesium-intake' AND 
    intake_formats ? 'calcium-intake'
  )
);

-- Customer data structure validation
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_customer_data_structure 
CHECK (jsonb_typeof(customer_data) = 'object');

-- Session ID validation (must not be empty)
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_session_id 
CHECK (session_id IS NOT NULL AND LENGTH(session_id) > 0);

-- Source validation
ALTER TABLE public.customer_surveys 
ADD CONSTRAINT valid_source 
CHECK (
  source IS NULL OR 
  source IN ('web', 'mobile', 'api', 'admin')
);

-- ================== FORMULATION RESULTS CONSTRAINTS ==================

-- Use case validation (from V1 UseCase enum)
ALTER TABLE public.formulation_results 
ADD CONSTRAINT valid_use_case 
CHECK (use_case IN ('daily', 'sweat', 'bedtime', 'menstrual', 'hangover'));

-- Positive electrolyte amounts
ALTER TABLE public.formulation_results 
ADD CONSTRAINT positive_electrolyte_amounts 
CHECK (
  (sodium_mg IS NULL OR sodium_mg >= 0) AND
  (potassium_mg IS NULL OR potassium_mg >= 0) AND
  (magnesium_mg IS NULL OR magnesium_mg >= 0) AND
  (calcium_mg IS NULL OR calcium_mg >= 0)
);

-- Reasonable upper limits for electrolyte amounts (safety check)
ALTER TABLE public.formulation_results 
ADD CONSTRAINT reasonable_electrolyte_limits 
CHECK (
  (sodium_mg IS NULL OR sodium_mg <= 10000) AND     -- 10g max sodium
  (potassium_mg IS NULL OR potassium_mg <= 10000) AND -- 10g max potassium  
  (magnesium_mg IS NULL OR magnesium_mg <= 2000) AND  -- 2g max magnesium
  (calcium_mg IS NULL OR calcium_mg <= 5000)          -- 5g max calcium
);

-- Formulation result structure validation
ALTER TABLE public.formulation_results 
ADD CONSTRAINT valid_formulation_result_structure 
CHECK (jsonb_typeof(formulation_result) = 'object');

-- Price validation (must be positive cents)
ALTER TABLE public.formulation_results 
ADD CONSTRAINT valid_price_cents 
CHECK (price_cents IS NULL OR price_cents >= 0);

-- Formula version format validation
ALTER TABLE public.formulation_results 
ADD CONSTRAINT valid_formula_version 
CHECK (
  formula_version IS NULL OR 
  formula_version ~ '^[0-9]+\.[0-9]+$'  -- Format: X.Y
);

-- Serving size validation (common serving sizes)
ALTER TABLE public.formulation_results 
ADD CONSTRAINT valid_serving_size 
CHECK (
  serving_size IS NULL OR 
  serving_size IN (
    '8 fl oz (237ml)', 
    '12 fl oz (355ml)', 
    '16 fl oz (473ml)', 
    '20 fl oz (591ml)', 
    '24 fl oz (710ml)',
    '32 fl oz (946ml)'
  )
);

-- ================== INTAKE CONVERSIONS CONSTRAINTS ==================

-- Electrolyte validation (from V1 framework)
-- Already included in table definition CHECK constraint

-- Format validation  
-- Already included in table definition CHECK constraint

-- Positive converted amount
ALTER TABLE public.intake_conversions 
ADD CONSTRAINT positive_converted_mg 
CHECK (converted_mg >= 0);

-- Reasonable upper limit for converted amounts (safety check)
ALTER TABLE public.intake_conversions 
ADD CONSTRAINT reasonable_converted_limit 
CHECK (converted_mg <= 50000); -- 50g max (safety limit)

-- Original value validation (must not be empty)
ALTER TABLE public.intake_conversions 
ADD CONSTRAINT valid_original_value 
CHECK (original_value IS NOT NULL AND LENGTH(original_value) > 0);

-- Conversion source validation (from expected sources)
ALTER TABLE public.intake_conversions 
ADD CONSTRAINT valid_conversion_source 
CHECK (
  conversion_source IN (
    'LEGACY_INTAKE_ESTIMATES', 
    'DIRECT_NUMERIC', 
    'DEFAULT_ASSUMPTION',
    'USER_PROVIDED'
  )
);

-- ================== CROSS-TABLE BUSINESS RULES ==================

-- Ensure that formulation results are only created for completed surveys
-- Note: This could be enforced via triggers, but keeping as comment for documentation
-- The application logic should handle this constraint

-- ================== TRIGGER FOR UPDATED_AT ==================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for customer_surveys updated_at
CREATE TRIGGER update_customer_surveys_updated_at 
    BEFORE UPDATE ON public.customer_surveys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================== VALIDATION COMMENTS ==================

COMMENT ON CONSTRAINT valid_age ON public.customer_surveys IS 'Age must be between 13-120 years (V1 validation limits)';
COMMENT ON CONSTRAINT valid_weight ON public.customer_surveys IS 'Weight must be between 80-400 lbs (V1 validation limits)';
COMMENT ON CONSTRAINT valid_intake_formats ON public.customer_surveys IS 'Intake formats must track all 4 electrolytes when present';
COMMENT ON CONSTRAINT positive_electrolyte_amounts ON public.formulation_results IS 'All electrolyte amounts must be non-negative';
COMMENT ON CONSTRAINT reasonable_electrolyte_limits ON public.formulation_results IS 'Safety limits to prevent unreasonable electrolyte amounts'; 