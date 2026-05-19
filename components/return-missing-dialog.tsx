"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package } from "lucide-react"
import type { MissingItemRecord } from "@/lib/types"
import { remainingMissing } from "@/lib/loan-utils"

interface ReturnMissingDialogProps {
  isOpen: boolean
  onClose: () => void
  missingItems: MissingItemRecord[]
  onConfirm: (items: { name: string; quantity: number }[]) => Promise<void>
  borrowerName: string
}

export default function ReturnMissingDialog({
  isOpen,
  onClose,
  missingItems,
  onConfirm,
  borrowerName,
}: ReturnMissingDialogProps) {
  const pending = missingItems
    .map((mi) => ({ ...mi, pending: remainingMissing(mi) }))
    .filter((mi) => mi.pending > 0)

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setQuantities(Object.fromEntries(pending.map((mi) => [mi.name, mi.pending])))
    }
  }, [isOpen, missingItems])

  const totalReturning = Object.values(quantities).reduce((a, b) => a + b, 0)
  const isValid = totalReturning > 0

  const handleConfirm = async () => {
    if (!isValid) return
    setLoading(true)
    try {
      const items = pending
        .filter((mi) => (quantities[mi.name] ?? 0) > 0)
        .map((mi) => ({ name: mi.name, quantity: quantities[mi.name] ?? 0 }))
      await onConfirm(items)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (pending.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <Package className="w-5 h-5" />
            Devolver faltantes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600">
            Préstamo de <span className="font-semibold">{borrowerName}</span>. Indica cuántos
            faltantes se entregan ahora:
          </p>

          <div className="space-y-3">
            {pending.map((mi) => (
              <div key={mi.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{mi.name}</Label>
                  <p className="text-xs text-gray-500">Pendientes: {mi.pending}</p>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min={0}
                    max={mi.pending}
                    value={quantities[mi.name] ?? 0}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      setQuantities((prev) => ({
                        ...prev,
                        [mi.name]: isNaN(v) ? 0 : Math.min(Math.max(0, v), mi.pending),
                      }))
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {totalReturning > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              Se registrarán <strong>{totalReturning}</strong> elemento(s) devueltos.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !isValid}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Guardando…" : "Confirmar devolución"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
