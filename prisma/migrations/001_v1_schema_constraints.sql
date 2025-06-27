-- Personal Potions V1 Database Schema - Additional Constraints and Indexes
-- This migration adds validation constraints and performance indexes that Prisma cannot express

-- ================== CUSTOMER SURVEYS CONSTRAINTS ==================

-- Age validation (from V1 VALIDATION_LIMITS)
ALTER TABLE customer_surveys 
ADD CONSTRAINT valid_age 
CHECK ((customer_data->>'age')::INTEGER BETWEEN 13 AND 120);

-- Weight validation (from V1 VALIDATION_LIMITS)
ALTER TABLE customer_surveys 
ADD CONSTRAINT valid_weight 
CHECK ((customer_data->>'weight')::NUMERIC BETWEEN 80 AND 400);

-- Biological sex validation (from V1 enum)
ALTER TABLE customer_surveys 
ADD CONSTRAINT valid_biological_sex 
CHECK (customer_data->>'biological-sex' IN ('male', 'female'));

-- Status validation
ALTER TABLE customer_surveys 
ADD CONSTRAINT valid_status 
CHECK (status IN ('draft', 'completed', 'processed'));

-- Completion percentage validation
ALTER TABLE customer_surveys 
ADD CONSTRAINT valid_completion_percentage 
CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

-- Intake formats validation (must track all 4 electrolytes)
ALTER TABLE customer_surveys 
ADD CONSTRAINT valid_intake_formats 
CHECK (
  intake_formats IS NULL OR (
    intake_formats ? 'sodium' AND 
    intake_formats ? 'potassium' AND 
    intake_formats ? 'magnesium' AND 
    intake_formats ? 'calcium'
  )
);

-- Customer data structure validation
ALTER TABLE customer_surveys 
ADD CONSTRAINT valid_customer_data_structure 
CHECK (jsonb_typeof(customer_data) = 'object');

-- ================== FORMULATION RESULTS CONSTRAINTS ==================

-- Use case validation (from V1 UseCase enum)
ALTER TABLE formulation_results 
ADD CONSTRAINT valid_use_case 
CHECK (use_case IN ('daily', 'sweat', 'bedtime', 'menstrual', 'hangover'));

-- Positive electrolyte amounts
ALTER TABLE formulation_results 
ADD CONSTRAINT positive_electrolyte_amounts 
CHECK (
  (sodium_mg IS NULL OR sodium_mg >= 0) AND
  (potassium_mg IS NULL OR potassium_mg >= 0) AND
  (magnesium_mg IS NULL OR magnesium_mg >= 0) AND
  (calcium_mg IS NULL OR calcium_mg >= 0)
);

-- Formulation result structure validation
ALTER TABLE formulation_results 
ADD CONSTRAINT valid_formulation_result_structure 
CHECK (jsonb_typeof(formulation_result) = 'object');

-- Price validation (must be positive cents)
ALTER TABLE formulation_results 
ADD CONSTRAINT valid_price_cents 
CHECK (price_cents IS NULL OR price_cents >= 0);

-- ================== INTAKE CONVERSIONS CONSTRAINTS ==================

-- Electrolyte validation (from V1 framework)
ALTER TABLE intake_conversions 
ADD CONSTRAINT valid_electrolyte 
CHECK (electrolyte IN ('sodium', 'potassium', 'magnesium', 'calcium'));

-- Format validation
ALTER TABLE intake_conversions 
ADD CONSTRAINT valid_format 
CHECK (original_format IN ('legacy', 'numeric'));

-- Positive converted amount
ALTER TABLE intake_conversions 
ADD CONSTRAINT positive_converted_mg 
CHECK (converted_mg >= 0);

-- ================== PERFORMANCE INDEXES ==================

-- GIN indexes for JSONB fields (for fast queries)
CREATE INDEX idx_customer_surveys_customer_data_gin 
ON customer_surveys USING GIN (customer_data);

CREATE INDEX idx_customer_surveys_intake_formats_gin 
ON customer_surveys USING GIN (intake_formats);

CREATE INDEX idx_formulation_results_formulation_gin 
ON formulation_results USING GIN (formulation_result);

-- ================== COMMENTS FOR DOCUMENTATION ==================

COMMENT ON TABLE customer_surveys IS 'Stores complete V1 CustomerData with exact field preservation and dual intake format support';
COMMENT ON COLUMN customer_surveys.customer_data IS 'Complete CustomerData interface as JSONB - preserves all 26 V1 fields exactly';
COMMENT ON COLUMN customer_surveys.intake_formats IS 'Tracks whether each intake field used legacy or numeric format: {"sodium": "legacy", "potassium": "numeric", ...}';

COMMENT ON TABLE formulation_results IS 'Stores calculated V1 formulation outputs with complete metadata preservation';
COMMENT ON COLUMN formulation_results.formulation_result IS 'Complete FormulationResult interface as JSONB - preserves all calculation metadata';

COMMENT ON TABLE intake_conversions IS 'Audit trail for dual format intake conversions - tracks legacy to mg mappings';

-- ================== SAMPLE QUERIES FOR TESTING ==================

-- Sample query examples (for testing and documentation)
-- Query all customers with sleep issues:
-- SELECT id, customer_data->'sleep-issues' as sleep_issues FROM customer_surveys WHERE customer_data->'sleep-issues' != 'null'::jsonb;

-- Query customers by intake format:
-- SELECT id, intake_formats FROM customer_surveys WHERE intake_formats->>'sodium' = 'legacy';

-- Query formulations by use case:
-- SELECT id, use_case, sodium_mg, potassium_mg FROM formulation_results WHERE use_case = 'bedtime';

-- Query intake conversions for audit:
-- SELECT electrolyte, original_value, original_format, converted_mg FROM intake_conversions WHERE customer_survey_id = 'uuid-here'; 