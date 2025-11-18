-- Verify profiles table schema and ensure all required columns exist
-- Run this to check table structure before running signup

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Also check if role column has proper NOT NULL constraint and default value
-- If role column shows is_nullable = YES, we need to fix it
