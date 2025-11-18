"use client"

import React from "react"

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title?: string
  description?: string
  confirmLabel?: string
  loading?: boolean
  children?: React.ReactNode
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  description = "Apakah Anda yakin ingin melanjutkan tindakan ini?",
  confirmLabel = "Konfirmasi",
  loading = false,
  children,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg bg-white dark:bg-slate-800 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{description}</p>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-md px-3 py-2 text-sm bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>
          <button
            className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={() => onConfirm()}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
