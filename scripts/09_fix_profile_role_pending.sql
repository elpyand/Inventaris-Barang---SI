-- Fix: Ensure all newly created profiles have role = 'pending' (not 'student')
-- This script disables any lingering triggers and resets profiles to pending if needed

-- Step 1: Drop trigger if it exists (in case trigger is changing role to 'student')
DROP TRIGGER IF EXISTS auth_user_insert_create_profile ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_on_auth_user_insert();

-- Step 2: Check if there are any profiles with role that should be 'pending'
-- Profiles created recently (within last 24 hours) without explicit admin approval should be 'pending'
-- For now, identify profiles that were just created (created_at recent) and have role='student'
SELECT id, email, full_name, role, student_id, created_at
FROM public.profiles
WHERE role = 'student'
  AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 100;

-- Step 3: If you want to revert recently created 'student' profiles back to 'pending':
-- (Run this ONLY if you're sure these profiles should be pending, not approved)
-- Uncomment and run if needed:
/*
UPDATE public.profiles
SET role = 'pending'
WHERE role = 'student'
  AND created_at > NOW() - INTERVAL '1 day';
*/

-- Step 4: Verify the fix
-- Check profiles created in the last day
SELECT id, email, full_name, role, student_id, created_at
FROM public.profiles
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 100;

-- Notes:
-- - If you see profiles with role='student' that should be 'pending', uncomment Step 3 and run.
-- - If you want to manually approve specific profiles, use:
--   UPDATE public.profiles SET role = 'student' WHERE id = '<UUID>';
-- - For bulk approval (not recommended): UPDATE public.profiles SET role = 'student' WHERE role = 'pending';
