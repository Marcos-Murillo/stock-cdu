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
  onRefresh?: () => Promise<void> | void
}

// Extrae el serial base quitando el sufijo -NN del final
function getSerialBase(serialNumber: string): string {
  return serialNumber.replace(/-\d+$/, "")
}

// Encuentra el índice más alto ya usado en el grupo para continuar desde ahí
function getNextSerialIndex(groupItems: InventoryItem[]): number {
  let max = groupItems.length
  for (const gi of groupItems) {
    const match = gi.serialNumber.match(/-(\d+)$/)
    if (match) {
      const n = parseInt(match[1])
      if (n > max) max = n
    }
  }
  return max
}

export default function EditItemModal({ item, groupItems, isOpen, onClose, onSave, onRefresh }: EditItemModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "" as "Auditorio 5" | "Bodega" | "",
    quantity: 1,
  })
  const [loading, setLoading] = useState(false)

  // Estado para el sub-modal de eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteMode, setDeleteMode] = useState<"all" | "custom">("custom")
  const [deleteQty, setDeleteQty] = useState(1)

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || "",
        location: (item.location || "") as "Auditorio 5" | "Bodega" | "",
        quantity: groupItems?.length ?? 1,
      })
    }
  }, [item, groupItems])

  const availableCount = (groupItems ?? [item]).filter((i) => i?.status === "available").length
  const currentQty = groupItems?.length ?? 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item?.id) return

    setLoading(true)
    try {
      const currentItems = groupItems ?? [item]
      const newQty = formData.quantity
      const maxAllowed = 500

      if (newQty < currentQty - availableCount) {
        toast({ title: "Error", description: `No puedes bajar de ${currentQty - availableCount} (hay items prestados)`, variant: "destructive" })
        setLoading(false)
        return
      }
      if (newQty > maxAllowed) {
        toast({ title: "Error", description: `El total no puede superar ${maxAllowed}. Actualmente tienes ${currentQty}, puedes agregar hasta ${maxAllowed - currentQty} más.`, variant: "destructive" })
        setLoading(false)
        return
      }

      // Actualizar nombre, descripción y ubicación en todos los items del grupo
      await Promise.all(currentItems.map((gi) => {
        const updates: Partial<InventoryItem> = { name: formData.name, description: formData.description }
        if (formData.location) updates.location = formData.location
        return onSave(gi.id!, updates)
      }))

      // Ajustar cantidad
      if (newQty > currentQty) {
        const toAdd = newQty - currentQty
        // Usar el serial base del grupo y continuar desde el índice más alto
        const serialBase = getSerialBase(currentItems[0].serialNumber)
        const startIdx = getNextSerialIndex(currentItems)
        await Promise.all(Array.from({ length: toAdd }, (_, k) => {
          const idx = startIdx + k + 1
          return addItem({
            name: formData.name,
            serialNumber: `${serialBase}-${String(idx).padStart(2, "0")}`,
            description: formData.description,
            ...(formData.location ? { location: formData.location } : {}),
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
      await onRefresh?.()
      onClose()
    } catch (error) {
      console.error("Error updating item:", error)
      toast({ title: "Error", description: "No se pudo actualizar el elemento", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const currentItems = groupItems ?? [item!]
    const available = currentItems.filter((i) => i.status === "available")
    const candidates = deleteMode === "all" ? available : available.slice(0, deleteQty)

    if (candidates.length === 0) {
      toast({ title: "Sin disponibles", description: "No hay elementos disponibles para eliminar", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await Promise.all(candidates.map((c) => removeItem(c.id!)))
      toast({ title: "Éxito", description: `${candidates.length} elemento(s) eliminado(s)` })
      setShowDeleteModal(false)
      await onRefresh?.()
      onClose()
    } catch {
      toast({ title: "Error", description: "No se pudieron eliminar los elementos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen && !showDeleteModal} onOpenChange={onClose}>
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
                  max={500}
                  value={formData.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (!isNaN(val)) setFormData({ ...formData, quantity: val })
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Actual: {currentQty} · {availableCount} disponibles · máx. {500 - currentQty} se pueden agregar
                </p>
              </div>
            </div>
            <DialogFooter>
              <div className="flex w-full gap-2 px-6 pb-4">
              <Button
                type="button"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 mr-auto"
                onClick={() => { setDeleteQty(1); setDeleteMode("custom"); setShowDeleteModal(true) }}
                disabled={loading}
              >
                Eliminar elementos
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-lime-600 hover:bg-lime-700">
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub-modal de eliminación */}
      <Dialog open={showDeleteModal} onOpenChange={() => setShowDeleteModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar elementos — {item?.name}</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Total en grupo: <span className="font-semibold">{currentQty}</span> · Disponibles para eliminar: <span className="font-semibold text-green-700">{availableCount}</span>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteMode("custom")}
                className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${deleteMode === "custom" ? "bg-red-50 border-red-400 text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                Cantidad específica
              </button>
              <button
                type="button"
                onClick={() => setDeleteMode("all")}
                className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${deleteMode === "all" ? "bg-red-50 border-red-400 text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                Todos los disponibles
              </button>
            </div>
            {deleteMode === "custom" && (
              <div>
                <Label htmlFor="delete-qty">Cantidad a eliminar</Label>
                <Input
                  id="delete-qty"
                  type="number"
                  min={1}
                  max={availableCount}
                  value={deleteQty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (!isNaN(val)) setDeleteQty(Math.min(val, availableCount))
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Máximo: {availableCount} disponibles</p>
              </div>
            )}
            {deleteMode === "all" && (
              <p className="text-sm text-red-600 bg-red-50 rounded p-2">
                Se eliminarán los {availableCount} elementos disponibles del grupo.
              </p>
            )}
          </div>
          <DialogFooter>
            <div className="flex w-full gap-2 px-6 pb-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading || availableCount === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Eliminando..." : `Eliminar ${deleteMode === "all" ? availableCount : deleteQty}`}
            </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
