"use client"

import { useState, useEffect, useMemo } from "react"
import {
  BarChart3,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  History,
  Search,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getInventory, getLoans, returnMissingItems } from "@/lib/firebase"
import type { InventoryItem, Loan } from "@/lib/types"
import Navigation from "@/components/navigation"
import { RouteGuard } from "@/components/route-guard"
import ReturnMissingDialog from "@/components/return-missing-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  buildLoanGroupSummaries,
  formatDateTime,
  hasPendingMissing,
  matchesLoanGroupSearch,
  remainingMissing,
  totalPendingMissing,
  type LoanGroupSummary,
} from "@/lib/loan-utils"

type TabId = "resumen" | "historial"

export default function ReportsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("resumen")
  const [historySearch, setHistorySearch] = useState("")
  const [returnMissingLoan, setReturnMissingLoan] = useState<Loan | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [inventory, loansList] = await Promise.all([getInventory(), getLoans()])
      setItems(inventory)
      setLoans(loansList)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const returnedGroups = useMemo(() => buildLoanGroupSummaries(loans), [loans])

  const pendingMissingGroups = useMemo(() => {
    const seen = new Set<string>()
    return returnedGroups.filter((g) => {
      if (!g.hadMissing || !hasPendingMissing(g.primaryLoan)) return false
      if (seen.has(g.groupId)) return false
      seen.add(g.groupId)
      return true
    })
  }, [returnedGroups])

  const filteredHistory = useMemo(() => {
    return returnedGroups
      .filter((g) => matchesLoanGroupSearch(g, historySearch))
      .sort((a, b) => (b.returnDate?.getTime() ?? 0) - (a.returnDate?.getTime() ?? 0))
  }, [returnedGroups, historySearch])

  const stats = {
    totalItems: items.length,
    availableItems: items.filter((item) => item.status === "available").length,
    loanedItems: items.filter((item) => item.status === "loaned").length,
    activeLoans: loans.filter((loan) => loan.status === "active").length,
    returnedLoans: loans.filter((loan) => loan.status === "returned").length,
  }

  const facultadStats = loans.reduce(
    (acc, loan) => {
      if (loan.status === "active" && loan.facultad) {
        acc[loan.facultad] = (acc[loan.facultad] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const generoStats = loans.reduce(
    (acc, loan) => {
      if (loan.status === "active") {
        acc[loan.genero] = (acc[loan.genero] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const recentLoans = loans
    .filter((loan) => loan.status === "active")
    .sort((a, b) => b.loanDate.getTime() - a.loanDate.getTime())
    .slice(0, 5)

  const handleReturnMissing = async (items: { name: string; quantity: number }[]) => {
    if (!returnMissingLoan?.id) return
    try {
      await returnMissingItems(returnMissingLoan.id, items)
      toast({
        title: "Faltantes registrados",
        description: "La devolución de faltantes se guardó correctamente",
      })
      setReturnMissingLoan(null)
      await loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar",
        variant: "destructive",
      })
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando reportes...</div>
        </div>
      </div>
    )
  }

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">Reportes y Estadísticas</h1>
            <p className="text-blue-700">Resumen del inventario y historial de préstamos</p>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={activeTab === "resumen" ? "default" : "outline"}
              onClick={() => setActiveTab("resumen")}
              className={activeTab === "resumen" ? "bg-blue-600" : ""}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Resumen
            </Button>
            <Button
              variant={activeTab === "historial" ? "default" : "outline"}
              onClick={() => setActiveTab("historial")}
              className={activeTab === "historial" ? "bg-blue-600" : ""}
            >
              <History className="w-4 h-4 mr-2" />
              Historial ({returnedGroups.length})
            </Button>
          </div>

          {activeTab === "resumen" && (
            <>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Elementos" value={stats.totalItems} icon={<Package className="h-4 w-4 text-blue-600" />} />
                <StatCard title="Disponibles" value={stats.availableItems} valueClass="text-green-600" icon={<TrendingUp className="h-4 w-4 text-green-600" />} />
                <StatCard title="Prestados" value={stats.activeLoans} valueClass="text-orange-600" icon={<Users className="h-4 w-4 text-orange-600" />} />
                <StatCard title="Devoluciones" value={stats.returnedLoans} valueClass="text-blue-600" icon={<BarChart3 className="h-4 w-4 text-blue-600" />} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FacultadCard stats={facultadStats} />
                <GeneroCard stats={generoStats} />
              </div>

              <Card className="mt-6 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">Préstamos Recientes</CardTitle>
                  <CardDescription>Últimos 5 préstamos activos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentLoans.map((loan) => (
                      <div key={loan.id} className="flex items-center justify-between p-3 border border-blue-100 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-800">{loan.itemName}</h4>
                          <p className="text-sm text-gray-600">{loan.borrowerName}</p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(loan.loanDate)} · {loan.estamento}
                          </p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">Activo</Badge>
                      </div>
                    ))}
                    {recentLoans.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No hay préstamos recientes</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {pendingMissingGroups.length > 0 && (
                <Card className="mt-6 border-orange-300 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Devoluciones con Faltantes pendientes ({pendingMissingGroups.length})
                    </CardTitle>
                    <CardDescription>
                      Préstamos devueltos con implementos aún por entregar — puede registrar la devolución aquí
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingMissingGroups.map((group) => (
                        <MissingPendingCard
                          key={group.groupId}
                          group={group}
                          onReturn={() => setReturnMissingLoan(group.primaryLoan)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <InventorySummaryCard stats={stats} />
            </>
          )}

          {activeTab === "historial" && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historial de préstamos devueltos
                </CardTitle>
                <CardDescription>
                  Fecha y hora de préstamo y devolución, faltantes y su estado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por objeto, nombre, cédula o código..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>

                {filteredHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {historySearch.trim()
                      ? "No hay resultados para esa búsqueda"
                      : "No hay préstamos devueltos registrados"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredHistory.map((group) => (
                      <HistoryCard key={group.groupId} group={group} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {returnMissingLoan && returnMissingLoan.missingItems && (
        <ReturnMissingDialog
          isOpen={true}
          onClose={() => setReturnMissingLoan(null)}
          missingItems={returnMissingLoan.missingItems}
          onConfirm={handleReturnMissing}
          borrowerName={returnMissingLoan.borrowerName}
        />
      )}
    </RouteGuard>
  )
}

function StatCard({
  title,
  value,
  valueClass = "text-blue-800",
  icon,
}: {
  title: string
  value: number
  valueClass?: string
  icon: React.ReactNode
}) {
  return (
    <Card className="border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-blue-800">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function FacultadCard({ stats }: { stats: Record<string, number> }) {
  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">Préstamos por Facultad</CardTitle>
        <CardDescription>Elementos actualmente prestados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([facultad, count]) => (
              <div key={facultad} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 flex-1 pr-2">
                  {facultad.length > 40 ? `${facultad.substring(0, 40)}...` : facultad}
                </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {count}
                </Badge>
              </div>
            ))}
          {Object.keys(stats).length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay préstamos activos por facultad</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function GeneroCard({ stats }: { stats: Record<string, number> }) {
  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">Préstamos por Género</CardTitle>
        <CardDescription>Distribución de préstamos activos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .map(([genero, count]) => (
              <div key={genero} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{genero}</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {count}
                </Badge>
              </div>
            ))}
          {Object.keys(stats).length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay préstamos activos</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function InventorySummaryCard({
  stats,
}: {
  stats: { totalItems: number; availableItems: number; activeLoans: number; returnedLoans: number }
}) {
  return (
    <Card className="mt-6 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">Estado del Inventario</CardTitle>
        <CardDescription>Resumen por categorías</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {stats.totalItems > 0
                ? ((stats.availableItems / stats.totalItems) * 100).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-sm text-gray-600">Disponibilidad</div>
          </div>
          <div className="text-center p-4 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {stats.totalItems > 0
                ? ((stats.activeLoans / stats.totalItems) * 100).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-sm text-gray-600">En Préstamo</div>
          </div>
          <div className="text-center p-4 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {stats.totalItems > 0
                ? (
                    (stats.returnedLoans / (stats.returnedLoans + stats.activeLoans)) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-sm text-gray-600">Tasa de Devolución</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MissingPendingCard({
  group,
  onReturn,
}: {
  group: LoanGroupSummary
  onReturn: () => void
}) {
  const loan = group.primaryLoan
  const pending = totalPendingMissing(loan)

  return (
    <div className="flex items-start justify-between gap-4 p-3 border border-orange-200 rounded-lg bg-white">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-orange-800">{group.borrowerName}</span>
          <Badge className="bg-orange-100 text-orange-800 border border-orange-300">
            {pending} faltante(s) pendiente(s)
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          Cédula: {group.borrowerDocument}
          {group.borrowerCode && ` · Código: ${group.borrowerCode}`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Préstamo: {formatDateTime(group.loanDate)} · Devolución:{" "}
          {group.returnDate ? formatDateTime(group.returnDate) : "—"}
        </p>
        <div className="mt-2 space-y-1">
          {loan.missingItems?.map((mi) => {
            const rem = remainingMissing(mi)
            if (rem <= 0) return null
            return (
              <div key={mi.name} className="flex items-center gap-2 text-xs text-orange-700">
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                <span>
                  {mi.name}: <strong>{rem}</strong> pendiente(s)
                  {(mi.returned ?? 0) > 0 && (
                    <span className="text-gray-500"> ({mi.returned} ya devueltos)</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Objetos: {group.itemNames.join(", ")}
        </p>
      </div>
      <Button onClick={onReturn} className="bg-green-600 hover:bg-green-700 shrink-0">
        Devolver
      </Button>
    </div>
  )
}

function HistoryCard({ group }: { group: LoanGroupSummary }) {
  return (
    <div className="p-4 border border-blue-100 rounded-lg bg-white space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-blue-800">{group.borrowerName}</h4>
          <p className="text-sm text-gray-600">
            Cédula: {group.borrowerDocument}
            {group.borrowerCode && ` · Código: ${group.borrowerCode}`}
          </p>
        </div>
        {group.hadMissing ? (
          group.missingResolved ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Faltantes completados
            </Badge>
          ) : (
            <Badge className="bg-orange-100 text-orange-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Faltantes pendientes
            </Badge>
          )
        ) : (
          <Badge className="bg-blue-100 text-blue-800">Devolución completa</Badge>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        <div className="p-2 bg-blue-50 rounded">
          <span className="text-gray-500 text-xs block">Préstamo</span>
          <span className="font-medium">{formatDateTime(group.loanDate)}</span>
        </div>
        <div className="p-2 bg-green-50 rounded">
          <span className="text-gray-500 text-xs block">Devolución</span>
          <span className="font-medium">
            {group.returnDate ? formatDateTime(group.returnDate) : "—"}
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">OBJETOS</p>
        <p className="text-sm text-gray-700">{group.itemNames.join(" · ")}</p>
      </div>

      {group.hadMissing && group.missingItems && (
        <div className="border-t pt-2 space-y-1">
          <p className="text-xs font-semibold text-gray-500">DETALLE DE FALTANTES</p>
          {group.missingItems.map((mi) => {
            const rem = remainingMissing(mi)
            const returned = mi.returned ?? 0
            return (
              <div key={mi.name} className="text-sm text-gray-700 flex flex-wrap gap-2">
                <span className="font-medium">{mi.name}:</span>
                <span>{mi.missing} faltante(s) en devolución</span>
                {returned > 0 && (
                  <span className="text-green-700">· {returned} devuelto(s) después</span>
                )}
                {rem > 0 && (
                  <span className="text-orange-700">· {rem} aún pendiente(s)</span>
                )}
                {rem <= 0 && returned > 0 && (
                  <span className="text-green-700">· Completado</span>
                )}
              </div>
            )
          })}
          {group.missingResolved && group.primaryLoan.missingResolvedAt && (
            <p className="text-xs text-green-700 mt-1">
              Faltantes cerrados: {formatDateTime(group.primaryLoan.missingResolvedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
