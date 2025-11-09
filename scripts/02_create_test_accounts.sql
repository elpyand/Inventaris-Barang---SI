-- Script untuk membuat test accounts (jalankan setelah aplikasi deployed)
-- Test Admin Account
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'admin@smk.com',
  crypt('admin123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, email, full_name, role, department)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'admin@smk.com',
  'Admin Inventaris',
  'admin',
  'Manajemen'
) ON CONFLICT DO NOTHING;

-- Test Student Account
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'e47ac10b-58cc-4372-a567-0e02b2c3d480',
  'student@smk.com',
  crypt('student123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, email, full_name, role, student_id)
VALUES (
  'e47ac10b-58cc-4372-a567-0e02b2c3d480',
  'student@smk.com',
  'Siswa Test',
  'student',
  '12345'
) ON CONFLICT DO NOTHING;

-- Insert sample inventory items
INSERT INTO inventory_items (name, description, category, quantity_total, quantity_available, location, created_by)
VALUES 
  ('Proyektor', 'Proyektor multimedia untuk kelas', 'Elektronik', 5, 3, 'Ruang AV', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'),
  ('Laptop', 'Laptop untuk praktikum', 'Komputer', 10, 7, 'Lab Komputer', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'),
  ('Mikroskop', 'Mikroskop untuk praktikum biologi', 'Lab', 8, 6, 'Lab Biologi', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'),
  ('Rak Buku', 'Rak buku perpustakaan', 'Furniture', 15, 15, 'Perpustakaan', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'),
  ('Printer', 'Printer laserjet untuk kantor', 'Elektronik', 3, 2, 'Kantor', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
ON CONFLICT DO NOTHING;
