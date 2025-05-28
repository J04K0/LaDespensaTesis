import { io } from 'socket.io-client';
import { showSuccessAlert } from '../helpers/swaHelper';

let socket;

export const initializeSocket = () => {
  // Usar la URL base desde donde se sirve el frontend para conectar al mismo servidor
  const baseUrl = window.location.origin.includes('localhost') 
    ? 'http://localhost:4000' 
    : window.location.origin;
    
  // Crear la conexión WebSocket
  socket = io(baseUrl);
  
  socket.on('connect', () => {
    console.log('Conectado al servidor de alertas');
  });
  
  socket.on('disconnect', () => {
    console.log('Desconectado del servidor de alertas');
  });
  
  socket.on('error', (error) => {
    console.error('Error en la conexión WebSocket:', error);
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};