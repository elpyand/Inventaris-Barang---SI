"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

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

  useEffect(() => {
    const loadRequests = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

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
    return <div className="text-slate-400">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">My Borrow Requests</h1>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-slate-500" />
              <p className="text-slate-400">You haven't submitted any borrow requests yet</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="border-slate-700 bg-slate-800">
              <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{request.inventory_items?.name}</h3>
                    <p className="text-sm text-slate-400">Quantity: {request.quantity_requested}</p>
                    <p className="text-xs text-slate-500">
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-start justify-between sm:items-end">
                    <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                    {request.borrow_date && (
                      <p className="mt-2 text-xs text-slate-400">
                        Borrowed: {new Date(request.borrow_date).toLocaleDateString()}
                      </p>
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
