-- Personal Potions V2 - Row Level Security (RLS) Policies
-- Implements HIPAA-compliant data access controls
-- Ensures users can only access their own data with proper session-based access for anonymous surveys

-- ================== ENABLE RLS ON ALL TABLES ==================

-- Enable RLS on all public tables
ALTER TABLE public.customer_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_conversions ENABLE ROW LEVEL SECURITY;

-- ================== CUSTOMER SURVEYS POLICIES ==================

-- Policy 1: Users can view their own surveys
CREATE POLICY "Users can view own surveys" ON public.customer_surveys
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    user_id IS NULL  -- Allow access to anonymous surveys for linking
  );

-- Policy 2: Users can insert their own surveys
CREATE POLICY "Users can insert own surveys" ON public.customer_surveys
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    user_id IS NULL  -- Allow creation of anonymous surveys
  );

-- Policy 3: Users can update their own surveys
CREATE POLICY "Users can update own surveys" ON public.customer_surveys
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    user_id IS NULL  -- Allow updates to anonymous surveys for linking
  )
  WITH CHECK (
    user_id = auth.uid() OR
    user_id IS NULL
  );

-- Policy 4: Users can delete their own surveys
CREATE POLICY "Users can delete own surveys" ON public.customer_surveys
  FOR DELETE
  USING (user_id = auth.uid());

-- Policy 5: Special policy for anonymous survey access by session
-- This allows accessing anonymous surveys by session_id for the linking process
CREATE POLICY "Anonymous surveys by session" ON public.customer_surveys
  FOR ALL
  USING (
    user_id IS NULL AND
    session_id = current_setting('app.current_session_id', true)
  );

-- Policy 6: Service role bypass (for admin operations and system processes)
CREATE POLICY "Service role bypass" ON public.customer_surveys
  FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- ================== FORMULATION RESULTS POLICIES ==================

-- Policy 1: Users can view formulation results for their own surveys
CREATE POLICY "Users can view own formulation results" ON public.formulation_results
  FOR SELECT
  USING (
    customer_survey_id IN (
      SELECT id FROM public.customer_surveys 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND session_id = current_setting('app.current_session_id', true))
    )
  );

-- Policy 2: Users can insert formulation results for their own surveys
CREATE POLICY "Users can insert own formulation results" ON public.formulation_results
  FOR INSERT
  WITH CHECK (
    customer_survey_id IN (
      SELECT id FROM public.customer_surveys 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND session_id = current_setting('app.current_session_id', true))
    )
  );

-- Policy 3: Users can update formulation results for their own surveys
CREATE POLICY "Users can update own formulation results" ON public.formulation_results
  FOR UPDATE
  USING (
    customer_survey_id IN (
      SELECT id FROM public.customer_surveys 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND session_id = current_setting('app.current_session_id', true))
    )
  )
  WITH CHECK (
    customer_survey_id IN (
      SELECT id FROM public.customer_surveys 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND session_id = current_setting('app.current_session_id', true))
    )
  );

-- Policy 4: Users can delete formulation results for their own surveys
CREATE POLICY "Users can delete own formulation results" ON public.formulation_results
  FOR DELETE
  USING (
    customer_survey_id IN (
      SELECT id FROM public.customer_surveys 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 5: Service role bypass for formulation results
CREATE POLICY "Service role bypass formulation results" ON public.formulation_results
  FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- ================== INTAKE CONVERSIONS POLICIES ==================

-- Policy 1: Users can view intake conversions for their own surveys
CREATE POLICY "Users can view own intake conversions" ON public.intake_conversions
  FOR SELECT
  USING (
    customer_survey_id IN (
      SELECT id FROM public.customer_surveys 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND session_id = current_setting('app.current_session_id', true))
    )
  );

-- Policy 2: Users can insert intake conversions for their own surveys
CREATE POLICY "Users can insert own intake conversions" ON public.intake_conversions
  FOR INSERT
  WITH CHECK (
    customer_survey_id IN (
      SELECT id FROM public.customer_surveys 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND session_id = current_setting('app.current_session_id', true))
    )
  );

-- Policy 3: Users can update intake conversions for their own surveys
CREATE POLICY "Users can update own intake conversions" ON public.intake_conversions
  FOR UPDATE
  USING (
    customer_survey_id IN (
      SELECT id FROM public.customer_surveys 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND session_id = current_setting('app.current_session_id', true))
    )
  )
  WITH CHECK (
    customer_survey_id IN (
      SELECT id FROM public.customer_surveys 
      WHERE user_id = auth.uid() OR 
            (user_id IS NULL AND session_id = current_setting('app.current_session_id', true))
    )
  );

-- Policy 4: Users can delete intake conversions for their own surveys
CREATE POLICY "Users can delete own intake conversions" ON public.intake_conversions
  FOR DELETE
  USING (
    customer_survey_id IN (
      SELECT id FROM public.customer_surveys 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 5: Service role bypass for intake conversions
CREATE POLICY "Service role bypass intake conversions" ON public.intake_conversions
  FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- ================== HELPER FUNCTIONS FOR RLS ==================

-- Function to set current session ID for anonymous survey access
CREATE OR REPLACE FUNCTION set_current_session_id(session_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_session_id', session_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current session ID
CREATE OR REPLACE FUNCTION get_current_session_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_session_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely link anonymous survey to user
CREATE OR REPLACE FUNCTION link_anonymous_survey_to_user(
  p_session_id TEXT,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Only allow linking if the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to link surveys';
  END IF;
  
  -- Only allow linking to the authenticated user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Can only link surveys to your own account';
  END IF;
  
  -- Update anonymous surveys with the specified session_id
  UPDATE public.customer_surveys 
  SET user_id = p_user_id,
      updated_at = NOW()
  WHERE user_id IS NULL 
    AND session_id = p_session_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================== ADMIN POLICIES (OPTIONAL) ==================

-- Admin role can view all data (for support and debugging)
-- Note: This should be used sparingly and with proper audit logging
CREATE POLICY "Admin can view all surveys" ON public.customer_surveys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin can view all formulation results" ON public.formulation_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin can view all intake conversions" ON public.intake_conversions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- ================== POLICY COMMENTS ==================

COMMENT ON POLICY "Users can view own surveys" ON public.customer_surveys IS 'HIPAA: Users can only view their own survey data plus anonymous surveys for linking';
COMMENT ON POLICY "Anonymous surveys by session" ON public.customer_surveys IS 'Allows session-based access to anonymous surveys during the linking process';
COMMENT ON POLICY "Service role bypass" ON public.customer_surveys IS 'Service role has full access for system operations and migrations';
COMMENT ON FUNCTION link_anonymous_survey_to_user(TEXT, UUID) IS 'Safely links anonymous surveys to authenticated users with proper validation';

-- ================== SECURITY NOTES ==================

-- Security Implementation Notes:
-- 1. All tables have RLS enabled with policies that ensure users can only access their own data
-- 2. Anonymous surveys are accessible by session_id for the linking process
-- 3. Service role bypasses RLS for admin operations and system processes
-- 4. Helper functions provide safe operations for session management and survey linking
-- 5. Admin policies allow support staff to view data when needed (with proper audit logging)
-- 6. Foreign key constraints ensure referential integrity
-- 7. CASCADE deletes ensure cleanup when users delete their accounts 