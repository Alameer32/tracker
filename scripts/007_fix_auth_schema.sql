-- Fix authentication schema for single-user app
-- Remove auth.users references and create a static user

-- First, drop existing policies and constraints
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_can_delete_own_profile" ON public.user_profiles;

DROP POLICY IF EXISTS "users_can_view_own_food_logs" ON public.food_logs;
DROP POLICY IF EXISTS "users_can_insert_own_food_logs" ON public.food_logs;
DROP POLICY IF EXISTS "users_can_update_own_food_logs" ON public.food_logs;
DROP POLICY IF EXISTS "users_can_delete_own_food_logs" ON public.food_logs;

DROP POLICY IF EXISTS "users_can_view_own_steps_logs" ON public.steps_logs;
DROP POLICY IF EXISTS "users_can_insert_own_steps_logs" ON public.steps_logs;
DROP POLICY IF EXISTS "users_can_update_own_steps_logs" ON public.steps_logs;
DROP POLICY IF EXISTS "users_can_delete_own_steps_logs" ON public.steps_logs;

-- Drop foreign key constraints
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE public.food_logs DROP CONSTRAINT IF EXISTS food_logs_user_id_fkey;
ALTER TABLE public.steps_logs DROP CONSTRAINT IF EXISTS steps_logs_user_id_fkey;

-- Create simple policies that allow all operations (since it's a single-user app)
CREATE POLICY "allow_all_user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_food_logs" ON public.food_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_steps_logs" ON public.steps_logs FOR ALL USING (true) WITH CHECK (true);

-- Insert a default user profile with a static UUID
INSERT INTO public.user_profiles (
  id,
  name,
  age,
  gender,
  height_cm,
  weight_kg,
  activity_level,
  daily_calories,
  daily_protein_g,
  daily_carbs_g,
  daily_fat_g,
  daily_fiber_g,
  daily_sugar_g,
  daily_sodium_mg,
  daily_steps_goal
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'User',
  30,
  'other',
  170,
  70.0,
  'moderately_active',
  2000,
  150,
  250,
  67,
  25,
  50,
  2300,
  10000
) ON CONFLICT (id) DO NOTHING;
