// Servicio para gestionar las alertas en tiempo real
import { io } from '../server.js';
import cron from 'node-cron';

// Contador para generar IDs únicos
let alertIdCounter = 0;

// Cache para evitar notificaciones duplicadas recientes (solo para productos vencidos)
const recentExpirationAlerts = new Map();
const EXPIRATION_ALERT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 horas para alertas de vencimiento

// Tipos de alertas
export const ALERT_TYPES = {
  STOCK_BAJO: 'stock_bajo',
  PRODUCTO_VENCIDO: 'producto_vencido',
  PRODUCTO_POR_VENCER: 'producto_por_vencer',
  DEUDOR_PAGO_PROXIMO: 'deudor_pago_proximo',
  CUENTA_POR_PAGAR: 'cuenta_por_pagar'
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

/**
 * Limpia alertas de vencimiento antiguas del cache
 */
const cleanOldExpirationAlerts = () => {
  const now = Date.now();
  for (const [key, alert] of recentExpirationAlerts.entries()) {
    if (now - alert.timestamp > EXPIRATION_ALERT_COOLDOWN) {
      recentExpirationAlerts.delete(key);
    }
  }
};

/**
 * Crea una clave única para alertas de vencimiento
 */
const createExpirationAlertKey = (data) => {
  return `expiration_${data._id || data.codigoBarras || data.Nombre}`;
};

/**
 * Verifica si una alerta de vencimiento fue enviada recientemente
 */
const isRecentExpirationAlert = (alertKey) => {
  cleanOldExpirationAlerts();
  return recentExpirationAlerts.has(alertKey);
};

/**
 * Emite una alerta directamente
 */
const emitAlertDirect = (type, data, message) => {
  if (!io) {
    console.error('Socket.io no está inicializado');
    return;
  }

  const alert = {
    id: generateUniqueId(),
    type,
    data,
    message,
    timestamp: new Date(),
    read: false,
    isGrouped: Array.isArray(data) && data.length > 1
  };

  console.log(`📢 Emitiendo alerta ${type}:`, message);
  io.emit('nueva_alerta', alert);
  return alert;
};

/**
 * Emite alerta de stock bajo (SOLO después de ventas)
 * @param {object|array} producto - Producto o array de productos con stock bajo
 */
export const emitStockBajoAlert = (producto) => {
  // Si es un array de productos, procesar cada uno individualmente
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
  
  // Caso de un solo producto
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
  // Si es un array de productos, procesar cada uno individualmente
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
          // Marcar como enviado
          recentExpirationAlerts.set(alertKey, { timestamp: Date.now(), type: ALERT_TYPES.PRODUCTO_VENCIDO, data: prod });
          validAlerts.push(alert);
        }
      } else {
        console.log(`⏭️ Alerta de vencimiento ignorada (enviada recientemente): ${prod.Nombre}`);
      }
    });
    
    return validAlerts;
  }
  
  // Caso de un solo producto
  if (!producto || !producto.Nombre) {
    console.error('Error: Producto inválido o sin nombre', producto);
    return null;
  }
  
  const alertKey = createExpirationAlertKey(producto);
  
  // Solo emitir si no se ha enviado en las últimas 24 horas
  if (!isRecentExpirationAlert(alertKey)) {
    const fechaVencimiento = new Date(producto.fechaVencimiento).toLocaleDateString();
    const alert = emitAlertDirect(
      ALERT_TYPES.PRODUCTO_VENCIDO,
      producto,
      `Producto vencido: ${producto.Nombre} (${fechaVencimiento})`
    );
    
    if (alert) {
      // Marcar como enviado
      recentExpirationAlerts.set(alertKey, { timestamp: Date.now(), type: ALERT_TYPES.PRODUCTO_VENCIDO, data: producto });
    }
    
    return alert;
  } else {
    console.log(`⏭️ Alerta de vencimiento ignorada (enviada recientemente): ${producto.Nombre}`);
    return null;
  }
};

/**
 * Emite alerta de producto por vencer (SOLO en revisión diaria)
 * @param {object|array} producto - Producto o array de productos próximos a vencer
 */
export const emitProductoPorVencerAlert = (producto) => {
  // Si es un array de productos, procesar cada uno individualmente
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
          ALERT_TYPES.PRODUCTO_POR_VENCER,
          prod,
          `Producto por vencer: ${prod.Nombre} (${fechaVencimiento})`
        );
        
        if (alert) {
          // Marcar como enviado
          recentExpirationAlerts.set(alertKey, { timestamp: Date.now(), type: ALERT_TYPES.PRODUCTO_POR_VENCER, data: prod });
          validAlerts.push(alert);
        }
      } else {
        console.log(`⏭️ Alerta de vencimiento ignorada (enviada recientemente): ${prod.Nombre}`);
      }
    });
    
    return validAlerts;
  }
  
  // Caso de un solo producto
  if (!producto || !producto.Nombre) {
    console.error('Error: Producto inválido o sin nombre', producto);
    return null;
  }
  
  const alertKey = createExpirationAlertKey(producto);
  
  // Solo emitir si no se ha enviado en las últimas 24 horas
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
  } else {
    console.log(`⏭️ Alerta de vencimiento ignorada (enviada recientemente): ${producto.Nombre}`);
    return null;
  }
};

/**
 * Emite alerta de pago próximo de deudor
 * @param {object} deudor - Deudor con pago próximo
 */
export const emitDeudorPagoProximoAlert = (deudor) => {
  if (!deudor || !deudor.Nombre) {
    console.error('Error: Deudor inválido o sin nombre', deudor);
    return null;
  }
  
  const fechaPago = new Date(deudor.fechaPaga).toLocaleDateString();
  return emitAlertDirect(
    ALERT_TYPES.DEUDOR_PAGO_PROXIMO,
    deudor,
    `Pago próximo: ${deudor.Nombre} - ${fechaPago}`
  );
};

/**
 * Emite alerta de cuenta por pagar
 * @param {object} cuenta - Cuenta por pagar
 */
export const emitCuentaPorPagarAlert = (cuenta) => {
  if (!cuenta || !cuenta.Nombre) {
    console.error('Error: Cuenta inválida o sin nombre', cuenta);
    return null;
  }
  
  return emitAlertDirect(
    ALERT_TYPES.CUENTA_POR_PAGAR,
    cuenta,
    `Cuenta por pagar: ${cuenta.Nombre} - ${cuenta.Mes} ($${cuenta.Monto})`
  );
};

// 🕒 TAREAS PROGRAMADAS PARA REVISIÓN DIARIA DE VENCIMIENTOS

/**
 * Revisa productos vencidos y próximos a vencer (DIARIO)
 */
const checkDailyExpirations = async () => {
  try {
    console.log('🔍 Iniciando revisión diaria de fechas de vencimiento...');
    
    // Importar dinámicamente para evitar dependencias circulares
    const { default: Product } = await import('../models/products.model.js');
    const { sendExpirationAlert } = await import('./email.service.js');
    
    const today = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(today.getDate() + 5);
    
    // Buscar productos vencidos
    const expiredProducts = await Product.find({
      fechaVencimiento: { $lt: today }
    });
    
    // Buscar productos próximos a vencer (próximos 5 días)
    const expiringSoonProducts = await Product.find({
      fechaVencimiento: {
        $gte: today,
        $lte: fiveDaysFromNow
      }
    });
    
    console.log(`📊 Productos vencidos encontrados: ${expiredProducts.length}`);
    console.log(`📊 Productos por vencer encontrados: ${expiringSoonProducts.length}`);
    
    // Emitir alertas solo si hay productos y no se han enviado recientemente
    if (expiredProducts.length > 0) {
      try {
        await sendExpirationAlert(expiredProducts, 'vencidos');
        emitProductoVencidoAlert(expiredProducts);
        console.log(`✅ Alertas de productos vencidos enviadas: ${expiredProducts.length} productos`);
      } catch (error) {
        console.error('❌ Error enviando alertas de productos vencidos:', error);
      }
    }
    
    if (expiringSoonProducts.length > 0) {
      try {
        await sendExpirationAlert(expiringSoonProducts, 'porVencer');
        emitProductoPorVencerAlert(expiringSoonProducts);
        console.log(`✅ Alertas de productos por vencer enviadas: ${expiringSoonProducts.length} productos`);
      } catch (error) {
        console.error('❌ Error enviando alertas de productos por vencer:', error);
      }
    }
    
    if (expiredProducts.length === 0 && expiringSoonProducts.length === 0) {
      console.log('✅ No hay productos vencidos o próximos a vencer');
    }
    
  } catch (error) {
    console.error('❌ Error en revisión diaria de vencimientos:', error);
  }
};

// 📅 PROGRAMAR REVISIÓN DIARIA A LAS 9:00 AM
cron.schedule('0 9 * * *', () => {
  console.log('⏰ Ejecutando revisión diaria programada de fechas de vencimiento...');
  checkDailyExpirations();
}, {
  timezone: "America/Santiago" // Ajusta según tu zona horaria
});

export const forceExpirationCheck = () => {
  console.log('🔧 Forzando revisión manual de vencimientos...');
  checkDailyExpirations();
};

/**
 * Limpia todo el cache de alertas para testing
 */
export const clearAlertCache = () => {
  recentExpirationAlerts.clear();
  console.log('🧹 Cache de alertas de vencimiento limpiado');
};