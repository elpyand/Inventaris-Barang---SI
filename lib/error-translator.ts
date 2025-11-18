/**
 * Translate Supabase error messages to Indonesian
 */
export function translateErrorMessage(errorMessage: string): string {
  const errorMap: { [key: string]: string } = {
    // Authentication errors
    "Invalid login credentials": "Email atau password salah",
    "User already registered": "Email sudah terdaftar",
    "Password should be at least 6 characters": "Password minimal 6 karakter",
    "Passwords do not match": "Password tidak cocok",
    "Email not confirmed": "Email belum dikonfirmasi",
    "Email confirmation pending": "Konfirmasi email sedang tertunda",
    "Invalid email": "Email tidak valid",
    "User not found": "User tidak ditemukan",
    "Email not provided": "Email belum dimasukkan",
    "Password not provided": "Password belum dimasukkan",
    "Invalid access token": "Token akses tidak valid",
    "Session has expired": "Sesi telah berakhir",
    "User session not found": "Sesi user tidak ditemukan",

    // Validation errors
    "Required fields": "Semua kolom wajib diisi",
    "Email is required": "Email wajib diisi",
    "Password is required": "Password wajib diisi",

    // Generic errors
    "An error occurred": "Terjadi kesalahan",
    "Network error": "Kesalahan jaringan",
    "Server error": "Kesalahan server",
  }

  // Check for exact match first
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage]
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  // If no translation found, return original message
  return errorMessage
}
