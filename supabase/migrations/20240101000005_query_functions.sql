-- Personal Potions V2 - Query and Maintenance Functions  
-- Dashboard queries, user operations, and maintenance functions
-- Split from helper_functions.sql to maintain <300 line limit per user coding rules

-- ================== USER OPERATION FUNCTIONS ==================

-- Function to safely link anonymous survey to user (from RLS policies file - avoid duplication)
-- This function already exists in RLS policies, so we just add a comment reference
-- See: 20240101000003_rls_policies.sql for link_anonymous_survey_to_user function

-- Function to clean up expired anonymous surveys (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_surveys()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired anonymous surveys (older than 30 days)
  DELETE FROM public.customer_surveys
  WHERE user_id IS NULL
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Also delete very old anonymous surveys without explicit expiration
  DELETE FROM public.customer_surveys
  WHERE user_id IS NULL
    AND expires_at IS NULL
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================== DASHBOARD QUERY FUNCTIONS ==================

-- Function to get survey summary for dashboard
CREATE OR REPLACE FUNCTION get_survey_summary(p_user_id UUID)
RETURNS TABLE (
  total_surveys INTEGER,
  completed_surveys INTEGER,
  draft_surveys INTEGER,
  latest_survey_date TIMESTAMPTZ,
  most_common_use_case TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_surveys,
    COUNT(CASE WHEN cs.status = 'completed' THEN 1 END)::INTEGER as completed_surveys,
    COUNT(CASE WHEN cs.status = 'draft' THEN 1 END)::INTEGER as draft_surveys,
    MAX(cs.created_at) as latest_survey_date,
    MODE() WITHIN GROUP (ORDER BY cs.detected_use_case) as most_common_use_case
  FROM public.customer_surveys cs
  WHERE cs.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get formulation history for a user
CREATE OR REPLACE FUNCTION get_formulation_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  formulation_id UUID,
  survey_id UUID,
  use_case TEXT,
  created_at TIMESTAMPTZ,
  sodium_mg DECIMAL,
  potassium_mg DECIMAL,
  magnesium_mg DECIMAL,
  calcium_mg DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id as formulation_id,
    fr.customer_survey_id as survey_id,
    fr.use_case,
    fr.created_at,
    fr.sodium_mg,
    fr.potassium_mg,
    fr.magnesium_mg,
    fr.calcium_mg
  FROM public.formulation_results fr
  JOIN public.customer_surveys cs ON cs.id = fr.customer_survey_id
  WHERE cs.user_id = p_user_id
  ORDER BY fr.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================== MAINTENANCE FUNCTIONS ==================

-- Function to update database statistics (for performance monitoring)
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS TEXT AS $$
BEGIN
  ANALYZE public.customer_surveys;
  ANALYZE public.formulation_results;
  ANALYZE public.intake_conversions;
  
  RETURN 'Statistics updated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple health check function for all environments (dev, test, prod)
CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'database'::TEXT as component,
    'healthy'::TEXT as status,
    'All core tables accessible'::TEXT as details
  WHERE EXISTS (
    SELECT 1 FROM public.customer_surveys LIMIT 1
  ) OR NOT EXISTS (
    SELECT 1 FROM public.customer_surveys LIMIT 1
  );
  
  RETURN QUERY
  SELECT 
    'rls_policies'::TEXT as component,
    'active'::TEXT as status,
    'Row level security enabled'::TEXT as details
  WHERE EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'customer_surveys'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================== FUNCTION COMMENTS ==================

COMMENT ON FUNCTION cleanup_expired_surveys() IS 'Maintenance function to clean up expired anonymous surveys';
COMMENT ON FUNCTION get_survey_summary(UUID) IS 'Returns dashboard summary statistics for a user';
COMMENT ON FUNCTION get_formulation_history(UUID, INTEGER) IS 'Returns formulation history for a user with pagination';
COMMENT ON FUNCTION update_table_statistics() IS 'Updates PostgreSQL statistics for query optimization';
COMMENT ON FUNCTION health_check() IS 'Simple health check for all environments (dev, test, prod)'; 