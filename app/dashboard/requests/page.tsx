"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { approveRequest, rejectRequest } from "@/app/actions/notifications"

interface BorrowRequest {
  id: string
  student_id: string
  item_id: string
  quantity_requested: number
  status: string
  created_at: string
  inventory_items: { name: string; quantity_available: number }
  profiles: { full_name: string }
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<BorrowRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      setUserRole(profile?.role || null)

      const query = supabase
        .from("borrow_requests")
        .select("*, inventory_items(name, quantity_available), profiles(full_name)")
        .order("created_at", { ascending: false })

      if (profile?.role === "student") {
        query.eq("student_id", user.id)
      }

      const { data: requestsData } = await query
      setRequests(requestsData || [])
      setIsLoading(false)
    }

    loadData()
  }, [])

  const handleApprove = async (id: string) => {
    setIsProcessing(id)
    try {
      await approveRequest(id)
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: "approved" } : r)))
    } catch (error) {
      console.error("Error approving request:", error)
    } finally {
      setIsProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    setIsProcessing(id)
    try {
      await rejectRequest(id, "Request rejected by admin")
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)))
    } catch (error) {
      console.error("Error rejecting request:", error)
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
    return <div className="text-slate-400">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Borrow Requests</h1>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-slate-500" />
              <p className="text-slate-400">No borrow requests yet</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="border-slate-700 bg-slate-800">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{request.inventory_items?.name}</h3>
                    <p className="text-sm text-slate-400">Requested by: {request.profiles?.full_name}</p>
                    <p className="text-sm text-slate-400">
                      Quantity: {request.quantity_requested} (Available: {request.inventory_items?.quantity_available})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                    {userRole === "admin" && request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={isProcessing === request.id}
                        >
                          {isProcessing === request.id ? "Processing..." : "Approve"}
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-400 hover:bg-red-500/10"
                          disabled={isProcessing === request.id}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
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
