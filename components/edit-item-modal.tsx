"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { InventoryItem } from "@/lib/types"

interface EditItemModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (itemId: string, updates: Partial<InventoryItem>) => Promise<void>
}

export default function EditItemModal({ item, isOpen, onClose, onSave }: EditItemModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    description: "",
    location: "" as "Auditorio 5" | "Bodega" | "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        serialNumber: item.serialNumber,
        description: item.description || "",
        location: (item.location || "") as "Auditorio 5" | "Bodega" | "",
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item?.id) return

    setLoading(true)
    try {
      await onSave(item.id, {
        name: formData.name,
        serialNumber: formData.serialNumber,
        description: formData.description,
        location: formData.location || undefined,
      })
      onClose()
    } catch (error) {
      console.error("Error updating item:", error)
    } finally {
      setLoading(false)
    }
  }

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
              <Label htmlFor="edit-serialNumber">Número de Serie *</Label>
              <Input
                id="edit-serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Ej: GTA-001"
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
