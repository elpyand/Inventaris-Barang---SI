"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Calendar, AlertCircle } from "lucide-react"

interface BorrowHistoryRecord {
  id: string
  student_id: string
  item_id: string
  quantity: number
  borrow_date: string
  return_date: string | null
  status: string
  inventory_items: { name: string }
  profiles: { full_name: string }
}

export default function HistoryPage() {
  const [history, setHistory] = useState<BorrowHistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "returned" | "pending">("all")

  useEffect(() => {
    const loadHistory = async () => {
      const supabase = createClient()

      let query = supabase
        .from("borrow_history")
        .select("*, inventory_items(name), profiles(full_name)")
        .order("borrow_date", { ascending: false })

      if (filter === "returned") {
        query = query.eq("status", "returned")
      } else if (filter === "pending") {
        query = query.is("return_date", null)
      }

      const { data: historyData } = await query
      setHistory(historyData || [])
      setIsLoading(false)
    }

    loadHistory()
  }, [filter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "returned":
        return "bg-green-500/10 text-green-400"
      default:
        return "bg-yellow-500/10 text-yellow-400"
    }
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading history...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Borrow History</h1>

      {/* Filter buttons */}
      <div className="flex gap-2">
        {(["all", "returned", "pending"] as const).map((option) => (
          <button
            key={option}
            onClick={() => setFilter(option)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === option ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* History list */}
      <div className="grid gap-4">
        {history.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-slate-500" />
              <p className="text-slate-400">No borrow history found</p>
            </CardContent>
          </Card>
        ) : (
          history.map((record) => (
            <Card key={record.id} className="border-slate-700 bg-slate-800">
              <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{record.inventory_items?.name}</h3>
                    <p className="text-sm text-slate-400">Student: {record.profiles?.full_name}</p>
                    <p className="text-sm text-slate-400">Quantity: {record.quantity}</p>
                  </div>
                  <div className="flex flex-col items-start justify-between sm:items-end">
                    <Badge className={`flex items-center gap-1 ${getStatusColor(record.status)}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                    <div className="mt-2 space-y-1 text-right text-xs text-slate-400">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Borrowed: {new Date(record.borrow_date).toLocaleDateString()}
                      </p>
                      {record.return_date && (
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Returned: {new Date(record.return_date).toLocaleDateString()}
                        </p>
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
