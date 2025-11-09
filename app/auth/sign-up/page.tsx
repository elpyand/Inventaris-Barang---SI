"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BookOpen, AlertCircle, CheckCircle } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            student_id: studentId,
          },
        },
      })
      if (signUpError) throw signUpError
      setIsSuccess(true)
      setTimeout(() => router.push("/auth/login"), 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">SMK Inventory</span>
          </div>
        </div>
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Create Account</CardTitle>
            <CardDescription>Register to access the inventory system</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <CheckCircle className="h-12 w-12 text-green-400" />
                <h3 className="text-center text-white font-semibold">Account Created Successfully</h3>
                <p className="text-center text-sm text-slate-400">
                  Please check your email to confirm your account. Redirecting to login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName" className="text-slate-200">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="studentId" className="text-slate-200">
                      Student ID
                    </Label>
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="2024001"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-slate-200">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@school.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-slate-200">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password" className="text-slate-200">
                      Confirm Password
                    </Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 rounded bg-red-500/10 p-3 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-slate-400">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 underline">
                    Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
