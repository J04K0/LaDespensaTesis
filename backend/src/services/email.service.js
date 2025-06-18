import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Cachés específicos para cada tipo de alerta con diferentes tiempos de cooldown
const emailCaches = {
  // Cache para alertas de productos vencidos - 1 correo por día
  expired: new Map(),
  // Cache para alertas de bajo stock - máximo cada 24h
  lowStock: new Map(),
  // Cache para productos agotados - cada 12-24h dependiendo urgencia
  outOfStock: new Map(),
  // Cache general para otros tipos
  general: new Map()
};

// Diferentes tiempos de cooldown según el tipo de alerta
const COOLDOWN_TIMES = {
  EXPIRED_PRODUCTS: 24 * 60 * 60 * 1000,     // 24 horas (1 día)
  LOW_STOCK: 24 * 60 * 60 * 1000,            // 24 horas
  OUT_OF_STOCK_URGENT: 12 * 60 * 60 * 1000,  // 12 horas para casos urgentes
  OUT_OF_STOCK_NORMAL: 24 * 60 * 60 * 1000,  // 24 horas para casos normales
  GENERAL: 2 * 60 * 60 * 1000                 // 2 horas (para compatibilidad)
};

// Crear un transportador de correo (puedes usar SMTP o servicios como Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Puedes cambiarlo por otro servicio
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Usa una contraseña de aplicación para Gmail
  }
});

/**
 * Crea una clave única para identificar emails similares según el tipo
 */
const createEmailKey = (type, productos, date = null) => {
  // Para productos vencidos, usar la fecha del día para agrupar por día
  if (type === 'expired') {
    const today = date || new Date().toDateString();
    return `expired_${today}`;
  }
  
  // Para bajo stock, agrupar por día
  if (type === 'lowStock') {
    const today = date || new Date().toDateString();
    return `lowStock_${today}`;
  }
  
  // Para productos agotados, crear clave específica
  if (type === 'outOfStock') {
    const today = date || new Date().toDateString();
    return `outOfStock_${today}`;
  }
  
  // Comportamiento original para otros tipos
  if (Array.isArray(productos)) {
    const productIds = productos.map(p => p._id || p.codigoBarras || p.Nombre).sort().join('|');
    return `${type}_${productIds}`;
  }
  return `${type}_${productos._id || productos.codigoBarras || productos.Nombre}`;
};

/**
 * Verifica si un email fue enviado recientemente según el tipo específico
 */
const isRecentEmail = (emailKey, alertType) => {
  const now = Date.now();
  let cache, cooldownTime;
  
  // Seleccionar el cache y tiempo de cooldown apropiado
  switch (alertType) {
    case 'expired':
      cache = emailCaches.expired;
      cooldownTime = COOLDOWN_TIMES.EXPIRED_PRODUCTS;
      break;
    case 'lowStock':
      cache = emailCaches.lowStock;
      cooldownTime = COOLDOWN_TIMES.LOW_STOCK;
      break;
    case 'outOfStockUrgent':
      cache = emailCaches.outOfStock;
      cooldownTime = COOLDOWN_TIMES.OUT_OF_STOCK_URGENT;
      break;
    case 'outOfStockNormal':
      cache = emailCaches.outOfStock;
      cooldownTime = COOLDOWN_TIMES.OUT_OF_STOCK_NORMAL;
      break;
    default:
      cache = emailCaches.general;
      cooldownTime = COOLDOWN_TIMES.GENERAL;
  }
  
  // Limpiar emails antiguos del cache específico
  for (const [key, timestamp] of cache.entries()) {
    if (now - timestamp > cooldownTime) {
      cache.delete(key);
    }
  }
  
  return cache.has(emailKey);
};

/**
 * Marcar email como enviado en el cache apropiado
 */
const markEmailSent = (emailKey, alertType) => {
  let cache;
  
  switch (alertType) {
    case 'expired':
      cache = emailCaches.expired;
      break;
    case 'lowStock':
      cache = emailCaches.lowStock;
      break;
    case 'outOfStockUrgent':
    case 'outOfStockNormal':
      cache = emailCaches.outOfStock;
      break;
    default:
      cache = emailCaches.general;
  }
  
  cache.set(emailKey, Date.now());
};

export const sendLowStockAlert = async (productos, hayProductosRecienAfectados = false, hayProductosAgotados = false, hayProductosYaAgotados = false, productosVencidos = []) => {
  const hayProductosVencidos = productosVencidos && productosVencidos.length > 0;
  
  if (!productos || productos.length === 0 && !hayProductosVencidos) {
    return;
  }
  
  // Verificar diferentes tipos de alertas y sus restricciones de frecuencia
  const today = new Date().toDateString();
  
  // 1. Verificar productos vencidos (máximo 1 correo por día)
  if (hayProductosVencidos) {
    const expiredEmailKey = createEmailKey('expired', null, today);
    if (isRecentEmail(expiredEmailKey, 'expired')) {
      console.log('📧 Email de productos vencidos ignorado - ya enviado hoy');
      // Continuar con otras alertas, pero sin productos vencidos
      hayProductosVencidos = false;
      productosVencidos = [];
    }
  }
  
  // 2. Verificar bajo stock (máximo cada 24h)
  const productosRecienAfectados = productos.filter(p => p.esRecienAfectado);
  const otrosProductosBajoStock = productos.filter(p => !p.esRecienAfectado && !p.esAgotado && !p.esYaAgotado);
  const hayBajoStock = productosRecienAfectados.length > 0 || otrosProductosBajoStock.length > 0;
  
  if (hayBajoStock) {
    const lowStockEmailKey = createEmailKey('lowStock', null, today);
    if (isRecentEmail(lowStockEmailKey, 'lowStock')) {
      console.log('📧 Email de bajo stock ignorado - ya enviado en las últimas 24h');
      // Eliminar productos de bajo stock de la alerta
      productos = productos.filter(p => p.esAgotado || p.esYaAgotado);
    }
  }
  
  // 3. Verificar productos agotados (12-24h según urgencia)
  const productosAgotados = productos.filter(p => p.esAgotado);
  const productosYaAgotados = productos.filter(p => p.esYaAgotado);
  
  if (productosAgotados.length > 0) {
    // Casos urgentes: más de 5 productos agotados = cada 12h
    const isUrgent = productosAgotados.length >= 5;
    const outOfStockEmailKey = createEmailKey('outOfStock', null, today);
    const alertType = isUrgent ? 'outOfStockUrgent' : 'outOfStockNormal';
    
    if (isRecentEmail(outOfStockEmailKey, alertType)) {
      const hours = isUrgent ? '12' : '24';
      console.log(`📧 Email de productos agotados ignorado - ya enviado en las últimas ${hours}h`);
      // Eliminar productos agotados de la alerta
      productos = productos.filter(p => !p.esAgotado);
    }
  }
  
  // Si después de todas las verificaciones no hay nada que reportar
  if (!hayProductosVencidos && productos.length === 0) {
    console.log('📧 No hay alertas nuevas que enviar según las restricciones de frecuencia');
    return;
  }
  
  // Reagrupar productos después de filtros
  const productosRecienAfectadosFinal = productos.filter(p => p.esRecienAfectado);
  const productosAgotadosFinal = productos.filter(p => p.esAgotado);
  const productosYaAgotadosFinal = productos.filter(p => p.esYaAgotado);
  const otrosProductosBajoStockFinal = productos.filter(p => !p.esRecienAfectado && !p.esAgotado && !p.esYaAgotado);
  
  let htmlContent = `
    <h2>🚨 ALERTA DE STOCK Y VENCIMIENTO 🚨</h2>
    <p style="color: #666; font-style: italic;">Reporte diario agrupado generado el ${new Date().toLocaleString('es-ES')}</p>
  `;
  
  // NUEVA SECCIÓN para productos vencidos (solo si pasan la verificación)
  if (hayProductosVencidos && productosVencidos.length > 0) {
    htmlContent += `
      <h3 style="color: #FF0000; font-weight: bold;">⛔ PRODUCTOS VENCIDOS (Reporte Diario) ⛔</h3>
      <p style="color: #d32f2f;">Todos los productos vencidos detectados hoy:</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th>Producto</th>
          <th>Marca</th>
          <th>Categoría</th>
          <th>Fecha de Vencimiento</th>
        </tr>
    `;
    
    productosVencidos.forEach(producto => {
      const fecha = new Date(producto.fechaVencimiento).toLocaleDateString('es-ES');
      htmlContent += `
        <tr style="background-color: #ffebee;">
          <td><strong>${producto.Nombre}</strong></td>
          <td>${producto.Marca}</td>
          <td>${producto.Categoria}</td>
          <td style="text-align: center; color: #d32f2f; font-weight: bold;">${fecha}</td>
        </tr>
      `;
    });
    
    htmlContent += `</table>`;
  }
  
  // Sección para productos agotados (con nueva lógica de frecuencia)
  if (productosAgotadosFinal.length > 0) {
    const isUrgent = productosAgotadosFinal.length >= 5;
    const frecuencia = isUrgent ? '12 horas' : '24 horas';
    
    htmlContent += `
      <h3 style="color: #ff0000; font-weight: bold;">⚠️ PRODUCTOS AGOTADOS (Cada ${frecuencia}) ⚠️</h3>
      <p style="color: #d32f2f; font-weight: bold;">Los siguientes productos se han agotado:</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th>Producto</th>
          <th>Marca</th>
          <th>Categoría</th>
          <th>Estado</th>
        </tr>
    `;
    
    productosAgotadosFinal.forEach(producto => {
      htmlContent += `
        <tr style="background-color: #ffebee;">
          <td><strong>${producto.Nombre}</strong></td>
          <td>${producto.Marca}</td>
          <td>${producto.Categoria}</td>
          <td style="text-align: center; color: #d32f2f; font-weight: bold;">AGOTADO</td>
        </tr>
      `;
    });
    
    htmlContent += `</table>`;
  }
  
  // Sección para productos con bajo stock (máximo cada 24h)
  if (productosRecienAfectadosFinal.length > 0 || otrosProductosBajoStockFinal.length > 0) {
    htmlContent += `
      <h3 style="color: #ff9800;">📦 BAJO STOCK (Reporte Diario) 📦</h3>
      <p style="color: #e65100;">Productos con stock por debajo del mínimo:</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th>Producto</th>
          <th>Marca</th>
          <th>Categoría</th>
          <th>Stock Actual</th>
          <th>Estado</th>
        </tr>
    `;
    
    // Productos recién afectados
    productosRecienAfectadosFinal.forEach(producto => {
      htmlContent += `
        <tr style="background-color: #fff3e0;">
          <td><strong>${producto.Nombre}</strong></td>
          <td>${producto.Marca}</td>
          <td>${producto.Categoria}</td>
          <td style="text-align: center; color: #f57c00;"><strong>${producto.Stock}</strong></td>
          <td style="text-align: center; color: #d84315; font-weight: bold;">NUEVO</td>
        </tr>
      `;
    });
    
    // Otros productos con bajo stock
    otrosProductosBajoStockFinal.forEach(producto => {
      htmlContent += `
        <tr style="background-color: #fff8f0;">
          <td>${producto.Nombre}</td>
          <td>${producto.Marca}</td>
          <td>${producto.Categoria}</td>
          <td style="text-align: center; color: #ff9800;"><strong>${producto.Stock}</strong></td>
          <td style="text-align: center; color: #ff9800;">BAJO STOCK</td>
        </tr>
      `;
    });
    
    htmlContent += `</table>`;
  }
  
  // NUEVA SECCIÓN para productos que ya estaban agotados (sin cambios en frecuencia)
  if (productosYaAgotadosFinal.length > 0) {
    htmlContent += `
      <h3 style="color: #9c27b0; font-weight: bold;">📋 PRODUCTOS SIN STOCK (Información) 📋</h3>
      <p style="color: #666;">Los siguientes productos continúan sin stock:</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th>Producto</th>
          <th>Marca</th>
          <th>Categoría</th>
          <th>Estado</th>
        </tr>
    `;
    
    productosYaAgotadosFinal.forEach(producto => {
      htmlContent += `
        <tr style="background-color: #f3e5f5;">
          <td><strong>${producto.Nombre}</strong></td>
          <td>${producto.Marca}</td>
          <td>${producto.Categoria}</td>
          <td style="text-align: center; color: #9c27b0; font-weight: bold;">SIN STOCK</td>
        </tr>
      `;
    });
    
    htmlContent += `</table>`;
  }
  
  htmlContent += `
    <hr style="margin: 20px 0;">
    <h4 style="color: #333;">📊 Resumen de Frecuencias de Reporte:</h4>
    <ul style="color: #666; font-size: 14px;">
      <li><strong>Productos vencidos:</strong> 1 correo por día (máximo)</li>
      <li><strong>Bajo stock:</strong> 1 correo cada 24 horas (máximo)</li>
      <li><strong>Productos agotados:</strong> Cada 12-24h según urgencia</li>
    </ul>
    <p style="color: #333; font-weight: bold;">Por favor, reponga estos productos a la brevedad.</p>
    <p style="color: #666; font-size: 12px;">
      <em>Este es un mensaje automático agrupado de La Despensa.</em>
    </p>
  `;
  
  // Determinar el asunto y prioridad del correo
  let subject = '📊 Reporte Diario de Inventario - La Despensa';
  let priority = 'normal';
  
  if (hayProductosVencidos) {
    subject = '⛔ URGENTE: Productos Vencidos (Reporte Diario) - La Despensa';
    priority = 'high';
  } else if (productosAgotadosFinal.length >= 5) {
    subject = '🚨 URGENTE: Múltiples Productos Agotados - La Despensa';
    priority = 'high';
  } else if (productosAgotadosFinal.length > 0) {
    subject = '⚠️ ALERTA: Productos Agotados - La Despensa';
    priority = 'high';
  } else if (productosRecienAfectadosFinal.length > 0) {
    subject = '📦 ALERTA: Productos con Bajo Stock - La Despensa';
    priority = 'normal';
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: subject,
    html: htmlContent,
    priority: priority
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Marcar los diferentes tipos de alertas como enviadas
    if (hayProductosVencidos) {
      const expiredKey = createEmailKey('expired', null, today);
      markEmailSent(expiredKey, 'expired');
    }
    
    if (productosRecienAfectadosFinal.length > 0 || otrosProductosBajoStockFinal.length > 0) {
      const lowStockKey = createEmailKey('lowStock', null, today);
      markEmailSent(lowStockKey, 'lowStock');
    }
    
    if (productosAgotadosFinal.length > 0) {
      const isUrgent = productosAgotadosFinal.length >= 5;
      const outOfStockKey = createEmailKey('outOfStock', null, today);
      const alertType = isUrgent ? 'outOfStockUrgent' : 'outOfStockNormal';
      markEmailSent(outOfStockKey, alertType);
    }
    
    console.log('📧 Email agrupado de alertas enviado correctamente:', subject);
    return info;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw error;
  }
};

export const sendExpirationAlert = async (productos, tipo) => {
  if (!productos || productos.length === 0) {
    return;
  }

  // NUEVA LÓGICA: Para productos vencidos, verificar si ya se envió hoy
  if (tipo === 'vencidos') {
    const today = new Date().toDateString();
    const emailKey = createEmailKey('expired', null, today);
    
    if (isRecentEmail(emailKey, 'expired')) {
      console.log('📧 Email de productos vencidos ignorado - ya enviado hoy');
      return;
    }
  } else {
    // Para productos por vencer, mantener lógica original
    const emailKey = createEmailKey(`expiration_${tipo}`, productos);
    if (isRecentEmail(emailKey, 'general')) {
      console.log(`📧 Email de ${tipo} ignorado - enviado recientemente`);
      return;
    }
  }

  const titulo = tipo === 'vencidos' ? 
    '🚨 PRODUCTOS VENCIDOS (Reporte Diario) 🚨' : 
    '⚠️ ALERTA DE PRODUCTOS PRÓXIMOS A VENCER ⚠️';
  
  const color = tipo === 'vencidos' ? '#FF0000' : '#FFA500';
  const descripcionFrecuencia = tipo === 'vencidos' ? 
    'Reporte diario agrupado de todos los productos vencidos detectados' :
    'Productos que vencerán próximamente';
  
  let htmlContent = `
    <h2 style="color: ${color};">${titulo}</h2>
    <p>${descripcionFrecuencia}:</p>
    <p style="color: #666; font-style: italic;">Reporte generado el ${new Date().toLocaleString('es-ES')}</p>
    ${tipo === 'vencidos' ? '<p style="color: #d32f2f; font-weight: bold;">⚠️ Este reporte se envía máximo 1 vez por día</p>' : ''}
    <table border="1" cellpadding="5" style="border-collapse: collapse;">
      <tr style="background-color: #f2f2f2;">
        <th>Producto</th>
        <th>Marca</th>
        <th>Categoría</th>
        <th>Fecha de Vencimiento</th>
      </tr>
  `;
  
  productos.forEach(producto => {
    const fecha = new Date(producto.fechaVencimiento).toLocaleDateString('es-ES');
    htmlContent += `
      <tr>
        <td>${producto.Nombre}</td>
        <td>${producto.Marca}</td>
        <td>${producto.Categoria}</td>
        <td style="text-align: center; color: ${color};"><strong>${fecha}</strong></td>
      </tr>
    `;
  });
  
  htmlContent += `
    </table>
    <p>${tipo === 'vencidos' ? 'Por favor, retire estos productos del inventario.' : 'Por favor, priorice la venta de estos productos o verifique su estado.'}</p>
    <p style="color: #666; font-size: 12px;">
      <em>Este es un mensaje automático de La Despensa.</em>
      ${tipo === 'vencidos' ? '<br><em>Próximo reporte de vencidos: mañana (si hay nuevos productos vencidos).</em>' : '<br><em>Próximo reporte en 2 horas (si hay cambios).</em>'}
    </p>
  `;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `${tipo === 'vencidos' ? '🚨' : '⚠️'} ${tipo === 'vencidos' ? 'Productos Vencidos (Diario)' : 'Productos Por Vencer'} - La Despensa`,
    html: htmlContent,
    priority: tipo === 'vencidos' ? 'high' : 'normal'
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Marcar como enviado según el tipo
    if (tipo === 'vencidos') {
      const today = new Date().toDateString();
      const emailKey = createEmailKey('expired', null, today);
      markEmailSent(emailKey, 'expired');
    } else {
      const emailKey = createEmailKey(`expiration_${tipo}`, productos);
      markEmailSent(emailKey, 'general');
    }
    
    console.log(`📧 Email de ${tipo} enviado correctamente`);
    return info;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw error;
  }
};

/**
 * Limpia todos los caches de emails para testing
 */
export const clearEmailCache = () => {
  Object.values(emailCaches).forEach(cache => cache.clear());
  console.log('🧹 Todos los caches de emails limpiados');
};

/**
 * Obtiene estadísticas de los caches de email
 */
export const getEmailCacheStats = () => {
  return {
    expired: emailCaches.expired.size,
    lowStock: emailCaches.lowStock.size,
    outOfStock: emailCaches.outOfStock.size,
    general: emailCaches.general.size
  };
};