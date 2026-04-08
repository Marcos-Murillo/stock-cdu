"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

export interface MissingItem {
  name: string
  total: number
  missing: number
}

interface PartialReturnDialogProps {
  isOpen: boolean
  onClose: () => void
  // itemGroups: { name, total } por cada tipo de elemento en el préstamo
  itemGroups: { name: string; total: number }[]
  onConfirm: (missingItems: { name: string; missing: number }[]) => Promise<void>
  borrowerName: string
}

export default function PartialReturnDialog({
  isOpen,
  onClose,
  itemGroups,
  onConfirm,
  borrowerName,
}: PartialReturnDialogProps) {
  const [missing, setMissing] = useState<Record<string, number>>(
    () => Object.fromEntries(itemGroups.map((g) => [g.name, 0]))
  )
  const [loading, setLoading] = useState(false)

  const totalMissing = Object.values(missing).reduce((a, b) => a + b, 0)
  const isValid = totalMissing > 0

  const handleConfirm = async () => {
    if (!isValid) return
    setLoading(true)
    try {
      const missingItems = itemGroups
        .filter((g) => (missing[g.name] ?? 0) > 0)
        .map((g) => ({ name: g.name, missing: missing[g.name] }))
      await onConfirm(missingItems)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMissing(Object.fromEntries(itemGroups.map((g) => [g.name, 0])))
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Regreso con Faltas
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-1 py-2 space-y-4">
          <p className="text-sm text-gray-600">
            Préstamo de <span className="font-semibold">{borrowerName}</span>. Indica cuántos faltan por cada elemento:
          </p>

          <div className="space-y-3">
            {itemGroups.map((group) => (
              <div key={group.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{group.name}</Label>
                  <p className="text-xs text-gray-500">Prestados: {group.total}</p>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min={0}
                    max={group.total}
                    value={missing[group.name] ?? 0}
                    onChange={(e) => {
                      const v = parseInt(e.target.value)
                      setMissing((prev) => ({
                        ...prev,
                        [group.name]: isNaN(v) ? 0 : Math.min(v, group.total),
                      }))
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {totalMissing > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
              Faltan <strong>{totalMissing}</strong> elemento(s) en total.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !isValid}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? "Guardando..." : "Confirmar Devolución"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
