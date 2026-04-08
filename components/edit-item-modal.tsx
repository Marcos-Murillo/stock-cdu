"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addItem, removeItem } from "@/lib/firebase"
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
      const currentItems = groupItems ?? [item]
      const currentQty = currentItems.length
      const newQty = formData.quantity

      // Actualizar nombre, descripción y ubicación en todos los items del grupo
      for (const gi of currentItems) {
        const updates: Partial<InventoryItem> = {
          name: formData.name,
          description: formData.description,
        }
        if (formData.location) updates.location = formData.location
        await onSave(gi.id!, updates)
      }

      // Ajustar cantidad
      if (newQty > currentQty) {
        // Agregar los que faltan
        const toAdd = newQty - currentQty
        for (let i = 1; i <= toAdd; i++) {
          const idx = currentQty + i
          await addItem({
            name: formData.name,
            serialNumber: `${item.serialNumber.replace(/-\d+$/, "")}-${String(idx).padStart(2, "0")}`,
            description: formData.description,
            location: formData.location || undefined,
            status: "available",
            createdAt: new Date(),
          })
        }
      } else if (newQty < currentQty) {
        // Eliminar los sobrantes (solo los disponibles al final)
        const available = currentItems.filter((i) => i.status === "available")
        const toRemove = currentQty - newQty
        const candidates = available.slice(-toRemove)
        for (const c of candidates) {
          await removeItem(c.id!)
        }
      }

      onRefresh?.()
      onClose()
    } catch (error) {
      console.error("Error updating item:", error)
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
                max={200}
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
