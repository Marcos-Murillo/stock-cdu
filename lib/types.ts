export type UserRole = "superadmin" | "admin" | "monitor"

export interface StockUser {
  uid: string
  nombre: string
  cedula: string
  role: UserRole
}

export interface InventoryItem {
  id?: string
  name: string
  serialNumber: string
  description: string
  status: "available" | "loaned" | "removed"
  createdAt: Date
  loanCount?: number
  location?: string
}

export interface Loan {
  id?: string
  itemId: string
  itemName: string
  itemSerialNumber: string
  borrowerName: string
  borrowerDocument: string
  borrowerPhone?: string
  borrowerEmail?: string
  borrowerCode?: string
  facultad?: string
  programa?: string
  genero: string
  etnia?: string
  sede?: string
  estamento?: string
  loanDate: Date
  returnDate?: Date
  status: "active" | "returned"
  notes?: string
  loanGroupId?: string
}

export interface DamageReport {
  id?: string
  itemId: string
  itemName: string
  itemSerialNumber: string
  reportedBy: string
  reportDate: Date
  damageDescription: string
  severity: "low" | "medium" | "high"
}

export interface CartItem {
  itemName: string
  quantity: number
  items: InventoryItem[]
}

export interface LoanNotification {
  loanId: string
  borrowerName: string
  borrowerDocument: string
  itemName: string
  alertLevel: "warning" | "critical" | "overdue"
  shouldReport: boolean
  loan: Loan
}

export interface BorrowerSuggestion {
  name: string
  document: string
  phone?: string
  email?: string
  code?: string
  facultad?: string
  programa?: string
  genero?: string
  etnia?: string
  sede?: string
  estamento?: string
}

export interface User {
  id?: string
  nombre: string
  cedula: string
  email: string
  telefono?: string
  codigoEstudiantil?: string
  facultad?: string
  programa?: string
  genero?: string
  etnia?: string
  sede?: string
  estamento?: string
  createdAt: Date
}
