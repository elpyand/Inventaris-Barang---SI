"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Lock, BarChart3 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 transition-colors">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo-himed.png" alt="Logo SMK Kesehatan Hidayah Medika" width={40} height={40} />
              <span className="text-lg font-bold text-slate-900 dark:text-white">SMK Kesehatan Hidayah Medika</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10 bg-transparent">
                  Masuk
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Sistem Manajemen Inventaris Sekolah
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
              Kelola sumber daya sekolah dengan efisien, lacak permintaan peminjaman, dan pertahankan kontrol inventaris lengkap dengan sistem manajemen komprehensif kami.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/auth/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">Mulai Sekarang</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button
                  variant="outline"
                  className="w-full border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 sm:w-auto bg-transparent"
                >
                  Buat Akun
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6">
            <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 backdrop-blur">
              <Lock className="h-8 w-8 text-green-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Akses Aman</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Kontrol akses berbasis peran memastikan keamanan data dan manajemen sumber daya yang tepat.
              </p>
            </div>
            <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 backdrop-blur">
              <BarChart3 className="h-8 w-8 text-purple-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Analitik</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Lacak tingkat inventaris, pola peminjaman, dan buat laporan terperinci.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
