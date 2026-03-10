import { useState, useEffect } from "react"
import { getLoans } from "@/lib/firebase"
import type { Loan, LoanNotification } from "@/lib/types"

export function useNotifications() {
  const [notifications, setNotifications] = useState<LoanNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
    // Actualizar cada minuto
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const loans = await getLoans()
      const activeLoans = loans.filter((loan) => loan.status === "active")
      
      const now = new Date()
      const notifs: LoanNotification[] = []

      activeLoans.forEach((loan) => {
        const loanDate = new Date(loan.loanDate)
        const diffTime = Math.abs(now.getTime() - loanDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Determinar nivel de alerta
        const alerts: ('24h' | '3days' | '7days')[] = []
        
        if (diffDays >= 1) alerts.push('24h')
        if (diffDays >= 3) alerts.push('3days')
        if (diffDays >= 7) alerts.push('7days')

        // Crear notificación para cada nivel de alerta alcanzado
        if (alerts.length > 0) {
          // Usar el nivel más alto alcanzado
          const alertLevel = alerts[alerts.length - 1]
          const shouldReport = alerts.length === 3 // Tiene las 3 alertas

          notifs.push({
            loanId: loan.id!,
            loan,
            itemName: loan.itemName,
            borrowerName: loan.borrowerName,
            borrowerDocument: loan.borrowerDocument,
            daysOverdue: diffDays,
            alertLevel,
            shouldReport,
          })
        }
      })

      setNotifications(notifs)
      setLoading(false)
    } catch (error) {
      console.error("Error loading notifications:", error)
      setLoading(false)
    }
  }

  const criticalCount = notifications.filter((n) => n.shouldReport).length
  const totalCount = notifications.length

  return {
    notifications,
    loading,
    criticalCount,
    totalCount,
    refresh: loadNotifications,
  }
}
