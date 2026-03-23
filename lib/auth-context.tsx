"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { StockUser } from "./types"

const SESSION_KEY = "stockcdu_session"

interface AuthContextType {
  user: StockUser | null
  loading: boolean
  login: (user: StockUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StockUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) setUser(JSON.parse(raw) as StockUser)
    } catch {
      localStorage.removeItem(SESSION_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (u: StockUser) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
