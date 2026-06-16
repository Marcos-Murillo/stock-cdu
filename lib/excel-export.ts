import * as XLSX from "xlsx"
import type { Loan } from "./types"
import { buildLoanGroupSummaries, formatDateTime } from "./loan-utils"

function upperName(name: string): string {
  return (name || "").trim().toUpperCase()
}

export type StockExcelOptionalColumn = "correo" | "telefono" | "etnia" | "edad"

export const STOCK_EXCEL_OPTIONAL_COLUMNS: { key: StockExcelOptionalColumn; label: string }[] = [
  { key: "correo", label: "Correo" },
  { key: "telefono", label: "Teléfono" },
  { key: "etnia", label: "Etnia" },
  { key: "edad", label: "Edad" },
]

const OPTIONAL_LABELS: Record<StockExcelOptionalColumn, string> = {
  correo: "Correo",
  telefono: "Teléfono",
  etnia: "Etnia",
  edad: "Edad",
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

function optionalFromLoan(
  loan: Pick<Loan, "borrowerEmail" | "borrowerPhone" | "etnia" | "borrowerAge">,
  selected: StockExcelOptionalColumn[],
): Record<string, string | number> {
  const extra: Record<string, string | number> = {}
  for (const key of selected) {
    switch (key) {
      case "correo":
        extra[OPTIONAL_LABELS.correo] = loan.borrowerEmail ?? ""
        break
      case "telefono":
        extra[OPTIONAL_LABELS.telefono] = loan.borrowerPhone ?? ""
        break
      case "etnia":
        extra[OPTIONAL_LABELS.etnia] = loan.etnia ?? ""
        break
      case "edad":
        extra[OPTIONAL_LABELS.edad] =
          loan.borrowerAge != null && !Number.isNaN(loan.borrowerAge) ? loan.borrowerAge : ""
        break
    }
  }
  return extra
}

function orderRow(
  base: Record<string, string | number>,
  selected: StockExcelOptionalColumn[],
  beforeKeys: string[],
  afterKeys: string[],
): Record<string, string | number> {
  const optionalKeys = selected.map((k) => OPTIONAL_LABELS[k])
  const ordered: Record<string, string | number> = {}
  for (const key of beforeKeys) {
    if (key in base) ordered[key] = base[key]
  }
  for (const key of optionalKeys) {
    if (key in base) ordered[key] = base[key]
  }
  for (const key of afterKeys) {
    if (key in base) ordered[key] = base[key]
  }
  return ordered
}

function buildLoansByPersonRows(loans: Loan[], selected: StockExcelOptionalColumn[]) {
  const byDoc = new Map<
    string,
    {
      name: string
      document: string
      code: string
      facultad: string
      programa: string
      email: string
      phone: string
      etnia: string
      age: number | ""
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
      if (!existing.email && loan.borrowerEmail) existing.email = loan.borrowerEmail
      if (!existing.phone && loan.borrowerPhone) existing.phone = loan.borrowerPhone
      if (!existing.etnia && loan.etnia) existing.etnia = loan.etnia
      if (existing.age === "" && loan.borrowerAge != null) existing.age = loan.borrowerAge
    } else {
      byDoc.set(doc, {
        name: loan.borrowerName,
        document: loan.borrowerDocument,
        code: loan.borrowerCode ?? "",
        facultad: loan.facultad ?? "",
        programa: loan.programa ?? "",
        email: loan.borrowerEmail ?? "",
        phone: loan.borrowerPhone ?? "",
        etnia: loan.etnia ?? "",
        age: loan.borrowerAge ?? "",
        total: 1,
        active: loan.status === "active" ? 1 : 0,
        returned: loan.status === "returned" ? 1 : 0,
      })
    }
  }

  return Array.from(byDoc.values())
    .sort((a, b) => b.total - a.total)
    .map((p) => {
      const base: Record<string, string | number> = {
        Nombres: upperName(p.name),
        Documento: p.document,
        Código: p.code,
        Facultad: p.facultad,
        Programa: p.programa,
        "Total préstamos": p.total,
        Activos: p.active,
        Devueltos: p.returned,
        ...optionalFromLoan(
          {
            borrowerEmail: p.email,
            borrowerPhone: p.phone,
            etnia: p.etnia,
            borrowerAge: p.age === "" ? undefined : p.age,
          },
          selected,
        ),
      }
      return orderRow(base, selected, ["Nombres", "Documento"], [
        "Código",
        "Facultad",
        "Programa",
        "Total préstamos",
        "Activos",
        "Devueltos",
      ])
    })
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

function buildLoanDetailRows(loans: Loan[], selected: StockExcelOptionalColumn[]) {
  return [...loans]
    .sort((a, b) => b.loanDate.getTime() - a.loanDate.getTime())
    .map((loan) => {
      const base: Record<string, string | number> = {
        Nombres: upperName(loan.borrowerName),
        Documento: loan.borrowerDocument,
        Código: loan.borrowerCode ?? "",
        ...optionalFromLoan(loan, selected),
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
      }
      return orderRow(base, selected, ["Nombres", "Documento", "Código"], [
        "Elemento",
        "Serial",
        "Fecha préstamo",
        "Fecha devolución",
        "Estado",
        "Facultad",
        "Programa",
        "Género",
        "Sede",
        "Estamento",
      ])
    })
}

function buildReturnedGroupRows(loans: Loan[], selected: StockExcelOptionalColumn[]) {
  const groups = buildLoanGroupSummaries(loans)
  return groups
    .sort((a, b) => (b.returnDate?.getTime() ?? 0) - (a.returnDate?.getTime() ?? 0))
    .map((g) => {
      const primary = g.primaryLoan
      const base: Record<string, string | number> = {
        Nombres: upperName(g.borrowerName),
        Documento: g.borrowerDocument,
        Código: g.borrowerCode ?? "",
        ...optionalFromLoan(primary, selected),
        "Fecha préstamo": formatDateTime(g.loanDate),
        "Fecha devolución": g.returnDate ? formatDateTime(g.returnDate) : "",
        Elementos: g.itemNames.join(", "),
        "Cantidad elementos": g.itemNames.length,
        Faltantes: g.hadMissing ? (g.missingResolved ? "Resueltos" : "Pendientes") : "Ninguno",
      }
      return orderRow(base, selected, ["Nombres", "Documento", "Código"], [
        "Fecha préstamo",
        "Fecha devolución",
        "Elementos",
        "Cantidad elementos",
        "Faltantes",
      ])
    })
}

function buildSummaryRows(stats: DetailedStatsInput) {
  return [
    { Métrica: "Total elementos", Valor: stats.totalItems },
    { Métrica: "Total préstamos", Valor: stats.totalLoans },
    { Métrica: "Préstamos activos", Valor: stats.activeLoans },
    { Métrica: "Reportes de daño", Valor: stats.totalDamageReports },
  ]
}

export function exportStockStatisticsExcel(
  stats: DetailedStatsInput,
  loans: Loan[],
  selectedColumns: string[] = [],
) {
  const optional = selectedColumns.filter((col): col is StockExcelOptionalColumn =>
    STOCK_EXCEL_OPTIONAL_COLUMNS.some((c) => c.key === col),
  )

  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildSummaryRows(stats)),
    "Resumen",
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildLoansByPersonRows(loans, optional)),
    "Préstamos por persona",
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildItemUsageRows(stats.itemStats)),
    "Elementos usados",
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildLoanDetailRows(loans, optional)),
    "Detalle préstamos",
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildReturnedGroupRows(loans, optional)),
    "Grupos devueltos",
  )

  const date = new Date().toISOString().split("T")[0]
  XLSX.writeFile(wb, `estadisticas_stock_cdu_${date}.xlsx`)
}
