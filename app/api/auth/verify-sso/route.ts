import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const SSO_SECRET = process.env.SSO_SECRET!

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: "Token requerido." }, { status: 400 })

    const payload = jwt.verify(token, SSO_SECRET) as {
      uid: string
      nombre: string
      cedula: string
      role: string
      platform: string
    }

    return NextResponse.json({
      uid: payload.uid,
      nombre: payload.nombre,
      cedula: payload.cedula,
      role: payload.role,
    })
  } catch (err) {
    const message = (err as Error).message ?? ""
    if (message.includes("expired")) {
      return NextResponse.json({ error: "El enlace ha expirado. Vuelve a intentarlo." }, { status: 401 })
    }
    return NextResponse.json({ error: "Token inválido." }, { status: 401 })
  }
}
