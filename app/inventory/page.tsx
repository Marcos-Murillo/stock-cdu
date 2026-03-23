"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Search, Trash2, AlertTriangle, MoreVertical, Edit, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { addItem, getInventory, removeItem, updateItem } from "@/lib/firebase"
import type { InventoryItem } from "@/lib/types"
import Navigation from "@/components/navigation"
import DamageReportModal from "@/components/damage-report-modal"
import EditItemModal from "@/components/edit-item-modal"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { RouteGuard } from "@/components/route-guard"

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedItemForDamage, setSelectedItemForDamage] = useState<InventoryItem | null>(null)
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    description: "",
    location: "" as "Auditorio 5" | "Bodega" | "",
    quantity: 1,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadInventory()
  }, [])

  useEffect(() => {
    let filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (locationFilter && locationFilter !== "all") {
      filtered = filtered.filter((item) => item.location === locationFilter)
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, locationFilter])

  const loadInventory = async () => {
    try {
      const inventory = await getInventory()
      setItems(inventory)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario",
        variant: "destructive",
      })
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.serialNumber) {
      toast({
        title: "Error",
        description: "Nombre y número de serie son obligatorios",
        variant: "destructive",
      })
      return
    }

    if (formData.quantity < 1 || formData.quantity > 100) {
      toast({
        title: "Error",
        description: "La cantidad debe estar entre 1 y 100",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const itemsToAdd = []
      
      // Crear múltiples elementos si la cantidad es mayor a 1
      for (let i = 1; i <= formData.quantity; i++) {
        const serialNumber = formData.quantity === 1 
          ? formData.serialNumber 
          : `${formData.serialNumber}-${String(i).padStart(2, '0')}`
        
        // Verificar si el número de serie ya existe
        const existingItem = items.find((item) => item.serialNumber === serialNumber)
        if (existingItem) {
          toast({
            title: "Error",
            description: `Ya existe un elemento con el número de serie ${serialNumber}`,
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        itemsToAdd.push({
          name: formData.name,
          serialNumber: serialNumber,
          description: formData.description,
          location: formData.location || undefined,
          status: "available" as const,
          createdAt: new Date(),
        })
      }

      // Agregar todos los elementos
      for (const item of itemsToAdd) {
        await addItem(item)
      }

      toast({
        title: "Éxito",
        description: `${formData.quantity} ${formData.quantity === 1 ? 'elemento agregado' : 'elementos agregados'} al inventario`,
      })

      setFormData({ name: "", serialNumber: "", description: "", location: "", quantity: 1 })
      setShowAddForm(false)
      loadInventory()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el elemento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres dar de baja este elemento?")) {
      return
    }

    try {
      await removeItem(id)
      toast({
        title: "Éxito",
        description: "Elemento dado de baja",
      })
      loadInventory()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo dar de baja el elemento",
        variant: "destructive",
      })
    }
  }

  const handleEditItem = async (itemId: string, updates: Partial<InventoryItem>) => {
    try {
      await updateItem(itemId, updates)
      toast({
        title: "Éxito",
        description: "Elemento actualizado correctamente",
      })
      loadInventory()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el elemento",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsAvailable = async (item: InventoryItem) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres marcar "${item.name}" como disponible? Esto solo debe hacerse si el elemento no está realmente prestado.`,
      )
    ) {
      return
    }

    try {
      await updateItem(item.id!, { status: "available" })
      toast({
        title: "Éxito",
        description: "Elemento marcado como disponible",
      })
      loadInventory()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Disponible
          </Badge>
        )
      case "loaned":
        return <Badge className="bg-orange-100 text-orange-800">Prestado</Badge>
      case "removed":
        return <Badge variant="destructive">Dado de baja</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  return (
    <RouteGuard>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">Inventario</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Elemento
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-8 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Agregar Nuevo Elemento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre del Elemento *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Balón de Fútbol"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Número de Serie Base *</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="Ej: BF-2024"
                      required
                    />
                    {formData.quantity > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Se generarán: {formData.serialNumber}-01, {formData.serialNumber}-02, ...
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Cantidad *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.quantity}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          setFormData({ ...formData, quantity: 0 })
                        } else {
                          const num = parseInt(value)
                          if (!isNaN(num)) {
                            setFormData({ ...formData, quantity: num })
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Si está vacío o es 0, establecer en 1
                        if (formData.quantity === 0 || e.target.value === '') {
                          setFormData({ ...formData, quantity: 1 })
                        }
                      }}
                      placeholder="1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Número de elementos idénticos a agregar (máx. 100)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => setFormData({ ...formData, location: value as "Auditorio 5" | "Bodega" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auditorio 5">Auditorio 5</SelectItem>
                        <SelectItem value="Bodega">Bodega</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción adicional del elemento"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta descripción se aplicará a todos los elementos
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? "Agregando..." : `Agregar ${formData.quantity} ${formData.quantity === 1 ? 'Elemento' : 'Elementos'}`}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Stock Disponible</CardTitle>
            <CardDescription>{filteredItems.length} elementos en inventario</CardDescription>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o número de serie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="min-w-[180px]">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las ubicaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ubicaciones</SelectItem>
                    <SelectItem value="Auditorio 5">Auditorio 5</SelectItem>
                    <SelectItem value="Bodega">Bodega</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-white"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-blue-800">{item.name}</h3>
                      {item.location && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {item.location}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Serie: {item.serialNumber}</p>
                    {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                    {item.loanCount && item.loanCount > 0 && (
                      <p className="text-xs text-blue-600">Prestado {item.loanCount} veces</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <DropdownMenu
                      trigger={
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      }
                    >
                      <DropdownMenuItem onClick={() => setSelectedItemForEdit(item)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {item.status === "loaned" && (
                        <DropdownMenuItem onClick={() => handleMarkAsAvailable(item)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marcar como Disponible
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setSelectedItemForDamage(item)}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Reportar Daño
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRemoveItem(item.id!)} variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "No se encontraron elementos" : "No hay elementos en el inventario"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <DamageReportModal
          item={selectedItemForDamage!}
          isOpen={!!selectedItemForDamage}
          onClose={() => setSelectedItemForDamage(null)}
          onReportCreated={() => {
            toast({
              title: "Éxito",
              description: "Reporte de daño registrado",
            })
          }}
        />

        <EditItemModal
          item={selectedItemForEdit}
          isOpen={!!selectedItemForEdit}
          onClose={() => setSelectedItemForEdit(null)}
          onSave={handleEditItem}
        />
      </div>
    </div>
    </RouteGuard>
  )
}
