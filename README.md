# La Despensa - Sistema de Gestión para Almacenes

![Logo de La Despensa](/frontend/public/LaDespensaLogo.png)

## Descripción

La Despensa es un sistema completo de gestión para almacenes que permite administrar inventario, ventas, proveedores, finanzas, cuentas por pagar y gestión de deudores. Diseñado específicamente para satisfacer las necesidades de pequeños y medianos negocios con características avanzadas de análisis financiero y notificaciones en tiempo real.

## Funcionalidades Principales

### 🏠 Dashboard Principal
- **Panel de control unificado** con métricas principales del negocio
- **Estadísticas en tiempo real** de ventas, productos y deudores
- **Gráficos interactivos** con navegación entre diferentes períodos y tipos de datos
- **Resumen de deudores** con vista rápida de estado de pagos
- **Filtros temporales** (última semana, mes, año, todo el tiempo)
- **Descarga de reportes completos** en PDF con todos los gráficos
- **Indicadores visuales** de rendimiento y tendencias

### 📦 Gestión Avanzada de Productos
- **Registro completo** con datos detallados (nombre, código de barras, categoría, precio, stock, imagen)
- **Gestión de lotes** con fechas de vencimiento individuales por lote
- **Historial de precios** con seguimiento de cambios a lo largo del tiempo
- **Historial de stock** con registro de movimientos (ventas, agregados, ajustes)
- **Gestión de imágenes** para cada producto con carga y almacenamiento optimizado
- **Sistema de categorización** flexible con 15+ categorías predefinidas
- **Búsqueda avanzada** por nombre, código de barras, categoría o disponibilidad
- **Filtros inteligentes** por stock, categoría, fechas de vencimiento y estado
- **Alertas automáticas** para productos con bajo stock según niveles predefinidos
- **Monitoreo de fechas de vencimiento** con notificaciones para productos próximos a vencer
- **Listado de productos vencidos** y productos con poco stock
- **Modal de información detallada** con estadísticas de ventas, márgenes y valor de inventario
- **Edición en línea** con modal optimizado y vista previa de cambios
- **Gestión de productos desactivados** con posibilidad de reactivación
- **Cálculo automático de precios recomendados** basado en márgenes por categoría
- **Exportación a PDF** con filtros aplicados y datos completos
- **Vista de tabla y tarjetas** intercambiables para mejor visualización
- **Paginación inteligente** para manejo eficiente de grandes inventarios

### 🏪 Gestión de Inventario Avanzada
- **Modo dual**: Crear productos nuevos o agregar stock a productos existentes
- **Búsqueda inteligente** de productos para agregar stock
- **Validación automática** de códigos de barras únicos
- **Actualización de precios** con modal dedicado
- **Cálculo automático** de precios recomendados por categoría
- **Paginación en búsqueda** de productos existentes
- **Interfaz optimizada** con selección de modo de operación

### 🛒 Terminal de Ventas (ProductScanner)
- **Interfaz optimizada** para velocidad de uso en punto de venta
- **Escaneo por código de barras** para identificación rápida
- **Búsqueda inteligente** por nombre o código con sugerencias
- **Carrito de compras** dinámico con gestión de cantidades
- **Múltiples métodos de pago** (efectivo, tarjeta de crédito/débito)
- **Gestión de clientes deudores** integrada
- **Cálculo automático** de totales y cambio
- **Generación de tickets** con numeración secuencial
- **Descuento automático** de inventario tras cada venta
- **Validaciones en tiempo real** de stock y disponibilidad
- **Soporte para ventas a crédito** con registro automático en deudores
- **Creación rápida de productos** desde el punto de venta

### 📊 Historial de Ventas Completo
- **Visualización cronológica** con ordenamiento por fecha y hora
- **Búsqueda avanzada** por fecha, producto, método de pago o número de ticket
- **Filtrado por categorías** y métodos de pago
- **Sistema de devoluciones** parciales y completas con actualización automática
- **Anulación de ventas** completas con restauración de stock
- **Vista de ventas anuladas** separada para mejor control
- **Exportación a PDF** de reportes filtrados
- **Vista detallada** de cada ticket con productos vendidos
- **Paginación inteligente** para manejo eficiente de grandes volúmenes
- **Control de permisos** por roles de usuario
- **Estadísticas automáticas** de productos más vendidos

### 💰 Gestión Integral de Deudores
- **Registro completo** con datos de contacto y montos
- **Seguimiento detallado** de pagos parciales con actualización automática
- **Historial cronológico** completo de todas las transacciones
- **Sistema de comentarios** expandibles para cada transacción
- **Categorización automática** por estado de pago y antigüedad
- **Panel de control** con visualización general e individual
- **Filtros avanzados** por nombre, monto, estado y fechas
- **Indicadores visuales** para deudas próximas a vencer o vencidas
- **Métodos de pago múltiples** para registro de cobros
- **Estadísticas automáticas** con total de deuda, promedio y mayor deudor
- **Gestión de estados** (activo/inactivo) para deudores
- **Exportación a PDF** con datos completos y filtros aplicados
- **Paginación inteligente** para manejo eficiente
- **Control de permisos** por roles de usuario

### 🏢 Gestión Completa de Proveedores
- **Catálogo detallado** con información completa de contacto
- **Vinculación inteligente** entre productos y proveedores
- **Visualización de productos** asociados con imágenes en miniatura
- **Gestión dinámica** para agregar o quitar productos vinculados
- **Modal de selección** múltiple de productos con búsqueda
- **Panel de control** con visualización de proveedores activos/inactivos
- **Sistema de estados** para gestión de proveedores
- **Edición completa** de información de contacto y datos comerciales
- **Categorización automática** basada en productos suministrados
- **Filtros avanzados** por nombre, categoría, estado y productos
- **Exportación a PDF** con listado completo
- **Paginación inteligente** para catálogos grandes
- **Vista previa** de productos asociados en la tabla principal

### 📈 Dashboard Financiero Avanzado
- **Panel de indicadores clave** con métricas en tiempo real
- **Navegación por secciones**: General, Ingresos, Productos, Rentabilidad
- **Gráficos interactivos** con capacidad de alternar entre tabla y gráfico
- **Análisis por períodos** (semana, mes, año, personalizado)
- **Indicadores de rentabilidad** por producto y categoría
- **Cálculo automático** de ganancias y márgenes
- **Seguimiento de gastos** categorizados
- **Balance completo** de ingresos vs costos
- **Filtros temporales** avanzados con fechas específicas
- **Tooltips informativos** que explican cada métrica
- **Análisis de productos** más vendidos y de lenta rotación
- **Comparativas financieras** visuales
- **Análisis de inventario** por categoría con porcentajes
- **Paginación inteligente** para datos temporales
- **Exportación completa** a PDF con reportes profesionales

### 💳 Cuentas por Pagar
- **Creación detallada** con vinculación a proveedores existentes
- **Organización anual** con vista de tabla por meses
- **Categorización personalizable** (servicios, impuestos, etc.)
- **Control de estados** (Pendiente, Pagado) con actualización inmediata
- **Edición granular** por mes o datos generales del proveedor
- **Visualización mensual** para planificación financiera
- **Filtros avanzados** por nombre, categoría, estado y año
- **Búsqueda rápida** por nombre o identificador
- **Resumen automático** mensual con totales y estadísticas
- **Autocompletado** de proveedores existentes
- **Exportación a PDF** con reportes detallados
- **Paginación inteligente** para grandes volúmenes
- **Control de permisos** por roles de usuario

### 📄 Sistema de Reportes y Exportación
- **Servicio centralizado** de exportación con múltiples formatos
- **Reportes en PDF** con diseño profesional y branding
- **Tipos de reportes disponibles**:
  - Reporte de productos con filtros aplicados
  - Reporte de proveedores con datos completos
  - Reporte de deudores con estados de cuenta
  - Reporte de historial de ventas con análisis detallado
  - Reporte financiero completo con gráficos
  - Reportes de cuentas por pagar
- **Generación automática** con metadatos completos
- **Personalización** de períodos y filtros
- **Tablas formateadas** con autoTable para presentación profesional

### 🔔 Sistema de Notificaciones
- **Integración con servicios de email** para alertas importantes
- **Notificaciones de stock bajo** y productos vencidos
- **Alertas de fechas de vencimiento** próximas

### 🎨 Experiencia de Usuario Optimizada
- **Componentes Skeleton** para mejor percepción de carga
- **Modales optimizados** con gestión de scroll y accesibilidad
- **Animaciones suaves** y transiciones optimizadas
- **Diseño responsivo** adaptado a diferentes dispositivos
- **Sistema de temas** consistente con variables CSS
- **Iconografía consistente** con FontAwesome
- **Feedback visual** inmediato para todas las acciones
- **Validaciones en tiempo real** con mensajes claros
- **Estados de carga** visibles en operaciones asíncronas
- **Navegación intuitiva** con breadcrumbs y controles optimizados
- **Paginación inteligente** reutilizable (SmartPagination)
- **Control de permisos** por roles en toda la aplicación

### 🔧 Características Técnicas Avanzadas
- **Context API** para gestión de estado de ventas
- **Hooks personalizados** para operaciones comunes (useRole)
- **Componentes reutilizables** (SmartPagination, Skeleton components)
- **Lazy loading** de componentes pesados
- **Gestión de estado** eficiente con React hooks
- **Validación de datos** en frontend y backend
- **Manejo de errores** robusto con SweetAlert2
- **Autenticación JWT** con roles y permisos
- **Middleware de autorización** por roles
- **Optimización de imágenes** automática
- **Control de scroll** avanzado en modales
- **Persistencia de estado** en navegación

## Tecnologías Utilizadas

### Frontend
- **React 18** con hooks modernos y context API
- **React Router v6** con navegación optimizada
- **Vite** como herramienta de desarrollo y construcción
- **Axios** para comunicación HTTP
- **FontAwesome** para iconografía completa
- **SweetAlert2** para notificaciones y confirmaciones
- **jsPDF & AutoTable** para generación de reportes PDF
- **CSS personalizado** con variables y diseño responsivo

### Backend
- **Node.js** con Express framework
- **MongoDB** con Mongoose ODM
- **JWT** para autenticación y autorización
- **Multer** para manejo de archivos e imágenes
- **Express-validator** para validación de datos
- **Nodemailer** para servicios de email
- **Dotenv** para variables de entorno

## Arquitectura del Sistema

### Frontend (SPA - Single Page Application)
- **Aplicación React** con componentes modulares y reutilizables
- **Estado global** gestionado con Context API
- **Routing** dinámico con protección de rutas por roles
- **Componentes Skeleton** para mejor UX durante cargas
- **Sistema de permisos** integrado en toda la aplicación

### Backend (API RESTful)
- **API RESTful** con Express y middleware personalizado
- **Autenticación JWT** con diferentes roles (empleado, jefe, admin)
- **Validación robusta** con schemas específicos
- **Servicios especializados** para emails, alertas y exportación
- **Gestión de archivos** optimizada

### Base de Datos
- **MongoDB** con esquemas optimizados
- **Modelos principales**: Products, Venta, Deudores, Proveedores, CuentasPorPagar, User
- **Validaciones** a nivel de esquema con Mongoose

## Roles y Permisos

### Empleado
- **Acceso de solo lectura** a la mayoría de funcionalidades
- **Puede realizar ventas** en ProductScanner
- **Puede consultar** productos, proveedores, deudores
- **No puede crear, editar o eliminar** registros principales

### Jefe
- **Acceso completo** a todas las funcionalidades
- **Puede gestionar** productos, ventas, deudores
- **Acceso a reportes** y análisis financieros
- **Gestión de proveedores** y cuentas por pagar

### Admin
- **Acceso total** del sistema
- **Gestión de usuarios** y roles
- **Configuración** del sistema
- **Todas las funcionalidades** disponibles

## Requisitos del Sistema

### Desarrollo
- Node.js (v16.x o superior)
- MongoDB (v5.x o superior)
- NPM (v8.x o superior)

### Producción
- Node.js (v16.x o superior)
- MongoDB Atlas o MongoDB (v5.x o superior)
- Espacio en disco: Mínimo 1GB
- Memoria RAM: Mínimo 4GB recomendado
- Procesador: Dual-core mínimo

## Instalación y Despliegue

### Paso 1: Configuración del Backend

1. Clonar el repositorio:
```bash
git clone https://github.com/usuario/LaDespensaTesis.git
cd LaDespensaTesis
```

2. Instalar dependencias del backend:
```bash
cd backend
npm install
```

3. Configurar variables de entorno:
   - Crear un archivo `.env` en la carpeta `backend` con las siguientes variables:
   ```
   HOST=localhost
   PORT=4000
   DB_URL=mongodb://localhost:27017/ladespensa
   ACCESS_JWT_SECRET=tu_secret_key_para_access_token
   REFRESH_JWT_SECRET=tu_secret_key_para_refresh_token
   EMAIL_USER=tu_email@gmail.com
   EMAIL_APP_PASSWORD=tu_contraseña_de_aplicacion
   ```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

### Paso 2: Configuración del Frontend

1. Instalar dependencias del frontend:
```bash
cd ../frontend
npm install
```

2. Iniciar la aplicación de React:
```bash
npm run dev
```

3. Acceder a la aplicación en su navegador:
```
http://localhost:5173
```

## Estructura del Proyecto

```
LaDespensaTesis/
├── backend/                 # Código del servidor
│   ├── src/
│   │   ├── config/          # Configuración de DB y variables
│   │   ├── controllers/     # Controladores de la API REST
│   │   ├── middlewares/     # Middlewares de autenticación y autorización
│   │   ├── models/          # Modelos de datos (Mongoose)
│   │   ├── routes/          # Rutas de la API REST
│   │   ├── schema/          # Esquemas de validación
│   │   ├── services/        # Servicios de negocio
│   │   └── utils/           # Utilidades generales
│   └── package.json
│
└── frontend/                # Código del cliente
    ├── src/
    │   ├── components/      # Componentes reutilizables
    │   │   ├── Skeleton/    # Componentes de carga
    │   │   └── Modals/      # Modales especializados
    │   ├── context/         # Contextos de React
    │   ├── helpers/         # Funciones auxiliares
    │   ├── hooks/           # Hooks personalizados
    │   ├── services/        # Servicios para comunicación con API
    │   ├── styles/          # Archivos CSS organizados
    │   └── Views/           # Componentes principales/páginas
    │       ├── Home.jsx
    │       ├── Products.jsx
    │       ├── AddProducts.jsx
    │       ├── ProductScanner.jsx
    │       ├── HistorySale.jsx
    │       ├── Deudores.jsx
    │       ├── Proveedores.jsx
    │       ├── CuentasPorPagar.jsx
    │       └── Finanzas.jsx
    └── package.json
```

## Seguridad Implementada

- **Autenticación JWT** con tokens de acceso y refresh
- **Autorización basada en roles** con middleware personalizado
- **Validación de datos** robusta en cliente y servidor
- **Sanitización de inputs** para prevenir inyecciones
- **Protección CORS** configurada específicamente
- **Encriptación de contraseñas** con bcrypt
- **Gestión segura** de variables de entorno
- **Validación de archivos** subidos al servidor
- **Control de acceso** por roles en toda la aplicación

## Rendimiento y Optimización

- **Lazy loading** de componentes pesados
- **Memoización** de componentes con React.memo
- **Context API optimizado** con providers específicos
- **Skeleton components** para mejor UX durante cargas
- **Compresión de imágenes** automática
- **Optimización de queries** MongoDB con índices
- **Paginación inteligente** en todas las vistas
- **Bundle optimization** con Vite

---

**Desarrollado por:** @J04K0 y @PabloCastilloFer © 2025

**Tecnologías principales:** React 18, Node.js, Express, MongoDB, JWT

**Licencia:** MIT - Consulta el archivo LICENSE para más detalles
