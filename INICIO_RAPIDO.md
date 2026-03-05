# 🚀 Inicio Rápido - Sistema de Inventario Deportivo

## ⚡ Instalación en 3 Pasos

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Firebase
Las credenciales ya están configuradas en el código. Solo necesitas:

1. Ir a https://console.firebase.google.com
2. Abrir el proyecto "stock-cdu"
3. Ir a Firestore Database > Reglas
4. Copiar el contenido del archivo `firestore.rules`
5. Pegar y publicar

### 3. Ejecutar
```bash
npm run dev
```

Abre http://localhost:3000

---

## 🎯 Flujo de Uso Rápido

### Registrar Usuario
1. Ve a http://localhost:3000/registro
2. Completa los 4 pasos del formulario
3. Verás mensaje de éxito

### Crear Préstamo
1. Ve a http://localhost:3000/loans
2. Clic en "Nuevo Préstamo"
3. Escribe nombre o cédula del usuario
4. Selecciona del autocompletado
5. Selecciona elemento
6. Registra

### Ver Estadísticas
1. Ve a http://localhost:3000/statistics
2. Explora las métricas
3. Clic en tablas para expandir
4. Genera PDF si necesitas

---

## 📱 Páginas Disponibles

- `/` - Página principal
- `/registro` - Registro de usuarios (sin navbar)
- `/inventory` - Gestión de inventario
- `/loans` - Gestión de préstamos
- `/reports` - Reportes generales
- `/statistics` - Estadísticas detalladas

---

## ✅ Características Principales

### Registro con Stepper
- 4 pasos con validación
- Campos condicionales
- Pantalla de éxito
- Sin redirección

### Préstamos
- Autocompletado inteligente
- Todos los campos nuevos
- Validaciones completas

### Estadísticas
- Cards de género
- Top 10 facultades
- Top 10 programas
- Tablas plegables
- Generación de PDF

---

## 🎨 Colores del Sistema

- **Azul Principal:** #2563eb
- **Azul Hover:** #1d4ed8
- **Fondo:** Degradado azul claro

---

## 📊 Datos Incluidos

- 10 Facultades
- 200+ Programas académicos
- 12 Sedes
- 7 Estamentos
- 8 Etnias
- 3 Géneros

---

## ⚠️ Importante

1. **Cédula única:** No se pueden duplicar
2. **Campos condicionales:** Código, facultad y programa solo para estudiantes/egresados
3. **Sin redirección:** El registro muestra mensaje de éxito sin redirigir
4. **Autocompletado:** Requiere mínimo 3 caracteres

---

## 🐛 Solución Rápida de Problemas

### No aparecen sugerencias
- Verifica que haya usuarios registrados
- Escribe al menos 3 caracteres

### Error al crear préstamo
- Completa todos los campos obligatorios
- Para estudiantes: código, facultad y programa son obligatorios

### Error de Firebase
- Verifica las reglas de Firestore
- Revisa la configuración en `lib/firebase.ts`

---

## 📞 Soporte

Revisa los archivos de documentación:
- `RESUMEN_FINAL.md` - Resumen completo
- `INSTRUCCIONES.md` - Guía detallada
- `CAMBIOS_REALIZADOS.md` - Lista de cambios

---

## 🎉 ¡Listo para Usar!

El sistema está completamente funcional y listo para producción.

**Disfruta del Sistema de Inventario Deportivo!** 🏃‍♂️⚽🏀
