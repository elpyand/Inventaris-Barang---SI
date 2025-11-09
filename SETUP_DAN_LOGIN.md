# Panduan Setup dan Login - School Inventory Management System

## Akun Test yang Tersedia

Setelah menjalankan script `02_create_test_accounts.sql`, Anda bisa login dengan akun berikut:

### ADMIN Account
- **Email**: admin@smk.com
- **Password**: admin123456
- **Role**: Admin (bisa manage inventory, approve requests, lihat analytics)

### STUDENT Account
- **Email**: student@smk.com
- **Password**: student123456
- **Role**: Student (bisa browse items, request borrow, lihat status request)

---

## Cara Login

1. **Buka aplikasi** di `http://localhost:3000`
2. **Klik tombol "Login"** di home page
3. **Masukkan email dan password** dari salah satu akun di atas
4. **Klik "Sign in"**
5. Otomatis redirect ke `/dashboard`

---

## Perbedaan Akses Admin vs Student

### Admin dapat mengakses:
- ✅ **Dashboard** - Lihat semua statistik
- ✅ **Inventory Management** - Tambah/edit/hapus barang
- ✅ **Borrow Requests** - Approve/reject request dari siswa
- ✅ **Analytics** - Lihat grafik dan statistik peminjaman
- ✅ **History** - Lihat riwayat semua peminjaman

### Student dapat mengakses:
- ✅ **Dashboard** - Lihat profile dan quick stats
- ✅ **Browse Items** - Cari dan lihat barang yang tersedia
- ✅ **My Requests** - Lihat status request peminjaman sendiri
- ❌ Tidak bisa manage inventory
- ❌ Tidak bisa lihat request dari siswa lain

---

## Fitur Utama

### 1. **Student Menjalankan Borrow Request**
- Klik menu "Browse Items"
- Cari atau filter barang yang ingin dipinjam
- Masukkan jumlah yang ingin dipinjam
- Klik "Add to Request"
- Klik "Submit All Requests" untuk mengirim permintaan

### 2. **Admin Approve/Reject Request**
- Buka menu "Borrow Requests"
- Lihat semua request dari siswa dengan status "Pending"
- Klik tombol "✓ Approve" untuk persetujuan
- Klik tombol "✗ Reject" untuk penolakan
- Siswa akan otomatis menerima notifikasi

### 3. **Admin Manage Inventory**
- Buka menu "Inventory"
- **Tambah barang**: Klik "Add New Item"
- **Edit barang**: Klik tombol Edit (ikon pensil)
- **Hapus barang**: Klik tombol Delete (ikon X)

### 4. **Lihat Analytics**
- Buka menu "Analytics" (hanya untuk admin)
- Lihat KPI: Total Items, Total Borrows, Active Borrows, Total Students
- Lihat grafik: Most Borrowed Items dan Inventory Health

### 5. **Notifikasi Real-time**
- Klik ikon bell di header
- Lihat semua notifikasi approval/rejection
- Klik untuk mark as read
- Auto update ketika ada status perubahan

---

## Membuat Akun Baru

### Via UI (Sign Up)
1. Di login page, klik "Sign up here"
2. Isi form:
   - Full Name: Nama lengkap
   - Student ID: NIS (opsional)
   - Email: email@smk.com
   - Password: minimal 6 karakter
3. Klik "Sign up"
4. Otomatis login dengan role "student"

### Via Database (Untuk Admin)
Jalankan SQL manual di Supabase:
\`\`\`sql
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('newemail@smk.com', crypt('password123456', gen_salt('bf')), NOW());

INSERT INTO profiles (email, full_name, role, student_id)
SELECT email, 'Nama User', 'student', 'NIS123'
FROM auth.users WHERE email = 'newemail@smk.com';
\`\`\`

---

## Troubleshooting

### Login Error: "Invalid credentials"
- Pastikan email dan password benar
- Pastikan tidak ada space di awal/akhir email
- Password case-sensitive

### Tidak ada barang di Browse Items
- Pastikan admin sudah tambah inventory di menu "Inventory"
- Barang harus punya quantity_available > 0

### Notifikasi tidak muncul
- Refresh page
- Pastikan menggunakan akun yang sudah di-approve
- Cek browser console untuk error

### Database connection error
- Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY ada di env
- Cek Supabase project status
- Cek network connection

---

## Tips Penggunaan

1. **Untuk testing**: Gunakan 2 browser tab - satu admin, satu student
2. **Reset test data**: Jalankan SQL DELETE untuk hapus dan re-insert
3. **Lihat notifikasi realtime**: Approve request dari admin, refresh student tab untuk lihat notifikasi
4. **Export data**: Admin bisa melihat semua history untuk laporan

---

## Database Schema

**Tables yang ada:**
- `profiles` - Data user (admin/student)
- `inventory_items` - Data barang inventaris
- `borrow_requests` - Request peminjaman siswa
- `borrow_history` - Riwayat peminjaman selesai
- `notifications` - Notifikasi untuk user

Semua table sudah punya Row Level Security (RLS) untuk keamanan data.
