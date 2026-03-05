import Link from "next/link"
import { Home, Package, Users, BarChart3, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Navigation() {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Package className="w-6 h-6" />
            <span className="font-bold text-lg">Inventario Deportivo</span>
          </Link>

          <div className="flex space-x-1">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-blue-700">
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="ghost" className="text-white hover:bg-blue-700">
                <Package className="w-4 h-4 mr-2" />
                Inventario
              </Button>
            </Link>
            <Link href="/loans">
              <Button variant="ghost" className="text-white hover:bg-blue-700">
                <Users className="w-4 h-4 mr-2" />
                Préstamos
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="ghost" className="text-white hover:bg-blue-700">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reportes
              </Button>
            </Link>
            <Link href="/statistics">
              <Button variant="ghost" className="text-white hover:bg-blue-700">
                <TrendingUp className="w-4 h-4 mr-2" />
                Estadísticas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
