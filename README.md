# La Despensa - Sistema de Gestión para Almacenes

![Logo de La Despensa](/frontend/public/LaDespensaLogo.png)

## Descripción

La Despensa es un sistema completo de gestión para almacenes y tiendas minoristas que permite administrar inventario, ventas, proveedores, finanzas, cuentas por pagar y gestión de deudores. Diseñado específicamente para satisfacer las necesidades de pequeños y medianos negocios del sector retail con características avanzadas de análisis financiero y notificaciones en tiempo real.

## Funcionalidades Principales

### 🏠 Dashboard Principal
- **Panel de control unificado** con métricas principales del negocio
- **Estadísticas en tiempo real** de ventas, productos y deudores
- **Gráficos interactivos** con navegación entre diferentes períodos
- **Resumen de deudores** con vista rápida de estado de pagos
- **Generación de reportes** completos con descarga en PDF
- **Indicadores visuales** de rendimiento y tendencias

### 📦 Gestión Avanzada de Productos
- **Registro completo** con datos detallados (nombre, código de barras, categoría, precio, stock, imagen)
- **Historial de precios** que permite seguimiento de cambios a lo largo del tiempo
- **Gestión de imágenes** para cada producto con soporte para carga y almacenamiento
- **Sistema de categorización** flexible con 15+ categorías predefinidas
- **Búsqueda avanzada** por nombre, código de barras, categoría o disponibilidad
- **Filtros inteligentes** por stock, categoría, fecha de vencimiento y más
- **Alertas automáticas** para productos con bajo stock según niveles predefinidos por categoría
- **Monitoreo de fechas de vencimiento** con notificaciones para productos próximos a vencer
- **Listado de productos vencidos** para facilitar su identificación y retirada
- **Modal de información detallada** con estadísticas de ventas, margen de ganancia y valor de inventario
- **Edición en línea** con modal optimizado y vista previa de cambios
- **Cálculo automático de precios recomendados** basado en márgenes por categoría
- **Exportación a PDF** con filtros aplicados y datos completos
- **Sistema de skeleton loading** para mejor experiencia de usuario

### 🛒 Terminal de Ventas (TPV) Avanzado
- **Interface intuitiva** optimizada para velocidad de uso
- **Escaneo por código de barras** para identificación rápida de productos
- **Búsqueda inteligente** por nombre o código con sugerencias automáticas
- **Carrito de compras** dinámico con gestión de cantidades en tiempo real
- **Múltiples métodos de pago** (efectivo, tarjeta de crédito/débito)
- **Gestión de clientes deudores** integrada con creación rápida
- **Cálculo automático** de totales, impuestos y cambio
- **Generación automática de tickets** con numeración secuencial (formato TK-XXXXXX)
- **Descuento automático de inventario** tras cada venta
- **Validaciones en tiempo real** de stock y disponibilidad
- **Alertas inteligentes** para productos vencidos o con stock bajo durante la venta
- **Soporte para ventas a crédito** con registro automático en deudores

### 📊 Historial de Ventas Completo
- **Visualización cronológica** con ordenamiento por fecha y hora
- **Búsqueda avanzada** por fecha, producto, método de pago o número de ticket
- **Filtrado por categorías** de productos para análisis detallado
- **Sistema de devoluciones** parciales o completas con actualización automática de inventario
- **Cálculo automático** del importe a devolver en devoluciones parciales
- **Anulación de ventas** completas con restauración de stock
- **Exportación a PDF y Excel** de reportes de ventas con filtros aplicados
- **Vista detallada** de cada ticket con productos vendidos
- **Paginación inteligente** para manejo eficiente de grandes volúmenes
- **Estadísticas automáticas** de productos más vendidos por período

### 💰 Gestión Integral de Deudores
- **Registro completo** de clientes con deudas pendientes (nombre, teléfono, dirección, monto)
- **Seguimiento detallado** de pagos parciales con actualización automática del saldo
- **Historial cronológico** completo de todas las transacciones por cliente
- **Sistema de recordatorios** basado en fechas comprometidas de pago
- **Categorización automática** de deudas por antigüedad y monto
- **Panel de control** con visualización general e individual de deudores
- **Filtros avanzados** por nombre, monto, estado de pago y antigüedad de deuda
- **Indicadores visuales** para deudas próximas a vencer, vencidas o al día
- **Sistema de comentarios** expandibles para cada transacción en el historial
- **Métodos de pago múltiples** (efectivo, tarjeta) para registro de cobros
- **Estadísticas automáticas** del mayor deudor, deuda promedio y totales
- **Interfaz intuitiva** para visualizar pagos y deudas con distinción visual clara
- **Exportación a PDF** con datos completos y filtros aplicados
- **Modales optimizados** para edición, historial y registro de pagos

### 🏢 Gestión Completa de Proveedores
- **Catálogo detallado** de proveedores con información completa de contacto
- **Vinculación inteligente** entre productos y proveedores que los suministran
- **Visualización de productos** asociados a cada proveedor con imágenes
- **Gestión dinámica** para agregar o quitar productos vinculados
- **Búsqueda de productos** por proveedor para facilitar pedidos y gestión
- **Panel de control** con visualización de todos los proveedores activos/inactivos
- **Sistema de estados** (activo/inactivo) para gestión de proveedores
- **Edición completa** de información de contacto y datos comerciales
- **Categorización automática** basada en productos suministrados
- **Filtros avanzados** por nombre, categoría, estado y productos
- **Exportación a PDF** con listado completo de proveedores
- **Paginación inteligente** para manejo eficiente de grandes catálogos
- **Modal de vinculación** de productos con búsqueda y selección múltiple

### 📈 Dashboard Financiero Avanzado
- **Panel de indicadores clave** con métricas principales del negocio en tiempo real
- **Gráficos interactivos** para visualización de ventas, stock y finanzas
- **Análisis por períodos** (semana, mes, año, personalizado) con comparativas
- **Indicadores de rentabilidad** por producto y categoría con código de colores
- **Cálculo automático** de ganancias basado en costo vs. precio de venta
- **Seguimiento de gastos** categorizados por tipo y período
- **Balance completo** de ingresos y egresos con visualización clara
- **Tarjetas de resumen** con métricas de ingresos, costos y transacciones
- **Filtros temporales** avanzados con selección específica de fechas
- **Tooltips informativos** que explican cada métrica y su interpretación
- **Secciones especializadas**:
  - **General**: Resumen financiero y métricas principales
  - **Ingresos**: Análisis detallado de ventas por día, categoría y tendencias
  - **Productos**: Productos más vendidos, categorías por volumen y análisis de inventario
  - **Rentabilidad**: Margen de ganancia por categoría y análisis de rendimiento
- **Vista de tabla/gráfico** intercambiable para cada sección
- **Análisis de inversión** por categoría con porcentajes y valores
- **Comparativa financiera** visual entre ingresos, costos y ganancias
- **Exportación completa a PDF** con reportes profesionales detallados

### 💳 Cuentas por Pagar
- **Creación detallada** de cuentas por pagar (nombre, identificador, monto, categoría)
- **Organización anual** con visualización en formato de tabla por meses
- **Categorización personalizable** (Luz, Agua, Gas, Internet, Alquiler, Impuestos, etc.)
- **Control de estados** (Pendiente, Pagado) con actualización inmediata
- **Marcado rápido** de cuentas como pagadas con un solo clic
- **Posibilidad de desmarcar** cuentas pagadas si es necesario
- **Visualización mensual** para mejor organización y planificación
- **Edición completa** de cualquier aspecto de las cuentas registradas
- **Filtros avanzados** por nombre, categoría, estado y año
- **Búsqueda rápida** por nombre o identificador fiscal
- **Resumen automático** por mes con totales y estadísticas
- **Exportación a PDF** con generación automática de reportes detallados
- **Paginación inteligente** para manejo eficiente de grandes volúmenes

### 🔔 Sistema de Notificaciones en Tiempo Real
- **Centro de notificaciones** integrado en la barra de navegación
- **WebSocket en tiempo real** para alertas instantáneas
- **Tipos de alertas**:
  - Stock bajo (productos por debajo del mínimo por categoría)
  - Productos vencidos (con fecha de vencimiento expirada)
  - Productos por vencer (próximos a la fecha de vencimiento)
  - Recordatorios de pagos de deudores
  - Alertas de cuentas por pagar
- **Notificaciones con sonido** para alertas críticas
- **Persistencia local** de notificaciones no leídas
- **Gestión completa** con marcar como leída y limpiar historial
- **Iconografía específica** para cada tipo de alerta
- **Contador visual** de notificaciones no leídas
- **Integración con email** para alertas importantes

### 📄 Sistema de Reportes y Exportación
- **Servicio centralizado** de exportación con múltiples formatos
- **Reportes en PDF** con diseño profesional y branding
- **Exportación a Excel** para análisis externos
- **Tipos de reportes**:
  - **Reporte de cierre de caja** diario automático
  - **Reporte financiero** con análisis completo por períodos
  - **Reporte de productos** con filtros aplicados
  - **Reporte de proveedores** con datos completos
  - **Reporte de deudores** con estados de cuenta
  - **Reporte de historial de ventas** con análisis detallado
- **Generación automática** al cerrar sesión
- **Personalización** de períodos y filtros en cada reporte
- **Tablas formateadas** con autoTable para mejor presentación
- **Metadatos completos** (fecha, usuario, período, filtros aplicados)

### 🎨 Experiencia de Usuario Optimizada
- **Componentes Skeleton** para mejor percepción de carga
- **Modales optimizados** con gestión de scroll y accesibilidad
- **Animaciones suaves** y transiciones optimizadas
- **Responsive design** adaptado a diferentes dispositivos
- **Sistema de temas** consistente con variables CSS
- **Iconografía consistente** con FontAwesome
- **Feedback visual** inmediato para todas las acciones
- **Validaciones en tiempo real** con mensajes claros
- **Estados de carga** visibles en todas las operaciones asíncronas
- **Navegación intuitiva** con breadcrumbs y menús contextuales

### 🔧 Características Técnicas Avanzadas
- **Context API optimizado** para gestión global de ventas
- **Hooks personalizados** para operaciones comunes
- **Memoización inteligente** para optimización de rendimiento
- **Lazy loading** de componentes pesados
- **Gestión de estado** eficiente con React hooks
- **Validación de datos** en frontend y backend
- **Manejo de errores** robusto con recuperación automática
- **Autenticación JWT** con tokens de acceso y refresco
- **Middleware de autorización** por roles
- **WebSocket integration** para tiempo real
- **Optimización de imágenes** automática
- **Cache inteligente** para datos frecuentemente accedidos

## Tecnologías Utilizadas

### Frontend
- **React 18**: Biblioteca principal con hooks y context API
- **React Router v6**: Navegación entre componentes con lazy loading
- **Vite**: Herramienta de construcción ultrarrápida y servidor de desarrollo
- **Axios**: Cliente HTTP optimizado para comunicación con el backend
- **FontAwesome**: Iconografía completa para interfaces intuitivas
- **SweetAlert2**: Notificaciones interactivas y diálogos de confirmación optimizados
- **Socket.io-client**: Cliente WebSocket para notificaciones en tiempo real
- **jsPDF & AutoTable**: Generación de reportes en PDF con tablas formateadas
- **XLSX**: Exportación de datos a formato Excel
- **date-fns**: Manejo optimizado de fechas y locales
- **CSS personalizado**: Estilos específicos con variables CSS y responsive design

### Backend
- **Node.js**: Entorno de ejecución con optimizaciones de rendimiento
- **Express**: Framework para API RESTful con middleware personalizado
- **MongoDB**: Base de datos NoSQL con agregaciones optimizadas
- **Mongoose**: ODM para modelado de datos con validaciones avanzadas
- **Socket.io**: WebSocket server para notificaciones en tiempo real
- **JWT**: Autenticación basada en tokens con refresh tokens
- **Multer**: Gestión de carga de archivos e imágenes optimizada
- **Nodemailer**: Servicio de emails para alertas importantes
- **Express-validator**: Validación de datos robusta en el backend
- **Dotenv**: Gestión segura de variables de entorno

## Arquitectura del Sistema

El proyecto implementa una arquitectura moderna cliente-servidor con las siguientes características:

### Frontend (SPA - Single Page Application)
- **Aplicación React** con componentes modulares y reutilizables
- **Estado global** gestionado con Context API y hooks personalizados
- **Routing** dinámico con React Router y code splitting
- **PWA ready** con service workers para cache offline
- **WebSocket client** para notificaciones en tiempo real

### Backend (API RESTful + WebSocket)
- **API RESTful** desarrollada con Node.js y Express
- **WebSocket server** para comunicación bidireccional en tiempo real
- **Middleware stack** personalizado para autenticación, autorización y validación
- **Servicios especializados** para emails, alertas y exportación
- **Gestión de archivos** optimizada con Multer

### Base de Datos
- **MongoDB** con esquemas optimizados para consultas frecuentes
- **Índices compuestos** para búsquedas rápidas
- **Agregaciones** para análisis financieros complejos
- **Validaciones a nivel de esquema** con Mongoose

### Comunicación en Tiempo Real
- **WebSocket connection** para alertas instantáneas
- **Event-driven architecture** para notificaciones
- **Fallback polling** para conexiones inestables

## Requisitos del Sistema

### Desarrollo
- Node.js (v16.x o superior)
- MongoDB (v5.x o superior)
- NPM (v8.x o superior)

### Producción
- Node.js (v16.x o superior)
- MongoDB Atlas o MongoDB (v5.x o superior)
- Espacio en disco: Mínimo 1GB (sin contar la base de datos)
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
│   │   ├── config/          # Configuración de la base de datos y variables
│   │   ├── controllers/     # Controladores de la API REST
│   │   ├── middlewares/     # Middlewares de autenticación y autorización
│   │   ├── models/          # Modelos de datos (Mongoose)
│   │   ├── routes/          # Rutas de la API REST
│   │   ├── schema/          # Esquemas de validación
│   │   ├── services/        # Servicios de negocio (emails, alertas, exportación)
│   │   └── utils/           # Utilidades generales
│   └── package.json
│
└── frontend/                # Código del cliente
    ├── public/              # Archivos estáticos
    ├── src/
    │   ├── assets/          # Recursos (imágenes, etc.)
    │   ├── components/      # Componentes reutilizables
    │   │   ├── Skeleton/    # Componentes de carga optimizados
    │   │   └── Footer/      # Componentes de layout
    │   ├── context/         # Contextos de React para estado global
    │   ├── helpers/         # Funciones auxiliares (SweetAlert, etc.)
    │   ├── hooks/           # Hooks personalizados
    │   ├── routes/          # Configuración de rutas
    │   ├── services/        # Servicios para comunicación con API
    │   ├── styles/          # Archivos CSS organizados por componente
    │   └── Views/           # Componentes principales/páginas
    └── package.json
```

## Seguridad Implementada

El sistema implementa múltiples capas de seguridad:

- **Autenticación JWT** con tokens de acceso y refresco
- **Autorización basada en roles** con middleware personalizado
- **Validación de datos** robusta en cliente y servidor
- **Sanitización de inputs** para prevenir inyecciones
- **Protección CORS** configurada específicamente
- **Rate limiting** para prevenir ataques de fuerza bruta
- **Encriptación de contraseñas** con bcrypt
- **Gestión segura** de variables de entorno
- **Validación de archivos** subidos al servidor
- **Escape de datos** para prevenir XSS

## Rendimiento y Optimización

- **Lazy loading** de componentes pesados
- **Memoización** de componentes con React.memo
- **Context API optimizado** con providers específicos
- **Skeleton components** para mejor UX durante cargas
- **Compresión de imágenes** automática en subida
- **Cache inteligente** para datos frecuentemente accedidos
- **Optimización de queries** de MongoDB con índices
- **Code splitting** automático con Vite
- **Bundle optimization** para reducir tamaño de archivos

---

**Desarrollado por:** @J04K0 y @PabloCastilloFer © 2025

**Tecnologías principales:** React 18, Node.js, Express, MongoDB, Socket.io, JWT

**Licencia:** MIT - Consulta el archivo LICENSE para más detalles
