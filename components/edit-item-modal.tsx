"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addItem, removeItem } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import type { InventoryItem } from "@/lib/types"

interface EditItemModalProps {
  item: InventoryItem | null
  groupItems?: InventoryItem[]
  isOpen: boolean
  onClose: () => void
  onSave: (itemId: string, updates: Partial<InventoryItem>) => Promise<void>
  onRefresh?: () => void
}

export default function EditItemModal({ item, groupItems, isOpen, onClose, onSave, onRefresh }: EditItemModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    description: "",
    location: "" as "Auditorio 5" | "Bodega" | "",
    quantity: 1,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        serialNumber: item.serialNumber,
        description: item.description || "",
        location: (item.location || "") as "Auditorio 5" | "Bodega" | "",
        quantity: groupItems?.length ?? 1,
      })
    }
  }, [item, groupItems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item?.id) return

    setLoading(true)
    try {
      // Actualizar nombre, descripción y ubicación en todos los items del grupo en paralelo
      const currentItems = groupItems ?? [item]
      const currentQty = currentItems.length
      const newQty = formData.quantity

      await Promise.all(currentItems.map((gi) => {
        const updates: Partial<InventoryItem> = { name: formData.name, description: formData.description }
        if (formData.location) updates.location = formData.location
        return onSave(gi.id!, updates)
      }))

      // Ajustar cantidad
      if (newQty > currentQty) {
        const toAdd = newQty - currentQty
        await Promise.all(Array.from({ length: toAdd }, (_, k) => {
          const idx = currentQty + k + 1
          return addItem({
            name: formData.name,
            serialNumber: `${item.serialNumber.replace(/-\d+$/, "")}-${String(idx).padStart(2, "0")}`,
            description: formData.description,
            location: formData.location || undefined,
            status: "available",
            createdAt: new Date(),
          })
        }))
      } else if (newQty < currentQty) {
        const available = currentItems.filter((i) => i.status === "available")
        const toRemove = currentQty - newQty
        const candidates = available.slice(-toRemove)
        await Promise.all(candidates.map((c) => removeItem(c.id!)))
      }

      toast({ title: "Éxito", description: "Elemento actualizado correctamente" })
      onRefresh?.()
      onClose()
    } catch (error) {
      console.error("Error updating item:", error)
      toast({ title: "Error", description: "No se pudo actualizar el elemento", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const availableCount = (groupItems ?? [item]).filter((i) => i?.status === "available").length
  const currentQty = groupItems?.length ?? 1

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Elemento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre del Elemento *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Guitarra acústica"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción adicional del elemento"
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Ubicación</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value as "Auditorio 5" | "Bodega" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auditorio 5">Auditorio 5</SelectItem>
                  <SelectItem value="Bodega">Bodega</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-quantity">Cantidad</Label>
              <Input
                id="edit-quantity"
                type="number"
                min={currentQty - availableCount}
                value={formData.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!isNaN(val)) setFormData({ ...formData, quantity: val })
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Actual: {currentQty} · {availableCount} disponibles para eliminar
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-lime-600 hover:bg-lime-700">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
