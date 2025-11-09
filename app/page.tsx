"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Lock, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">SMK Inventory</span>
            </div>
            <Link href="/auth/login">
              <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10 bg-transparent">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              School Inventory Management System
            </h1>
            <p className="mt-6 text-lg text-slate-300">
              Efficiently manage school resources, track borrowing requests, and maintain complete inventory control
              with our comprehensive management system.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/auth/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">Get Started</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-white hover:bg-slate-700 sm:w-auto bg-transparent"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <Lock className="h-8 w-8 text-green-400" />
              <h3 className="mt-4 text-lg font-semibold text-white">Secure Access</h3>
              <p className="mt-2 text-sm text-slate-400">
                Role-based access control ensures data security and proper resource management.
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 backdrop-blur">
              <BarChart3 className="h-8 w-8 text-purple-400" />
              <h3 className="mt-4 text-lg font-semibold text-white">Analytics</h3>
              <p className="mt-2 text-sm text-slate-400">
                Track inventory levels, borrowing patterns, and generate detailed reports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
