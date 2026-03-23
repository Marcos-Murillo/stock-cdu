export type UserRole = "superadmin" | "admin" | "monitor"

export interface StockUser {
  uid: string
  nombre: string
  cedula: string
  role: UserRole
}
