"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { markNotificationAsRead } from "@/app/actions/notifications"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const loadNotifications = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Initial load
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      setNotifications(notificationsData || [])
      setUnreadCount(notificationsData?.filter((n) => !n.is_read).length || 0)

      // Subscribe to changes
      const subscription = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setNotifications((prev) => [payload.new as Notification, ...prev.slice(0, 9)])
              setUnreadCount((prev) => prev + 1)
            }
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    loadNotifications()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "approval":
        return "bg-green-500/10 text-green-400"
      case "rejection":
        return "bg-red-500/10 text-red-400"
      case "reminder":
        return "bg-yellow-500/10 text-yellow-400"
      default:
        return "bg-blue-500/10 text-blue-400"
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-xs font-bold text-white flex items-center justify-center">
            {Math.min(unreadCount, 9)}
          </span>
        )}
      </button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto border-slate-700 bg-slate-800 shadow-xl z-50">
          <div className="sticky top-0 border-b border-slate-700 bg-slate-800 p-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 p-4">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    notification.is_read
                      ? "border-slate-700 bg-slate-700/30"
                      : `border-slate-600 bg-slate-700 ${getNotificationColor(notification.type)}`
                  }`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{notification.title}</p>
                      <p className="text-xs text-slate-300 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.is_read && <div className="h-2 w-2 rounded-full bg-blue-400 mt-1" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
