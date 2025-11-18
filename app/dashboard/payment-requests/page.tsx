"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"

interface PaymentRequest {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
  profiles?: { full_name?: string; email?: string }
}

export default function PaymentRequestsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  const loadRequests = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("payment_requests")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })
    if (!error) setRequests(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleApprove = async (id: string, user_id: string, amount: number) => {
    setIsProcessing(id)
    const supabase = createClient()
    // Update status
    await supabase.from("payment_requests").update({ status: "approved" }).eq("id", id)
    // Kurangi fine_balance
    await supabase.rpc("decrease_fine_balance", { user_id, amount })
    setIsProcessing(null)
  }

  const handleReject = async (id: string) => {
    setIsProcessing(id)
    const supabase = createClient()
    await supabase.from("payment_requests").update({ status: "rejected" }).eq("id", id)
    setIsProcessing(null)
  }

  function renderStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-400">Disetujui</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-400">Ditolak</Badge>;
      case "pending":
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-400">Menunggu</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white dark:text-slate-900">Permintaan Pembayaran Denda</h1>
      <div className="flex justify-end mb-4">
        <Button onClick={loadRequests} className="bg-blue-600 hover:bg-blue-700 text-white">Refresh</Button>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4">
          {requests.length === 0 ? (
            <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <span className="mb-4 text-4xl">💸</span>
                <p className="text-slate-400 dark:text-slate-600">Belum ada permintaan pembayaran</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((req) => (
              <Card key={req.id} className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white dark:text-slate-900">{req.profiles?.full_name || req.user_id}</h3>
                      <p className="text-sm text-slate-400 dark:text-slate-600">{req.profiles?.email}</p>
                      <p className="text-sm text-slate-400 dark:text-slate-600 mt-2">
                        <span className="font-semibold">Nominal:</span> Rp {req.amount.toLocaleString("id-ID")}
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-600">
                        <span className="font-semibold">Status:</span> {renderStatusBadge(req.status)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(req.created_at).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      {req.status === "pending" && (
                        <>
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={isProcessing === req.id}
                            onClick={async () => { await handleApprove(req.id, req.user_id, req.amount); loadRequests(); }}
                          >
                            {isProcessing === req.id ? "Memproses..." : "Setujui"}
                          </Button>
                          <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isProcessing === req.id}
                            onClick={async () => { await handleReject(req.id); loadRequests(); }}
                          >
                            {isProcessing === req.id ? "Memproses..." : "Tolak"}
                          </Button>
                        </>
                      )}
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
