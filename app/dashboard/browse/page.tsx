"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { Package, ShoppingCart, AlertCircle } from "lucide-react"

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
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map())
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])

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

    if (!user || selectedItems.size === 0) return

    const borrowRequests = Array.from(selectedItems.entries()).map(([itemId, quantity]) => ({
      student_id: user.id,
      item_id: itemId,
      quantity_requested: quantity,
      status: "pending",
    }))

    const { error: insertError } = await supabase.from("borrow_requests").insert(borrowRequests)

    if (insertError) {
      setError(insertError.message)
    } else {
      setSelectedItems(new Map())
      setError(null)
      alert("Borrow requests submitted successfully!")
    }
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading items...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-white">Browse Inventory</h1>
        {selectedItems.size > 0 && (
          <Button onClick={handleSubmitRequest} className="bg-blue-600 hover:bg-blue-700">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Submit Request ({selectedItems.size})
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="border-slate-700 bg-slate-800">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="flex-1">
              <Label className="text-slate-200">Search</Label>
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2 border-slate-600 bg-slate-700 text-white"
              />
            </div>
            <div className="flex-1">
              <Label className="text-slate-200">Category</Label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-2 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800 md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="mb-4 h-12 w-12 text-slate-500" />
              <p className="text-slate-400">No items available</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">{item.name}</CardTitle>
                <CardDescription className="text-slate-400">{item.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Description</p>
                  <p className="text-sm text-white">{item.description || "No description"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Available</p>
                    <p className="text-xl font-bold text-blue-400">{item.quantity_available}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Location</p>
                    <p className="text-sm text-white">{item.location || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Quantity to Borrow</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={item.quantity_available}
                      value={selectedItems.get(item.id) || 0}
                      onChange={(e) => handleQuantityChange(item.id, Number.parseInt(e.target.value) || 0)}
                      className="border-slate-600 bg-slate-700 text-white"
                    />
                    <Button
                      onClick={() => handleQuantityChange(item.id, 0)}
                      variant="outline"
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      Clear
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
