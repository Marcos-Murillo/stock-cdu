import * as XLSX from "xlsx"
import type { Loan } from "./types"
import { buildLoanGroupSummaries, formatDateTime } from "./loan-utils"

function upperName(name: string): string {
  return (name || "").trim().toUpperCase()
}

interface ItemStatRow {
  id?: string
  name: string
  serialNumber: string
  totalLoans: number
  activeLoans: number
  returnedLoans: number
  damageReports: number
  lastLoanDate: Date | null
  status: string
}

interface DetailedStatsInput {
  itemStats: ItemStatRow[]
  totalItems: number
  totalLoans: number
  activeLoans: number
  totalDamageReports: number
}

function buildLoansByPersonRows(loans: Loan[]) {
  const byDoc = new Map<
    string,
    {
      name: string
      document: string
      code: string
      facultad: string
      programa: string
      total: number
      active: number
      returned: number
    }
  >()

  for (const loan of loans) {
    const doc = loan.borrowerDocument?.trim() || "SIN_DOCUMENTO"
    const existing = byDoc.get(doc)
    if (existing) {
      existing.total++
      if (loan.status === "active") existing.active++
      else existing.returned++
      if (!existing.code && loan.borrowerCode) existing.code = loan.borrowerCode
      if (!existing.facultad && loan.facultad) existing.facultad = loan.facultad
      if (!existing.programa && loan.programa) existing.programa = loan.programa
    } else {
      byDoc.set(doc, {
        name: loan.borrowerName,
        document: loan.borrowerDocument,
        code: loan.borrowerCode ?? "",
        facultad: loan.facultad ?? "",
        programa: loan.programa ?? "",
        total: 1,
        active: loan.status === "active" ? 1 : 0,
        returned: loan.status === "returned" ? 1 : 0,
      })
    }
  }

  return Array.from(byDoc.values())
    .sort((a, b) => b.total - a.total)
    .map((p) => ({
      Nombres: upperName(p.name),
      Documento: p.document,
      Código: p.code,
      Facultad: p.facultad,
      Programa: p.programa,
      "Total préstamos": p.total,
      Activos: p.active,
      Devueltos: p.returned,
    }))
}

function buildItemUsageRows(itemStats: ItemStatRow[]) {
  return [...itemStats]
    .sort((a, b) => b.totalLoans - a.totalLoans)
    .map((item) => ({
      Elemento: item.name,
      Serial: item.serialNumber,
      "Total préstamos": item.totalLoans,
      Activos: item.activeLoans,
      Devueltos: item.returnedLoans,
      "Reportes daño": item.damageReports,
      Estado: item.status,
      "Último préstamo": item.lastLoanDate ? formatDateTime(item.lastLoanDate) : "",
    }))
}

function buildLoanDetailRows(loans: Loan[]) {
  return [...loans]
    .sort((a, b) => b.loanDate.getTime() - a.loanDate.getTime())
    .map((loan) => ({
      Nombres: upperName(loan.borrowerName),
      Documento: loan.borrowerDocument,
      Código: loan.borrowerCode ?? "",
      Elemento: loan.itemName,
      Serial: loan.itemSerialNumber,
      "Fecha préstamo": formatDateTime(loan.loanDate),
      "Fecha devolución": loan.returnDate ? formatDateTime(loan.returnDate) : "",
      Estado: loan.status === "active" ? "Activo" : "Devuelto",
      Facultad: loan.facultad ?? "",
      Programa: loan.programa ?? "",
      Género: loan.genero ?? "",
      Sede: loan.sede ?? "",
      Estamento: loan.estamento ?? "",
    }))
}

function buildReturnedGroupRows(loans: Loan[]) {
  const groups = buildLoanGroupSummaries(loans)
  return groups
    .sort((a, b) => (b.returnDate?.getTime() ?? 0) - (a.returnDate?.getTime() ?? 0))
    .map((g) => ({
      Nombres: upperName(g.borrowerName),
      Documento: g.borrowerDocument,
      Código: g.borrowerCode ?? "",
      "Fecha préstamo": formatDateTime(g.loanDate),
      "Fecha devolución": g.returnDate ? formatDateTime(g.returnDate) : "",
      Elementos: g.itemNames.join(", "),
      "Cantidad elementos": g.itemNames.length,
      Faltantes: g.hadMissing ? (g.missingResolved ? "Resueltos" : "Pendientes") : "Ninguno",
    }))
}

function buildSummaryRows(stats: DetailedStatsInput) {
  return [
    { Métrica: "Total elementos", Valor: stats.totalItems },
    { Métrica: "Total préstamos", Valor: stats.totalLoans },
    { Métrica: "Préstamos activos", Valor: stats.activeLoans },
    { Métrica: "Reportes de daño", Valor: stats.totalDamageReports },
  ]
}

export function exportStockStatisticsExcel(stats: DetailedStatsInput, loans: Loan[]) {
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildSummaryRows(stats)),
    "Resumen",
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildLoansByPersonRows(loans)),
    "Préstamos por persona",
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildItemUsageRows(stats.itemStats)),
    "Elementos usados",
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildLoanDetailRows(loans)),
    "Detalle préstamos",
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildReturnedGroupRows(loans)),
    "Grupos devueltos",
  )

  const date = new Date().toISOString().split("T")[0]
  XLSX.writeFile(wb, `estadisticas_stock_cdu_${date}.xlsx`)
}
