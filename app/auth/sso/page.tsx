"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { StockUser } from "@/lib/types"

function SSOHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) { setError("Token no proporcionado."); return }

    fetch("/api/auth/verify-sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        const user: StockUser = {
          uid: data.uid,
          nombre: data.nombre,
          cedula: data.cedula,
          role: data.role,
        }
        login(user)
        router.replace(searchParams.get("redirect") ?? "/")
      })
      .catch(() => setError("Error al verificar el acceso."))
  }, [searchParams, login, router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-blue-50">
        <p className="text-red-600">{error}</p>
        <a href="/sin-acceso" className="text-blue-700 underline text-sm">Volver</a>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50">
      <p className="text-blue-700">Iniciando sesión...</p>
    </div>
  )
}

export default function SSOPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <p className="text-blue-700">Cargando...</p>
      </div>
    }>
      <SSOHandler />
    </Suspense>
  )
}
