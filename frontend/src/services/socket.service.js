import { io } from 'socket.io-client';
import { showSuccessAlert } from '../helpers/swaHelper';

let socket = null;
let isConnecting = false;

export const initializeSocket = () => {
  // Si ya existe una conexión activa, devolverla
  if (socket && socket.connected) {
    return socket;
  }

  // Si ya se está conectando, esperar a que termine
  if (isConnecting) {
    return socket;
  }

  // Evitar múltiples intentos de conexión simultáneos
  isConnecting = true;

  // Determinar la URL base del servidor
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    
  // Crear la conexión WebSocket con configuración mejorada
  socket = io(baseUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    upgrade: true,
    forceNew: false
  });
  
  socket.on('connect', () => {
    isConnecting = false;
    console.log('Conectado al servidor de alertas');
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Desconectado del servidor de alertas:', reason);
    // Solo marcar como no conectando si es una desconexión permanente
    if (reason === 'io client disconnect') {
      isConnecting = false;
    }
  });
  
  socket.on('connect_error', (error) => {
    isConnecting = false;
    console.error('Error de conexión WebSocket:', error.message);
  });
  
  socket.on('error', (error) => {
    console.error('Error en la conexión WebSocket:', error);
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    return initializeSocket();
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    isConnecting = false;
    socket.disconnect();
    socket = null;
  }
};

// Función para verificar si el socket está conectado
export const isSocketConnected = () => {
  return socket && socket.connected;
};