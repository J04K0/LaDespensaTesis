# Imagen base oficial para node 20.15.1
FROM node:20.15.1 AS base

# Crear directorios de trabajo para el frontend y el backend
WORKDIR /app

# Establece el directorio de trabajo para el frontend
FROM base AS frontend
WORKDIR /app/frontend

# Copia los archivos package del frontend y instala las dependencias
COPY frontend/package*.json ./
RUN npm install

# Copiar el código fuente del frontend
COPY frontend ./

# Establecer el directorio de trabajo para el backend
FROM base AS backend
WORKDIR /app/backend

# Copiar los archivos package del backend e instalar las dependencias
COPY backend/package*.json ./
RUN npm install

# Copiar el código fuente del backend
COPY backend ./

# Puertos
EXPOSE 5000
EXPOSE 5173

# Comando por defecto para el contenedor
CMD ["sh", "-c", "cd /app/frontend && npm run dev -- --host 0.0.0.0 & cd /app/backend && npm run dev"]
