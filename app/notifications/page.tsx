"use client"

import { useState } from "react"
import { AlertTriangle, Clock, AlertCircle, Bell, Package, User, Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications"
import { returnLoan } from "@/lib/firebase"
import Navigation from "@/components/navigation"
import type { LoanNotification } from "@/lib/types"

export default function NotificationsPage() {
  const { notifications, loading, criticalCount, totalCount, refresh } = useNotifications()
  const [filter, setFilter] = useState<'all' | '24h' | '3days' | '7days' | 'critical'>('all')
  const { toast } = useToast()

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'all') return true
    if (filter === 'critical') return notif.shouldReport
    return notif.alertLevel === filter
  })

  const getAlertColor = (level: string) => {
    switch (level) {
      case '24h': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case '3days': return 'bg-orange-100 border-orange-300 text-orange-800'
      case '7days': return 'bg-red-100 border-red-300 text-red-800'
      default: return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const getAlertIcon = (level: string) => {
    switch (level) {
      case '24h': return <Clock className="w-5 h-5" />
      case '3days': return <AlertCircle className="w-5 h-5" />
      case '7days': return <AlertTriangle className="w-5 h-5" />
      default: return <Bell className="w-5 h-5" />
    }
  }

  const getAlertText = (level: string) => {
    switch (level) {
      case '24h': return '24 horas'
      case '3days': return '3 días'
      case '7days': return '7 días'
      default: return 'Alerta'
    }
  }

  const handleReturnLoan = async (notif: LoanNotification) => {
    if (!confirm("¿Confirmar la devolución de este elemento?")) {
      return
    }

    try {
      await returnLoan(notif.loanId)
      toast({
        title: "Éxito",
        description: "Elemento devuelto correctamente",
      })
      refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la devolución",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Notificaciones</h1>
            <p className="text-gray-600 mt-2">
              {totalCount} {totalCount === 1 ? 'préstamo requiere' : 'préstamos requieren'} atención
            </p>
          </div>
          <Button onClick={refresh} variant="outline" className="border-blue-600 text-blue-600">
            Actualizar
          </Button>
        </div>

        {/* Banner crítico */}
        {criticalCount > 0 && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-red-500 text-white p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-800 mb-2">
                    ¡Atención! {criticalCount} {criticalCount === 1 ? 'préstamo crítico' : 'préstamos críticos'}
                  </h3>
                  <p className="text-red-700">
                    {criticalCount === 1 
                      ? 'Este préstamo ha superado los 7 días y debe ser reportado a la universidad.'
                      : 'Estos préstamos han superado los 7 días y deben ser reportados a la universidad.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-blue-600' : ''}
          >
            Todas ({totalCount})
          </Button>
          <Button
            variant={filter === 'critical' ? 'default' : 'outline'}
            onClick={() => setFilter('critical')}
            className={filter === 'critical' ? 'bg-red-600' : ''}
          >
            Críticas ({criticalCount})
          </Button>
          <Button
            variant={filter === '7days' ? 'default' : 'outline'}
            onClick={() => setFilter('7days')}
            className={filter === '7days' ? 'bg-red-600' : ''}
          >
            7+ días ({notifications.filter(n => n.alertLevel === '7days').length})
          </Button>
          <Button
            variant={filter === '3days' ? 'default' : 'outline'}
            onClick={() => setFilter('3days')}
            className={filter === '3days' ? 'bg-orange-600' : ''}
          >
            3+ días ({notifications.filter(n => n.alertLevel === '3days').length})
          </Button>
          <Button
            variant={filter === '24h' ? 'default' : 'outline'}
            onClick={() => setFilter('24h')}
            className={filter === '24h' ? 'bg-yellow-600' : ''}
          >
            24+ horas ({notifications.filter(n => n.alertLevel === '24h').length})
          </Button>
        </div>

        {/* Lista de notificaciones */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Cargando notificaciones...
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                {filter === 'all' 
                  ? '¡Excelente! No hay préstamos pendientes de atención.'
                  : 'No hay notificaciones en esta categoría.'}
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notif) => (
              <Card
                key={notif.loanId}
                className={`border-2 ${getAlertColor(notif.alertLevel)} ${
                  notif.shouldReport ? 'ring-2 ring-red-500' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-full ${getAlertColor(notif.alertLevel)}`}>
                        {getAlertIcon(notif.alertLevel)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{notif.itemName}</h3>
                          <Badge className={getAlertColor(notif.alertLevel)}>
                            {getAlertText(notif.alertLevel)}
                          </Badge>
                          {notif.shouldReport && (
                            <Badge className="bg-red-600 text-white">
                              REPORTAR A UNIVERSIDAD
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{notif.borrowerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>Cédula: {notif.borrowerDocument}</span>
                            </div>
                            {notif.loan.borrowerPhone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span>{notif.loan.borrowerPhone}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="w-4 h-4 text-gray-500" />
                              <span>Serie: {notif.loan.itemSerialNumber}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Fecha préstamo: {notif.loan.loanDate.toLocaleDateString()}
                            </div>
                            <div className="text-sm font-bold text-red-600">
                              {notif.daysOverdue} {notif.daysOverdue === 1 ? 'día' : 'días'} prestado
                            </div>
                          </div>
                        </div>

                        {notif.shouldReport && (
                          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                            <p className="text-sm text-red-800 font-medium">
                              ⚠️ Este préstamo debe ser reportado a la universidad por exceder el tiempo máximo permitido.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleReturnLoan(notif)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Marcar como Devuelto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
