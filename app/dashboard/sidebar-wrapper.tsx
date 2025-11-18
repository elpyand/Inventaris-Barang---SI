"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { BarChart3, Package, LogOut, Menu, X, History, Moon, Sun, User, Clock, AlertCircle, DollarSign, ChevronDown } from "lucide-react"
import { useTheme } from "@/app/providers/theme-provider"
import { ToastProvider } from "@/components/toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Avatar } from "@/components/avatar"

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
   const [userProfile, setUserProfile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [finesOpen, setFinesOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          console.log("No authenticated user found")
          router.push("/auth/login")
          return
        }

        console.log("Authenticated user ID:", user.id)

          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role, full_name, student_id, avatar_url")
            .eq("id", user.id)
            .maybeSingle()

        if (error) {
          console.error("Error fetching profile - code:", error.code, "message:", error.message, "details:", error.details)
          setUserRole(null)
           setUserProfile(null)
        } else if (profile) {
          console.log("User role loaded:", profile.role)
          setUserRole(profile.role || null)
           setUserProfile(profile)
        } else {
          console.warn("Profile not found for user:", user.id)
          setUserRole(null)
           setUserProfile(null)
        }
      } catch (err) {
        console.error("Unexpected error in checkAuth:", err)
        setUserRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    setShowLogoutConfirm(false)
    await handleLogout()
  }


  return (
    <div className="flex min-h-screen bg-slate-950 dark:bg-white transition-colors duration-500 ease-in-out">
      {/* Mobile toggle */}
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 md:hidden">
        {isOpen ? <X className="h-6 w-6 text-white dark:text-slate-900 transition-colors duration-500 ease-in-out" /> : <Menu className="h-6 w-6 text-white dark:text-slate-900 transition-colors duration-500 ease-in-out" />}
      </button>

      {/* Theme toggle button */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-slate-800 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 transition-all duration-500 ease-in-out transform hover:scale-110"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-yellow-400 transition-all duration-500 ease-in-out rotate-0" />
        ) : (
          <Moon className="h-5 w-5 text-slate-700 transition-all duration-500 ease-in-out rotate-180" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform bg-slate-900 dark:bg-white transition-all duration-500 ease-in-out overflow-y-auto md:relative md:translate-x-0 border-r border-slate-700 dark:border-slate-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-slate-700 dark:border-slate-200 p-4 transition-colors duration-500 ease-in-out">
            {userProfile ? (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {(() => {
                    const initials = userProfile.full_name
                      ?.split(" ")
                      .map((n: string) => n[0].toUpperCase())
                      .join("") || "?"
                    return <Avatar src={userProfile.avatar_url} initials={initials} size="md" />
                  })()}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-white dark:text-slate-900">{userProfile.full_name || "-"}</div>
                  <div className="text-xs text-slate-300 dark:text-slate-400">NIS: {userProfile.student_id || "-"}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-300 dark:text-slate-500">Profil belum tersedia</div>
            )}
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin"></div>
                </div>
              </div>
            ) : userRole === "admin" ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full justify-start text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out">
                    <Package className="mr-2 h-4 w-4" />
                    Inventaris
                  </Button>
                </Link>
                <Link href="/dashboard/requests">
                  <Button variant="ghost" className="w-full justify-start text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out">
                    <Clock className="mr-2 h-4 w-4" />
                    Permintaan
                  </Button>
                </Link>
                {/* Pendaftar Baru (dihapus sementara) */}
                <Link href="/dashboard/history">
                  <Button variant="ghost" className="w-full justify-start text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out">
                    <History className="mr-2 h-4 w-4" />
                    Riwayat
                  </Button>
                </Link>
                <Link href="/dashboard/analytics">
                  <Button variant="ghost" className="w-full justify-start text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analitik
                  </Button>
                </Link>
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setFinesOpen(!finesOpen)}
                    className="w-full justify-between text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out"
                  >
                    <div className="flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      <span>Denda</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transform transition-transform ${finesOpen ? 'rotate-180' : 'rotate-0'}`} />
                  </Button>

                  {finesOpen && (
                    <div className="pl-6 mt-2 space-y-1">
                      <Link href="/dashboard/payment-requests">
                        <Button variant="ghost" className="w-full justify-start text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Pembayaran Denda
                        </Button>
                      </Link>

                      <Link href="/dashboard/fines">
                        <Button variant="ghost" className="w-full justify-start text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Daftar Denda
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-700 dark:border-slate-200 my-2"></div>
                <Link href="/dashboard/profile">
                  <Button variant="ghost" className="w-full justify-start text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Button>
                </Link>
              </>
            ) : userRole === "student" ? (
              <>
                <Link href="/dashboard/browse">
                  <Button variant="ghost" className="w-full justify-start text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out">
                    <Package className="mr-2 h-4 w-4" />
                    Lihat Barang
                  </Button>
                </Link>
                <Link href="/dashboard/my-requests">
                  <Button variant="ghost" className="w-full justify-start text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Permintaan Saya
                  </Button>
                </Link>
                <div className="border-t border-slate-700 dark:border-slate-200 my-2"></div>
                <Link href="/dashboard/profile">
                  <Button variant="ghost" className="w-full justify-start text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-500 ease-in-out">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Button>
                </Link>
              </>
            ) : (
              <div className="rounded p-3 bg-yellow-500/10 text-yellow-400 text-xs">
                <p>Akun Anda menunggu verifikasi admin.</p>
                <p className="mt-1">Silakan tunggu atau hubungi administrator.</p>
              </div>
            )}
          </nav>

          <div className="border-t border-slate-700 dark:border-slate-200 p-4 transition-colors duration-500 ease-in-out">
            <Button
              onClick={handleLogoutClick}
              variant="outline"
              className="w-full border-red-500 dark:border-red-600 text-red-400 dark:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-100 bg-transparent transition-all duration-500 ease-in-out"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto pt-16 md:pt-0 bg-slate-950 dark:bg-slate-50 transition-colors duration-500 ease-in-out">
        <ToastProvider>
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </ToastProvider>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-slate-700 dark:border-slate-300 bg-slate-800 dark:bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white dark:text-slate-900 mb-2">Konfirmasi Keluar</h2>
            <p className="text-sm text-slate-400 dark:text-slate-600 mb-6">
              Apakah Anda yakin ingin keluar akun?
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
                onClick={confirmLogout}
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
