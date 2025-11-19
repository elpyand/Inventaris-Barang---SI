import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Avatar } from "@/components/avatar"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, student_id, role, fine_balance, avatar_url")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-400">Gagal memuat profil: {error.message}</p>
        <Link href="/dashboard/fines" className="text-blue-500 hover:underline">Kembali ke Daftar Denda</Link>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Profil tidak ditemukan.</p>
        <Link href="/dashboard/fines" className="text-blue-500 hover:underline">Kembali ke Daftar Denda</Link>
      </div>
    )
  }

  const initials = profile.full_name
    ?.split(" ")
    .map((n: string) => n[0].toUpperCase())
    .join("") || "?"

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white dark:text-slate-900">Profil Pengguna</h1>
        <Link href="/dashboard/fines" className="text-sm text-blue-500 hover:underline">Kembali</Link>
      </div>

      <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
        <CardHeader className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} initials={initials} size="xl" />
          <div>
            <CardTitle className="text-white dark:text-slate-900">
              {profile.full_name || "-"}
            </CardTitle>
            <p className="text-sm text-slate-400 dark:text-slate-600">
              {profile.email || "-"}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p><strong>ID:</strong> {profile.id}</p>
            <p><strong>NIS:</strong> {profile.student_id || "-"}</p>
            <p><strong>Role:</strong> {profile.role || "-"}</p>
            <p><strong>Total Denda:</strong> Rp {(profile.fine_balance || 0).toLocaleString("id-ID")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
