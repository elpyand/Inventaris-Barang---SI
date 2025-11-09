"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { TrendingUp, Users, Package, CheckCircle } from "lucide-react"

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
        ?.inventory_items?.name

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
    return <div className="text-slate-400">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Analytics</h1>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalItems}</div>
            <p className="text-xs text-slate-400">In inventory</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Borrows</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalBorrows}</div>
            <p className="text-xs text-slate-400">All time</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Active Borrows</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeBorrows}</div>
            <p className="text-xs text-slate-400">Currently out</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Students</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalStudents}</div>
            <p className="text-xs text-slate-400">Registered</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Most Borrowed Item</CardTitle>
            <CardDescription>Most popular item this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{stats.mostBorrowedItem || "N/A"}</div>
            <p className="mt-2 text-sm text-slate-400">Borrowed {stats.mostBorrowedCount} times</p>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Inventory Status</CardTitle>
            <CardDescription>Current inventory health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">
                <span className="font-semibold text-white">
                  {Math.round((stats.activeBorrows / stats.totalBorrows) * 100 || 0)}%
                </span>{" "}
                of requests are active
              </p>
              <div className="h-2 w-full rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(stats.activeBorrows / stats.totalBorrows) * 100 || 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Borrow History */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Borrow History</CardTitle>
          <CardDescription>Latest borrowing activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {borrowHistory.length === 0 ? (
              <p className="text-slate-400">No borrow history yet</p>
            ) : (
              borrowHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between border-b border-slate-700 pb-4 last:border-0"
                >
                  <div>
                    <p className="font-semibold text-white">{record.inventory_items?.name}</p>
                    <p className="text-sm text-slate-400">Borrowed by: {record.profiles?.full_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">{new Date(record.borrow_date).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500">Qty: {record.quantity}</p>
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
