"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, UserCheck, Package, UserPlus, ShoppingCart, X, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getInventory, getLoans, createLoan, returnLoan, returnLoanGroupPartial } from "@/lib/firebase"
import type { InventoryItem, Loan, CartItem } from "@/lib/types"
import Navigation from "@/components/navigation"
import BorrowerAutocomplete from "@/components/borrower-autocomplete"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RouteGuard } from "@/components/route-guard"
import PartialReturnDialog from "@/components/partial-return-dialog"

export default function LoansPage() {
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedItemName, setSelectedItemName] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)
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

  // Estado para el dialog de devolución parcial
  const [partialReturnGroup, setPartialReturnGroup] = useState<Loan[] | null>(null)

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

  // Obtener nombres únicos de elementos disponibles
  const uniqueItemNames = Array.from(new Set(availableItems.map(item => item.name)))

  // Obtener elementos disponibles por nombre
  const getAvailableItemsByName = (name: string) => {
    return availableItems.filter(item => item.name === name)
  }

  // Agregar elemento al carrito
  const handleAddToCart = () => {
    if (!selectedItemName) {
      toast({
        title: "Error",
        description: "Selecciona un elemento",
        variant: "destructive",
      })
      return
    }

    const availableForName = getAvailableItemsByName(selectedItemName)
    
    if (selectedQuantity > availableForName.length) {
      toast({
        title: "Error",
        description: `Solo hay ${availableForName.length} ${selectedItemName} disponibles`,
        variant: "destructive",
      })
      return
    }

    // Verificar si ya está en el carrito
    const existingCartItem = cart.find(item => item.itemName === selectedItemName)
    if (existingCartItem) {
      toast({
        title: "Error",
        description: "Este elemento ya está en el carrito",
        variant: "destructive",
      })
      return
    }

    const itemsToAdd = availableForName.slice(0, selectedQuantity)
    
    setCart([...cart, {
      itemName: selectedItemName,
      items: itemsToAdd,
      quantity: selectedQuantity
    }])

    setSelectedItemName("")
    setSelectedQuantity(1)

    toast({
      title: "Agregado",
      description: `${selectedQuantity} ${selectedItemName} agregado(s) al carrito`,
    })
  }

  // Remover elemento del carrito
  const handleRemoveFromCart = (itemName: string) => {
    setCart(cart.filter(item => item.itemName !== itemName))
  }

  // Calcular total de elementos en el carrito
  const getTotalItemsInCart = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Agrupar préstamos por loanGroupId
  const groupedLoans = filteredLoans
    .filter((loan) => loan.status === "active")
    .reduce((groups, loan) => {
      const groupId = loan.loanGroupId || loan.id!
      if (!groups[groupId]) {
        groups[groupId] = []
      }
      groups[groupId].push(loan)
      return groups
    }, {} as Record<string, Loan[]>)

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación básica
    if (!formData.borrowerName || !formData.borrowerDocument) {
      toast({
        title: "Error",
        description: "Debe seleccionar un usuario",
        variant: "destructive",
      })
      return
    }

    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un elemento al carrito",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Generar un ID único para agrupar todos los préstamos
      const loanGroupId = `${Date.now()}-${formData.borrowerDocument}`

      // Corregir la fecha sumando un día para compensar la zona horaria
      const loanDate = new Date(formData.loanDate)
      loanDate.setDate(loanDate.getDate() + 1)

      // Crear un préstamo por cada elemento en el carrito
      for (const cartItem of cart) {
        for (const item of cartItem.items) {
          const loanData: any = {
            borrowerName: formData.borrowerName,
            borrowerDocument: formData.borrowerDocument,
            borrowerPhone: formData.borrowerPhone,
            borrowerEmail: formData.borrowerEmail,
            genero: formData.genero,
            etnia: formData.etnia,
            sede: formData.sede,
            estamento: formData.estamento,
            itemId: item.id!,
            itemName: item.name,
            itemSerialNumber: item.serialNumber,
            loanDate: loanDate,
            status: "active",
            loanGroupId: loanGroupId,
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
        }
      }

      toast({
        title: "Éxito",
        description: `Préstamo de ${getTotalItemsInCart()} elementos registrado correctamente`,
      })

      // Limpiar formulario y carrito
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
      setCart([])
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

  const handleReturnLoanGroup = async (groupLoans: Loan[]) => {
    const count = groupLoans.length
    if (!confirm(`¿Confirmar la devolución de ${count} ${count === 1 ? 'elemento' : 'elementos'}?`)) {
      return
    }

    try {
      for (const loan of groupLoans) {
        await returnLoan(loan.id!)
      }
      toast({
        title: "Éxito",
        description: `${count} ${count === 1 ? 'elemento devuelto' : 'elementos devueltos'} correctamente`,
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

  const handlePartialReturn = async (missingItems: { name: string; missing: number }[]) => {
    if (!partialReturnGroup) return
    try {
      await returnLoanGroupPartial(
        partialReturnGroup.map((l) => ({ id: l.id!, itemId: l.itemId })),
        missingItems
      )
      toast({
        title: "Devolución registrada",
        description: `Devolución con faltantes registrada`,
      })
      setPartialReturnGroup(null)
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la devolución",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <RouteGuard>
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

                  {/* Selector de elementos y carrito */}
                  <div className="pt-2 space-y-4">
                    <div className="border-t pt-4">
                      <Label className="text-sm font-semibold text-blue-800 mb-2 block">
                        Agregar Elementos
                      </Label>
                      
                      <div className="space-y-2">
                        <Select
                          value={selectedItemName}
                          onValueChange={setSelectedItemName}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar elemento" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueItemNames.map((name) => {
                              const available = getAvailableItemsByName(name).length
                              return (
                                <SelectItem key={name} value={name}>
                                  {name} ({available} disponibles)
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>

                        {selectedItemName && (
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                type="number"
                                min="1"
                                max={getAvailableItemsByName(selectedItemName).length}
                                value={selectedQuantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value)
                                  if (!isNaN(val)) setSelectedQuantity(val)
                                }}
                                placeholder="Cantidad"
                              />
                            </div>
                            <Button
                              type="button"
                              onClick={handleAddToCart}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Carrito */}
                    {cart.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold text-blue-800">
                            <ShoppingCart className="w-4 h-4 inline mr-1" />
                            Carrito ({getTotalItemsInCart()})
                          </Label>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {cart.map((cartItem) => (
                            <div
                              key={cartItem.itemName}
                              className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800">
                                  {cartItem.itemName}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Cantidad: {cartItem.quantity}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFromCart(cartItem.itemName)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botón de registro */}
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.borrowerName || cart.length === 0} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Registrando..." : `Registrar Préstamo (${getTotalItemsInCart()} elementos)`}
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
                  {Object.entries(groupedLoans).map(([groupId, groupLoans]) => {
                    const firstLoan = groupLoans[0]
                    const isMultiple = groupLoans.length > 1

                    return (
                      <div
                        key={groupId}
                        className="border border-blue-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <p className="font-semibold text-blue-800">{firstLoan.borrowerName}</p>
                                {isMultiple && (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    {groupLoans.length} elementos
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-4 mb-3">
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>Cédula: {firstLoan.borrowerDocument}</p>
                                  {firstLoan.borrowerCode && <p>Código: {firstLoan.borrowerCode}</p>}
                                  <p>Tel: {firstLoan.borrowerPhone}</p>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>Estamento: {firstLoan.estamento}</p>
                                  <p>Fecha: {firstLoan.loanDate.toLocaleDateString()}</p>
                                  {firstLoan.facultad && <p className="truncate">Facultad: {firstLoan.facultad}</p>}
                                </div>
                              </div>

                              {/* Lista de elementos agrupados por nombre */}
                              <div className="border-t pt-3 mt-3">
                                <p className="text-xs font-semibold text-gray-500 mb-2">ELEMENTOS PRESTADOS:</p>
                                <div className="space-y-1">
                                  {Object.entries(
                                    groupLoans.reduce((acc, loan) => {
                                      acc[loan.itemName] = (acc[loan.itemName] || 0) + 1
                                      return acc
                                    }, {} as Record<string, number>)
                                  ).map(([name, qty]) => (
                                    <div key={name} className="flex items-center p-2 bg-gray-50 rounded">
                                      <p className="text-sm font-medium text-gray-800">
                                        {name}{qty > 1 ? ` - ${qty}` : ""}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <Badge className="bg-orange-100 text-orange-800">Prestado</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReturnLoanGroup(groupLoans)}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                              >
                                <Package className="w-4 h-4 mr-1" />
                                Devolver {isMultiple ? 'Todo' : ''}
                              </Button>
                              {isMultiple && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPartialReturnGroup(groupLoans)}
                                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                >
                                  <Package className="w-4 h-4 mr-1" />
                                  Regreso con Faltas
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(groupedLoans).length === 0 && (
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

    {partialReturnGroup && (
      <PartialReturnDialog
        isOpen={true}
        onClose={() => setPartialReturnGroup(null)}
        onConfirm={handlePartialReturn}
        itemGroups={Object.entries(
          partialReturnGroup.reduce((acc, l) => {
            acc[l.itemName] = (acc[l.itemName] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        ).map(([name, total]) => ({ name, total }))}
        borrowerName={partialReturnGroup[0].borrowerName}
      />
    )}
    </RouteGuard>
  )
}
