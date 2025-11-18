-- Backfill profiles from auth.users raw_user_meta_data
-- Run this in Supabase SQL Editor as a project owner.

-- This will insert or upsert a profiles row for each user that does not yet have one,
-- taking `full_name` and `student_id` from `auth.users.raw_user_meta_data` (the correct column).
-- It will not attempt to set avatar_url (storage files handled separately).
-- For role: it will preserve existing role, or set to 'student' for new rows (unless app_metadata has a role set).

INSERT INTO public.profiles (id, email, full_name, student_id, role)
SELECT
  u.id,
  u.email,
  (u.raw_user_meta_data->>'full_name')::text AS full_name,
  (u.raw_user_meta_data->>'student_id')::text AS student_id,
  COALESCE((u.raw_app_meta_data->>'role')::text, 'student') AS role
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  student_id = COALESCE(EXCLUDED.student_id, public.profiles.student_id),
  email = COALESCE(EXCLUDED.email, public.profiles.email),
  role = COALESCE(public.profiles.role, EXCLUDED.role)
;

-- Quick check: list newly created/updated profiles
SELECT id, email, full_name, student_id, role, avatar_url FROM public.profiles ORDER BY created_at DESC LIMIT 50;
