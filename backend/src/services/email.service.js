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

// Función helper para formatear números con punto como separador de miles
const formatNumberWithDots = (number) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
 * Envía un reporte diario completo con toda la información importante
 */
export const sendDailyCompleteReport = async () => {
  try {
    console.log('📊 Generando reporte diario completo...');
    
    // Importar dinámicamente para evitar dependencias circulares
    const { default: Product } = await import('../models/products.model.js');
    const { default: Deudores } = await import('../models/deudores.model.js');
    const { default: CuentasPorPagar } = await import('../models/cuentasPorPagar.model.js');
    
    const today = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(today.getDate() + 5);
    
    // 1. Obtener productos vencidos
    const expiredProducts = await Product.find({
      fechaVencimiento: { $lt: today }
    });
    
    // 2. Obtener productos próximos a vencer (próximos 5 días)
    const expiringSoonProducts = await Product.find({
      fechaVencimiento: {
        $gte: today,
        $lte: fiveDaysFromNow
      }
    });
    
    // 3. Obtener productos con stock bajo
    const stockMinimoPorCategoria = {
      'Congelados': 10,
      'Carnes': 5,
      'Despensa': 8,
      'Panaderia y Pasteleria': 10,
      'Quesos y Fiambres': 5,
      'Bebidas y Licores': 5,
      'Lacteos, Huevos y Refrigerados': 10,
      'Desayuno y Dulces': 10,
      'Bebes y Niños': 10,
      'Cigarros': 5,
      'Cuidado Personal': 8,
      'Remedios': 3,
      'Limpieza y Hogar': 5,
      'Mascotas': 5,
      'Otros': 5
    };
    
    const allProducts = await Product.find();
    const lowStockProducts = allProducts.filter(producto => {
      const categoria = producto.Categoria;
      const stockMinimo = stockMinimoPorCategoria[categoria];
      return stockMinimo && producto.Stock <= stockMinimo && producto.Stock > 0;
    });
    
    // 4. Obtener productos sin stock
    const outOfStockProducts = await Product.find({ Stock: 0 });
    
    // 5. Obtener deudores con pagos próximos (próximos 3 días)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    const deudoresConPagosProximos = await Deudores.find({
      fechaPaga: {
        $gte: today,
        $lte: threeDaysFromNow
      }
    });
    
    // 6. Obtener cuentas por pagar pendientes
    const cuentasPorPagarPendientes = await CuentasPorPagar.find({ Estado: 'Pendiente' });
    
    // 7. Obtener cuentas por pagar del mes actual
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const mesActual = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    const cuentasDelMesActual = await CuentasPorPagar.find({
      Mes: mesActual,
      Estado: 'Pendiente'
    });
    
    // Verificar si hay información para reportar
    const hayInformacion = expiredProducts.length > 0 || 
                          expiringSoonProducts.length > 0 || 
                          lowStockProducts.length > 0 || 
                          outOfStockProducts.length > 0 || 
                          deudoresConPagosProximos.length > 0 || 
                          cuentasPorPagarPendientes.length > 0;
    
    if (!hayInformacion) {
      console.log('✅ No hay alertas para el reporte diario - todo está en orden');
      
      // Enviar reporte indicando que todo está bien
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #28a745; text-align: center;">✅ REPORTE DIARIO - TODO EN ORDEN</h2>
          <p style="color: #666; font-style: italic; text-align: center;">Reporte generado el ${today.toLocaleString('es-ES')}</p>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">🎉 ¡Excelente! No hay alertas pendientes</h3>
            <ul style="color: #155724;">
              <li>✅ No hay productos vencidos</li>
              <li>✅ No hay productos próximos a vencer</li>
              <li>✅ Todos los productos tienen stock adecuado</li>
              <li>✅ No hay deudores con pagos próximos</li>
              <li>✅ No hay cuentas por pagar urgentes</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            <em>Este es un reporte automático diario de La Despensa.</em><br>
            <em>Próximo reporte: mañana a las 9:00 AM</em>
          </p>
        </div>
      `;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: '✅ Reporte Diario - Todo en Orden - La Despensa',
        html: htmlContent,
        priority: 'normal'
      };
      
      await transporter.sendMail(mailOptions);
      console.log('📧 Reporte diario "todo en orden" enviado correctamente');
      return;
    }
    
    // Generar el reporte completo
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #dc3545; text-align: center;">📊 REPORTE DIARIO COMPLETO</h2>
        <p style="color: #666; font-style: italic; text-align: center;">Reporte generado el ${today.toLocaleString('es-ES')}</p>
    `;
    
    // Sección de productos vencidos
    if (expiredProducts.length > 0) {
      htmlContent += `
        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #721c24; margin-top: 0;">⛔ PRODUCTOS VENCIDOS (${expiredProducts.length})</h3>
          <p style="color: #721c24; font-weight: bold;">¡ATENCIÓN! Estos productos deben retirarse inmediatamente:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="background-color: #f5c6cb;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Producto</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Marca</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Categoría</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Fecha Vencimiento</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Stock</th>
            </tr>
      `;
      
      expiredProducts.forEach(producto => {
        const fecha = new Date(producto.fechaVencimiento).toLocaleDateString('es-ES');
        htmlContent += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${producto.Nombre}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${producto.Marca}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${producto.Categoria}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #dc3545; font-weight: bold;">${fecha}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${producto.Stock}</td>
          </tr>
        `;
      });
      
      htmlContent += `
          </table>
        </div>
      `;
    }
    
    // Sección de productos próximos a vencer
    if (expiringSoonProducts.length > 0) {
      htmlContent += `
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">⚠️ PRODUCTOS PRÓXIMOS A VENCER (${expiringSoonProducts.length})</h3>
          <p style="color: #856404;">Estos productos vencen en los próximos 5 días:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="background-color: #ffeaa7;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Producto</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Marca</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Categoría</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Fecha Vencimiento</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Stock</th>
            </tr>
      `;
      
      expiringSoonProducts.forEach(producto => {
        const fecha = new Date(producto.fechaVencimiento).toLocaleDateString('es-ES');
        const diasRestantes = Math.ceil((new Date(producto.fechaVencimiento) - today) / (1000 * 60 * 60 * 24));
        htmlContent += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${producto.Nombre}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${producto.Marca}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${producto.Categoria}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #ff8c00; font-weight: bold;">${fecha} (${diasRestantes} días)</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${producto.Stock}</td>
          </tr>
        `;
      });
      
      htmlContent += `
          </table>
        </div>
      `;
    }
    
    // Sección de productos sin stock
    if (outOfStockProducts.length > 0) {
      htmlContent += `
        <div style="background-color: #e2e3e5; border: 1px solid #d6d8db; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #383d41; margin-top: 0;">📦 PRODUCTOS SIN STOCK (${outOfStockProducts.length})</h3>
          <p style="color: #383d41;">Estos productos están completamente agotados:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="background-color: #d6d8db;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Producto</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Marca</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Categoría</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Estado</th>
            </tr>
      `;
      
      outOfStockProducts.slice(0, 10).forEach(producto => { // Limitar a 10 para no saturar el email
        htmlContent += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${producto.Nombre}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${producto.Marca}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${producto.Categoria}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #dc3545; font-weight: bold;">AGOTADO</td>
          </tr>
        `;
      });
      
      if (outOfStockProducts.length > 10) {
        htmlContent += `
          <tr>
            <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: center; font-style: italic; color: #666;">
              ... y ${outOfStockProducts.length - 10} productos más sin stock
            </td>
          </tr>
        `;
      }
      
      htmlContent += `
          </table>
        </div>
      `;
    }
    
    // Sección de productos con stock bajo
    if (lowStockProducts.length > 0) {
      htmlContent += `
        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0c5460; margin-top: 0;">📉 PRODUCTOS CON STOCK BAJO (${lowStockProducts.length})</h3>
          <p style="color: #0c5460;">Estos productos están por debajo del stock mínimo:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="background-color: #bee5eb;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Producto</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Marca</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Categoría</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Stock Actual</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Stock Mínimo</th>
            </tr>
      `;
      
      lowStockProducts.slice(0, 15).forEach(producto => { // Limitar a 15
        const stockMinimo = stockMinimoPorCategoria[producto.Categoria] || 5;
        htmlContent += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${producto.Nombre}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${producto.Marca}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${producto.Categoria}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #ff6b6b; font-weight: bold;">${producto.Stock}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${stockMinimo}</td>
          </tr>
        `;
      });
      
      if (lowStockProducts.length > 15) {
        htmlContent += `
          <tr>
            <td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: center; font-style: italic; color: #666;">
              ... y ${lowStockProducts.length - 15} productos más con stock bajo
            </td>
          </tr>
        `;
      }
      
      htmlContent += `
          </table>
        </div>
      `;
    }
    
    // Sección de deudores con pagos próximos
    if (deudoresConPagosProximos.length > 0) {
      htmlContent += `
        <div style="background-color: #f3e5f5; border: 1px solid #e1bee7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4a148c; margin-top: 0;">💰 DEUDORES CON PAGOS PRÓXIMOS (${deudoresConPagosProximos.length})</h3>
          <p style="color: #4a148c;">Estos deudores tienen pagos programados en los próximos 3 días:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="background-color: #e1bee7;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nombre</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Teléfono</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Fecha Pago</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Deuda Total</th>
            </tr>
      `;
      
      deudoresConPagosProximos.forEach(deudor => {
        const fechaPago = new Date(deudor.fechaPaga).toLocaleDateString('es-ES');
        const diasRestantes = Math.ceil((new Date(deudor.fechaPaga) - today) / (1000 * 60 * 60 * 24));
        htmlContent += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${deudor.Nombre}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${deudor.numeroTelefono}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #9c27b0; font-weight: bold;">${fechaPago} (${diasRestantes} días)</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">$${formatNumberWithDots(deudor.deudaTotal)}</td>
          </tr>
        `;
      });
      
      htmlContent += `
          </table>
        </div>
      `;
    }
    
    // Sección de cuentas por pagar pendientes
    if (cuentasPorPagarPendientes.length > 0) {
      htmlContent += `
        <div style="background-color: #fff8e1; border: 1px solid #ffecb3; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #e65100; margin-top: 0;">💳 CUENTAS POR PAGAR PENDIENTES (${cuentasPorPagarPendientes.length})</h3>
          <p style="color: #e65100;">Resumen de cuentas pendientes de pago:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="background-color: #ffecb3;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Cuenta</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Categoría</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Mes</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Monto</th>
            </tr>
      `;
      
      let totalCuentasPendientes = 0;
      cuentasPorPagarPendientes.forEach(cuenta => {
        totalCuentasPendientes += cuenta.Monto;
        htmlContent += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>${cuenta.Nombre}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${cuenta.Categoria}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cuenta.Mes}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">$${formatNumberWithDots(cuenta.Monto)}</td>
          </tr>
        `;
      });
      
      htmlContent += `
            <tr style="background-color: #ffcc02; font-weight: bold;">
              <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>TOTAL PENDIENTE:</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #e65100; font-size: 16px;"><strong>$${formatNumberWithDots(totalCuentasPendientes)}</strong></td>
            </tr>
          </table>
        </div>
      `;
    }
    
    // Calcular total para usar en la sección de resumen
    const totalCuentasPendientes = cuentasPorPagarPendientes.reduce((sum, cuenta) => sum + cuenta.Monto, 0);
    
    // Sección de resumen y acciones recomendadas
    htmlContent += `
      <div style="background-color: #e8f4f8; border: 1px solid #b8e6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #0277bd; margin-top: 0;">📋 RESUMEN Y ACCIONES RECOMENDADAS</h3>
        <ul style="color: #0277bd; line-height: 1.6;">
    `;
    
    if (expiredProducts.length > 0) {
      htmlContent += `<li><strong>🚨 URGENTE:</strong> Retirar ${expiredProducts.length} producto(s) vencido(s) del inventario</li>`;
    }
    if (expiringSoonProducts.length > 0) {
      htmlContent += `<li><strong>⚠️ PRIORIDAD:</strong> Promocionar ${expiringSoonProducts.length} producto(s) próximo(s) a vencer</li>`;
    }
    if (outOfStockProducts.length > 0) {
      htmlContent += `<li><strong>📦 REPOSICIÓN:</strong> Reabastecer ${outOfStockProducts.length} producto(s) agotado(s)</li>`;
    }
    if (lowStockProducts.length > 0) {
      htmlContent += `<li><strong>📉 SEGUIMIENTO:</strong> Monitorear ${lowStockProducts.length} producto(s) con stock bajo</li>`;
    }
    if (deudoresConPagosProximos.length > 0) {
      htmlContent += `<li><strong>💰 COBRANZA:</strong> Contactar ${deudoresConPagosProximos.length} deudor(es) con pagos próximos</li>`;
    }
    if (cuentasPorPagarPendientes.length > 0) {
      htmlContent += `<li><strong>💳 PAGOS:</strong> Gestionar ${cuentasPorPagarPendientes.length} cuenta(s) pendiente(s) - Total: $${formatNumberWithDots(totalCuentasPendientes)}</li>`;
    }
    
    htmlContent += `
        </ul>
      </div>
    `;
    
    // Pie del reporte
    htmlContent += `
        <hr style="margin: 30px 0; border: 1px solid #ddd;">
        <div style="text-align: center; color: #666; font-size: 12px;">
          <p><em>Este es un reporte automático diario de La Despensa</em></p>
          <p><em>Próximo reporte: mañana a las 9:00 AM</em></p>
          <p><em>Reporte generado el ${today.toLocaleString('es-ES')}</em></p>
        </div>
      </div>
    `;
    
    // Determinar prioridad y asunto del correo
    let priority = 'normal';
    let subject = '📊 Reporte Diario Completo - La Despensa';
    
    if (expiredProducts.length > 0) {
      priority = 'high';
      subject = '🚨 URGENTE: Reporte Diario - Productos Vencidos - La Despensa';
    } else if (outOfStockProducts.length >= 5 || (expiringSoonProducts.length > 0 && lowStockProducts.length > 5)) {
      priority = 'high';
      subject = '⚠️ IMPORTANTE: Reporte Diario - Múltiples Alertas - La Despensa';
    } else if (expiringSoonProducts.length > 0 || lowStockProducts.length > 0) {
      subject = '⚠️ Reporte Diario - Alertas de Inventario - La Despensa';
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: subject,
      html: htmlContent,
      priority: priority
    };
    
    await transporter.sendMail(mailOptions);
    
    console.log('📧 Reporte diario completo enviado correctamente');
    console.log(`📊 Resumen del reporte:`);
    console.log(`   - Productos vencidos: ${expiredProducts.length}`);
    console.log(`   - Productos próximos a vencer: ${expiringSoonProducts.length}`);
    console.log(`   - Productos sin stock: ${outOfStockProducts.length}`);
    console.log(`   - Productos con stock bajo: ${lowStockProducts.length}`);
    console.log(`   - Deudores con pagos próximos: ${deudoresConPagosProximos.length}`);
    console.log(`   - Cuentas por pagar pendientes: ${cuentasPorPagarPendientes.length}`);
    
    return {
      success: true,
      data: {
        expiredProducts: expiredProducts.length,
        expiringSoonProducts: expiringSoonProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        lowStockProducts: lowStockProducts.length,
        deudoresConPagosProximos: deudoresConPagosProximos.length,
        cuentasPorPagarPendientes: cuentasPorPagarPendientes.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error al enviar reporte diario completo:', error);
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