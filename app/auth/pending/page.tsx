import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-lg text-center bg-slate-800 rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white">Halaman Menunggu Dihapus</h1>
        <p className="mt-4 text-slate-300">Fitur halaman menunggu pendaftaran telah dihapus. Silakan masuk atau hubungi admin jika ada masalah.</p>

      </div>
    </div>
  )
}
