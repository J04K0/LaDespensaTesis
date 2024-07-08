# Official base image for node 20.X.X
FROM node:20

# Set the working directory for backend
WORKDIR /app/backend

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend .

# Set the working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY frontend .

# Build frontend
RUN npm run build

# Set the working directory back to backend
WORKDIR /app/backend

# Expose the application port
EXPOSE 3000

# Command to run the backend
CMD ["npm", "start"]