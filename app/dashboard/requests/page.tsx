"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { approveRequest, rejectRequest, markAsBorrowed, markAsReturned } from "@/app/actions/notifications"
import ConfirmModal from "@/components/confirm-modal"
import { useToast } from "@/components/toast"
import { LoadingSpinner } from "@/components/loading-spinner"

interface BorrowRequest {
  id: string
  student_id: string
  item_id: string
  quantity_requested: number
  status: string
  created_at: string
  inventory_items: { name: string; quantity_available: number }
  profiles: { full_name?: string; role?: string }
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<BorrowRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    id: string
    type: "approve" | "reject" | "start" | "return"
  } | null>(null)
  const toast = useToast()
  const [rejectReason, setRejectReason] = useState<string>("")
  const router = useRouter()

  // Export data ke Excel
  const handleExportExcel = async () => {
    const XLSX = await import("xlsx")
    const statusMap: Record<string, string> = {
      approved: "Disetujui",
      rejected: "Ditolak",
      borrowed: "Dipinjam",
      pending: "Menunggu",
      returned: "Dikembalikan"
    }
    const exportData = requests.map((r) => ({
      "ID Permintaan": r.id,
      "Nama Siswa": r.profiles?.full_name || r.student_id,
      "Nama Barang": r.inventory_items?.name || r.item_id,
      "Jumlah": r.quantity_requested,
      "Status": statusMap[r.status] || r.status,
      "Tanggal Permintaan": new Date(r.created_at).toLocaleString("id-ID"),
    }))
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Permintaan")
    XLSX.writeFile(workbook, "permintaan_peminjaman.xlsx")
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          // No authenticated user — redirect to login
          router.push("/auth/login")
          setIsLoading(false)
          return
        }

        console.log("Current user ID:", user.id)

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Error loading profile:", profileError)
          setIsLoading(false)
          return
        }

        console.log("User role:", profile?.role)
        setUserRole(profile?.role || null)

        // Fetch borrow requests
        let requestQuery = supabase
          .from("borrow_requests")
          .select("*")
          .order("created_at", { ascending: false })

        // If student, filter by their ID
        if (profile?.role === "student") {
          requestQuery = requestQuery.eq("student_id", user.id)
        }

        const { data: requestsData, error: requestError } = await requestQuery

        if (requestError) {
          console.error("Error loading requests:", requestError)
          setIsLoading(false)
          return
        }

        console.log("Requests loaded successfully:", requestsData?.length || 0, "items")

        // Now fetch related data for each request
        if (requestsData && requestsData.length > 0) {
          // Get all unique item IDs and student IDs
          const itemIds = [...new Set(requestsData.map((r: any) => r.item_id))]
          const studentIds = [...new Set(requestsData.map((r: any) => r.student_id))]

          console.log("Fetching", itemIds.length, "items and", studentIds.length, "profiles")

          // Fetch items
          const { data: items, error: itemsError } = await supabase
            .from("inventory_items")
            .select("id, name, quantity_available")
            .in("id", itemIds)

          if (itemsError) console.error("Error fetching items:", itemsError)

          // Fetch profiles
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .in("id", studentIds)

          if (profilesError) console.error("Error fetching profiles:", profilesError)

          // Merge data
          const enrichedRequests = requestsData.map((req: any) => ({
            ...req,
            inventory_items: items?.find((i: any) => i.id === req.item_id) || { name: "Unknown", quantity_available: 0 },
            profiles: profiles?.find((p: any) => p.id === req.student_id) || { full_name: "Unknown" },
          }))

          console.log("Enriched requests:", enrichedRequests.length)
          setRequests(enrichedRequests as BorrowRequest[])
        } else {
          setRequests([])
        }
      } catch (err) {
        console.error("Unexpected error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Refresh data every 3 seconds
    const interval = setInterval(loadData, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleApprove = async (id: string) => {
    setIsProcessing(id)
    try {
      await approveRequest(id)
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: "approved" } : r)))
      toast.showToast("Permintaan berhasil disetujui", "success")
    } catch (error) {
      console.error("Error approving request:", error)
      toast.showToast("Gagal menyetujui permintaan", "error")
    } finally {
      setIsProcessing(null)
    }
  }

  const handleStartBorrow = async (id: string) => {
    setIsProcessing(id)
    try {
      await markAsBorrowed(id)
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: "borrowed" } : r)))
      toast.showToast("Peminjaman dimulai", "success")
    } catch (error) {
      console.error("Error starting borrow:", error)
      toast.showToast("Gagal memulai peminjaman", "error")
    } finally {
      setIsProcessing(null)
    }
  }

  const openConfirm = (id: string, type: "approve" | "reject" | "start" | "return") => {
    setPendingAction({ id, type })
    setRejectReason("")
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingAction) return
    const { id, type } = pendingAction
    setConfirmOpen(false)
    try {
      if (type === "approve") await handleApprove(id)
      if (type === "reject") await handleReject(id, rejectReason)
      if (type === "start") await handleStartBorrow(id)
      if (type === "return") await handleMarkReturned(id)
    } catch (err) {
      console.error("Error executing confirmed action:", err)
      toast.showToast("Aksi gagal: lihat console untuk detail", "error")
    } finally {
      setPendingAction(null)
    }
  }

  const handleReject = async (id: string, reason?: string) => {
    setIsProcessing(id)
    try {
      await rejectRequest(id, reason || "Request rejected by admin")
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)))
      toast.showToast("Permintaan ditolak", "success")
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast.showToast("Gagal menolak permintaan", "error")
    } finally {
      setIsProcessing(null)
    }
  }

  const handleMarkReturned = async (id: string) => {
    setIsProcessing(id)
    try {
      const res: any = await markAsReturned(id)
      console.log("Return result:", res)
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: "returned" } : r)))
      toast.showToast(res?.fine > 0 ? `Denda: Rp ${res.fine}` : "Pengembalian tercatat (tanpa denda)", "success")
    } catch (error) {
      console.error("Error marking returned:", error)
      toast.showToast("Gagal menandai pengembalian", "error")
    } finally {
      setIsProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-400"
      case "rejected":
        return "bg-red-500/10 text-red-400"
      case "borrowed":
        return "bg-blue-500/10 text-blue-400"
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
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white dark:text-slate-900">Permintaan Peminjaman</h1>
      {userRole === "admin" && (
        <div className="flex justify-end mb-4">
          <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white">Export ke Excel</Button>
        </div>
      )}
      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-slate-500 dark:text-slate-400" />
              <p className="text-slate-400 dark:text-slate-600">Belum ada permintaan peminjaman</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white dark:text-slate-900">{request.inventory_items?.name}</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-600">
                      Diminta oleh: {request.profiles?.full_name ?? `Unknown (${request.student_id})`}
                      {request.profiles?.role ? ` — ${request.profiles.role}` : ""}
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-600">
                      Jumlah: {request.quantity_requested} (Tersedia: {request.inventory_items?.quantity_available})
                    </p>
                    <div className="mt-2 text-sm text-slate-400 dark:text-slate-600">
                      {request.borrow_date && (
                        <p>Dipinjam: {new Date(request.borrow_date).toLocaleDateString()}</p>
                      )}
                      {request.return_date && (
                        <p>Kembali: {new Date(request.return_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status === 'approved' ? 'Disetujui' : 
                       request.status === 'rejected' ? 'Ditolak' : 
                       request.status === 'borrowed' ? 'Dipinjam' : 
                       'Menunggu'}
                    </Badge>
                    {userRole === "admin" && (
                      <div className="flex gap-2">
                        {request.status === "pending" && (
                          <>
                            <Button
                              onClick={() => openConfirm(request.id, "approve")}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              disabled={isProcessing === request.id}
                            >
                              {isProcessing === request.id ? "Memproses..." : "Setujui"}
                            </Button>
                            <Button
                              onClick={() => openConfirm(request.id, "reject")}
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-400 hover:bg-red-500/10"
                              disabled={isProcessing === request.id}
                            >
                              Tolak
                            </Button>
                          </>
                        )}

                        {request.status === "approved" && (
                          <Button
                            onClick={() => openConfirm(request.id, "start")}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isProcessing === request.id}
                          >
                            {isProcessing === request.id ? "Memproses..." : "Mulai Peminjaman"}
                          </Button>
                        )}

                        {request.status === "borrowed" && (
                          <Button
                            onClick={() => openConfirm(request.id, "return")}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            disabled={isProcessing === request.id}
                          >
                            {isProcessing === request.id ? "Memproses..." : "Tandai Dikembalikan"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={
          pendingAction?.type === "approve"
            ? "Konfirmasi Persetujuan"
            : pendingAction?.type === "reject"
            ? "Konfirmasi Penolakan"
            : pendingAction?.type === "start"
            ? "Mulai Peminjaman"
            : "Tandai Pengembalian"
        }
        description={
          pendingAction?.type === "approve"
            ? "Setujui permintaan ini sehingga siswa dapat meminjam barang." 
            : pendingAction?.type === "reject"
            ? "Tolak permintaan ini dan beri tahu siswa." 
            : pendingAction?.type === "start"
            ? "Mulai periode peminjaman untuk siswa ini." 
            : "Tandai barang ini telah dikembalikan oleh siswa."
        }
        confirmLabel={pendingAction?.type === "reject" ? "Tolak" : "Konfirmasi"}
        loading={isProcessing === pendingAction?.id}
      />
    </div>
  )
}
