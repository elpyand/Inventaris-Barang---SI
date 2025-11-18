-- Idempotent constraints: add role check and foreign key only if missing
-- This script is safe to run multiple times.

-- Add profiles_role_check if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check CHECK (role IN ('student','staff','admin'));
  END IF;
END$$;

-- Add foreign key borrow_requests.student_id -> profiles(id) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'borrow_requests'
      AND kcu.column_name = 'student_id'
  ) THEN
    ALTER TABLE public.borrow_requests
      ADD CONSTRAINT borrow_requests_student_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
  END IF;
END$$;

-- Optional: ensure every auth user has a profile (INSERT missing)
-- Note: run this only if you want to create default profiles for auth.users.
-- INSERT INTO profiles (id, full_name, role, created_at)
-- SELECT u.id, COALESCE(u.email, 'Unknown'), 'student', NOW()
-- FROM auth.users u
-- LEFT JOIN profiles p ON p.id = u.id
-- WHERE p.id IS NULL;
