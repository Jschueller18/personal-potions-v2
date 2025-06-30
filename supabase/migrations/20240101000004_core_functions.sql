-- Personal Potions V2 - Core Database Functions
-- Essential functions for survey management, formulation storage, and intake conversion
-- Split from helper_functions.sql to maintain <300 line limit per user coding rules

-- ================== VALIDATION HELPERS ==================

-- Shared validation function to avoid duplication
CREATE OR REPLACE FUNCTION validate_jsonb_object(p_data JSONB, p_context TEXT)
RETURNS VOID AS $$
BEGIN
  IF p_data IS NULL OR jsonb_typeof(p_data) != 'object' THEN
    RAISE EXCEPTION '% must be a valid JSON object', p_context;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Shared function to extract numeric value from JSONB (avoid duplication)
CREATE OR REPLACE FUNCTION extract_numeric_from_jsonb(p_data JSONB, p_key TEXT)
RETURNS DECIMAL AS $$
BEGIN
  IF p_data->>p_key ~ '^[0-9]+\.?[0-9]*$' THEN
    RETURN (p_data->>p_key)::DECIMAL;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================== SURVEY MANAGEMENT FUNCTIONS ==================

-- Function to create a new survey draft with proper validation
CREATE OR REPLACE FUNCTION create_survey_draft(
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_customer_data JSONB DEFAULT '{}'::jsonb,
  p_source TEXT DEFAULT 'web'
)
RETURNS UUID AS $$
DECLARE
  survey_id UUID;
BEGIN
  -- Validate inputs using shared function
  IF p_session_id IS NULL OR LENGTH(p_session_id) = 0 THEN
    RAISE EXCEPTION 'Session ID cannot be empty';
  END IF;
  
  PERFORM validate_jsonb_object(p_customer_data, 'Customer data');
  
  -- Insert new survey
  INSERT INTO public.customer_surveys (
    user_id, session_id, customer_data, status, completion_percentage, source
  ) VALUES (
    p_user_id, p_session_id, p_customer_data, 'draft', 0, p_source
  ) RETURNING id INTO survey_id;
  
  RETURN survey_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update survey progress with derived field extraction
CREATE OR REPLACE FUNCTION update_survey_progress(
  p_survey_id UUID,
  p_customer_data JSONB,
  p_completion_percentage DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  calculated_percentage DECIMAL;
  completed_fields INTEGER := 0;
BEGIN
  PERFORM validate_jsonb_object(p_customer_data, 'Customer data');
  
  -- Calculate completion percentage if not provided
  IF p_completion_percentage IS NULL THEN
    SELECT COUNT(*) INTO completed_fields
    FROM jsonb_each_text(p_customer_data)
    WHERE value IS NOT NULL AND value != '' AND value != 'null';
    
    calculated_percentage := (completed_fields::DECIMAL / 26::DECIMAL) * 100; -- 26 V1 fields
  ELSE
    calculated_percentage := p_completion_percentage;
  END IF;
  
  -- Update survey with extracted derived fields
  UPDATE public.customer_surveys
  SET 
    customer_data = p_customer_data,
    completion_percentage = calculated_percentage,
    age = extract_numeric_from_jsonb(p_customer_data, 'age')::INTEGER,
    biological_sex = p_customer_data->>'biological-sex',
    weight = extract_numeric_from_jsonb(p_customer_data, 'weight'),
    activity_level = p_customer_data->>'activity-level',
    sweat_level = p_customer_data->>'sweat-level',
    detected_use_case = p_customer_data->>'detected-use-case',
    updated_at = NOW(),
    status = CASE WHEN calculated_percentage >= 100 THEN 'completed' ELSE 'draft' END
  WHERE id = p_survey_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================== FORMULATION FUNCTIONS ==================

-- Function to store formulation result with extracted electrolyte amounts
CREATE OR REPLACE FUNCTION store_formulation_result(
  p_customer_survey_id UUID,
  p_formulation_result JSONB,
  p_use_case TEXT,
  p_formula_version TEXT DEFAULT '1.4',
  p_serving_size TEXT DEFAULT '16 fl oz (473ml)'
)
RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  -- Validate inputs
  IF p_customer_survey_id IS NULL THEN
    RAISE EXCEPTION 'Customer survey ID cannot be null';
  END IF;
  
  PERFORM validate_jsonb_object(p_formulation_result, 'Formulation result');
  
  -- Insert with extracted electrolyte amounts using shared function
  INSERT INTO public.formulation_results (
    customer_survey_id, formulation_result, use_case, formula_version, serving_size,
    sodium_mg, potassium_mg, magnesium_mg, calcium_mg,
    price_cents, formula_name
  ) VALUES (
    p_customer_survey_id, p_formulation_result, p_use_case, p_formula_version, p_serving_size,
    extract_numeric_from_jsonb(p_formulation_result->'electrolytes', 'sodium'),
    extract_numeric_from_jsonb(p_formulation_result->'electrolytes', 'potassium'),
    extract_numeric_from_jsonb(p_formulation_result->'electrolytes', 'magnesium'),
    extract_numeric_from_jsonb(p_formulation_result->'electrolytes', 'calcium'),
    CASE WHEN p_formulation_result->>'price_cents' ~ '^[0-9]+$' 
         THEN (p_formulation_result->>'price_cents')::INTEGER ELSE NULL END,
    p_formulation_result->>'formula_name'
  ) RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================== INTAKE CONVERSION FUNCTIONS ==================

-- Function to record intake conversion for audit trail
CREATE OR REPLACE FUNCTION record_intake_conversion(
  p_customer_survey_id UUID,
  p_electrolyte TEXT,
  p_original_value TEXT,
  p_original_format TEXT,
  p_converted_mg DECIMAL,
  p_conversion_source TEXT
)
RETURNS UUID AS $$
DECLARE
  conversion_id UUID;
BEGIN
  -- Validate inputs (simple validation, no duplication)
  IF p_electrolyte NOT IN ('sodium', 'potassium', 'magnesium', 'calcium') THEN
    RAISE EXCEPTION 'Invalid electrolyte: %', p_electrolyte;
  END IF;
  
  IF p_original_format NOT IN ('legacy', 'numeric') THEN
    RAISE EXCEPTION 'Invalid format: %', p_original_format;
  END IF;
  
  IF p_converted_mg < 0 THEN
    RAISE EXCEPTION 'Converted amount cannot be negative';
  END IF;
  
  -- Insert conversion record
  INSERT INTO public.intake_conversions (
    customer_survey_id, electrolyte, original_value, original_format, 
    converted_mg, conversion_source
  ) VALUES (
    p_customer_survey_id, p_electrolyte, p_original_value, p_original_format,
    p_converted_mg, p_conversion_source
  ) RETURNING id INTO conversion_id;
  
  RETURN conversion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================== FUNCTION COMMENTS ==================

COMMENT ON FUNCTION validate_jsonb_object(JSONB, TEXT) IS 'Shared validation function to avoid code duplication';
COMMENT ON FUNCTION extract_numeric_from_jsonb(JSONB, TEXT) IS 'Shared function to extract numeric values from JSONB, avoiding repetitive CASE statements';
COMMENT ON FUNCTION create_survey_draft(TEXT, UUID, JSONB, TEXT) IS 'Creates new survey draft with validation';
COMMENT ON FUNCTION update_survey_progress(UUID, JSONB, DECIMAL) IS 'Updates survey progress and extracts derived fields';
COMMENT ON FUNCTION store_formulation_result(UUID, JSONB, TEXT, TEXT, TEXT) IS 'Stores formulation results with extracted electrolyte amounts';
COMMENT ON FUNCTION record_intake_conversion(UUID, TEXT, TEXT, TEXT, DECIMAL, TEXT) IS 'Records intake conversions for audit trail'; 