"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/app/providers/theme-provider"
import { Package, ShoppingCart, AlertCircle } from "lucide-react"
import { SuccessModal } from "@/components/success-modal"
import { LoadingSpinner } from "@/components/loading-spinner"

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity_available: number
  quantity_total: number
  location: string
  description?: string
}

interface BorrowItem {
  itemId: string
  quantity: number
}

export default function BrowsePage() {
  const { theme } = useTheme()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map())
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [borrowDate, setBorrowDate] = useState<string>("")
  const [returnDate, setReturnDate] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const router = useRouter()

  useEffect(() => {
    const loadItems = async () => {
      const supabase = createClient()

      const { data: itemsData, error: itemsError } = await supabase
        .from("inventory_items")
        .select("*")
        .gt("quantity_available", 0)
        .order("name")

      if (itemsError) {
        setError(itemsError.message)
      } else {
        setItems(itemsData || [])
        const uniqueCategories = Array.from(new Set(itemsData?.map((item) => item.category) || []))
        setCategories(uniqueCategories as string[])
      }
      setIsLoading(false)
    }

    loadItems()
  }, [])

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newSelected = new Map(selectedItems)
    if (quantity > 0) {
      newSelected.set(itemId, quantity)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSubmitRequest = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Redirect unauthenticated users to login
      router.push("/auth/login")
      return
    }

    if (selectedItems.size === 0) {
      console.error("No items selected")
      setError("Pilih barang terlebih dahulu")
      return
    }

    // Validate dates
    if (!borrowDate || !returnDate) {
      setError("Masukkan tanggal pinjam dan tanggal kembali")
      return
    }

    const borrowDateObj = new Date(borrowDate)
    const returnDateObj = new Date(returnDate)
    if (isNaN(borrowDateObj.getTime()) || isNaN(returnDateObj.getTime())) {
      setError("Format tanggal tidak valid")
      return
    }
    if (borrowDateObj > returnDateObj) {
      setError("Tanggal kembali harus sama atau setelah tanggal pinjam")
      return
    }

    const borrowRequests = Array.from(selectedItems.entries()).map(([itemId, quantity]) => ({
      student_id: user.id,
      item_id: itemId,
      quantity_requested: quantity,
      status: "pending",
      borrow_date: borrowDateObj.toISOString(),
      return_date: returnDateObj.toISOString(),
    }))

    console.log("User ID:", user.id)
    console.log("Sending requests:", borrowRequests)

    const { error: insertError, data } = await supabase.from("borrow_requests").insert(borrowRequests)

    if (insertError) {
      console.error("Insert error:", insertError)
      console.error("Error details:", insertError.message, insertError.code)
      setError(`Error: ${insertError.message}`)
    } else {
      console.log("Request berhasil dikirim!", data)
      setSelectedItems(new Map())
      setError(null)
      // reset dates after successful submit
      setBorrowDate("")
      setReturnDate("")
      setShowSuccess(true)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <SuccessModal
        isOpen={showSuccess}
        title="Permintaan Berhasil Dikirim"
        message="Barang yang Anda minta akan diproses oleh admin. Terima kasih telah menggunakan sistem inventaris!"
        onClose={() => setShowSuccess(false)}
        autoCloseDuration={3000}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-white dark:text-slate-900">Lihat Inventaris</h1>
        {selectedItems.size > 0 && (
          <Button
            onClick={handleSubmitRequest}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:text-white"
            disabled={!borrowDate || !returnDate}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Kirim Permintaan ({selectedItems.size})
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 dark:bg-red-100 p-4 text-red-400 dark:text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="flex-1">
              <Label className="text-slate-700 dark:text-slate-200">Cari</Label>
              <Input
                placeholder="Cari barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
              />
            </div>
            <div className="flex-1">
              <Label className="text-slate-700 dark:text-slate-200">Kategori</Label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-2 w-full rounded-md border border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white px-3 py-2 text-white dark:text-slate-900"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-slate-700 dark:text-slate-200">Tanggal Pinjam</Label>
              <Input
                type="date"
                value={borrowDate}
                onChange={(e) => setBorrowDate(e.target.value)}
                min={today}
                className="mt-2 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
              />
              <Label className="mt-3 text-slate-700 dark:text-slate-200">Tanggal Kembali</Label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={borrowDate || today}
                className="mt-2 border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length === 0 ? (
          <Card className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="mb-4 h-12 w-12 text-slate-500 dark:text-slate-400" />
              <p className="text-slate-400 dark:text-slate-600">Tidak ada barang tersedia</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
                    <Card key={item.id} className="border-slate-700 dark:border-slate-200 bg-slate-800 dark:bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-white dark:text-slate-900">{item.name}</CardTitle>
                <CardDescription className="text-slate-400 dark:text-slate-600">{item.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 dark:text-slate-600">Deskripsi</p>
                  <p className="text-sm text-white dark:text-slate-900">{item.description || "Tidak ada deskripsi"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400 dark:text-slate-600">Tersedia</p>
                    <p className="text-xl font-bold text-blue-400 dark:text-blue-600">{item.quantity_available}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 dark:text-slate-600">Lokasi</p>
                    <p className="text-sm text-white dark:text-slate-900">{item.location || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-200">Jumlah untuk Dipinjam</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={item.quantity_available}
                      value={selectedItems.get(item.id) || 0}
                      onChange={(e) => handleQuantityChange(item.id, Number.parseInt(e.target.value) || 0)}
                      className="border-slate-600 dark:border-slate-300 bg-slate-700 dark:bg-white text-white dark:text-slate-900"
                    />
                    <Button
                      onClick={() => handleQuantityChange(item.id, 0)}
                      variant="outline"
                      className="flex-1 border-red-500 dark:border-red-600 text-red-400 dark:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-100"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
