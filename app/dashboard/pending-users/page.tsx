"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import ConfirmModal from "@/components/confirm-modal"
import { listPendingProfiles, approveUser, rejectUser } from "@/app/actions/notifications"
import { useToast } from "@/components/toast"
import { createClient } from "@/lib/supabase/client"

type PendingProfile = {
  id: string
  full_name?: string
  student_id?: string
  created_at?: string
}

export default function PendingUsersPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold">Halaman Pendaftar Baru Dihapus</h2>
        <p className="mt-2 text-slate-400">Fitur pendaftar sementara dihapus. Anda bisa mengembangkannya lagi nanti.</p>
      </div>
    </div>
  )
}
