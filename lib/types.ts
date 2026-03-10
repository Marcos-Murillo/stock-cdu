export interface InventoryItem {
  id?: string
  name: string
  serialNumber: string
  description?: string
  status: "available" | "loaned" | "removed"
  location?: "Auditorio 5" | "Bodega"
  createdAt: Date
  damageReports?: DamageReport[]
  loanCount?: number
}

export interface User {
  id?: string
  tipoDocumento: string
  cedula: string
  nombre: string
  codigoEstudiantil?: string
  facultad?: string
  programa?: string
  genero: string
  etnia: string
  sede: string
  estamento: string
  telefono: string
  email: string
  createdAt: Date
}

export interface Loan {
  id?: string
  borrowerName: string
  borrowerDocument: string
  borrowerPhone: string
  borrowerEmail: string
  borrowerCode?: string
  facultad?: string
  programa?: string
  genero: string
  etnia: string
  sede: string
  estamento: string
  itemId: string
  itemName: string
  itemSerialNumber: string
  loanDate: Date
  returnDate?: Date
  status: "active" | "returned"
  loanGroupId?: string // Para agrupar préstamos del mismo momento
}

export interface DamageReport {
  id?: string
  itemId: string
  itemName: string
  itemSerialNumber: string
  reportDate: Date
  reportedBy: string
  damageDescription: string
  severity: "low" | "medium" | "high"
  status: "pending" | "resolved"
}

export interface BorrowerSuggestion {
  name: string
  document: string
  phone: string
  email: string
  code?: string
  facultad?: string
  programa?: string
  genero: string
  etnia: string
  sede: string
  estamento: string
}

export interface LoanNotification {
  loanId: string
  loan: Loan
  itemName: string
  borrowerName: string
  borrowerDocument: string
  daysOverdue: number
  alertLevel: '24h' | '3days' | '7days'
  shouldReport: boolean
}

export interface CartItem {
  itemName: string
  items: InventoryItem[]
  quantity: number
}
