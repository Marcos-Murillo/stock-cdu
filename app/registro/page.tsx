"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createUser } from "@/lib/firebase"
import { 
  TIPOS_DOCUMENTO, 
  GENEROS, 
  ETNIAS, 
  SEDES, 
  ESTAMENTOS,
  FACULTADES,
  PROGRAMAS_POR_FACULTAD 
} from "@/lib/data"
import { CheckCircle } from "lucide-react"

export default function RegistroPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    tipoDocumento: "",
    cedula: "",
    nombre: "",
    codigoEstudiantil: "",
    facultad: "",
    programa: "",
    genero: "",
    etnia: "",
    sede: "",
    estamento: "",
    telefono: "",
    email: "",
  })
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registroExitoso, setRegistroExitoso] = useState(false)
  const { toast } = useToast()

  const requiresAcademicInfo = ["ESTUDIANTE", "EGRESADO"].includes(formData.estamento)

  const validateStep1 = () => {
    if (!formData.tipoDocumento || !formData.cedula || !formData.nombre) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos de identificación",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.telefono || !formData.email) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos de contacto",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!formData.estamento || !formData.sede) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos institucionales",
        variant: "destructive",
      })
      return false
    }

    if (requiresAcademicInfo && (!formData.codigoEstudiantil || !formData.facultad || !formData.programa)) {
      toast({
        title: "Error",
        description: "Los estudiantes y egresados deben completar código, facultad y programa",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateStep4 = () => {
    if (!formData.genero || !formData.etnia) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos demográficos",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 2 && !validateStep2()) return
    if (currentStep === 3 && !validateStep3()) return
    if (currentStep === 4 && !validateStep4()) return
    
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    if (!validateStep4()) return

    setLoading(true)
    setIsSubmitting(true)

    try {
      await createUser({
        tipoDocumento: formData.tipoDocumento,
        cedula: formData.cedula,
        nombre: formData.nombre,
        codigoEstudiantil: requiresAcademicInfo ? formData.codigoEstudiantil : undefined,
        facultad: requiresAcademicInfo ? formData.facultad : undefined,
        programa: requiresAcademicInfo ? formData.programa : undefined,
        genero: formData.genero,
        etnia: formData.etnia,
        sede: formData.sede,
        estamento: formData.estamento,
        telefono: formData.telefono,
        email: formData.email,
        createdAt: new Date(),
      })

      setRegistroExitoso(true)
    } catch (error) {
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar el usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const programasDisponibles = formData.facultad ? PROGRAMAS_POR_FACULTAD[formData.facultad] || [] : []

  if (registroExitoso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-blue-200 text-center">
          <CardContent className="pt-12 pb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-blue-800 mb-4">¡Gracias por registrarte!</h1>
            <p className="text-lg text-gray-700 mb-2">
              Tu registro ha sido completado exitosamente.
            </p>
            <p className="text-lg text-blue-600 font-semibold">
              Ahora puedes disfrutar de nuestros implementos deportivos.
            </p>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">
                Dirígete al área de préstamos para solicitar implementos deportivos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl border-blue-200">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-800">Registro de Usuario</CardTitle>
          <CardDescription>Sistema de Gestión Deportiva - Universidad del Valle</CardDescription>
          
          {/* Stepper */}
          <div className="flex items-center justify-center mt-6 space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-12 h-1 ${
                      currentStep > step ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Títulos de pasos */}
          <div className="mt-4">
            <p className="text-sm font-medium text-blue-700">
              {currentStep === 1 && "Paso 1: Información de Identificación"}
              {currentStep === 2 && "Paso 2: Información de Contacto"}
              {currentStep === 3 && "Paso 3: Información Institucional"}
              {currentStep === 4 && "Paso 4: Información Demográfica"}
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Paso 1: Información de Identificación */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
                  <Select
                    value={formData.tipoDocumento}
                    onValueChange={(value) => setFormData({ ...formData, tipoDocumento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cedula">Número de Documento *</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    placeholder="Número de documento"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  required
                />
              </div>
            </div>
          )}

          {/* Paso 2: Información de Contacto */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Número de teléfono"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Información Institucional */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estamento">Estamento *</Label>
                  <Select
                    value={formData.estamento}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        estamento: value,
                        codigoEstudiantil: "",
                        facultad: "",
                        programa: ""
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estamento" />
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
              </div>

              {requiresAcademicInfo && (
                <>
                  <div>
                    <Label htmlFor="codigoEstudiantil">Código Estudiantil *</Label>
                    <Input
                      id="codigoEstudiantil"
                      value={formData.codigoEstudiantil}
                      onChange={(e) => setFormData({ ...formData, codigoEstudiantil: e.target.value })}
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
            </div>
          )}

          {/* Paso 4: Información Demográfica */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="genero">Género *</Label>
                  <Select
                    value={formData.genero}
                    onValueChange={(value) => setFormData({ ...formData, genero: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar género" />
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
                      <SelectValue placeholder="Seleccionar etnia" />
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
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
            >
              Anterior
            </Button>
            
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Registrando..." : "Registrarme"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
