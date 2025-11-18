-- Optional: SECURITY DEFINER function to create/upsert profiles bypassing RLS
-- Use this if you prefer calling a Postgres function from an authenticated service

CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_student_id TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, student_id, role, avatar_url, created_at)
  VALUES (p_user_id, p_email, p_full_name, p_student_id, 'pending', p_avatar_url, now())
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(excluded.email, public.profiles.email),
    full_name = COALESCE(excluded.full_name, public.profiles.full_name),
    student_id = COALESCE(excluded.student_id, public.profiles.student_id),
    avatar_url = COALESCE(excluded.avatar_url, public.profiles.avatar_url),
    role = public.profiles.role; -- do not overwrite existing role automatically
END;
$$;

-- Grant execute to authenticated role if needed (be cautious)
-- GRANT EXECUTE ON FUNCTION public.create_profile_for_user(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;