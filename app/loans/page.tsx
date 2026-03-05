"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, UserCheck, Package, UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getInventory, getLoans, createLoan, returnLoan } from "@/lib/firebase"
import { GENEROS, ETNIAS, SEDES, ESTAMENTOS, FACULTADES, PROGRAMAS_POR_FACULTAD } from "@/lib/data"
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
  const [showLoanForm, setShowLoanForm] = useState(false)
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

  const requiresAcademicInfo = ["ESTUDIANTE", "EGRESADO"].includes(formData.estamento)

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.borrowerName ||
      !formData.borrowerDocument ||
      !formData.borrowerPhone ||
      !formData.borrowerEmail ||
      !formData.genero ||
      !formData.etnia ||
      !formData.sede ||
      !formData.estamento ||
      !formData.itemId
    ) {
      toast({
        title: "Error",
        description: "Todos los campos obligatorios deben ser completados",
        variant: "destructive",
      })
      return
    }

    if (requiresAcademicInfo && (!formData.borrowerCode || !formData.facultad || !formData.programa)) {
      toast({
        title: "Error",
        description: "Los estudiantes y egresados deben completar código, facultad y programa",
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
      await createLoan({
        borrowerName: formData.borrowerName,
        borrowerDocument: formData.borrowerDocument,
        borrowerPhone: formData.borrowerPhone,
        borrowerEmail: formData.borrowerEmail,
        borrowerCode: formData.borrowerCode || undefined,
        facultad: formData.facultad || undefined,
        programa: formData.programa || undefined,
        genero: formData.genero,
        etnia: formData.etnia,
        sede: formData.sede,
        estamento: formData.estamento,
        itemId: formData.itemId,
        itemName: selectedItem.name,
        itemSerialNumber: selectedItem.serialNumber,
        loanDate: new Date(formData.loanDate),
        status: "active",
      })

      toast({
        title: "Éxito",
        description: "Préstamo registrado correctamente",
      })

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
      setShowLoanForm(false)
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el préstamo",
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

  const programasDisponibles = formData.facultad ? PROGRAMAS_POR_FACULTAD[formData.facultad] || [] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">Préstamos Deportivos</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push("/registro")} 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Registrar Usuario
            </Button>
            <Button onClick={() => setShowLoanForm(!showLoanForm)} className="bg-blue-600 hover:bg-blue-700">
              <UserCheck className="w-4 h-4 mr-2" />
              Nuevo Préstamo
            </Button>
          </div>
        </div>

        {showLoanForm && (
          <Card className="mb-8 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Registrar Nuevo Préstamo</CardTitle>
              <CardDescription>Complete los datos del solicitante y seleccione el elemento</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLoan} className="space-y-6">
                <BorrowerAutocomplete
                  onSelect={(borrower) => {
                    // El autocompletado ya maneja la actualización del formData
                  }}
                  formData={formData}
                  setFormData={setFormData}
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="estamento">Estamento *</Label>
                    <Select
                      value={formData.estamento}
                      onValueChange={(value) => {
                        setFormData({ 
                          ...formData, 
                          estamento: value,
                          borrowerCode: "",
                          facultad: "",
                          programa: ""
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTAMENTOS.map((estamento) => (
                          <SelectItem key={estamento} value={estamento}>
                            {estamento}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="genero">Género *</Label>
                    <Select
                      value={formData.genero}
                      onValueChange={(value) => setFormData({ ...formData, genero: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENEROS.map((genero) => (
                          <SelectItem key={genero} value={genero}>
                            {genero}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="etnia">Etnia *</Label>
                    <Select
                      value={formData.etnia}
                      onValueChange={(value) => setFormData({ ...formData, etnia: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {ETNIAS.map((etnia) => (
                          <SelectItem key={etnia} value={etnia}>
                            {etnia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sede">Sede *</Label>
                  <Select
                    value={formData.sede}
                    onValueChange={(value) => setFormData({ ...formData, sede: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEDES.map((sede) => (
                        <SelectItem key={sede} value={sede}>
                          {sede}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {requiresAcademicInfo && (
                  <>
                    <div>
                      <Label htmlFor="borrowerCode">Código Estudiantil *</Label>
                      <Input
                        id="borrowerCode"
                        value={formData.borrowerCode}
                        onChange={(e) => setFormData({ ...formData, borrowerCode: e.target.value })}
                        placeholder="Código estudiantil"
                        required={requiresAcademicInfo}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="facultad">Facultad *</Label>
                        <Select
                          value={formData.facultad}
                          onValueChange={(value) => setFormData({ ...formData, facultad: value, programa: "" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar facultad" />
                          </SelectTrigger>
                          <SelectContent>
                            {FACULTADES.map((facultad) => (
                              <SelectItem key={facultad} value={facultad}>
                                {facultad}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="programa">Programa *</Label>
                        <Select
                          value={formData.programa}
                          onValueChange={(value) => setFormData({ ...formData, programa: value })}
                          disabled={!formData.facultad}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar programa" />
                          </SelectTrigger>
                          <SelectContent>
                            {programasDisponibles.map((programa) => (
                              <SelectItem key={programa} value={programa}>
                                {programa}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="loanDate">Fecha del Préstamo *</Label>
                  <Input
                    id="loanDate"
                    type="date"
                    value={formData.loanDate}
                    onChange={(e) => setFormData({ ...formData, loanDate: e.target.value })}
                    required
                  />
                </div>

                <ItemSelector
                  items={availableItems}
                  selectedItemId={formData.itemId}
                  onSelect={(itemId) => setFormData({ ...formData, itemId })}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? "Registrando..." : "Registrar Préstamo"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowLoanForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Préstamos Activos</CardTitle>
            <CardDescription>
              {filteredLoans.filter((loan) => loan.status === "active").length} préstamos activos
            </CardDescription>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, elemento, serie, cédula, código o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLoans
                .filter((loan) => loan.status === "active")
                .map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-white"
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
                        <p className="text-sm text-gray-600">Email: {loan.borrowerEmail}</p>
                        <p className="text-sm text-gray-600">Estamento: {loan.estamento}</p>
                        {loan.facultad && <p className="text-sm text-gray-600">Facultad: {loan.facultad}</p>}
                        {loan.programa && <p className="text-sm text-gray-600">Programa: {loan.programa}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "No se encontraron préstamos" : "No hay préstamos activos"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
