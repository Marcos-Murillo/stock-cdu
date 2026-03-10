"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, UserCheck, Package, UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getInventory, getLoans, createLoan, returnLoan } from "@/lib/firebase"
import type { InventoryItem, Loan } from "@/lib/types"
import Navigation from "@/components/navigation"
import BorrowerAutocomplete from "@/components/borrower-autocomplete"
import ItemSelector from "@/components/item-selector"
import { useRouter } from "next/navigation"

export default function LoansPage() {
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    borrowerName: "",
    borrowerDocument: "",
    borrowerPhone: "",
    borrowerEmail: "",
    borrowerCode: "",
    facultad: "",
    programa: "",
    genero: "",
    etnia: "",
    sede: "",
    estamento: "",
    itemId: "",
    loanDate: new Date().toISOString().split("T")[0],
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const filtered = loans.filter((loan) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        (loan.borrowerName?.toLowerCase() || "").includes(searchLower) ||
        (loan.itemName?.toLowerCase() || "").includes(searchLower) ||
        (loan.itemSerialNumber?.toLowerCase() || "").includes(searchLower) ||
        (loan.borrowerDocument || "").includes(searchTerm) ||
        (loan.borrowerEmail?.toLowerCase() || "").includes(searchLower) ||
        (loan.borrowerCode || "").includes(searchTerm)
      )
    })
    setFilteredLoans(filtered)
  }, [loans, searchTerm])

  const loadData = async () => {
    try {
      const [inventory, loansList] = await Promise.all([getInventory(), getLoans()])

      const available = inventory.filter((item) => item.status === "available")
      setAvailableItems(available)
      setLoans(loansList)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    }
  }

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación básica
    if (!formData.borrowerName || !formData.borrowerDocument || !formData.itemId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un usuario y un elemento",
        variant: "destructive",
      })
      return
    }

    const selectedItem = availableItems.find((item) => item.id === formData.itemId)
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Elemento no encontrado",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const loanData: any = {
        borrowerName: formData.borrowerName,
        borrowerDocument: formData.borrowerDocument,
        borrowerPhone: formData.borrowerPhone,
        borrowerEmail: formData.borrowerEmail,
        genero: formData.genero,
        etnia: formData.etnia,
        sede: formData.sede,
        estamento: formData.estamento,
        itemId: formData.itemId,
        itemName: selectedItem.name,
        itemSerialNumber: selectedItem.serialNumber,
        loanDate: new Date(formData.loanDate),
        status: "active",
      }

      // Solo agregar campos académicos si existen
      if (formData.borrowerCode) {
        loanData.borrowerCode = formData.borrowerCode
      }
      if (formData.facultad) {
        loanData.facultad = formData.facultad
      }
      if (formData.programa) {
        loanData.programa = formData.programa
      }

      await createLoan(loanData)

      toast({
        title: "Éxito",
        description: "Préstamo registrado correctamente",
      })

      // Limpiar formulario
      setFormData({
        borrowerName: "",
        borrowerDocument: "",
        borrowerPhone: "",
        borrowerEmail: "",
        borrowerCode: "",
        facultad: "",
        programa: "",
        genero: "",
        etnia: "",
        sede: "",
        estamento: "",
        itemId: "",
        loanDate: new Date().toISOString().split("T")[0],
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar el préstamo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReturnLoan = async (loanId: string) => {
    if (!confirm("¿Confirmar la devolución de este elemento?")) {
      return
    }

    try {
      await returnLoan(loanId)
      toast({
        title: "Éxito",
        description: "Elemento devuelto correctamente",
      })
      loadData()
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">Préstamos Deportivos</h1>
          <Button 
            onClick={() => router.push("/registro")} 
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Registrar Usuario
          </Button>
        </div>

        {/* Layout de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Izquierdo - Nuevo Préstamo (1/3) */}
          <div className="lg:col-span-1">
            <Card className="border-blue-200 sticky top-4">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Nuevo Préstamo
                </CardTitle>
                <CardDescription>Complete los datos para registrar un préstamo</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateLoan} className="space-y-4">
                  {/* Autocompletado */}
                  <BorrowerAutocomplete
                    onSelect={() => {}}
                    formData={formData}
                    setFormData={setFormData}
                  />

                  {/* Campos de solo lectura que se llenan automáticamente */}
                  <div>
                    <Label className="text-xs text-gray-500">Solicitante</Label>
                    <Input
                      value={formData.borrowerName}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Se llenará automáticamente"
                    />
                  </div>

                  {formData.borrowerCode && (
                    <div>
                      <Label className="text-xs text-gray-500">Código</Label>
                      <Input
                        value={formData.borrowerCode}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  )}

                  {formData.facultad && (
                    <div>
                      <Label className="text-xs text-gray-500">Facultad</Label>
                      <Input
                        value={formData.facultad}
                        readOnly
                        className="bg-gray-50 text-xs"
                      />
                    </div>
                  )}

                  {formData.programa && (
                    <div>
                      <Label className="text-xs text-gray-500">Programa</Label>
                      <Input
                        value={formData.programa}
                        readOnly
                        className="bg-gray-50 text-xs"
                      />
                    </div>
                  )}

                  {formData.estamento && (
                    <div>
                      <Label className="text-xs text-gray-500">Estamento</Label>
                      <Input
                        value={formData.estamento}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  )}

                  {formData.sede && (
                    <div>
                      <Label className="text-xs text-gray-500">Sede</Label>
                      <Input
                        value={formData.sede}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  )}

                  {/* Selector de elemento */}
                  <div className="pt-2">
                    <ItemSelector
                      items={availableItems}
                      selectedItemId={formData.itemId}
                      onSelect={(itemId) => setFormData({ ...formData, itemId })}
                    />
                  </div>

                  {/* Botón de registro */}
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.borrowerName || !formData.itemId} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Registrando..." : "Registrar Préstamo"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Card Derecho - Préstamos Activos (2/3) */}
          <div className="lg:col-span-2">
            <Card className="border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle className="text-blue-800">Préstamos Activos</CardTitle>
                    <CardDescription>
                      {filteredLoans.filter((loan) => loan.status === "active").length} préstamos activos
                    </CardDescription>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, elemento, serie, cédula, código o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {filteredLoans
                    .filter((loan) => loan.status === "active")
                    .map((loan) => (
                      <div
                        key={loan.id}
                        className="flex items-start justify-between p-4 border border-blue-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1 grid md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold text-blue-800 mb-2">{loan.itemName}</h3>
                            <p className="text-sm text-gray-600">Serie: {loan.itemSerialNumber}</p>
                            <p className="text-sm text-gray-500">Fecha: {loan.loanDate.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{loan.borrowerName}</p>
                            <p className="text-sm text-gray-600">Cédula: {loan.borrowerDocument}</p>
                            {loan.borrowerCode && <p className="text-sm text-gray-600">Código: {loan.borrowerCode}</p>}
                            <p className="text-sm text-gray-600">Tel: {loan.borrowerPhone}</p>
                            <p className="text-sm text-gray-600">Estamento: {loan.estamento}</p>
                            {loan.facultad && <p className="text-sm text-gray-600 truncate">Facultad: {loan.facultad}</p>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge className="bg-orange-100 text-orange-800">Prestado</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturnLoan(loan.id!)}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Devolver
                          </Button>
                        </div>
                      </div>
                    ))}
                  {filteredLoans.filter((loan) => loan.status === "active").length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      {searchTerm ? "No se encontraron préstamos" : "No hay préstamos activos"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
