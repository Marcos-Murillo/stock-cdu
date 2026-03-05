# ✅ Checklist de Verificación - Sistema de Inventario Deportivo

## 📋 Antes de Usar el Sistema

### Configuración Inicial
- [ ] Ejecutar `npm install`
- [ ] Verificar que Firebase esté configurado
- [ ] Copiar reglas de `firestore.rules` a Firebase Console
- [ ] Publicar las reglas en Firestore
- [ ] Ejecutar `npm run dev`
- [ ] Verificar que la app cargue en http://localhost:3000

---

## 🧪 Pruebas de Funcionalidad

### 1. Registro de Usuarios
- [ ] Ir a `/registro`
- [ ] Verificar que NO aparezca el navigation bar
- [ ] Completar Paso 1 (Identificación)
- [ ] Hacer clic en "Siguiente"
- [ ] Completar Paso 2 (Contacto)
- [ ] Hacer clic en "Siguiente"
- [ ] Completar Paso 3 (Institucional)
  - [ ] Seleccionar "ESTUDIANTE" como estamento
  - [ ] Verificar que aparezcan campos de código, facultad y programa
  - [ ] Seleccionar "FUNCIONARIO" como estamento
  - [ ] Verificar que NO aparezcan campos de código, facultad y programa
- [ ] Hacer clic en "Siguiente"
- [ ] Completar Paso 4 (Demográfica)
- [ ] Hacer clic en "Registrarme"
- [ ] Verificar que aparezca pantalla de éxito
- [ ] Verificar mensaje: "¡Gracias por registrarte! Ahora puedes disfrutar de nuestros implementos deportivos"
- [ ] Verificar que NO redirija a otra página
- [ ] Intentar registrar la misma cédula nuevamente
- [ ] Verificar que muestre error de cédula duplicada

### 2. Gestión de Inventario
- [ ] Ir a `/inventory`
- [ ] Verificar colores azules en toda la página
- [ ] Hacer clic en "Agregar Elemento"
- [ ] Completar formulario
- [ ] Agregar elemento
- [ ] Verificar que aparezca en la lista
- [ ] Buscar elemento por nombre
- [ ] Buscar elemento por serie
- [ ] Filtrar por ubicación
- [ ] Editar un elemento
- [ ] Reportar daño en un elemento
- [ ] Verificar contador de préstamos

### 3. Gestión de Préstamos
- [ ] Ir a `/loans`
- [ ] Verificar colores azules
- [ ] Verificar botón "Registrar Usuario"
- [ ] Hacer clic en "Nuevo Préstamo"
- [ ] Escribir nombre de usuario registrado
- [ ] Verificar que aparezcan sugerencias
- [ ] Seleccionar usuario del autocompletado
- [ ] Verificar que se autocompleten todos los campos
- [ ] Escribir cédula de usuario
- [ ] Verificar que aparezcan sugerencias
- [ ] Escribir código estudiantil
- [ ] Verificar que aparezcan sugerencias
- [ ] Completar campos faltantes si es necesario
- [ ] Seleccionar elemento disponible
- [ ] Registrar préstamo
- [ ] Verificar que aparezca en préstamos activos
- [ ] Buscar préstamo por nombre
- [ ] Buscar préstamo por cédula
- [ ] Buscar préstamo por código
- [ ] Devolver elemento
- [ ] Verificar que desaparezca de activos

### 4. Estadísticas Detalladas
- [ ] Ir a `/statistics`
- [ ] Verificar colores azules
- [ ] Verificar 4 cards de resumen general
- [ ] Verificar 3 cards de préstamos por género
  - [ ] Card de MUJER
  - [ ] Card de HOMBRE
  - [ ] Card de OTRO
- [ ] Verificar Top 10 elementos más prestados
- [ ] Verificar Top 10 facultades más activas
- [ ] Verificar Top 10 programas más activos
- [ ] Hacer clic en tabla de facultades
- [ ] Verificar que se expanda/contraiga
- [ ] Verificar que solo muestre facultades con préstamos
- [ ] Hacer clic en tabla de programas
- [ ] Verificar que se expanda/contraiga
- [ ] Verificar que solo muestre programas con préstamos
- [ ] Verificar tabla detallada de elementos
- [ ] Ordenar por préstamos
- [ ] Ordenar por daños
- [ ] Ordenar por nombre
- [ ] Filtrar solo activos
- [ ] Hacer clic en "Generar Reporte General"
- [ ] Verificar que se abra ventana de impresión
- [ ] Verificar que el PDF incluya:
  - [ ] Resumen general
  - [ ] Préstamos por facultad
  - [ ] Préstamos por programa
  - [ ] Préstamos por género
  - [ ] Préstamos por elemento
  - [ ] Top 10 facultades
  - [ ] Top 10 programas
  - [ ] Top 5 elementos
  - [ ] Reportes de daños

### 5. Reportes
- [ ] Ir a `/reports`
- [ ] Verificar colores azules
- [ ] Verificar 4 cards de estadísticas generales
- [ ] Verificar préstamos por facultad
- [ ] Verificar préstamos por género
- [ ] Verificar préstamos recientes
- [ ] Verificar estado del inventario

### 6. Página Principal
- [ ] Ir a `/`
- [ ] Verificar colores azules
- [ ] Verificar título "Sistema de Inventario Deportivo"
- [ ] Verificar 4 cards de navegación
- [ ] Hacer clic en cada card
- [ ] Verificar que navegue correctamente

### 7. Navegación
- [ ] Verificar navigation bar en todas las páginas (excepto `/registro`)
- [ ] Verificar título "Inventario Deportivo"
- [ ] Verificar colores azules
- [ ] Hacer clic en cada enlace
- [ ] Verificar navegación correcta

---

## 🎨 Verificación de Diseño

### Colores
- [ ] Todos los botones principales son azules (blue-600)
- [ ] Hover de botones es azul oscuro (blue-700)
- [ ] Fondos son degradado azul claro
- [ ] Bordes son azul claro (blue-200)
- [ ] Textos principales son azul oscuro (blue-800)
- [ ] NO hay colores verdes (lime) en ninguna parte

### Componentes
- [ ] Cards tienen bordes azules
- [ ] Badges tienen colores semánticos
- [ ] Tablas tienen hover azul
- [ ] Inputs tienen focus azul
- [ ] Selects tienen colores azules

---

## 📊 Verificación de Datos

### Firestore
- [ ] Colección `users` existe
- [ ] Colección `loans` existe
- [ ] Colección `inventory` existe
- [ ] Colección `damageReports` existe
- [ ] Reglas de seguridad están configuradas

### Datos de Prueba
- [ ] Al menos 1 usuario registrado
- [ ] Al menos 1 elemento en inventario
- [ ] Al menos 1 préstamo activo
- [ ] Verificar que las estadísticas se calculen correctamente

---

## 🔐 Verificación de Validaciones

### Registro
- [ ] No permite avanzar sin completar campos obligatorios
- [ ] No permite cédulas duplicadas
- [ ] Campos condicionales funcionan correctamente
- [ ] Botón "Registrarme" se deshabilita después del primer clic
- [ ] Validación de email funciona

### Préstamos
- [ ] No permite crear préstamo sin todos los campos
- [ ] Valida campos obligatorios según estamento
- [ ] No permite prestar elementos no disponibles
- [ ] Autocompletado requiere mínimo 3 caracteres

### Inventario
- [ ] No permite números de serie duplicados
- [ ] Valida campos obligatorios
- [ ] Confirma antes de eliminar

---

## 📱 Verificación de Responsividad

- [ ] Página principal se ve bien en móvil
- [ ] Registro se ve bien en móvil
- [ ] Inventario se ve bien en móvil
- [ ] Préstamos se ve bien en móvil
- [ ] Estadísticas se ve bien en móvil
- [ ] Reportes se ve bien en móvil
- [ ] Tablas son scrolleables en móvil
- [ ] Stepper se adapta en móvil

---

## 🐛 Verificación de Errores

### Manejo de Errores
- [ ] Muestra toast de error cuando falla una operación
- [ ] Muestra toast de éxito cuando completa una operación
- [ ] Maneja errores de conexión a Firebase
- [ ] Maneja errores de validación
- [ ] Muestra mensajes claros al usuario

### Estados de Carga
- [ ] Muestra "Cargando..." mientras obtiene datos
- [ ] Deshabilita botones durante operaciones
- [ ] Muestra "Registrando..." durante registro
- [ ] Muestra "Agregando..." durante creación

---

## 📄 Verificación de Documentación

- [ ] README.md está actualizado
- [ ] INICIO_RAPIDO.md existe
- [ ] INSTRUCCIONES.md existe
- [ ] RESUMEN_FINAL.md existe
- [ ] CAMBIOS_REALIZADOS.md existe
- [ ] firestore.rules existe
- [ ] Todos los archivos tienen información correcta

---

## ✅ Checklist Final

- [ ] Todas las funcionalidades funcionan correctamente
- [ ] Todos los colores son azules (no verdes)
- [ ] Todas las validaciones funcionan
- [ ] Todas las páginas son responsivas
- [ ] Todos los errores se manejan correctamente
- [ ] Toda la documentación está completa
- [ ] El sistema está listo para producción

---

## 🎉 Sistema Verificado

Si todos los items están marcados, el sistema está **100% funcional y listo para usar**.

**Fecha de verificación:** _______________

**Verificado por:** _______________

**Notas adicionales:**
_______________________________________________
_______________________________________________
_______________________________________________
