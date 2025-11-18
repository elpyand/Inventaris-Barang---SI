-- CLEAN RLS RESET untuk profiles table
-- Menghapus semua policy yang menyebabkan infinite recursion
-- Lalu membuat policy SIMPLE dan AMAN tanpa subquery self-referencing

-- Step 1: DISABLE RLS sementara untuk reset bersih
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: DROP SEMUA policy (hapus yang recursive)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow insert for profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their profile" ON profiles;
DROP POLICY IF EXISTS "Allow anonymous inserts for profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admins_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_debug" ON profiles;

-- Step 3: RE-ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: CREATE NEW SAFE POLICIES (NO SELF-REFERENCING SUBQUERY)
-- Policy 1: INSERT - allow user to insert their own profile
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 2: SELECT - allow user to view their own profile
CREATE POLICY "profiles_select_self" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 3: UPDATE - allow user to update their own profile
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 5: FORCE RLS enabled
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Done. Policies are now simple and no recursive checking.
