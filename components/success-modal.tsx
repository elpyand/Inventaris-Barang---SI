"use client"

import { CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface SuccessModalProps {
  isOpen: boolean
  title: string
  message: string
  onClose?: () => void
  autoCloseDuration?: number
}

export function SuccessModal({
  isOpen,
  title,
  message,
  onClose,
  autoCloseDuration = 3000,
}: SuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(isOpen)
    if (isOpen && autoCloseDuration) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, autoCloseDuration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoCloseDuration, onClose])

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out"
        style={{ opacity: isVisible ? 1 : 0 }}
        onClick={() => {
          setIsVisible(false)
          onClose?.()
        }}
      />

      {/* Modal Container - Flex centering */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm mx-4 rounded-lg border border-blue-500/20 bg-slate-800 dark:bg-white shadow-2xl p-6 space-y-4 transition-all duration-500 ease-in-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "scale(1)" : "scale(0.95)",
          }}
        >
          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20 dark:bg-blue-100">
              <CheckCircle className="h-8 w-8 text-blue-400 dark:text-blue-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white dark:text-slate-900">{title}</h2>
            <p className="text-sm text-slate-300 dark:text-slate-600">{message}</p>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-slate-700 dark:bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-blue-500 dark:bg-blue-600 rounded-full"
              style={{
                animation: `shrink ${autoCloseDuration}ms linear forwards`,
              }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setIsVisible(false)
              onClose?.()
            }}
            className="w-full mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium transition-all duration-300 ease-in-out"
          >
            Tutup
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </>
  )
}

