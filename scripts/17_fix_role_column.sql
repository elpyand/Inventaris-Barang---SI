-- Fix profiles table to ensure signup works properly
-- This handles missing role values and ensures proper constraints

-- Step 1: Ensure role column exists and has proper default
ALTER TABLE profiles 
  ALTER COLUMN role SET DEFAULT 'student',
  ALTER COLUMN role SET NOT NULL;

-- Step 2: Update any NULL roles to 'student'
UPDATE profiles SET role = 'student' WHERE role IS NULL;

-- Step 3: Ensure email column constraint
ALTER TABLE profiles 
  ALTER COLUMN email SET NOT NULL;

-- Step 4: Review current RLS status
-- If you see issues, run: ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Then re-enable with: ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
