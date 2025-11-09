"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { BookOpen, BarChart3, Package, LogOut, Menu, X, History } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      setUserRole(profile?.role || null)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Mobile menu button */}
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 md:hidden">
        {isOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform bg-slate-900 transition-transform duration-200 md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-slate-700 p-4">
            <BookOpen className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold text-white">SMK Inventory</span>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {userRole === "admin" && (
              <>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Inventory
                  </Button>
                </Link>
                <Link href="/dashboard/requests">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Requests
                  </Button>
                </Link>
                <Link href="/dashboard/history">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <History className="mr-2 h-4 w-4" />
                    History
                  </Button>
                </Link>
                <Link href="/dashboard/analytics">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </Link>
              </>
            )}
            {userRole === "student" && (
              <>
                <Link href="/dashboard/browse">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Browse Items
                  </Button>
                </Link>
                <Link href="/dashboard/my-requests">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    My Requests
                  </Button>
                </Link>
              </>
            )}
          </nav>

          <div className="border-t border-slate-700 p-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-500 text-red-400 hover:bg-red-500/10 bg-transparent"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pt-16 md:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
