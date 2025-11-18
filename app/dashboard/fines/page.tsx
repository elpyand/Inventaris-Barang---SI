"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ProfileWithFine {
  id: string
  full_name?: string | null
  email?: string | null
  student_id?: string | null
  role?: string | null
  fine_balance?: number | null
}

export default function AdminFinesPage() {
  const [users, setUsers] = useState<ProfileWithFine[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadUsersWithFines = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, student_id, role, fine_balance")
      .gt("fine_balance", 0)
      .order("fine_balance", { ascending: false })

    if (error) {
      console.error("Failed to load users with fines:", error)
      setUsers([])
    } else {
      setUsers(data || [])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadUsersWithFines()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white dark:text-slate-900">Daftar Pengguna dengan Denda</h1>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={loadUsersWithFines}>Refresh</Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4">
          {users.length === 0 ? (
            <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <span className="mb-4 text-4xl">✅</span>
                <p className="text-slate-400 dark:text-slate-600">Tidak ada pengguna dengan denda</p>
              </CardContent>
            </Card>
          ) : (
            users.map((u) => (
              <Card key={u.id} className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
                <CardHeader>
                  <CardTitle className="text-white dark:text-slate-900">{u.full_name || u.email || u.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400 dark:text-slate-600">Email: {u.email || '-'}</p>
                      <p className="text-sm text-slate-400 dark:text-slate-600">NIS: {u.student_id || '-'}</p>
                      <p className="text-sm text-slate-400 dark:text-slate-600">Role: {u.role || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400 dark:text-slate-600">Total Denda</p>
                      <p className="text-xl font-bold text-red-400">Rp {(u.fine_balance || 0).toLocaleString('id-ID')}</p>
                      <div className="mt-3">
                        <Link href={`/dashboard/profile/${u.id}`}>
                          <Button className="bg-slate-600 hover:bg-slate-700 text-white">Lihat Profil</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
