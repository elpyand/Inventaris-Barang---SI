-- Disable the problematic trigger that was causing sign-up errors
-- Profile creation is now handled server-side in the sign-up action

DROP TRIGGER IF EXISTS auth_user_insert_create_profile ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_on_auth_user_insert();

-- Note: Profiles are now created via server action in app/auth/sign-up/page.tsx
-- This is safer and more reliable than trigger-based creation.
