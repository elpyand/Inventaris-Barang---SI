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
// NOTE: Pending-profile creation flow removed. If you want to re-enable
// a pending-registration workflow later, re-introduce a controlled server
// action or an edge function that upserts `profiles` with role='pending'.

export async function approveRequest(requestId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  console.log("Approving request:", requestId)

  // Get the request details - without join to avoid RLS issues
  const { data: request, error: fetchError } = await supabase
    .from("borrow_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (fetchError) {
    console.error("Fetch error:", fetchError)
    throw new Error(`Failed to fetch request: ${fetchError.message}`)
  }

  if (!request) throw new Error("Request not found")

  console.log("Request found:", request)

  // Get item details
  const { data: item } = await supabase
    .from("inventory_items")
    .select("name, quantity_available")
    .eq("id", request.item_id)
    .single()

  // Get student profile
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", request.student_id)
    .single()

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

  console.log("Request updated successfully")

  // Create notification for student
  await createNotification(
    request.student_id,
    "Permintaan Disetujui",
    `Permintaan Anda untuk ${item?.name || "barang"} telah disetujui. Anda dapat mengambil barang tersebut.`,
    "approval",
    request.item_id,
    requestId,
  )

  // Update inventory quantities
  if (item) {
    await supabase
      .from("inventory_items")
      .update({
        quantity_available: Math.max(0, item.quantity_available - request.quantity_requested),
      })
      .eq("id", request.item_id)
  }

  return { success: true }
}

export async function rejectRequest(requestId: string, reason?: string) {
  const supabase = await createClient()

  console.log("Rejecting request:", requestId)

  // Get the request details - without join to avoid RLS issues
  const { data: request, error: fetchError } = await supabase
    .from("borrow_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (fetchError) {
    console.error("Fetch error:", fetchError)
    throw new Error(`Failed to fetch request: ${fetchError.message}`)
  }

  if (!request) throw new Error("Request not found")

  console.log("Request found:", request)

  // Get item details
  const { data: item } = await supabase
    .from("inventory_items")
    .select("name")
    .eq("id", request.item_id)
    .single()

  // Update the request
  const { error: updateError } = await supabase
    .from("borrow_requests")
    .update({
      status: "rejected",
      notes: reason,
    })
    .eq("id", requestId)

  if (updateError) throw updateError

  console.log("Request rejected successfully")

  // Create notification for student
  await createNotification(
    request.student_id,
    "Permintaan Ditolak",
    `Permintaan Anda untuk ${item?.name || "barang"} telah ditolak. Alasan: ${reason || "Tidak ada alasan yang diberikan"}`,
    "rejection",
    request.item_id,
    requestId,
  )

  return { success: true }
}

export async function markAsBorrowed(requestId: string, expectedDays = 7) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  // Fetch request
  const { data: request, error: fetchError } = await supabase
    .from("borrow_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (fetchError) {
    console.error("Fetch error:", fetchError)
    throw new Error(`Failed to fetch request: ${fetchError.message}`)
  }
  if (!request) throw new Error("Request not found")

  const now = new Date()
  const expectedReturn = new Date(now.getTime() + expectedDays * 24 * 60 * 60 * 1000)

  // Respect dates provided by the student when available.
  // If the request already contains borrow_date/return_date, keep them; otherwise set defaults.
  const borrowToSet = request.borrow_date || now.toISOString()
  const returnToSet = request.return_date || expectedReturn.toISOString()

  const { error: updateError } = await supabase
    .from("borrow_requests")
    .update({ status: "borrowed", borrow_date: borrowToSet, return_date: returnToSet })
    .eq("id", requestId)

  if (updateError) throw updateError

  // Notify student
  const { data: item } = await supabase
    .from("inventory_items")
    .select("name")
    .eq("id", request.item_id)
    .single()

  await createNotification(
    request.student_id,
    "Pinjaman Dimulai",
    `Peminjaman untuk ${item?.name || "barang"} telah dimulai. Harap kembalikan sebelum ${new Date(returnToSet).toLocaleDateString()}.`,
    "alert",
    request.item_id,
    requestId,
  )

  // Insert a record into borrow_history for active borrow so "Menunggu" filter can show it
  try {
    const { error: historyError } = await supabase.from("borrow_history").insert({
      student_id: request.student_id,
      item_id: request.item_id,
      quantity: request.quantity_requested,
      borrow_date: borrowToSet,
      return_date: null,
      status: "borrowed",
      created_at: new Date().toISOString(),
    })

    if (historyError) {
      console.error("Failed to insert borrow_history on start:", historyError)
    }
  } catch (err) {
    console.error("Exception inserting borrow_history on start:", err)
  }

  return { success: true }
}

// Fine per day in local currency (adjust as needed)
const FINE_PER_DAY = 5000

export async function markAsReturned(requestId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  // Fetch the request
  const { data: request, error: fetchError } = await supabase
    .from("borrow_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (fetchError) {
    console.error("Fetch error:", fetchError)
    throw new Error(`Failed to fetch request: ${fetchError.message}`)
  }
  if (!request) throw new Error("Request not found")

  const now = new Date()
  const actualReturn = now.toISOString()

  // Calculate fine
  let fine = 0
  if (request.return_date) {
    const expected = new Date(request.return_date)
    const diffMs = now.getTime() - expected.getTime()
    const daysLate = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))
    fine = daysLate * FINE_PER_DAY
  }

  // Update borrow_requests
  const { error: updateError } = await supabase
    .from("borrow_requests")
    .update({ status: "returned", actual_return_date: actualReturn })
    .eq("id", requestId)

  if (updateError) throw updateError

  // Insert into borrow_history
  const { error: historyError } = await supabase.from("borrow_history").insert({
    student_id: request.student_id,
    item_id: request.item_id,
    quantity: request.quantity_requested,
    borrow_date: request.borrow_date || now.toISOString(),
    return_date: request.return_date || now.toISOString(),
    status: "returned",
    created_at: new Date().toISOString(),
  })

  if (historyError) console.error("Failed to insert history:", historyError)

  // Update inventory - add back quantity
  const { data: item } = await supabase
    .from("inventory_items")
    .select("quantity_available")
    .eq("id", request.item_id)
    .single()

  if (item) {
    await supabase
      .from("inventory_items")
      .update({ quantity_available: item.quantity_available + request.quantity_requested })
      .eq("id", request.item_id)
  }

  // Notify student about return and fine
  const fineMessage = fine > 0 ? `Denda keterlambatan: Rp ${fine}` : "Tidak ada denda"
  await createNotification(
    request.student_id,
    "Pengembalian Diterima",
    `Pengembalian untuk item Anda telah diterima. ${fineMessage}`,
    "reminder",
    request.item_id,
    requestId,
  )

  // If there is a fine, increment the student's fine_balance in profiles
  if (fine > 0) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("fine_balance")
        .eq("id", request.student_id)
        .single()

      if (profileError) {
        console.warn("Unable to fetch student profile for fine update:", profileError)
      } else {
        const current = (profileData?.fine_balance as number) || 0
        const newBalance = current + fine
        const { error: updateProfileError } = await supabase
          .from("profiles")
          .update({ fine_balance: newBalance })
          .eq("id", request.student_id)

        if (updateProfileError) {
          console.error("Failed to update fine_balance:", updateProfileError)
        }
      }
    } catch (err) {
      console.error("Exception updating fine_balance:", err)
    }
  }

  return { success: true, fine }
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

export async function listPendingProfiles() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  // Check admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") throw new Error("Forbidden")

  const { data: pending } = await supabase.from("profiles").select("id, full_name, student_id, created_at").eq("role", "pending").order("created_at", { ascending: true })

  return { pending: pending || [] }
}

export async function approveUser(userId: string, role: "student" | "staff" = "student") {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  // Ensure caller is admin
  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!callerProfile || callerProfile.role !== "admin") throw new Error("Forbidden")

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)
  if (error) throw error

  await createNotification(userId, "Akun Diverifikasi", "Akun Anda telah diverifikasi oleh admin.", "approval")

  return { success: true }
}

export async function rejectUser(userId: string, reason?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  // Ensure caller is admin
  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!callerProfile || callerProfile.role !== "admin") throw new Error("Forbidden")

  // Mark profile as rejected (or delete) - here we set role to 'rejected'
  const { error } = await supabase.from("profiles").update({ role: "rejected" }).eq("id", userId)
  if (error) throw error

  await createNotification(userId, "Pendaftaran Ditolak", `Pendaftaran Anda ditolak. ${reason || ""}`, "rejection")

  return { success: true }
}
