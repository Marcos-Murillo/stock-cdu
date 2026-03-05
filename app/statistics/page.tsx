"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, AlertTriangle, Package, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getDetailedStats, getDamageReports, getLoans } from "@/lib/firebase"
import type { DamageReport, Loan } from "@/lib/types"
import Navigation from "@/components/navigation"

interface ItemStat {
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

interface DetailedStats {
  itemStats: ItemStat[]
  facultadStats: Record<string, any>
  programaStats: Record<string, any>
  generoStats: Record<string, any>
  totalItems: number
  totalLoans: number
  activeLoans: number
  totalDamageReports: number
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<DetailedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"totalLoans" | "damageReports" | "name">("totalLoans")
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const [showFacultadTable, setShowFacultadTable] = useState(false)
  const [showProgramaTable, setShowProgramaTable] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const detailedStats = await getDetailedStats()
      setStats(detailedStats)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    try {
      const [damageReports, loans] = await Promise.all([getDamageReports(), getLoans()])

      const reportWindow = window.open("", "_blank")
      if (!reportWindow) return

      const reportHTML = generateReportHTML(stats!, damageReports, loans)
      reportWindow.document.write(reportHTML)
      reportWindow.document.close()

      setTimeout(() => {
        reportWindow.print()
      }, 500)
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Error al generar el reporte")
    }
  }

  const generateReportHTML = (stats: DetailedStats, damageReports: DamageReport[], loans: Loan[]) => {
    const topFacultades = Object.entries(stats.facultadStats)
      .filter(([facultad]) => facultad)
      .sort(([, a], [, b]) => b.totalLoans - a.totalLoans)
      .slice(0, 10)

    const topProgramas = Object.entries(stats.programaStats)
      .filter(([programa]) => programa)
      .sort(([, a], [, b]) => b.totalLoans - a.totalLoans)
      .slice(0, 10)

    const topItems = stats.itemStats
      .filter((item) => item.totalLoans > 0)
      .sort((a, b) => b.totalLoans - a.totalLoans)
      .slice(0, 5)

    const itemsWithLoans = stats.itemStats.filter((item) => item.totalLoans > 0)
    const itemsWithDamage = stats.itemStats.filter((item) => item.damageReports > 0)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte General - Sistema Deportivo</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
            .page-break { page-break-before: always; }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          h2 {
            color: #2563eb;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 5px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .summary-card {
            border: 2px solid #dbeafe;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #2563eb;
          }
          .summary-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #dbeafe;
          }
          tr:nth-child(even) {
            background-color: #eff6ff;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .badge-success { background-color: #dcfce7; color: #166534; }
          .badge-warning { background-color: #fed7aa; color: #9a3412; }
          .badge-danger { background-color: #fee2e2; color: #991b1b; }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .date {
            color: #666;
            font-size: 14px;
          }
          .top-list {
            list-style: none;
            padding: 0;
          }
          .top-list li {
            padding: 10px;
            margin-bottom: 8px;
            background-color: #eff6ff;
            border-left: 4px solid #2563eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .rank {
            background-color: #2563eb;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Reporte General - Sistema Deportivo</h1>
          <p class="date">Generado el: ${new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</p>
        </div>

        <h2>📈 Resumen General</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Elementos</h3>
            <div class="value">${stats.totalItems}</div>
          </div>
          <div class="summary-card">
            <h3>Total Préstamos</h3>
            <div class="value">${stats.totalLoans}</div>
          </div>
          <div class="summary-card">
            <h3>Préstamos Activos</h3>
            <div class="value">${stats.activeLoans}</div>
          </div>
          <div class="summary-card">
            <h3>Reportes de Daño</h3>
            <div class="value">${stats.totalDamageReports}</div>
          </div>
        </div>

        <h2>🎓 Préstamos por Facultad</h2>
        <table>
          <thead>
            <tr>
              <th>Facultad</th>
              <th style="text-align: center;">Total Préstamos</th>
              <th style="text-align: center;">Activos</th>
              <th style="text-align: center;">Devueltos</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(stats.facultadStats)
              .filter(([facultad]) => facultad)
              .sort(([, a], [, b]) => b.totalLoans - a.totalLoans)
              .map(
                ([facultad, data]) => `
              <tr>
                <td>${facultad}</td>
                <td style="text-align: center;"><strong>${data.totalLoans}</strong></td>
                <td style="text-align: center;">${data.activeLoans}</td>
                <td style="text-align: center;">${data.returnedLoans}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <h2>📚 Préstamos por Programa</h2>
        <table>
          <thead>
            <tr>
              <th>Programa</th>
              <th style="text-align: center;">Total Préstamos</th>
              <th style="text-align: center;">Activos</th>
              <th style="text-align: center;">Devueltos</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(stats.programaStats)
              .filter(([programa]) => programa)
              .sort(([, a], [, b]) => b.totalLoans - a.totalLoans)
              .map(
                ([programa, data]) => `
              <tr>
                <td>${programa}</td>
                <td style="text-align: center;"><strong>${data.totalLoans}</strong></td>
                <td style="text-align: center;">${data.activeLoans}</td>
                <td style="text-align: center;">${data.returnedLoans}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="page-break"></div>

        <h2>👥 Préstamos por Género</h2>
        <table>
          <thead>
            <tr>
              <th>Género</th>
              <th style="text-align: center;">Total Préstamos</th>
              <th style="text-align: center;">Activos</th>
              <th style="text-align: center;">Devueltos</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(stats.generoStats)
              .sort(([, a], [, b]) => b.totalLoans - a.totalLoans)
              .map(
                ([genero, data]) => `
              <tr>
                <td>${genero}</td>
                <td style="text-align: center;"><strong>${data.totalLoans}</strong></td>
                <td style="text-align: center;">${data.activeLoans}</td>
                <td style="text-align: center;">${data.returnedLoans}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <h2>📦 Préstamos por Elemento</h2>
        <p><em>Solo elementos que han sido prestados al menos una vez</em></p>
        <table>
          <thead>
            <tr>
              <th>Elemento</th>
              <th>Número de Serie</th>
              <th style="text-align: center;">Total Préstamos</th>
              <th style="text-align: center;">Activos</th>
              <th style="text-align: center;">Devueltos</th>
            </tr>
          </thead>
          <tbody>
            ${itemsWithLoans
              .sort((a, b) => b.totalLoans - a.totalLoans)
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.serialNumber}</td>
                <td style="text-align: center;"><strong>${item.totalLoans}</strong></td>
                <td style="text-align: center;">${item.activeLoans}</td>
                <td style="text-align: center;">${item.returnedLoans}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <h2>🏆 Top 10 Facultades Más Activas</h2>
        <ul class="top-list">
          ${topFacultades
            .map(
              ([facultad, data], index) => `
            <li>
              <div>
                <span class="rank">${index + 1}</span>
                <strong>${facultad}</strong>
              </div>
              <div><strong>${data.totalLoans}</strong> préstamos</div>
            </li>
          `,
            )
            .join("")}
        </ul>

        <h2>🎯 Top 10 Programas Más Activos</h2>
        <ul class="top-list">
          ${topProgramas
            .map(
              ([programa, data], index) => `
            <li>
              <div>
                <span class="rank">${index + 1}</span>
                <strong>${programa}</strong>
              </div>
              <div><strong>${data.totalLoans}</strong> préstamos</div>
            </li>
          `,
            )
            .join("")}
        </ul>

        <h2>⭐ Top 5 Elementos Más Prestados</h2>
        <ul class="top-list">
          ${topItems
            .map(
              (item, index) => `
            <li>
              <div>
                <span class="rank">${index + 1}</span>
                <strong>${item.name}</strong> <span style="color: #666;">(${item.serialNumber})</span>
              </div>
              <div><strong>${item.totalLoans}</strong> préstamos</div>
            </li>
          `,
            )
            .join("")}
        </ul>

        <div class="page-break"></div>

        <h2>⚠️ Reporte de Elementos con Daños</h2>
        ${
          itemsWithDamage.length > 0
            ? `
        <table>
          <thead>
            <tr>
              <th>Elemento</th>
              <th>Número de Serie</th>
              <th>Fecha</th>
              <th>Reportado por</th>
              <th>Severidad</th>
              <th>Descripción del Daño</th>
            </tr>
          </thead>
          <tbody>
            ${damageReports
              .sort((a, b) => b.reportDate.getTime() - a.reportDate.getTime())
              .map(
                (report) => `
              <tr>
                <td>${report.itemName}</td>
                <td>${report.itemSerialNumber}</td>
                <td>${report.reportDate.toLocaleDateString("es-ES")}</td>
                <td>${report.reportedBy}</td>
                <td>
                  <span class="badge ${
                    report.severity === "high"
                      ? "badge-danger"
                      : report.severity === "medium"
                        ? "badge-warning"
                        : "badge-success"
                  }">
                    ${report.severity === "high" ? "Alta" : report.severity === "medium" ? "Media" : "Baja"}
                  </span>
                </td>
                <td>${report.damageDescription}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        `
            : "<p><em>No hay reportes de daños registrados</em></p>"
        }

        <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #dbeafe; text-align: center; color: #666;">
          <p>Reporte generado automáticamente por Sistema Deportivo</p>
        </div>
      </body>
      </html>
    `
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando estadísticas...</div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">Error al cargar estadísticas</div>
        </div>
      </div>
    )
  }

  const sortedItems = [...stats.itemStats].sort((a, b) => {
    switch (sortBy) {
      case "totalLoans":
        return b.totalLoans - a.totalLoans
      case "damageReports":
        return b.damageReports - a.damageReports
      case "name":
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const filteredItems = showOnlyActive
    ? sortedItems.filter((item) => item.status === "available" || item.activeLoans > 0)
    : sortedItems

  const topFacultades = Object.entries(stats.facultadStats)
    .filter(([facultad]) => facultad)
    .sort(([, a], [, b]) => b.totalLoans - a.totalLoans)
    .slice(0, 10)

  const topProgramas = Object.entries(stats.programaStats)
    .filter(([programa]) => programa)
    .sort(([, a], [, b]) => b.totalLoans - a.totalLoans)
    .slice(0, 10)

  const mostUsedItems = stats.itemStats
    .filter((item) => item.totalLoans > 0)
    .sort((a, b) => b.totalLoans - a.totalLoans)
    .slice(0, 10)

  const itemsWithDamage = stats.itemStats
    .filter((item) => item.damageReports > 0)
    .sort((a, b) => b.damageReports - a.damageReports)

  const facultadesConPrestamos = Object.entries(stats.facultadStats)
    .filter(([facultad]) => facultad)
    .sort(([, a], [, b]) => b.totalLoans - a.totalLoans)

  const programasConPrestamos = Object.entries(stats.programaStats)
    .filter(([programa]) => programa)
    .sort(([, a], [, b]) => b.totalLoans - a.totalLoans)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-800 mb-2">Estadísticas Detalladas</h1>
            <p className="text-blue-700">Análisis completo del uso del inventario deportivo</p>
          </div>
          <Button onClick={generateReport} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Generar Reporte General
          </Button>
        </div>

        {/* Resumen General */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Elementos</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{stats.totalItems}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Préstamos</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalLoans}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Préstamos Activos</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.activeLoans}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Reportes de Daño</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalDamageReports}</div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas por Género */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {Object.entries(stats.generoStats)
            .sort(([, a], [, b]) => b.totalLoans - a.totalLoans)
            .map(([genero, data]) => (
              <Card key={genero} className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">Préstamos - {genero}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-blue-600">{data.totalLoans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activos:</span>
                      <span className="font-bold text-orange-600">{data.activeLoans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Devueltos:</span>
                      <span className="font-bold text-green-600">{data.returnedLoans}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Elementos Más Prestados */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Top 10 - Elementos Más Prestados</CardTitle>
              <CardDescription>Elementos con mayor número de préstamos históricos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mostUsedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-blue-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-blue-800">{item.name}</div>
                        <div className="text-sm text-gray-600">Serie: {item.serialNumber}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{item.totalLoans}</div>
                      <div className="text-xs text-gray-500">préstamos</div>
                    </div>
                  </div>
                ))}
                {mostUsedItems.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No hay datos de préstamos</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Facultades */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Top 10 - Facultades Más Activas</CardTitle>
              <CardDescription>Facultades con mayor número de préstamos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topFacultades.map(([facultad, data], index) => (
                  <div key={facultad} className="flex items-center justify-between p-3 border border-blue-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-green-800 text-sm">
                          {facultad.length > 35 ? `${facultad.substring(0, 35)}...` : facultad}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{data.totalLoans}</div>
                      <div className="text-xs text-gray-500">préstamos</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Programas */}
        <Card className="border-blue-200 mb-8">
          <CardHeader>
            <CardTitle className="text-blue-800">Top 10 - Programas Más Activos</CardTitle>
            <CardDescription>Programas académicos con mayor número de préstamos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {topProgramas.map(([programa, data], index) => (
                <div key={programa} className="flex items-center justify-between p-3 border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-purple-800 text-sm">
                        {programa.length > 40 ? `${programa.substring(0, 40)}...` : programa}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">{data.totalLoans}</div>
                    <div className="text-xs text-gray-500">préstamos</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tablas Plegables */}
        <Card className="border-blue-200 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFacultadTable(!showFacultadTable)}>
              <div>
                <CardTitle className="text-blue-800">Préstamos por Facultad</CardTitle>
                <CardDescription>Todas las facultades con préstamos registrados</CardDescription>
              </div>
              {showFacultadTable ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
            </div>
          </CardHeader>
          {showFacultadTable && (
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left p-3 font-medium text-blue-800">Facultad</th>
                      <th className="text-center p-3 font-medium text-blue-800">Total Préstamos</th>
                      <th className="text-center p-3 font-medium text-blue-800">Activos</th>
                      <th className="text-center p-3 font-medium text-blue-800">Devueltos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultadesConPrestamos.map(([facultad, data]) => (
                      <tr key={facultad} className="border-b border-blue-100 hover:bg-blue-50">
                        <td className="p-3 text-gray-700">{facultad}</td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-blue-600">{data.totalLoans}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-orange-600">{data.activeLoans}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-green-600">{data.returnedLoans}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {facultadesConPrestamos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No hay préstamos por facultad</div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="border-blue-200 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowProgramaTable(!showProgramaTable)}>
              <div>
                <CardTitle className="text-blue-800">Préstamos por Programa</CardTitle>
                <CardDescription>Todos los programas con préstamos registrados</CardDescription>
              </div>
              {showProgramaTable ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-blue-600" />}
            </div>
          </CardHeader>
          {showProgramaTable && (
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left p-3 font-medium text-blue-800">Programa</th>
                      <th className="text-center p-3 font-medium text-blue-800">Total Préstamos</th>
                      <th className="text-center p-3 font-medium text-blue-800">Activos</th>
                      <th className="text-center p-3 font-medium text-blue-800">Devueltos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programasConPrestamos.map(([programa, data]) => (
                      <tr key={programa} className="border-b border-blue-100 hover:bg-blue-50">
                        <td className="p-3 text-gray-700">{programa}</td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-blue-600">{data.totalLoans}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-orange-600">{data.activeLoans}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-green-600">{data.returnedLoans}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {programasConPrestamos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No hay préstamos por programa</div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Elementos con Reportes de Daño */}
        {itemsWithDamage.length > 0 && (
          <Card className="border-red-200 mb-8">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Elementos con Reportes de Daño
              </CardTitle>
              <CardDescription>Elementos que han reportado daños o problemas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {itemsWithDamage.map((item) => (
                  <div key={item.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-red-800">{item.name}</div>
                        <div className="text-sm text-gray-600">Serie: {item.serialNumber}</div>
                      </div>
                      <Badge variant="destructive">{item.damageReports} reportes</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla Detallada de Todos los Elementos */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Tabla Detallada de Elementos</CardTitle>
            <CardDescription>Estadísticas completas de todos los elementos del inventario</CardDescription>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={sortBy === "totalLoans" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("totalLoans")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ordenar por Préstamos
              </Button>
              <Button
                variant={sortBy === "damageReports" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("damageReports")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ordenar por Daños
              </Button>
              <Button
                variant={sortBy === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("name")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ordenar por Nombre
              </Button>
              <Button
                variant={showOnlyActive ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyActive(!showOnlyActive)}
                className="bg-green-600 hover:bg-green-700"
              >
                {showOnlyActive ? "Mostrar Todos" : "Solo Activos"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-blue-200">
                    <th className="text-left p-3 font-medium text-blue-800">Elemento</th>
                    <th className="text-left p-3 font-medium text-blue-800">Serie</th>
                    <th className="text-center p-3 font-medium text-blue-800">Estado</th>
                    <th className="text-center p-3 font-medium text-blue-800">Total Préstamos</th>
                    <th className="text-center p-3 font-medium text-blue-800">Activos</th>
                    <th className="text-center p-3 font-medium text-blue-800">Devueltos</th>
                    <th className="text-center p-3 font-medium text-blue-800">Daños</th>
                    <th className="text-left p-3 font-medium text-blue-800">Último Préstamo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id || `item-${item.serialNumber}`}
                      className="border-b border-blue-100 hover:bg-blue-50"
                    >
                      <td className="p-3">
                        <div className="font-medium text-blue-800">{item.name}</div>
                      </td>
                      <td className="p-3 text-gray-600">{item.serialNumber}</td>
                      <td className="p-3 text-center">
                        {item.status === "available" && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Disponible
                          </Badge>
                        )}
                        {item.status === "loaned" && <Badge className="bg-orange-100 text-orange-800">Prestado</Badge>}
                        {item.status === "removed" && <Badge variant="destructive">Dado de baja</Badge>}
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-blue-600">{item.totalLoans}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-orange-600">{item.activeLoans}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-green-600">{item.returnedLoans}</span>
                      </td>
                      <td className="p-3 text-center">
                        {item.damageReports > 0 ? (
                          <Badge variant="destructive">{item.damageReports}</Badge>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600">
                        {item.lastLoanDate ? item.lastLoanDate.toLocaleDateString() : "Nunca prestado"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">No hay elementos que mostrar</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
