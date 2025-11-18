"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { Avatar } from "@/components/avatar"
import { LoadingSpinner } from "@/components/loading-spinner"
import { LogOut, Mail, Badge } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  student_id: string | null
  role: string
  avatar_url: string | null
  fine_balance?: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [borrowStats, setBorrowStats] = useState({ active: 0, total: 0 })
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paidAmount, setPaidAmount] = useState(0)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
      }

      if (profileData) {
        setProfile(profileData)
      }

      // Fetch borrowing statistics
      try {
        // Get active borrows
        const { count: activeCount, error: activeError } = await supabase
          .from("borrow_requests")
          .select("*", { count: "exact", head: true })
          .eq("student_id", user.id)
          .eq("status", "borrowed")

        // Get total borrow history
        const { count: totalCount, error: totalError } = await supabase
          .from("borrow_history")
          .select("*", { count: "exact", head: true })
          .eq("student_id", user.id)

        if (!activeError && !totalError) {
          setBorrowStats({
            active: activeCount || 0,
            total: totalCount || 0,
          })
        }
      } catch (err) {
        console.error("Failed to fetch borrow stats:", err)
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-slate-50">
          <CardContent className="pt-6">
            <p className="text-slate-400 dark:text-slate-600">Profile tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?"

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentError(null)
    setPaymentSuccess(false)

    // Validate input
    const amount = Number.parseFloat(paymentAmount)
    if (!paymentAmount || amount <= 0) {
      setPaymentError("Masukkan nominal pembayaran yang valid")
      return
    }

    if (amount > (profile.fine_balance || 0)) {
      setPaymentError(`Nominal tidak boleh lebih dari Rp ${(profile.fine_balance || 0).toLocaleString('id-ID')}`)
      return
    }

    setIsProcessingPayment(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setPaymentError("User tidak ditemukan")
        setIsProcessingPayment(false)
        return
      }

      // Buat permintaan pembayaran baru
      const { error: insertError } = await supabase.from("payment_requests").insert({
        user_id: user.id,
        amount,
        status: "pending", // Status awal adalah pending
        created_at: new Date().toISOString(),
      })

      if (insertError) {
        setPaymentError("Gagal membuat permintaan pembayaran")
        // Log error Supabase lebih detail
        if (typeof insertError === "object" && insertError !== null) {
          console.error("Supabase insert error:", JSON.stringify(insertError, null, 2))
        } else {
          console.error("Supabase insert error:", insertError)
        }
        setIsProcessingPayment(false)
        return
      }

      setPaymentSuccess(true)
      setPaymentAmount("")

      // Tutup modal setelah 2 detik
      setTimeout(() => {
        setShowPaymentModal(false)
        setPaymentSuccess(false)
      }, 2000)
    } catch (err) {
      console.error("Payment request error:", err)
      setPaymentError("Terjadi kesalahan saat membuat permintaan pembayaran")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white dark:text-slate-900">Profil Saya</h1>

      {/* Profile Card */}
      <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
        <CardHeader>
          <CardTitle className="text-white dark:text-slate-900">Informasi Profil</CardTitle>
          <CardDescription className="text-slate-400 dark:text-slate-600">Detail akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Avatar Section */}
            <div className="flex items-start gap-6">
              <Avatar src={profile.avatar_url} initials={initials} size="xl" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white dark:text-slate-900 mb-1">{profile.full_name || "Nama tidak tersedia"}</h2>
                <p className="text-slate-400 dark:text-slate-600 text-sm">
                  {profile.role === "admin" ? "Administrator" : "Siswa"}
                </p>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Email */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600">
                  <Mail className="w-4 h-4" />
                  <label className="text-sm font-medium">Email</label>
                </div>
                <p className="text-white dark:text-slate-900 bg-slate-700 dark:bg-slate-100 rounded px-3 py-2">{profile.email}</p>
              </div>

              {/* Student ID */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600">
                  <Badge className="w-4 h-4" />
                  <label className="text-sm font-medium">NIS / Nomor Induk</label>
                </div>
                <p className="text-white dark:text-slate-900 bg-slate-700 dark:bg-slate-100 rounded px-3 py-2">
                  {profile.student_id || "Tidak tersedia"}
                </p>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 dark:text-slate-600">Role</label>
                <div className="text-white dark:text-slate-900 bg-slate-700 dark:bg-slate-100 rounded px-3 py-2 capitalize">
                  {profile.role === "admin" ? "Administrator" : "Siswa"}
                </div>
              </div>

              {/* User ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 dark:text-slate-600">ID Pengguna</label>
                <p className="text-white dark:text-slate-900 bg-slate-700 dark:bg-slate-100 rounded px-3 py-2 text-xs font-mono truncate">
                  {profile.id}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/profile/edit">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:text-white">
                  Edit Profil
                </Button>
              </Link>
              <Button
                onClick={() => setShowLogoutConfirm(true)}
                variant="outline"
                className="border-slate-600 dark:border-slate-300 hover:bg-slate-700 dark:hover:bg-slate-100 text-white dark:text-slate-900 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
          <CardHeader>
            <CardTitle className="text-white dark:text-slate-900 text-base">Statistik Peminjaman</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-600">Peminjaman Aktif</span>
                <span className="text-2xl font-bold text-blue-400 dark:text-blue-600">{borrowStats.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-600">Total Peminjaman</span>
                <span className="text-2xl font-bold text-slate-300 dark:text-slate-700">{borrowStats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
          <CardHeader>
            <CardTitle className="text-white dark:text-slate-900 text-base">Denda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-600">Total Denda</span>
                <span className="text-2xl font-bold text-red-400 dark:text-red-600">
                  Rp {(profile.fine_balance || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-600">Status</span>
                <span className={`font-medium ${(profile.fine_balance || 0) > 0 ? 'text-red-400 dark:text-red-600' : 'text-green-400 dark:text-green-600'}`}>
                  {(profile.fine_balance || 0) > 0 ? 'Ada Tunggakan' : 'Lunas'}
                </span>
              </div>
              {(profile.fine_balance || 0) > 0 && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                >
                  Bayar Denda
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-slate-700 dark:border-slate-300 bg-slate-800 dark:bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white dark:text-slate-900 mb-2">Bayar Denda</h2>
            <p className="text-sm text-slate-400 dark:text-slate-600 mb-4">
              Total denda: <span className="font-bold">Rp {(profile.fine_balance || 0).toLocaleString('id-ID')}</span>
            </p>

            {paymentError && (
              <div className="rounded bg-red-500/10 dark:bg-red-100 p-3 mb-4 text-red-400 dark:text-red-700 text-sm">
                {paymentError}
              </div>
            )}

            {paymentSuccess && (
              <div className="rounded bg-green-500/10 dark:bg-green-100 p-3 mb-4 text-green-400 dark:text-green-700 text-sm">
                Pembayaran berhasil! Denda berkurang Rp {paidAmount.toLocaleString('id-ID')}
              </div>
            )}

            {!paymentSuccess && (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 dark:text-slate-700 text-sm">Nominal Pembayaran</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => {
                      setPaymentAmount(e.target.value)
                      setPaymentError(null)
                    }}
                    placeholder="Masukkan nominal"
                    max={profile.fine_balance || 0}
                    min={0}
                    className="border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-slate-50 text-white dark:text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-600">
                    Maksimal: Rp {(profile.fine_balance || 0).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false)
                      setPaymentAmount("")
                      setPaymentError(null)
                    }}
                    variant="outline"
                    className="flex-1 border-slate-600 dark:border-slate-300 text-slate-300 dark:text-slate-700 hover:bg-slate-700 dark:hover:bg-slate-100 bg-transparent"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    {isProcessingPayment ? "Memproses..." : "Bayar"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-slate-700 dark:border-slate-300 bg-slate-800 dark:bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white dark:text-slate-900 mb-2">Konfirmasi Logout</h2>
            <p className="text-sm text-slate-400 dark:text-slate-600 mb-6">
              Apakah Anda yakin ingin keluar dari akun?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowLogoutConfirm(false)}
                variant="outline"
                className="flex-1 border-slate-600 dark:border-slate-300 text-slate-300 dark:text-slate-700 hover:bg-slate-700 dark:hover:bg-slate-100 bg-transparent"
              >
                Batal
              </Button>
              <Button
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push("/")
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
