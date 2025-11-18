-- Create trigger and function to auto-create profiles when auth.users are created
-- This script is idempotent and safe to run multiple times.

-- Drop existing trigger if it exists (safe approach)
DROP TRIGGER IF EXISTS auth_user_insert_create_profile ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_profile_on_auth_user_insert();

-- Create function with SECURITY DEFINER to bypass RLS
CREATE FUNCTION public.create_profile_on_auth_user_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, role, created_at)
  VALUES (NEW.id, COALESCE(NEW.email, 'Unknown'), 'pending', NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ SET search_path = public;

-- Create trigger
CREATE TRIGGER auth_user_insert_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_on_auth_user_insert();
