// Servicio para gestionar las alertas en tiempo real
import { io } from '../server.js';
import cron from 'node-cron';

// Contador para generar IDs únicos
let alertIdCounter = 0;

// Cache para evitar notificaciones duplicadas recientes (solo para productos vencidos)
const recentExpirationAlerts = new Map();
const EXPIRATION_ALERT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 horas para alertas de vencimiento

// Tipos de alertas (solo los que necesitamos)
export const ALERT_TYPES = {
  STOCK_BAJO: 'stock_bajo',
  PRODUCTO_VENCIDO: 'producto_vencido',
  PRODUCTO_POR_VENCER: 'producto_por_vencer'
};

/**
 * Genera un ID único para las alertas
 * @returns {string} ID único
 */
const generateUniqueId = () => {
  alertIdCounter++;
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${timestamp}-${alertIdCounter}-${random}`;
};

// Funciones auxiliares para manejar alertas de vencimiento
const cleanOldExpirationAlerts = () => {
  const now = Date.now();
  for (const [key, alert] of recentExpirationAlerts.entries()) {
    if (now - alert.timestamp > EXPIRATION_ALERT_COOLDOWN) {
      recentExpirationAlerts.delete(key);
    }
  }
};

// Función para crear una clave única para las alertas de vencimiento
const createExpirationAlertKey = (data) => {
  return `expiration_${data._id || data.codigoBarras || data.Nombre}`;
};

// Verifica si una alerta de vencimiento reciente ya fue enviada
const isRecentExpirationAlert = (alertKey) => {
  cleanOldExpirationAlerts();
  return recentExpirationAlerts.has(alertKey);
};

// Función para emitir alertas directamente a través de Socket.io
const emitAlertDirect = (type, data, message) => {
  if (!io) {
    console.error('Socket.io no está inicializado');
    return null;
  }

  const alert = {
    id: generateUniqueId(),
    type,
    data,
    message,
    timestamp: new Date(),
    read: false,
    isGrouped: Array.isArray(data) && data.length > 1,
    // Añadir compatibilidad con el frontend
    tipo: type,
    datos: data,
    mensaje: message
  };

  console.log('🔔 Emitiendo alerta:', { type, message, dataCount: Array.isArray(data) ? data.length : 1 });
  io.emit('nueva_alerta', alert);
  return alert;
};

/**
 * Emite alerta de stock bajo (SOLO después de ventas)
 * @param {object|array} producto - Producto o array de productos con stock bajo
 */
export const emitStockBajoAlert = (producto) => {
  if (Array.isArray(producto)) {
    return producto.map(prod => {
      if (!prod || !prod.Nombre) {
        console.error('Error: Producto inválido o sin nombre', prod);
        return null;
      }
      return emitAlertDirect(
        ALERT_TYPES.STOCK_BAJO,
        prod,
        `Stock bajo: ${prod.Nombre} (${prod.Stock} unidades)`
      );
    }).filter(alert => alert !== null);
  }
  
  if (!producto || !producto.Nombre) {
    console.error('Error: Producto inválido o sin nombre', producto);
    return null;
  }
  
  return emitAlertDirect(
    ALERT_TYPES.STOCK_BAJO,
    producto,
    `Stock bajo: ${producto.Nombre} (${producto.Stock} unidades)`
  );
};

/**
 * Emite alerta de producto vencido (SOLO en revisión diaria)
 * @param {object|array} producto - Producto o array de productos vencidos
 */
export const emitProductoVencidoAlert = (producto) => {
  if (Array.isArray(producto)) {
    const validAlerts = [];
    
    producto.forEach(prod => {
      if (!prod || !prod.Nombre) {
        console.error('Error: Producto inválido o sin nombre', prod);
        return;
      }
      
      const alertKey = createExpirationAlertKey(prod);
      
      // Solo emitir si no se ha enviado en las últimas 24 horas
      if (!isRecentExpirationAlert(alertKey)) {
        const fechaVencimiento = new Date(prod.fechaVencimiento).toLocaleDateString();
        const alert = emitAlertDirect(
          ALERT_TYPES.PRODUCTO_VENCIDO,
          prod,
          `Producto vencido: ${prod.Nombre} (${fechaVencimiento})`
        );
        
        if (alert) {
          recentExpirationAlerts.set(alertKey, { timestamp: Date.now(), type: ALERT_TYPES.PRODUCTO_VENCIDO, data: prod });
          validAlerts.push(alert);
        }
      }
    });
    
    return validAlerts;
  }
  
  if (!producto || !producto.Nombre) {
    console.error('Error: Producto inválido o sin nombre', producto);
    return null;
  }
  
  const alertKey = createExpirationAlertKey(producto);
  
  if (!isRecentExpirationAlert(alertKey)) {
    const fechaVencimiento = new Date(producto.fechaVencimiento).toLocaleDateString();
    const alert = emitAlertDirect(
      ALERT_TYPES.PRODUCTO_VENCIDO,
      producto,
      `Producto vencido: ${producto.Nombre} (${fechaVencimiento})`
    );
    
    if (alert) {
      recentExpirationAlerts.set(alertKey, { timestamp: Date.now(), type: ALERT_TYPES.PRODUCTO_VENCIDO, data: producto });
    }
    
    return alert;
  }
};

/**
 * Emite alerta de producto por vencer (SOLO en revisión diaria)
 * @param {object|array} producto - Producto o array de productos próximos a vencer
 */
export const emitProductoPorVencerAlert = (producto) => {
  if (Array.isArray(producto)) {
    const validAlerts = [];
    
    producto.forEach(prod => {
      if (!prod || !prod.Nombre) {
        console.error('Error: Producto inválido o sin nombre', prod);
        return;
      }
      
      const alertKey = createExpirationAlertKey(prod);
      
      if (!isRecentExpirationAlert(alertKey)) {
        const fechaVencimiento = new Date(prod.fechaVencimiento).toLocaleDateString();
        const alert = emitAlertDirect(
          ALERT_TYPES.PRODUCTO_POR_VENCER,
          prod,
          `Producto por vencer: ${prod.Nombre} (${fechaVencimiento})`
        );
        
        if (alert) {
          recentExpirationAlerts.set(alertKey, { timestamp: Date.now(), type: ALERT_TYPES.PRODUCTO_POR_VENCER, data: prod });
          validAlerts.push(alert);
        }
      }
    });
    
    return validAlerts;
  }
  
  if (!producto || !producto.Nombre) {
    console.error('Error: Producto inválido o sin nombre', producto);
    return null;
  }
  
  const alertKey = createExpirationAlertKey(producto);
  
  if (!isRecentExpirationAlert(alertKey)) {
    const fechaVencimiento = new Date(producto.fechaVencimiento).toLocaleDateString();
    const alert = emitAlertDirect(
      ALERT_TYPES.PRODUCTO_POR_VENCER,
      producto,
      `Producto por vencer: ${producto.Nombre} (${fechaVencimiento})`
    );
    
    if (alert) {
      // Marcar como enviado
      recentExpirationAlerts.set(alertKey, { timestamp: Date.now(), type: ALERT_TYPES.PRODUCTO_POR_VENCER, data: producto });
    }
    
    return alert;
  }
};

// Revisión diaria de expiraciones
const checkDailyExpirations = async () => {
  try {
    const { sendDailyCompleteReport } = await import('./email.service.js');
    await sendDailyCompleteReport();
  } catch (error) {
    console.error('❌ Error en revisión diaria completa:', error);
  }
};

// Esta tarea se ejecutará todos los días a las 9 am
cron.schedule('0 9 * * *', () => {
  checkDailyExpirations();
}, {
  timezone: "America/Santiago" // Se ajusta segun zona horaria de Chile
});