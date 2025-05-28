// Servicio para gestionar las alertas en tiempo real
import { io } from '../server.js';

// Tipos de alertas
export const ALERT_TYPES = {
  STOCK_BAJO: 'stock_bajo',
  PRODUCTO_VENCIDO: 'producto_vencido',
  PRODUCTO_POR_VENCER: 'producto_por_vencer',
  DEUDOR_PAGO_PROXIMO: 'deudor_pago_proximo',
  CUENTA_POR_PAGAR: 'cuenta_por_pagar'
};

/**
 * Emite una alerta a todos los clientes conectados
 * @param {string} type - Tipo de alerta (usar constantes ALERT_TYPES)
 * @param {object} data - Datos de la alerta
 * @param {string} message - Mensaje descriptivo
 */
export const emitAlert = (type, data, message) => {
  if (!io) {
    console.error('Socket.io no está inicializado');
    return;
  }

  const alert = {
    id: Date.now().toString(),
    type,
    data,
    message,
    timestamp: new Date(),
    read: false
  };

  io.emit('nueva_alerta', alert);
  return alert;
};

/**
 * Emite alerta de stock bajo
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
      return emitAlert(
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
  
  return emitAlert(
    ALERT_TYPES.STOCK_BAJO,
    producto,
    `Stock bajo: ${producto.Nombre} (${producto.Stock} unidades)`
  );
};

/**
 * Emite alerta de producto vencido
 * @param {object|array} producto - Producto o array de productos vencidos
 */
export const emitProductoVencidoAlert = (producto) => {
  // Si es un array de productos, procesar cada uno individualmente
  if (Array.isArray(producto)) {
    return producto.map(prod => {
      if (!prod || !prod.Nombre) {
        console.error('Error: Producto inválido o sin nombre', prod);
        return null;
      }
      const fechaVencimiento = new Date(prod.fechaVencimiento).toLocaleDateString();
      return emitAlert(
        ALERT_TYPES.PRODUCTO_VENCIDO,
        prod,
        `Producto vencido: ${prod.Nombre} (${fechaVencimiento})`
      );
    }).filter(alert => alert !== null);
  }
  
  // Caso de un solo producto
  if (!producto || !producto.Nombre) {
    console.error('Error: Producto inválido o sin nombre', producto);
    return null;
  }
  
  const fechaVencimiento = new Date(producto.fechaVencimiento).toLocaleDateString();
  return emitAlert(
    ALERT_TYPES.PRODUCTO_VENCIDO,
    producto,
    `Producto vencido: ${producto.Nombre} (${fechaVencimiento})`
  );
};

/**
 * Emite alerta de producto por vencer
 * @param {object|array} producto - Producto o array de productos próximos a vencer
 */
export const emitProductoPorVencerAlert = (producto) => {
  // Si es un array de productos, procesar cada uno individualmente
  if (Array.isArray(producto)) {
    return producto.map(prod => {
      if (!prod || !prod.Nombre) {
        console.error('Error: Producto inválido o sin nombre', prod);
        return null;
      }
      const fechaVencimiento = new Date(prod.fechaVencimiento).toLocaleDateString();
      return emitAlert(
        ALERT_TYPES.PRODUCTO_POR_VENCER,
        prod,
        `Producto por vencer: ${prod.Nombre} (${fechaVencimiento})`
      );
    }).filter(alert => alert !== null);
  }
  
  // Caso de un solo producto
  if (!producto || !producto.Nombre) {
    console.error('Error: Producto inválido o sin nombre', producto);
    return null;
  }
  
  const fechaVencimiento = new Date(producto.fechaVencimiento).toLocaleDateString();
  return emitAlert(
    ALERT_TYPES.PRODUCTO_POR_VENCER,
    producto,
    `Producto por vencer: ${producto.Nombre} (${fechaVencimiento})`
  );
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
  return emitAlert(
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
  
  return emitAlert(
    ALERT_TYPES.CUENTA_POR_PAGAR,
    cuenta,
    `Cuenta por pagar: ${cuenta.Nombre} - ${cuenta.Mes} ($${cuenta.Monto})`
  );
};