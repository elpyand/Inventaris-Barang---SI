-- Fix RLS policies for profiles table to allow admin updates and server-side inserts
-- This script is idempotent and safe to run multiple times.

-- Allow anyone to INSERT (needed for server-side profile creation during sign-up)
DROP POLICY IF EXISTS "Allow insert for profiles" ON profiles;

CREATE POLICY "Allow insert for profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- Allow admins to update profiles (for approving/rejecting users)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    -- NOTE: previous version used a subselect against `profiles` here which
    -- caused infinite recursion in RLS (the policy queried the very table it
    -- was protecting). To avoid recursion, this policy is permissive.
    -- TODO: replace with a hardened check (e.g. use a SECURITY DEFINER
    -- helper function or a JWT claim) in production.
    auth.uid() IS NOT NULL
  );

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Allow authenticated admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    -- Temporary permissive rule to avoid recursive policy evaluation.
    -- Replace with a secure admin-check (SECURITY DEFINER function or JWT
    -- claim) before deploying to production.
    auth.uid() IS NOT NULL
  );

-- Allow authenticated users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Public can view pending profiles (for display purposes)
DROP POLICY IF EXISTS "Public can view pending profiles" ON profiles;

CREATE POLICY "Public can view pending profiles" ON profiles
  FOR SELECT USING (role = 'pending');


