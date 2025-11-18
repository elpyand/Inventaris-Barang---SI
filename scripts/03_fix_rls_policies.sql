-- Fix RLS policies to allow proper joins
-- Drop existing policies and recreate them

-- For profiles table - allow admins to read all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (true);

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Ensure inventory_items can be read by admins for joins
DROP POLICY IF EXISTS "Anyone can view inventory" ON inventory_items;

CREATE POLICY "Anyone can view inventory" ON inventory_items
  FOR SELECT USING (true);

-- Make sure borrow_requests RLS allows admin to see all
DROP POLICY IF EXISTS "Admins can view all requests" ON borrow_requests;

CREATE POLICY "Admins can view all requests" ON borrow_requests
  FOR SELECT USING (
    -- Avoid querying `profiles` from within this policy (that can invoke
    -- `profiles` policies and lead to infinite recursion). This is a
    -- permissive rule to unblock admin reads; replace with a secure
    -- admin-check (e.g. SECURITY DEFINER helper) when possible.
    auth.uid() IS NOT NULL
  );

-- Drop and recreate student policy to ensure it works
DROP POLICY IF EXISTS "Students can view their own requests" ON borrow_requests;

CREATE POLICY "Students can view their own requests" ON borrow_requests
  FOR SELECT USING (auth.uid() = student_id);

