-- Fix profile insertion during sign-up
-- This script:
-- 1. Adds missing avatar_url column
-- 2. Fixes RLS policies to allow INSERT during signup
-- 3. Ensures proper policy hierarchy

-- Step 1: Add avatar_url column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Step 2: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow insert for profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their profile" ON profiles;
DROP POLICY IF EXISTS "Allow anonymous inserts for profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admins_all" ON profiles;

-- Step 3: Disable RLS temporarily to ensure clean state
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new policies - INSERT first (signup needs this)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Step 5: SELECT policies
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admins_all" ON profiles
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Step 6: UPDATE policies
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 7: Verify policy is enabled
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

