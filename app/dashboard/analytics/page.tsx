"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { TrendingUp, Users, Package, CheckCircle } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"

interface DashboardStats {
  totalItems: number
  totalBorrows: number
  activeBorrows: number
  totalStudents: number
  mostBorrowedItem?: string
  mostBorrowedCount?: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalBorrows: 0,
    activeBorrows: 0,
    totalStudents: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [borrowHistory, setBorrowHistory] = useState<any[]>([])

  useEffect(() => {
    const loadAnalytics = async () => {
      const supabase = createClient()

      // Get total items
      const { count: itemsCount } = await supabase.from("inventory_items").select("*", { count: "exact", head: true })

      // Get total borrow requests
      const { count: borrowCount } = await supabase.from("borrow_requests").select("*", { count: "exact", head: true })

      // Get active borrows
      const { count: activeBorrowCount } = await supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "borrowed")

      // Get total students
      const { count: studentsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student")

      // Get borrow history with item names
      const { data: historyData } = await supabase
        .from("borrow_history")
        .select("*, inventory_items(name), profiles(full_name)")
        .order("borrow_date", { ascending: false })
        .limit(10)

      // Get most borrowed item
      const { data: borrowStats } = await supabase
        .from("borrow_history")
        .select("item_id, inventory_items(name)")
        .limit(1000)

      const itemBorrowCounts = new Map()
      borrowStats?.forEach((record: any) => {
        const itemId = record.item_id
        itemBorrowCounts.set(itemId, (itemBorrowCounts.get(itemId) || 0) + 1)
      })

      const mostBorrowedEntry = Array.from(itemBorrowCounts.entries()).sort((a, b) => b[1] - a[1])[0]

      const mostBorrowedItem = borrowStats?.find((record: any) => record.item_id === mostBorrowedEntry?.[0])
        ?.inventory_items?.[0]?.name

      setStats({
        totalItems: itemsCount || 0,
        totalBorrows: borrowCount || 0,
        activeBorrows: activeBorrowCount || 0,
        totalStudents: studentsCount || 0,
        mostBorrowedItem,
        mostBorrowedCount: mostBorrowedEntry?.[1] || 0,
      })

      setBorrowHistory(historyData || [])
      setIsLoading(false)
    }

    loadAnalytics()
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white dark:text-slate-900">Analitik</h1>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200 dark:text-slate-700">Total Barang</CardTitle>
            <Package className="h-4 w-4 text-blue-400 dark:text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white dark:text-slate-900">{stats.totalItems}</div>
            <p className="text-xs text-slate-400 dark:text-slate-600">Di inventaris</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200 dark:text-slate-700">Total Peminjaman</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400 dark:text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white dark:text-slate-900">{stats.totalBorrows}</div>
            <p className="text-xs text-slate-400 dark:text-slate-600">Sepanjang masa</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200 dark:text-slate-700">Peminjaman Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-400 dark:text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white dark:text-slate-900">{stats.activeBorrows}</div>
            <p className="text-xs text-slate-400 dark:text-slate-600">Sedang dipinjam</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200 dark:text-slate-700">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-purple-400 dark:text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white dark:text-slate-900">{stats.totalStudents}</div>
            <p className="text-xs text-slate-400 dark:text-slate-600">Terdaftar</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
          <CardHeader>
            <CardTitle className="text-white dark:text-slate-900">Barang Paling Dipinjam</CardTitle>
            <CardDescription className="dark:text-slate-600">Barang paling populer pada periode ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400 dark:text-blue-600">{stats.mostBorrowedItem || "N/A"}</div>
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-600">Dipinjam {stats.mostBorrowedCount} kali</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
          <CardHeader>
            <CardTitle className="text-white dark:text-slate-900">Status Inventaris</CardTitle>
            <CardDescription className="dark:text-slate-600">Kesehatan inventaris saat ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-slate-400 dark:text-slate-600">
                <span className="font-semibold text-white dark:text-slate-900">
                  {Math.round((stats.activeBorrows / stats.totalBorrows) * 100 || 0)}%
                </span>{" "}
                dari permintaan sedang aktif
              </p>
              <div className="h-2 w-full rounded-full bg-slate-700 dark:bg-slate-300">
                <div
                  className="h-full rounded-full bg-blue-500 dark:bg-blue-600"
                  style={{ width: `${(stats.activeBorrows / stats.totalBorrows) * 100 || 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Borrow History */}
      <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
        <CardHeader>
          <CardTitle className="text-white dark:text-slate-900">Riwayat Peminjaman Terbaru</CardTitle>
          <CardDescription className="dark:text-slate-600">Aktivitas peminjaman terbaru</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {borrowHistory.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-600">Belum ada riwayat peminjaman</p>
            ) : (
              borrowHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between border-b border-slate-700 dark:border-slate-200 pb-4 last:border-0"
                >
                  <div>
                    <p className="font-semibold text-white dark:text-slate-900">{record.inventory_items?.[0]?.name}</p>
                    <p className="text-sm text-slate-400 dark:text-slate-600">Dipinjam oleh: {record.profiles?.full_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400 dark:text-slate-600">{new Date(record.borrow_date).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-600">Jml: {record.quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
