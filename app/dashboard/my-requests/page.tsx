"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"

interface StudentRequest {
  id: string
  item_id: string
  quantity_requested: number
  status: string
  borrow_date: string | null
  return_date: string | null
  created_at: string
  inventory_items: { name: string }
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<StudentRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fineBalance, setFineBalance] = useState<number>(0)

  useEffect(() => {
    const loadRequests = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch user's fine balance
      try {
        const { data: profileData } = await supabase.from("profiles").select("fine_balance").eq("id", user.id).single()
        setFineBalance((profileData?.fine_balance as number) || 0)
      } catch (err) {
        console.warn("Failed to load fine balance:", err)
      }

      const { data: requestsData } = await supabase
        .from("borrow_requests")
        .select("*, inventory_items(name)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })

      setRequests(requestsData || [])
      setIsLoading(false)
    }

    loadRequests()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-400"
      case "rejected":
        return "bg-red-500/10 text-red-400"
      case "borrowed":
        return "bg-blue-500/10 text-blue-400"
      case "returned":
        return "bg-slate-500/10 text-slate-400"
      default:
        return "bg-yellow-500/10 text-yellow-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "returned":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white dark:text-slate-900">Permintaan Saya</h1>

      {fineBalance > 0 && (
        <div className="rounded-lg bg-red-500/10 dark:bg-red-100 p-3 text-red-400 dark:text-red-700">
          <strong>Denda tertunggak:</strong> Rp {fineBalance}
        </div>
      )}

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-slate-500 dark:text-slate-400" />
              <p className="text-slate-400 dark:text-slate-600">Anda belum mengirimkan permintaan peminjaman</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
              <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white dark:text-slate-900">{request.inventory_items?.name}</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-600">Jumlah: {request.quantity_requested}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-600">
                      Diminta: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-start justify-between sm:items-end">
                    <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status === 'approved' ? 'Disetujui' : 
                       request.status === 'rejected' ? 'Ditolak' : 
                       request.status === 'borrowed' ? 'Dipinjam' : 
                       'Menunggu'}
                    </Badge>
                    <div className="mt-2 text-xs text-slate-400 dark:text-slate-600">
                      {request.borrow_date && (
                        <p>Dipinjam: {new Date(request.borrow_date).toLocaleDateString()}</p>
                      )}
                      {request.return_date && (
                        <p>Kembali: {new Date(request.return_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
