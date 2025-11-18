# Panduan Test Denda (Fine) Peminjaman

Karena input date di UI tidak boleh memilih tanggal sebelum hari ini, berikut adalah cara mengtest fitur denda dengan menggunakan SQL script di Supabase:

## Prerequisite (Persiapan)

1. **Jalankan migration untuk `fine_balance`:**

   - Buka Supabase SQL Editor
   - Copy isi dari `scripts/11_add_fine_balance.sql`
   - Jalankan (Run)

2. **Pastikan Anda memiliki:**
   - Satu akun admin (sudah ada)
   - Satu akun siswa dengan profil yang terdaftar
   - Minimal satu item inventory

## Step-by-Step Test

### 1. Buat Permintaan Peminjaman (Sebagai Siswa)

- Login sebagai siswa
- Buka "Lihat Inventaris"
- Pilih tanggal pinjam: **hari ini atau besok** (karena input hanya boleh hari ini ke depan)
- Pilih tanggal kembali: **2-3 hari dari tanggal pinjam**
- Pilih barang dan jumlah, klik "Kirim Permintaan"

**Contoh:**

- Tanggal Pinjam: 17 Nov 2025 (hari ini)
- Tanggal Kembali: 20 Nov 2025 (3 hari kemudian)

### 2. Admin Approve Permintaan

- Login sebagai admin
- Buka "Permintaan Peminjaman"
- Cari permintaan yang baru dibuat
- Klik "Setujui"

### 3. Admin Mulai Peminjaman

- Klik "Mulai Peminjaman" pada permintaan yang sudah disetujui
- Tanggal pinjam/kembali harus tetap sesuai yang siswa tentukan

### 4. Manipulasi Tanggal Kembali (Menggunakan SQL) - **Untuk Simulasi Terlambat**

**Buka Supabase SQL Editor dan jalankan query berikut:**

```sql
-- 1. Cari ID permintaan yang baru saja dibuat
SELECT id, student_id, item_id, status, borrow_date, return_date
FROM borrow_requests
WHERE status = 'borrowed'
ORDER BY created_at DESC
LIMIT 1;
```

**Copy ID dari query di atas, lalu jalankan query berikut (ganti `REQUEST_ID_HERE`):**

```sql
-- 2. Ubah return_date ke tanggal lampau agar simulasi terlambat
UPDATE borrow_requests
SET return_date = NOW() - INTERVAL '5 days'  -- 5 hari lampau = denda 5 * 5000 = Rp 25.000
WHERE id = 'REQUEST_ID_HERE';

-- 3. Verifikasi sudah berubah
SELECT id, student_id, status, return_date FROM borrow_requests WHERE id = 'REQUEST_ID_HERE';
```

### 5. Admin Tandai Pengembalian

- Kembali ke aplikasi, refresh halaman "Permintaan Peminjaman"
- Klik "Tandai Dikembalikan" pada permintaan tersebut
- Di toast/notifikasi, seharusnya muncul pesan denda (mis. "Denda: Rp 25000")

### 6. Verifikasi Denda Terakumulasi

**Di SQL Editor:**

```sql
-- Lihat fine_balance siswa
SELECT id, full_name, fine_balance
FROM profiles
WHERE role = 'student'
ORDER BY fine_balance DESC;
```

**Di aplikasi (Sebagai Siswa):**

- Buka "Permintaan Saya"
- Di bagian atas halaman, seharusnya muncul banner merah: **"Denda tertunggak: Rp 25000"** (sesuai denda yang terhitung)

### 7. Cek Notifikasi

**Di SQL Editor:**

```sql
-- Lihat notifikasi pengembalian yang dikirim
SELECT id, user_id, title, message, type, created_at
FROM notifications
WHERE type IN ('reminder', 'alert')
ORDER BY created_at DESC
LIMIT 5;
```

---

## Catatan Penting

- **FINE_PER_DAY = Rp 5.000** (lihat di `app/actions/notifications.ts` baris `const FINE_PER_DAY = 5000`)
- Jika terlambat 5 hari → Fine = 5 × 5000 = **Rp 25.000**
- Jika tepat waktu (return_date ≤ hari kembali) → Fine = **Rp 0**

---

## Troubleshooting

**Q: Denda tidak muncul di "Permintaan Saya"?**

- Pastikan SQL migration `11_add_fine_balance.sql` sudah dijalankan.
- Refresh halaman atau logout/login ulang.
- Cek tabel `profiles` apakah kolom `fine_balance` ada: `SELECT * FROM profiles LIMIT 1;`

**Q: Tombol "Tandai Dikembalikan" tidak muncul?**

- Pastikan permintaan berstatus "borrowed" (bukan "pending" atau "approved").
- Login kembali sebagai admin.

**Q: Tanggal tidak berubah saat admin mulai peminjaman?**

- Itu adalah behavior yang benar sekarang (sudah diperbaiki). Tanggal yang diisi siswa harus tetap.

---

## Optional: Reset Data untuk Test Ulang

Jika ingin test ulang, jalankan query berikut untuk menghapus data test:

```sql
-- Hapus permintaan yang dibuat untuk test (ganti REQUEST_ID_HERE)
DELETE FROM borrow_requests WHERE id = 'REQUEST_ID_HERE';

-- Reset fine_balance siswa
UPDATE profiles SET fine_balance = 0 WHERE role = 'student';
```

---

**Selamat testing! Hubungi jika ada pertanyaan atau error.**
