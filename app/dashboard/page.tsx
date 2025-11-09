"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { Package, Plus, Edit, Trash2, AlertCircle } from "lucide-react"

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
    const supabase = createClient()
    const { error: deleteError } = await supabase.from("inventory_items").delete().eq("id", id)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
        {userRole === "admin" && (
          <Button onClick={() => setIsAddingItem(!isAddingItem)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {isAddingItem && userRole === "admin" && (
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Add New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-slate-200">Name</Label>
                  <Input
                    required
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="mt-1 border-slate-600 bg-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">Category</Label>
                  <Input
                    required
                    placeholder="Category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="mt-1 border-slate-600 bg-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">Quantity</Label>
                  <Input
                    required
                    type="number"
                    placeholder="0"
                    value={newItem.quantity_total}
                    onChange={(e) => setNewItem({ ...newItem, quantity_total: e.target.value })}
                    className="mt-1 border-slate-600 bg-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">Location</Label>
                  <Input
                    placeholder="Storage location"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="mt-1 border-slate-600 bg-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Save Item
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingItem(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800 md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="mb-4 h-12 w-12 text-slate-500" />
              <p className="text-slate-400">No inventory items yet</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">{item.name}</CardTitle>
                <CardDescription className="text-slate-400">{item.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400">Available</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {item.quantity_available}/{item.quantity_total}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Location</p>
                    <p className="text-sm text-white">{item.location || "N/A"}</p>
                  </div>
                  {userRole === "admin" && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-600 hover:bg-slate-700 bg-transparent"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
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
    </div>
  )
}
