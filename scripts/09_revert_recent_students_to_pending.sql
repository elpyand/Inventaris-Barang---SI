-- Safe helper script: ubah role = 'student' menjadi 'pending' untuk profiles baru (mis. 24 jam terakhir)
-- LANG: SQL
-- Petunjuk: 1) Jalankan bagian PREVIEW dulu dan periksa hasilnya. 2) Jika sesuai, jalankan bagian BACKUP lalu UPDATE.

-- 1) PREVIEW: Tampilkan profile berstatus 'student' yang dibuat dalam 24 jam terakhir
SELECT id, email, role, created_at
FROM public.profiles
WHERE role = 'student'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Jika Anda ingin memperluas jangka waktu, ubah interval '24 hours' menjadi '48 hours' atau lain.

-- 2) BACKUP: Simpan baris yang akan diubah ke tabel log (jalankan sekali)
CREATE TABLE IF NOT EXISTS public.profiles_change_log (
  id UUID,
  email TEXT,
  old_role TEXT,
  changed_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP
);

INSERT INTO public.profiles_change_log (id, email, old_role, created_at)
SELECT id, email, role, created_at
FROM public.profiles
WHERE role = 'student'
  AND created_at > now() - interval '24 hours';

-- 3) UPDATE: Ubah role menjadi 'pending' untuk baris yang sudah Anda verifikasi
BEGIN;

UPDATE public.profiles
SET role = 'pending'
WHERE role = 'student'
  AND created_at > now() - interval '24 hours'
RETURNING id, email, role, created_at;

COMMIT;

-- 4) OPSIONAL: jika perlu batalkan perubahan, Anda bisa melihat table public.profiles_change_log
-- dan mengembalikan per baris dengan:
-- UPDATE public.profiles p
-- SET role = l.old_role
-- FROM public.profiles_change_log l
-- WHERE p.id = l.id AND l.changed_at > now() - interval '1 hour';

-- PERINGATAN: Jalankan skrip ini hanya setelah Anda memverifikasi hasil SELECT PREVIEW.
-- Jangan jalankan pada produksi tanpa backup yang sesuai.
