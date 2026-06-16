import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { InventoryItem } from "./types"
import { normalizeItemCondition } from "./data"

const ITEM_CONDITION_LABELS = ["Bueno", "Regular", "Para cambio"]

export function generateInventoryArqueoPDF(items: InventoryItem[]) {
  const active = items.filter((i) => i.status !== "removed")

  const byName = new Map<
    string,
    { bueno: number; regular: number; para_cambio: number; total: number }
  >()

  for (const item of active) {
    const cond = normalizeItemCondition(item.condition)
    const row = byName.get(item.name) ?? { bueno: 0, regular: 0, para_cambio: 0, total: 0 }
    row[cond]++
    row.total++
    byName.set(item.name, row)
  }

  const rows = Array.from(byName.entries())
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([name, counts]) => [
      name,
      String(counts.bueno),
      String(counts.regular),
      String(counts.para_cambio),
      String(counts.total),
    ])

  const totals = { bueno: 0, regular: 0, para_cambio: 0, total: 0 }
  for (const c of Array.from(byName.values())) {
    totals.bueno += c.bueno
    totals.regular += c.regular
    totals.para_cambio += c.para_cambio
    totals.total += c.total
  }

  rows.push([
    "TOTAL GENERAL",
    String(totals.bueno),
    String(totals.regular),
    String(totals.para_cambio),
    String(totals.total),
  ])

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const fecha = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("ARQUEO DE IMPLEMENTOS DEPORTIVOS", pageWidth / 2, 18, { align: "center" })

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text("Universidad del Valle — Inventario Deportivo", pageWidth / 2, 26, { align: "center" })
  doc.text(`Fecha: ${fecha}`, pageWidth / 2, 33, { align: "center" })

  doc.setFontSize(9)
  doc.text(
    `Estados: ${ITEM_CONDITION_LABELS.join(" · ")}`,
    pageWidth / 2,
    40,
    { align: "center" },
  )

  autoTable(doc, {
    startY: 46,
    head: [["Implemento", "Bueno", "Regular", "Para cambio", "Total"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: "center", cellWidth: 22 },
      2: { halign: "center", cellWidth: 22 },
      3: { halign: "center", cellWidth: 28 },
      4: { halign: "center", cellWidth: 22, fontStyle: "bold" },
    },
    didParseCell(data) {
      if (data.row.index === rows.length - 1) {
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fillColor = [239, 246, 255]
      }
    },
  })

  const fileName = `arqueo_implementos_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}
