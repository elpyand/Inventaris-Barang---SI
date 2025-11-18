"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  student_id: string | null
  role: string
  avatar_url: string | null
}

export default function EditProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    password_confirm: "",
  })
  

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          setError("Gagal memuat profil")
          console.error(profileError)
          return
        }

        if (profileData) {
          setProfile(profileData)
          setFormData({
            full_name: profileData.full_name || "",
            email: profileData.email || "",
            password: "",
            password_confirm: "",
          })
        }
      } catch (err) {
        console.error("Error loading profile:", err)
        setError("Terjadi kesalahan saat memuat profil")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
    setSuccess(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Avatar upload temporarily removed. Keep input inert.
  }

  // Avatar cropping/upload removed for now.

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("User tidak ditemukan")
        setIsSaving(false)
        return
      }

      // Validate password if user tries to change it
      if (formData.password) {
        if (formData.password.length < 6) {
          setError("Password minimal 6 karakter")
          setIsSaving(false)
          return
        }

        if (formData.password !== formData.password_confirm) {
          setError("Password tidak cocok")
          setIsSaving(false)
          return
        }

        // Update password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password,
        })

        if (passwordError) {
          setError(passwordError.message)
          setIsSaving(false)
          return
        }
      }

      // Update email if changed
      if (formData.email !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        })

        if (emailError) {
          setError(emailError.message)
          setIsSaving(false)
          return
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          email: formData.email,
        })
        .eq("id", user.id)

      if (profileError) {
        setError("Gagal menyimpan profil")
        console.error(profileError)
        setIsSaving(false)
        return
      }

      setSuccess(true)
      // Update local profile state
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: formData.full_name,
              email: formData.email,
            }
          : null
      )

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        password: "",
        password_confirm: "",
      }))

      // Redirect after success
      setTimeout(() => {
        router.push("/dashboard/profile")
      }, 2000)
    } catch (err) {
      console.error("Error saving profile:", err)
      setError("Terjadi kesalahan saat menyimpan profil")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-slate-50">
          <CardContent className="pt-6">
                {/* Avatar Upload */}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/profile">
          <Button variant="ghost" size="sm" className="text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900">
            Kembali
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-white dark:text-slate-900">Edit Profil</h1>
                {/* Avatar add/crop removed */}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-red-500/10 dark:bg-red-100 p-4 text-red-400 dark:text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="rounded-lg bg-green-500/10 dark:bg-green-100 p-4 text-green-400 dark:text-green-700 text-sm">
          Profil berhasil diperbarui! Mengarahkan ke halaman profil...
        </div>
      )}

      {/* Edit Form Card */}
      <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
        <CardHeader>
          <CardTitle className="text-white dark:text-slate-900">Informasi Pribadi</CardTitle>
          <CardDescription className="text-slate-400 dark:text-slate-600">
            Perbarui data pribadi dan keamanan akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label className="text-slate-300 dark:text-slate-700">Avatar</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400">?</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Avatar upload disabled for now.</p>
                  </div>
                </div>
              </div>
            {/* Full Name */}
            <div className="space-y-2">
              <Label className="text-slate-300 dark:text-slate-700">Nama Lengkap</Label>
              <Input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Masukkan nama lengkap"
                className="border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-slate-50 text-white dark:text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-slate-300 dark:text-slate-700">Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Masukkan email"
                className="border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-slate-50 text-white dark:text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400 dark:text-slate-600">Email akan diverifikasi jika berubah</p>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700 dark:border-slate-200 pt-6">
              <h3 className="text-sm font-semibold text-slate-200 dark:text-slate-800 mb-4">Ubah Password (Opsional)</h3>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label className="text-slate-300 dark:text-slate-700">Password Baru</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  className="border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-slate-50 text-white dark:text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 dark:text-slate-600 dark:hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-600">Minimal 6 karakter</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label className="text-slate-300 dark:text-slate-700">Konfirmasi Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleInputChange}
                placeholder="Ketik ulang password baru"
                className="border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-slate-50 text-white dark:text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:text-white disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
              <Link href="/dashboard/profile">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-600 dark:border-slate-300 hover:bg-slate-700 dark:hover:bg-slate-100 text-white dark:text-slate-900 bg-transparent"
                >
                  Batal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
        <CardHeader>
          <CardTitle className="text-white dark:text-slate-900 text-sm">Informasi Penting</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-slate-400 dark:text-slate-600">
          <p>• NIS dan Role tidak bisa diubah. Hubungi admin jika ada kesalahan data.</p>
          <p>• Jika email diubah, Anda perlu verifikasi email baru melalui link yang dikirim ke email baru.</p>
          <p>• Password minimal 6 karakter untuk keamanan akun.</p>
        </CardContent>
      </Card>
    </div>
  )
}
