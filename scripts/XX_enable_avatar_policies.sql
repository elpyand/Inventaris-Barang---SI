-- SQL contoh: tambahkan policies untuk upload avatar dan update profil
-- Jalankan di Supabase SQL editor (https://app.supabase.com/project/<YOUR_PROJECT>/sql)

-- 1) Enable RLS on profiles (if not already enabled)
-- Uncomment jika perlu
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Allow users to update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Optionally allow select on profiles (adjust as needed)
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
ON public.profiles
FOR SELECT
USING (true);

-- 3) Storage policies: allow authenticated users to insert/select objects in 'avatars' bucket
-- Supabase storage uses the schema `storage.objects`
-- Ensure the bucket name matches the one used in code ("avatars")

-- Allow insert (upload) to storage.objects for bucket 'avatars' by authenticated users
DROP POLICY IF EXISTS "storage_objects_insert_avatars" ON storage.objects;
CREATE POLICY "storage_objects_insert_avatars"
ON storage.objects
FOR INSERT
WITH CHECK ((SELECT name FROM storage.buckets WHERE id = bucket_id) = 'avatars' AND auth.role() = 'authenticated' AND owner = auth.uid());

-- Allow update (if using upsert) by authenticated users for same bucket
DROP POLICY IF EXISTS "storage_objects_update_avatars" ON storage.objects;
CREATE POLICY "storage_objects_update_avatars"
ON storage.objects
FOR UPDATE
USING ((SELECT name FROM storage.buckets WHERE id = bucket_id) = 'avatars' AND auth.role() = 'authenticated' AND owner = auth.uid())
WITH CHECK ((SELECT name FROM storage.buckets WHERE id = bucket_id) = 'avatars' AND auth.role() = 'authenticated' AND owner = auth.uid());

-- Allow select so that URLs and file info can be read (you may tighten this rule if needed)
DROP POLICY IF EXISTS "storage_objects_select_avatars" ON storage.objects;
CREATE POLICY "storage_objects_select_avatars"
ON storage.objects
FOR SELECT
USING ((SELECT name FROM storage.buckets WHERE id = bucket_id) = 'avatars');

-- Notes:
-- - Jika Anda ingin bucket bersifat publik (agar file dapat diakses tanpa autentikasi), Anda juga
--   dapat mengaktifkan 'public' saat membuat bucket lewat dashboard Supabase Storage.
-- - Jika Anda tidak ingin memberikan akses langsung dari client, gunakan server-side function
--   yang memakai service_role key untuk melakukan upload atau generating signed URLs.
-- - Pastikan nama bucket pada policy ('avatars') sama dengan yang dipakai pada kode.

-- Setelah menjalankan SQL ini, coba ulangi upload avatar dari aplikasi.
