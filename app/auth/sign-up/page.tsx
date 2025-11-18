"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"
import { translateErrorMessage } from "@/lib/error-translator"
import { ThemeToggle } from "@/components/theme-toggle"

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

// Compress image to be under maxSizeKB (approx). Returns a Blob (JPEG) or original file if compression fails
async function compressImage(file: File, maxSizeKB = 1000, maxWidth = 1024): Promise<Blob> {
  try {
    const img = await loadImageFromFile(file)

    // Resize if wider than maxWidth
    const ratio = Math.min(1, maxWidth / img.width)
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.width * ratio)
    canvas.height = Math.round(img.height * ratio)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const maxBytes = maxSizeKB * 1024

    // Try multiple quality levels
    for (let q = 0.92; q >= 0.5; q -= 0.07) {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", q))
      if (!blob) continue
      if (blob.size <= maxBytes) return blob
    }

    // If still too big, progressively reduce dimensions
    let currentWidth = canvas.width
    while (currentWidth > 200) {
      currentWidth = Math.round(currentWidth * 0.9)
      const tmp = document.createElement("canvas")
      tmp.width = currentWidth
      tmp.height = Math.round((canvas.height * currentWidth) / canvas.width)
      const tctx = tmp.getContext("2d")!
      tctx.drawImage(img, 0, 0, tmp.width, tmp.height)

      for (let q = 0.85; q >= 0.45; q -= 0.1) {
        const blob = await new Promise<Blob | null>((res) => tmp.toBlob(res, "image/jpeg", q))
        if (!blob) continue
        if (blob.size <= maxBytes) return blob
      }
    }

    // Fallback: return original file as Blob
    return file
  } catch (err) {
    // If anything fails, return original file
    return file
  }
}

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError(translateErrorMessage("Passwords do not match"))
      setIsLoading(false)
      return
    }

    // Check if NIS already exists
    const { data: existingNis } = await supabase
      .from("profiles")
      .select("id")
      .eq("student_id", studentId)
      .maybeSingle()

    if (existingNis) {
      setError("NIS/Nomor Induk Siswa sudah terdaftar. Gunakan NIS yang berbeda.")
      setIsLoading(false)
      return
    }

    // Check if full name already exists
    const { data: existingName } = await supabase
      .from("profiles")
      .select("id")
      .eq("full_name", fullName)
      .maybeSingle()

    if (existingName) {
      setError("Nama lengkap sudah terdaftar. Gunakan nama yang berbeda.")
      setIsLoading(false)
      return
    }

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            student_id: studentId,
          },
        },
      })

      if (signUpError) throw signUpError

      // After sign up, try to create the profiles row and upload avatar client-side.
      // Note: signUpData.user may be null if email confirmation flow is enabled;
      // in that case try to read the current user afterwards.
      let userId: string | undefined = (signUpData as any)?.user?.id
      if (!userId) {
        try {
          const { data: userResult } = await supabase.auth.getUser()
          userId = userResult?.user?.id as string | undefined
        } catch (e) {
          console.warn("Unable to get user after signup:", e)
        }
      }

      if (!userId) {
        throw new Error("Failed to get user ID after signup. Profile cannot be created.")
      }

      // Skip avatar upload - use default avatar placeholder
      const avatarUrlToSend: string | undefined = undefined

      try {
        const upsertPayload: any = {
          id: userId,
          email,
          full_name: fullName || null,
          student_id: studentId || null,
          role: "student", // New users are students by default
        }
        if (avatarUrlToSend) upsertPayload.avatar_url = avatarUrlToSend

        console.log("Attempting to upsert profile with payload:", JSON.stringify(upsertPayload, null, 2))

        const { error: upsertError, data: upsertData } = await supabase.from("profiles").upsert(upsertPayload)
        if (upsertError) {
          console.error("Failed to upsert profile:")
          console.error("- Full Error Object:", JSON.stringify(upsertError, null, 2))
          console.error("- Error message:", upsertError.message)
          console.error("- Error code:", upsertError.code)
          console.error("- Error details:", upsertError.details)
          console.error("- Error hint:", (upsertError as any).hint)
          throw new Error(`Profile upsert failed: ${upsertError.message || JSON.stringify(upsertError)}`)
        }
        console.log("Profile upserted successfully:", upsertData)
      } catch (err) {
        console.error("Unexpected error upserting profile:", err)
        throw err
      }

      // Show a success message and redirect to login
      setIsSuccess(true)
      setTimeout(() => router.push("/auth/login"), 2000)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
      setError(translateErrorMessage(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 transition-colors p-4 sm:p-6">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
            <img src="/logo-himed.png" alt="Logo SMK Kesehatan Hidayah Medika" width={48} height={48} className="w-12 h-12 object-contain" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">SMK Kesehatan Hidayah Medika</span>
          </div>
        </div>
        <Card className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Buat Akun</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Daftar untuk mengakses sistem inventaris</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <CheckCircle className="h-12 w-12 text-green-400" />
                <h3 className="text-center text-slate-900 dark:text-white font-semibold">Pendaftaran Berhasil</h3>
                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                  Akun Anda telah dibuat. Silakan masuk dengan email dan kata sandi yang sudah dibuat.
                </p>
                <div className="mt-4">
                  <Link href="/auth/login" className="text-blue-400 underline">
                    Kembali ke Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName" className="text-slate-900 dark:text-slate-200">
                      Nama Lengkap
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="studentId" className="text-slate-900 dark:text-slate-200">
                      NIS/Nomor Induk Siswa
                    </Label>
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="2024001"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-slate-900 dark:text-slate-200">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="siswa@sekolah.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-slate-900 dark:text-slate-200">
                      Kata Sandi
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password" className="text-slate-900 dark:text-slate-200">
                      Konfirmasi Kata Sandi
                    </Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 rounded bg-red-500/10 p-3 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                    {isLoading ? "Membuat akun..." : "Daftar"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
                  Sudah punya akun?{" "}
                  <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 underline">
                    Masuk
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
