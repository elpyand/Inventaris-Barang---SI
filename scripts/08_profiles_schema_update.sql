-- Update profiles schema: add avatar_url and expand allowed role values
DO $$
BEGIN
  -- Add avatar_url column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Replace existing role check constraint with a broader one that includes 'pending' and 'rejected'
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  END IF;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('student','staff','admin','pending','rejected'));
END$$;

-- Optional: set existing NULL avatars to empty
UPDATE public.profiles SET avatar_url = '' WHERE avatar_url IS NULL;

-- Helper queries you can run manually in Supabase SQL editor:
-- 1) List pending profiles:
-- SELECT id, email, full_name, student_id, role, created_at
-- FROM public.profiles
-- WHERE role = 'pending';

-- 2) Approve a user (set role to 'student' or 'staff'):
-- UPDATE public.profiles
-- SET role = 'student'
-- WHERE id = '<USER_UUID>';

-- 3) Reject a user (set role to 'rejected'):
-- UPDATE public.profiles
-- SET role = 'rejected'
-- WHERE id = '<USER_UUID>';

-- 4) Find auth users without profiles (useful to seed missing profiles):
-- SELECT u.id, u.email
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON p.id = u.id
-- WHERE p.id IS NULL;

-- Notes:
-- - This file is pure SQL. Remove any JavaScript or '//' comments before running
--   in Supabase SQL editor. Use '--' for SQL comments.
-- - After applying schema changes, run any other scripts you need (e.g.,
--   scripts/02_create_test_accounts.sql) to seed test data.
