-- Inspection script for `profiles` table
-- Run these queries in Supabase SQL Editor and paste the results here.

-- 1) Show columns and their defaults (also in scripts/16_verify_profiles_schema.sql)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2) Show ROW LEVEL SECURITY status
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'profiles';

-- 3) List policies defined for profiles
SELECT * FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'profiles';

-- 4) List table constraints (unique, primary key, check)
SELECT tc.constraint_type, tc.constraint_name, kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles';

-- 5) Show indexes on profiles
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'profiles';

-- 6) Optional: show row count
SELECT count(*) as profiles_count FROM profiles;
