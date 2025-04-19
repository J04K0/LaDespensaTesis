# La Despensa - Sistema de Gestión para Almacenes

![Logo de La Despensa](/frontend/public/LaDespensaLogo.png)

## Descripción

La Despensa es un sistema completo de gestión para almacenes y tiendas minoristas que permite administrar inventario, ventas, proveedores, finanzas, cuentas por pagar y gestión de deudores. Diseñado específicamente para satisfacer las necesidades de pequeños y medianos negocios del sector retail.

## Funcionalidades Principales

### Gestión de Productos
- Registro completo de productos con datos detallados (nombre, código de barras, categoría, precio, stock, imagen)
- Historial de precios que permite seguimiento de cambios a lo largo del tiempo
- Gestión de imágenes para cada producto con soporte para carga y almacenamiento
- Categorización con sistema flexible de clasificación por tipos de productos
- Búsqueda avanzada por nombre, código de barras, categoría o disponibilidad
- Alertas automáticas para productos con bajo stock según niveles predefinidos
- Monitoreo de fechas de vencimiento con notificaciones para productos próximos a vencer
- Listado de productos vencidos para facilitar su identificación y retirada
- Actualización automática de inventario después de cada venta
- Verificación de stock en tiempo real con indicadores visuales de disponibilidad
- Sistema de escaneo por código de barras para identificación rápida

### Ventas
- Terminal punto de venta (TPV) con interface intuitiva
- Generación automática de tickets con numeración secuencial (formato TK-XXXXXX)
- Descuento automático de inventario tras cada venta
- Proceso simplificado de selección de productos por código o escaneo
- Cálculo automático de totales incluyendo descuentos e impuestos
- Registro detallado de todas las transacciones realizadas
- Agrupación de ventas por ticket para fácil seguimiento
- Capacidad de edición y eliminación de tickets completos
- Visualización cronológica con ordenamiento por fecha y hora
- Búsqueda avanzada de ventas por fecha, producto o número de ticket
- Exportación a PDF de reportes diarios, semanales y mensuales
- Generación de estadísticas de productos más vendidos

### Gestión de Deudores
- Registro completo de clientes con deudas pendientes (nombre, teléfono, dirección, monto)
- Seguimiento detallado de pagos parciales con actualización automática del saldo
- Historial cronológico de todos los pagos realizados por cliente
- Sistema de recordatorios basado en fechas comprometidas
- Categorización de deudas por antigüedad y monto
- Panel de control con visualización general e individual de deudores
- Filtros avanzados por nombre, monto y antigüedad de deuda
- Indicadores visuales para deudas próximas a vencer o vencidas
- Edición y eliminación de registros de deudores

### Proveedores
- Catálogo completo de proveedores con datos detallados de contacto
- Relación directa entre productos y proveedores que los suministran
- Visualización de todos los productos asociados a cada proveedor
- Facilidad para agregar o quitar productos vinculados a un proveedor
- Búsqueda de productos por proveedor para facilitar los pedidos
- Panel de control con visualización de todos los proveedores
- Edición y actualización de la información de cada proveedor
- Eliminación segura con verificación previa
- Paginación y búsqueda para mejor gestión de grandes catálogos

### Estadísticas y Finanzas
- Panel de indicadores clave con métricas principales del negocio
- Gráficos interactivos para visualización de ventas, stock y finanzas
- Comparativas de períodos para análisis de crecimiento o tendencias
- Indicadores de rentabilidad por producto y categoría
- Cálculo de ganancias basado en costo vs. precio de venta
- Seguimiento de gastos categorizados por tipo
- Balance de ingresos y egresos con visualización clara
- Proyecciones basadas en datos históricos
- Exportación a múltiples formatos (PDF) para análisis externos
- Reportes personalizables por período, categoría o producto

### Cuentas por Pagar
- Creación detallada de cuentas por pagar (nombre, identificador, monto, categoría)
- Organización por meses con visualización en formato de tabla anual
- Categorización personalizable (Luz, Agua, Gas, Internet, Alquiler, Impuestos, etc.)
- Control de estados (Pendiente, Pagado) con actualización inmediata
- Marcado rápido de cuentas como pagadas con un solo clic
- Posibilidad de desmarcar cuentas pagadas si es necesario
- Visualización mensual para mejor organización y planificación
- Edición y actualización de cualquier aspecto de las cuentas registradas
- Filtros avanzados por nombre, categoría, estado y año
- Búsqueda rápida por nombre o identificador fiscal
- Exportación a PDF con generación automática de reportes detallados
- Paginación inteligente para manejo eficiente de grandes volúmenes de cuentas

## Tecnologías Utilizadas

### Frontend
- **React**: Biblioteca principal para la interfaz de usuario
- **React Router**: Navegación entre componentes
- **Chart.js**: Visualización de datos y estadísticas
- **FontAwesome**: Iconografía
- **CSS personalizado**: Estilos específicos para cada componente
- **Axios**: Cliente HTTP para comunicación con el backend
- **jsPDF & xlsx**: Generación de reportes en PDF y Excel
- **SweetAlert**: Notificaciones interactivas

### Backend
- **Node.js**: Entorno de ejecución
- **Express**: Framework para API RESTful
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: ODM para modelado de datos
- **JWT**: Autenticación basada en tokens
- **Multer**: Gestión de carga de archivos
- **Express-validator**: Validación de datos en el backend

## Arquitectura del Sistema

El proyecto sigue una arquitectura cliente-servidor con separación clara entre:

- **Frontend**: Aplicación React que maneja toda la interfaz de usuario
- **Backend**: API RESTful desarrollada con Node.js y Express que gestiona la lógica de negocio y el acceso a datos
- **Base de datos**: MongoDB para almacenamiento de datos

## Requisitos del Sistema

- Node.js (v14.x o superior)
- MongoDB (v4.x o superior)
- NPM (v6.x o superior)
- Espacio en disco: Mínimo 500MB (sin contar la base de datos)
- Memoria RAM: Mínimo 2GB recomendado

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
PORT=4000
MONGODB_URI=mongodb://localhost:27017/ladespensa
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
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

### Configuración para Producción

1. Construir la aplicación frontend:
```bash
cd frontend
npm run start
```

2. Configurar el backend para servir los archivos estáticos:
   - Los archivos generados en `frontend/dist` deben ser accesibles desde el backend
   - Asegurarse de configurar correctamente las variables de entorno para producción

3. Iniciar el servidor en modo producción:
```bash
cd backend
npm start
```

## Estructura del Proyecto

```
LaDespensaTesis/
├── backend/                 # Código del servidor
│   ├── src/
│   │   ├── config/          # Configuración de la base de datos y variables
│   │   ├── controllers/     # Controladores de la API
│   │   ├── middlewares/     # Middlewares de autenticación y autorización
│   │   ├── models/          # Modelos de datos (Mongoose)
│   │   ├── routes/          # Rutas de la API
│   │   ├── schema/          # Esquemas de validación
│   │   ├── services/        # Servicios de negocio
│   │   └── utils/           # Utilidades generales
│   └── package.json
│
└── frontend/                # Código del cliente
    ├── public/              # Archivos estáticos
    ├── src/
    │   ├── assets/          # Recursos (imágenes, etc.)
    │   ├── components/      # Componentes reutilizables
    │   ├── context/         # Contextos de React
    │   ├── helpers/         # Funciones auxiliares
    │   ├── routes/          # Configuración de rutas
    │   ├── services/        # Servicios para comunicación con API
    │   ├── styles/          # Archivos CSS
    │   └── Views/           # Componentes principales/páginas
    └── package.json
```

## Seguridad

El sistema implementa diversas medidas de seguridad:

- Autenticación mediante JWT
- Autorización basada en roles
- Validación de datos en cliente y servidor
- Protección contra ataques CSRF y XSS
- Uso de HTTPS para comunicaciones seguras (en producción)

---

Desarrollado por Joaco y Pablo © 2025