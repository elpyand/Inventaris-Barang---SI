'use client'

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <div className="relative w-16 h-16">
        {/* Outer spinning circle */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-700 dark:border-slate-300 border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
        
        {/* Inner spinning circle (opposite direction) */}
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-r-blue-400 dark:border-r-blue-500 animate-spin-reverse"></div>
      </div>
      <p className="mt-6 text-slate-600 dark:text-slate-400 font-medium">Memuat...</p>
    </div>
  )
}
