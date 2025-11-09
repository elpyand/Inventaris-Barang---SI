"use server"

import { createClient } from "@/lib/supabase/server"

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "approval" | "rejection" | "reminder" | "alert",
  relatedItemId?: string,
  relatedRequestId?: string,
) {
  const supabase = await createClient()

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    related_item_id: relatedItemId,
    related_request_id: relatedRequestId,
  })

  return { error }
}

export async function approveRequest(requestId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  // Get the request details
  const { data: request } = await supabase
    .from("borrow_requests")
    .select("*, inventory_items(name), profiles(id, full_name)")
    .eq("id", requestId)
    .single()

  if (!request) throw new Error("Request not found")

  // Update the request
  const { error: updateError } = await supabase
    .from("borrow_requests")
    .update({
      status: "approved",
      approved_by: user.id,
      borrow_date: new Date().toISOString(),
    })
    .eq("id", requestId)

  if (updateError) throw updateError

  // Create notification for student
  await createNotification(
    request.student_id,
    "Request Approved",
    `Your request for ${request.inventory_items.name} has been approved. You can now collect the item.`,
    "approval",
    request.item_id,
    requestId,
  )

  // Update inventory quantities
  await supabase
    .from("inventory_items")
    .update({
      quantity_available: request.inventory_items.quantity_available - request.quantity_requested,
    })
    .eq("id", request.item_id)

  return { success: true }
}

export async function rejectRequest(requestId: string, reason?: string) {
  const supabase = await createClient()

  // Get the request details
  const { data: request } = await supabase
    .from("borrow_requests")
    .select("*, inventory_items(name)")
    .eq("id", requestId)
    .single()

  if (!request) throw new Error("Request not found")

  // Update the request
  const { error: updateError } = await supabase
    .from("borrow_requests")
    .update({
      status: "rejected",
      notes: reason,
    })
    .eq("id", requestId)

  if (updateError) throw updateError

  // Create notification for student
  await createNotification(
    request.student_id,
    "Request Rejected",
    `Your request for ${request.inventory_items.name} has been rejected. Reason: ${reason || "No reason provided"}`,
    "rejection",
    request.item_id,
    requestId,
  )

  return { success: true }
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

  return { error }
}

export async function getUnreadNotifications() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { notifications: [] }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })

  return { notifications }
}
