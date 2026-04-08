"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface PartialReturnDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (missingCount: number, missingNotes: string) => Promise<void>
  totalItems: number
  borrowerName: string
}

export default function PartialReturnDialog({
  isOpen,
  onClose,
  onConfirm,
  totalItems,
  borrowerName,
}: PartialReturnDialogProps) {
  const [missingCount, setMissingCount] = useState(1)
  const [missingNotes, setMissingNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (missingCount < 1 || missingCount >= totalItems) return
    setLoading(true)
    try {
      await onConfirm(missingCount, missingNotes)
      setMissingCount(1)
      setMissingNotes("")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMissingCount(1)
    setMissingNotes("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="w-5 h-5" />
            Regreso con Faltas
          </DialogTitle>
        </DialogHeader>

        <div className="px-1 py-2 space-y-4">
          <p className="text-sm text-gray-600">
            Préstamo de <span className="font-semibold">{borrowerName}</span> — {totalItems} elementos prestados.
          </p>

          <div>
            <Label htmlFor="missing-count">¿Cuántos implementos faltan por entregar?</Label>
            <Input
              id="missing-count"
              type="number"
              min={1}
              max={totalItems - 1}
              value={missingCount}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                if (!isNaN(v)) setMissingCount(v)
              }}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo {totalItems - 1} (debe entregar al menos 1)
            </p>
          </div>

          <div>
            <Label htmlFor="missing-notes">Observaciones (opcional)</Label>
            <Input
              id="missing-notes"
              value={missingNotes}
              onChange={(e) => setMissingNotes(e.target.value)}
              placeholder="Ej: Falta 1 balón, quedó en el campo..."
              className="mt-1"
            />
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
            Se registrará la devolución de <strong>{totalItems - missingCount}</strong> elemento(s) y quedarán{" "}
            <strong>{missingCount}</strong> faltante(s) en el reporte.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || missingCount < 1 || missingCount >= totalItems}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? "Guardando..." : "Confirmar Devolución"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
