"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { Package, Plus, Edit, Trash2, AlertCircle } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import ConfirmModal from "@/components/confirm-modal"
import { useToast } from "@/components/toast"

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity_total: number
  quantity_available: number
  location: string
}

export default function DashboardPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    quantity_total: "",
    location: "",
  })
  const [userRole, setUserRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [originalTotal, setOriginalTotal] = useState<number | null>(null)
  const [originalAvailable, setOriginalAvailable] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      setUserRole(profile?.role || null)

      const { data: itemsData, error: itemsError } = await supabase
        .from("inventory_items")
        .select("*")
        .order("created_at", { ascending: false })

      console.log('User:', user);
      console.log('Profile:', profile);
      console.log('Items Data:', itemsData);
      console.log('Items Error:', itemsError);

      if (itemsError) {
        setError(itemsError.message)
      } else {
        setItems(itemsData || [])
      }
      setIsLoading(false)
    }

    loadData()
  }, [])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error: addError } = await supabase.from("inventory_items").insert([
      {
        name: newItem.name,
        category: newItem.category,
        quantity_total: Number.parseInt(newItem.quantity_total),
        quantity_available: Number.parseInt(newItem.quantity_total),
        location: newItem.location,
        created_by: user.id,
      },
    ])

    if (addError) {
      setError(addError.message)
    } else {
      setNewItem({ name: "", category: "", quantity_total: "", location: "" })
      setIsAddingItem(false)
      // Reload items
      const { data: itemsData } = await supabase
        .from("inventory_items")
        .select("*")
        .order("created_at", { ascending: false })
      setItems(itemsData || [])
    }
  }

  const handleDeleteItem = async (id: string) => {
    setDeleting(true)
    const supabase = createClient()

    // Check for dependent borrow_requests referencing this item to avoid FK violation
    const { data: relatedRequests, error: relatedError } = await supabase
      .from("borrow_requests")
      .select("id")
      .eq("item_id", id)
      .limit(1)

    if (relatedError) {
      setError(relatedError.message)
      setDeleting(false)
      return
    }

    if (relatedRequests && relatedRequests.length > 0) {
      const msg = "Tidak bisa menghapus barang: terdapat permintaan peminjaman yang merujuk ke barang ini. Batalkan atau selesaikan permintaan terlebih dahulu."
      setError(msg)
      showToast(msg, "error")
      setDeleting(false)
      setConfirmOpen(false)
      return
    }

    const { error: deleteError } = await supabase.from("inventory_items").delete().eq("id", id)

    if (deleteError) {
      setError(deleteError.message)
      showToast(deleteError.message, "error")
    } else {
      setItems(items.filter((item) => item.id !== id))
      showToast("Barang berhasil dihapus.")
    }

    setDeleting(false)
    setConfirmOpen(false)
    setDeletingId(null)
  }

  const openDeleteConfirm = (id: string) => {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  const openEdit = (item: InventoryItem) => {
    // copy the item to avoid mutating original object from list
    setEditingItem({ ...item })
    setOriginalTotal(item.quantity_total)
    setOriginalAvailable(item.quantity_available)
    setEditOpen(true)
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return
    setEditLoading(true)
    const supabase = createClient()

    // compute borrowed count and validate edits
    const prevTotal = originalTotal ?? editingItem.quantity_total
    const prevAvailable = originalAvailable ?? editingItem.quantity_available
    const borrowed = Math.max(0, prevTotal - prevAvailable)

    // If admin attempts to set total lower than currently borrowed, block and show error.
    if (editingItem.quantity_total < borrowed) {
      const msg = `Tidak bisa mengurangi jumlah total di bawah ${borrowed} barang yang sedang dipinjam.`
      setError(msg)
      showToast(msg, "error")
      setEditLoading(false)
      return
    }

    // New available equals total minus borrowed
    const newAvailable = Math.max(0, editingItem.quantity_total - borrowed)

    const { error, data } = await supabase
      .from("inventory_items")
      .update({
        name: editingItem.name,
        category: editingItem.category,
        quantity_total: editingItem.quantity_total,
        quantity_available: newAvailable,
        location: editingItem.location,
      })
      .eq("id", editingItem.id)
      .select()
      .maybeSingle()

    if (error) {
      setError(error.message)
      showToast(error.message, "error")
      setEditLoading(false)
      return
    }

    // Update local state with returned data (or optimistic update). Ensure quantity_available updated.
    const updated = data || { ...editingItem, quantity_available: newAvailable }
    setItems((prev) => prev.map((it) => (it.id === editingItem.id ? { ...it, ...updated } : it)))
    showToast("Barang berhasil diperbarui.")
    setEditLoading(false)
    setEditOpen(false)
    setEditingItem(null)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white dark:text-slate-900">Manajemen Inventaris</h1>
        {userRole === "admin" && (
          <Button onClick={() => setIsAddingItem(!isAddingItem)} className="bg-blue-600 hover:bg-blue-700 text-white dark:text-white">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Barang
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 dark:bg-red-100 p-4 text-red-400 dark:text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {isAddingItem && userRole === "admin" && (
        <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-slate-50">
          <CardHeader>
            <CardTitle className="text-white dark:text-slate-900">Tambah Barang Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-slate-200 dark:text-slate-700">Nama</Label>
                  <Input
                    required
                    placeholder="Nama barang"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="mt-1 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-200 dark:text-slate-700">Kategori</Label>
                  <Input
                    required
                    placeholder="Kategori"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="mt-1 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-200 dark:text-slate-700">Jumlah</Label>
                  <Input
                    required
                    type="number"
                    placeholder="0"
                    value={newItem.quantity_total}
                    onChange={(e) => setNewItem({ ...newItem, quantity_total: e.target.value })}
                    className="mt-1 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-slate-200 dark:text-slate-700">Lokasi</Label>
                  <Input
                    placeholder="Lokasi penyimpanan"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="mt-1 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Simpan
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingItem(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-slate-50 md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="mb-4 h-12 w-12 text-slate-500 dark:text-slate-400" />
              <p className="text-slate-400 dark:text-slate-600">Belum ada barang inventaris</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-white dark:text-slate-900">{item.name}</CardTitle>
                <CardDescription className="text-slate-400 dark:text-slate-600">{item.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400 dark:text-slate-600">Tersedia</p>
                    <p className="text-2xl font-bold text-blue-400 dark:text-blue-600">
                      {item.quantity_available}/{item.quantity_total}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 dark:text-slate-600">Lokasi</p>
                    <p className="text-sm text-white dark:text-slate-900">{item.location || "N/A"}</p>
                  </div>
                  {userRole === "admin" && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item)}
                        className="flex-1 border-slate-600 dark:border-slate-300 hover:bg-slate-700 dark:hover:bg-slate-100 bg-transparent text-white dark:text-slate-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteConfirm(item.id)}
                        className="flex-1 border-red-500 dark:border-red-600 text-red-400 dark:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (deletingId) await handleDeleteItem(deletingId)
        }}
        title="Hapus Barang"
        description="Apakah Anda yakin ingin menghapus barang ini? Tindakan ini tidak dapat dikembalikan."
        confirmLabel={deleting ? "Menghapus..." : "Hapus"}
        loading={deleting}
      />
      <ConfirmModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onConfirm={async () => {
          await handleUpdateItem()
        }}
        title="Edit Barang"
        description="Ubah informasi barang di bawah ini lalu klik Simpan."
        confirmLabel={editLoading ? "Menyimpan..." : "Simpan"}
        loading={editLoading}
      >
        {editingItem && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpdateItem(); }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-slate-200 dark:text-slate-700">Nama</Label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="mt-1 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
                />
              </div>

              <div>
                <Label className="text-slate-200 dark:text-slate-700">Kategori</Label>
                <Input
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="mt-1 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
                />
              </div>

              <div>
                <Label className="text-slate-200 dark:text-slate-700">Jumlah Total</Label>
                <Input
                  type="number"
                  value={String(editingItem.quantity_total)}
                  onChange={(e) => setEditingItem({ ...editingItem, quantity_total: Number.parseInt(e.target.value || "0") })}
                  className="mt-1 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
                />
              </div>

              <div>
                <Label className="text-slate-200 dark:text-slate-700">Lokasi</Label>
                <Input
                  value={editingItem.location || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                  className="mt-1 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
                />
              </div>
            </div>
          </form>
        )}
      </ConfirmModal>
    </div>
  )
}
