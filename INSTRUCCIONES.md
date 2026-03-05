# Sistema de Inventario Deportivo - Universidad del Valle

## 📋 Descripción

Sistema completo de gestión de inventario deportivo con registro de usuarios, préstamos, estadísticas y reportes.

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Firebase

Las credenciales de Firebase ya están configuradas en `lib/firebase.ts`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCqdvCQrUVFG953lsaHTXvcweTnacixX3s",
  authDomain: "stock-cdu.firebaseapp.com",
  projectId: "stock-cdu",
  storageBucket: "stock-cdu.firebasestorage.app",
  messagingSenderId: "185915862646",
  appId: "1:185915862646:web:ba4c8e4810543849b97957"
}
```

### 3. Configurar Reglas de Firestore

En la consola de Firebase (https://console.firebase.google.com):

1. Ve a tu proyecto "stock-cdu"
2. Navega a Firestore Database
3. Ve a la pestaña "Reglas"
4. Copia y pega el contenido del archivo `firestore.rules`
5. Haz clic en "Publicar"

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## 📁 Estructura del Proyecto

```
├── app/
│   ├── inventory/          # Gestión de inventario
│   ├── loans/              # Gestión de préstamos
│   ├── registro/           # Registro de usuarios
│   ├── reports/            # Reportes generales
│   ├── statistics/         # Estadísticas detalladas
│   └── page.tsx            # Página principal
├── components/
│   ├── ui/                 # Componentes de UI
│   ├── borrower-autocomplete.tsx
│   ├── damage-report-modal.tsx
│   ├── edit-item-modal.tsx
│   ├── item-selector.tsx
│   └── navigation.tsx
├── lib/
│   ├── data.ts             # Constantes (facultades, programas, etc.)
│   ├── firebase.ts         # Configuración y funciones de Firebase
│   ├── types.ts            # Tipos TypeScript
│   ├── constants.ts        # Constantes adicionales
│   └── utils.ts            # Utilidades
└── hooks/
    └── use-toast.ts        # Hook para notificaciones
```

## 🎯 Funcionalidades Principales

### 1. Registro de Usuarios (`/registro`)

- Formulario completo con validación
- Campos condicionales según estamento
- Validación de cédula única
- Prevención de doble envío
- Sin navigation bar

**Campos:**
- Tipo de documento
- Número de documento (cédula)
- Nombre completo
- Teléfono
- Email
- Estamento
- Sede
- Género
- Etnia
- Código estudiantil (solo estudiantes/egresados)
- Facultad (solo estudiantes/egresados)
- Programa (solo estudiantes/egresados)

### 2. Gestión de Inventario (`/inventory`)

- Agregar elementos deportivos
- Editar información de elementos
- Reportar daños
- Dar de baja elementos
- Búsqueda y filtrado por ubicación
- Contador de préstamos por elemento

### 3. Gestión de Préstamos (`/loans`)

- Crear nuevos préstamos
- Autocompletado de usuarios registrados
- Campos condicionales según estamento
- Búsqueda de préstamos activos
- Devolución de elementos
- Validaciones completas

### 4. Estadísticas Detalladas (`/statistics`)

- Resumen general
- Cards de préstamos por género
- Top 10 elementos más prestados
- Top 10 facultades más activas
- Top 10 programas más activos
- Tablas plegables de facultades y programas
- Tabla detallada de todos los elementos
- Reportes de daños
- Generación de PDF completo

### 5. Reportes (`/reports`)

- Estadísticas generales
- Préstamos por facultad
- Préstamos por género
- Préstamos recientes
- Estado del inventario

## 🔄 Flujo de Trabajo

### Flujo Completo de Préstamo

1. **Registrar Usuario** (si no existe)
   - Ir a `/registro`
   - Completar formulario
   - Hacer clic en "Registrarme"

2. **Crear Préstamo**
   - Ir a `/loans`
   - Hacer clic en "Nuevo Préstamo"
   - Escribir nombre, cédula o código del usuario
   - Seleccionar usuario del autocompletado
   - Completar campos adicionales si es necesario
   - Seleccionar elemento a prestar
   - Hacer clic en "Registrar Préstamo"

3. **Devolver Elemento**
   - Ir a `/loans`
   - Buscar el préstamo activo
   - Hacer clic en "Devolver"
   - Confirmar devolución

4. **Ver Estadísticas**
   - Ir a `/statistics`
   - Explorar las diferentes métricas
   - Generar reporte PDF si es necesario

## 📊 Colecciones de Firestore

### `users`
```javascript
{
  tipoDocumento: string,
  cedula: string,
  nombre: string,
  codigoEstudiantil?: string,
  facultad?: string,
  programa?: string,
  genero: string,
  etnia: string,
  sede: string,
  estamento: string,
  telefono: string,
  email: string,
  createdAt: Timestamp
}
```

### `loans`
```javascript
{
  borrowerName: string,
  borrowerDocument: string,
  borrowerPhone: string,
  borrowerEmail: string,
  borrowerCode?: string,
  facultad?: string,
  programa?: string,
  genero: string,
  etnia: string,
  sede: string,
  estamento: string,
  itemId: string,
  itemName: string,
  itemSerialNumber: string,
  loanDate: Timestamp,
  returnDate?: Timestamp,
  status: "active" | "returned",
  createdAt: Timestamp
}
```

### `inventory`
```javascript
{
  name: string,
  serialNumber: string,
  description?: string,
  status: "available" | "loaned" | "removed",
  location?: "Auditorio 5" | "Bodega",
  createdAt: Timestamp,
  loanCount: number
}
```

### `damageReports`
```javascript
{
  itemId: string,
  itemName: string,
  itemSerialNumber: string,
  reportDate: Timestamp,
  reportedBy: string,
  damageDescription: string,
  severity: "low" | "medium" | "high",
  status: "pending" | "resolved"
}
```

## 🎨 Paleta de Colores

- **Azul Principal:** `blue-600` (#2563eb)
- **Azul Hover:** `blue-700` (#1d4ed8)
- **Azul Claro:** `blue-800` (#1e40af)
- **Fondo:** `from-blue-50 to-blue-100`
- **Bordes:** `blue-200`

## ⚠️ Notas Importantes

1. **Cédula única:** No se pueden registrar dos usuarios con la misma cédula
2. **Campos condicionales:** Código, facultad y programa solo son requeridos para estudiantes y egresados
3. **Autocompletado:** Busca en usuarios registrados por nombre, cédula o código
4. **Historial:** Los préstamos y reportes de daños no se pueden eliminar para mantener el historial
5. **Validaciones:** Todos los formularios tienen validaciones completas
6. **Prevención de doble clic:** Los botones de envío se deshabilitan después del primer clic

## 🐛 Solución de Problemas

### Error de conexión a Firebase

1. Verifica que las credenciales en `lib/firebase.ts` sean correctas
2. Asegúrate de que las reglas de Firestore estén configuradas
3. Verifica que el proyecto de Firebase esté activo

### No aparecen sugerencias en el autocompletado

1. Verifica que haya usuarios registrados en la colección `users`
2. Escribe al menos 3 caracteres para activar la búsqueda
3. Verifica la conexión a Firebase

### Error al crear préstamo

1. Verifica que el elemento esté disponible
2. Asegúrate de completar todos los campos obligatorios
3. Para estudiantes/egresados, verifica que código, facultad y programa estén completos

## 📞 Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.

## 📄 Licencia

Este proyecto es propiedad de la Universidad del Valle.
