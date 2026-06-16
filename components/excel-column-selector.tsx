"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Plus } from "lucide-react"

export interface ExcelColumn {
  key: string
  label: string
}

interface ExcelColumnSelectorProps {
  availableColumns: ExcelColumn[]
  onDownload: (selectedColumns: string[]) => void
  disabled?: boolean
}

export function ExcelColumnSelector({
  availableColumns,
  onDownload,
  disabled = false,
}: ExcelColumnSelectorProps) {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    () => new Set(availableColumns.map((col) => col.key)),
  )

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAll = () => {
    setSelectedColumns(new Set(availableColumns.map((col) => col.key)))
  }

  const deselectAll = () => {
    setSelectedColumns(new Set())
  }

  const handleDownload = () => {
    onDownload(Array.from(selectedColumns))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-blue-900">Columnas adicionales</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={selectAll} className="h-7 text-xs">
            Todas
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={deselectAll} className="h-7 text-xs">
            Ninguna
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 sm:grid-cols-2">
        {availableColumns.map((column) => {
          const isSelected = selectedColumns.has(column.key)
          return (
            <button
              key={column.key}
              type="button"
              onClick={() => toggleColumn(column.key)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-800 hover:bg-blue-100"
              }`}
            >
              <span className="truncate">{column.label}</span>
              {isSelected ? (
                <Check className="ml-1 h-3 w-3 shrink-0" />
              ) : (
                <Plus className="ml-1 h-3 w-3 shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      <Button
        type="button"
        onClick={handleDownload}
        disabled={disabled}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        Descargar Excel
      </Button>
    </div>
  )
}
