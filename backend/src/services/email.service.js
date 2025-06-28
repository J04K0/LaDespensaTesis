import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { STOCK_MINIMO_POR_CATEGORIA } from '../constants/products.constants.js';

// Diferentes caches para cada tipo de alerta
const emailCaches = {
  expired: new Map(),
  lowStock: new Map(),
  outOfStock: new Map(),
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

// Función para crear claves únicas para emails
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

// Verifica si un email fue enviado recientemente según el tipo específico
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

// Marcar email como enviado en el cache apropiado
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

const crearTablaProductos = (productos, tipo) => {
  const color = tipo === 'vencidos' ? '#d32f2f' : '#e65100';
  let htmlContent = `
    <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
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
    </p>
  `;
  
  return htmlContent;
};

export const sendLowStockAlert = async (productos, hayRecienAfectados = false, hayAgotados = false) => {
  try {
    if (!productos || productos.length === 0) {
      console.log('⚠️ No hay productos para alertas de stock');
      return;
    }

    console.log(`📧 Preparando alerta de stock para ${productos.length} productos`);

    // Procesar y filtrar productos
    const productosAgotadosFinal = productos.filter(p => p.Stock === 0 || p.esAgotado);
    const productosRecienAfectadosFinal = productos.filter(p => 
      p.Stock > 0 && (p.esRecienAfectado || (!p.esAgotado && !p.esRecienAfectado))
    );
    const otrosProductosBajoStockFinal = productos.filter(p => {
      const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[p.Categoria] || 5;
      return p.Stock > 0 && p.Stock <= stockMinimo && !p.esRecienAfectado;
    });

    // Determinar si es urgente basado en productos agotados
    const esUrgente = productosAgotadosFinal.length > 0;
    const alertType = esUrgente ? 'outOfStockUrgent' : 'lowStock';
    
    // Crear clave única para el email
    const emailKey = createEmailKey('lowStock');
    
    // Verificar si ya se envió un email similar recientemente
    if (isRecentEmail(emailKey, alertType)) {
      console.log(`⏭️ Email de stock bajo ya enviado recientemente (tipo: ${alertType})`);
      return;
    }

    let asunto = '';
    let cuerpoHtml = '';

    if (productosAgotadosFinal.length > 0) {
      asunto = `🚨 URGENTE - Productos Agotados en La Despensa (${productosAgotadosFinal.length} productos)`;
      cuerpoHtml += `
        <h2 style="color: #d32f2f;">⚠️ PRODUCTOS AGOTADOS (${productosAgotadosFinal.length})</h2>
        <p style="color: #d32f2f; font-weight: bold;">Los siguientes productos se han agotado completamente:</p>
        <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
          <tr style="background-color: #ffebee;">
            <th>Producto</th>
            <th>Marca</th>
            <th>Categoría</th>
            <th>Código de Barras</th>
          </tr>
      `;
      
      productosAgotadosFinal.forEach(producto => {
        cuerpoHtml += `
          <tr style="background-color: #ffcdd2;">
            <td><strong>${producto.Nombre}</strong></td>
            <td>${producto.Marca}</td>
            <td>${producto.Categoria}</td>
            <td>${producto.codigoBarras}</td>
          </tr>
        `;
      });
      
      cuerpoHtml += `
        </table>
        <p style="color: #d32f2f;">
          <strong>⚠️ ACCIÓN REQUERIDA:</strong> Estos productos necesitan reposición inmediata.
        </p>
      `;
    }

    if (productosRecienAfectadosFinal.length > 0) {
      if (asunto === '') {
        asunto = `⚠️ Alerta de Stock Bajo - La Despensa (${productosRecienAfectadosFinal.length} productos)`;
      }
      
      cuerpoHtml += `
        <h2 style="color: #e65100;">📉 PRODUCTOS CON STOCK BAJO (${productosRecienAfectadosFinal.length})</h2>
        <p>Los siguientes productos han alcanzado el stock mínimo después de ventas recientes:</p>
        <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
          <tr style="background-color: #fff3e0;">
            <th>Producto</th>
            <th>Marca</th>
            <th>Categoría</th>
            <th>Stock Actual</th>
            <th>Stock Mínimo</th>
          </tr>
      `;
      
      productosRecienAfectadosFinal.forEach(producto => {
        const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[producto.Categoria] || 5;
        cuerpoHtml += `
          <tr style="background-color: #ffe0b2;">
            <td><strong>${producto.Nombre}</strong></td>
            <td>${producto.Marca}</td>
            <td>${producto.Categoria}</td>
            <td style="text-align: center; color: #e65100;"><strong>${producto.Stock}</strong></td>
            <td style="text-align: center;">${stockMinimo}</td>
          </tr>
        `;
      });
      
      cuerpoHtml += `
        </table>
      `;
    }

    if (otrosProductosBajoStockFinal.length > 0) {
      cuerpoHtml += `
        <h2 style="color: #f57c00;">📋 OTROS PRODUCTOS CON STOCK BAJO (${otrosProductosBajoStockFinal.length})</h2>
        <p>Productos que también requieren atención:</p>
        <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
          <tr style="background-color: #fff8e1;">
            <th>Producto</th>
            <th>Marca</th>
            <th>Categoría</th>
            <th>Stock Actual</th>
          </tr>
      `;
      
      otrosProductosBajoStockFinal.forEach(producto => {
        cuerpoHtml += `
          <tr>
            <td>${producto.Nombre}</td>
            <td>${producto.Marca}</td>
            <td>${producto.Categoria}</td>
            <td style="text-align: center; color: #f57c00;"><strong>${producto.Stock}</strong></td>
          </tr>
        `;
      });
      
      cuerpoHtml += `
        </table>
      `;
    }

    cuerpoHtml += `
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        <em>Este es un mensaje automático de La Despensa - ${new Date().toLocaleString('es-ES')}</em>
      </p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // O el email del administrador
      subject: asunto,
      html: cuerpoHtml
    };

    await transporter.sendMail(mailOptions);
    
    // Marcar como enviado
    markEmailSent(emailKey, alertType);
    
    console.log(`✅ Email de alerta de stock enviado exitosamente (${productos.length} productos, tipo: ${alertType})`);
  } catch (error) {
    console.error('❌ Error al enviar email de stock bajo:', error);
  }
};

export const sendExpirationAlert = async (productos, tipo = 'vencidos') => {
  try {
    if (!productos || productos.length === 0) {
      console.log('⚠️ No hay productos para alertas de vencimiento');
      return;
    }

    console.log(`📧 Preparando alerta de vencimiento para ${productos.length} productos (${tipo})`);

    const emailKey = createEmailKey('expired');
    
    if (isRecentEmail(emailKey, 'expired')) {
      console.log('⏭️ Email de productos vencidos ya enviado hoy');
      return;
    }

    const esVencido = tipo === 'vencidos';
    const asunto = esVencido 
      ? `🚨 PRODUCTOS VENCIDOS - La Despensa (${productos.length} productos)`
      : `⚠️ PRODUCTOS POR VENCER - La Despensa (${productos.length} productos)`;

    const cuerpoHtml = `
      <h1 style="color: ${esVencido ? '#d32f2f' : '#e65100'};">
        ${esVencido ? '🚨 PRODUCTOS VENCIDOS' : '⚠️ PRODUCTOS POR VENCER'}
      </h1>
      <p>Se han detectado <strong>${productos.length}</strong> productos ${esVencido ? 'vencidos' : 'próximos a vencer'}:</p>
      ${crearTablaProductos(productos, tipo)}
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: asunto,
      html: cuerpoHtml
    };

    await transporter.sendMail(mailOptions);
    markEmailSent(emailKey, 'expired');
    
    console.log(`✅ Email de productos ${tipo} enviado exitosamente`);
  } catch (error) {
    console.error(`❌ Error al enviar email de productos ${tipo}:`, error);
  }
};

export const sendDailyCompleteReport = async () => {
  try {
    console.log('📧 Iniciando reporte diario completo...');
    
    // Importar dinámicamente para evitar dependencias circulares
    const { default: Product } = await import('../models/products.model.js');
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Obtener productos vencidos
    const productosVencidos = await Product.find({
      fechaVencimiento: { $lt: today }
    });

    // Obtener productos por vencer (próximos 30 días)
    const productosPorVencer = await Product.find({
      fechaVencimiento: {
        $gte: today,
        $lte: thirtyDaysFromNow
      }
    });

    // Obtener productos con stock bajo
    const todosLosProductos = await Product.find();
    const productosStockBajo = todosLosProductos.filter(producto => {
      const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[producto.Categoria] || 5;
      return producto.Stock <= stockMinimo && producto.Stock > 0;
    });

    // Obtener productos agotados
    const productosAgotados = todosLosProductos.filter(producto => producto.Stock === 0);

    let hayAlertas = productosAgotados.length > 0 || productosStockBajo.length > 0 || productosVencidos.length > 0 || productosPorVencer.length > 0;
    
    // Estructura principal del email con diseño específico solicitado
    let contenidoCompleto = `
      <div style="
        max-width: 800px; 
        margin: 0 auto; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f8f9fa;
        padding: 20px;
      ">
        <!-- CONTENEDOR PRINCIPAL CON CUADRO -->
        <div style="
          background-color: #ffffff;
          border: 2px solid #002651;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 15px rgba(0, 38, 81, 0.1);
        ">
          
          <!-- ENCABEZADO -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="
              background-color: #002651;
              color: white;
              padding: 15px 20px;
              border-radius: 8px;
              display: inline-block;
              margin-bottom: 15px;
            ">
              <h1 style="margin: 0; font-size: 18px; font-weight: 600;">
                📊 REPORTE DIARIO COMPLETO
              </h1>
            </div>
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              Reporte generado el ${today.toLocaleDateString('es-ES', { 
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
              })} ${today.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <!-- CONTENIDO DE ALERTAS -->
    `;

    // 📦 PRODUCTOS SIN STOCK (Agotados)
    if (productosAgotados.length > 0) {
      contenidoCompleto += `
        <div style="
          background-color: #fff5f5;
          border: 2px solid #dc3545;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        ">
          <h2 style="
            color: #dc3545; 
            margin: 0 0 10px 0; 
            font-size: 16px; 
            font-weight: 600;
            display: flex; 
            align-items: center;
            gap: 8px;
          ">
            📦 PRODUCTOS SIN STOCK (${productosAgotados.length})
          </h2>
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #495057;">
            Estos productos están completamente agotados:
          </p>
          
          <table style="
            width: 100%; 
            border-collapse: collapse; 
            font-size: 14px;
            background-color: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            <tr style="background-color: #dc3545; color: white;">
              <th style="padding: 10px; text-align: left; font-weight: 600; border: 1px solid #c82333;">Producto</th>
              <th style="padding: 10px; text-align: left; font-weight: 600; border: 1px solid #c82333;">Marca</th>
              <th style="padding: 10px; text-align: left; font-weight: 600; border: 1px solid #c82333;">Categoría</th>
              <th style="padding: 10px; text-align: center; font-weight: 600; border: 1px solid #c82333;">Estado</th>
            </tr>
      `;
      
      productosAgotados.forEach((producto, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#fff5f5';
        contenidoCompleto += `
          <tr style="background-color: ${bgColor};">
            <td style="padding: 8px; border: 1px solid #e9ecef;">${producto.Nombre}</td>
            <td style="padding: 8px; border: 1px solid #e9ecef;">${producto.Marca}</td>
            <td style="padding: 8px; border: 1px solid #e9ecef;">${producto.Categoria}</td>
            <td style="padding: 8px; border: 1px solid #e9ecef; text-align: center; color: #dc3545; font-weight: 600;">AGOTADO</td>
          </tr>
        `;
      });
      
      contenidoCompleto += `
          </table>
        </div>
      `;
    }

    // 📉 PRODUCTOS CON STOCK BAJO
    if (productosStockBajo.length > 0) {
      contenidoCompleto += `
        <div style="
          background-color: #fff8e1;
          border: 2px solid #ffbe0b;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        ">
          <h2 style="
            color: #ff9800; 
            margin: 0 0 10px 0; 
            font-size: 16px; 
            font-weight: 600;
            display: flex; 
            align-items: center;
            gap: 8px;
          ">
            📉 PRODUCTOS CON STOCK BAJO (${productosStockBajo.length})
          </h2>
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #495057;">
            Estos productos están por debajo del stock mínimo:
          </p>
          
          <table style="
            width: 100%; 
            border-collapse: collapse; 
            font-size: 14px;
            background-color: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            <tr style="background-color: #ffbe0b; color: #343a40;">
              <th style="padding: 10px; text-align: left; font-weight: 600; border: 1px solid #e0a800;">Producto</th>
              <th style="padding: 10px; text-align: left; font-weight: 600; border: 1px solid #e0a800;">Marca</th>
              <th style="padding: 10px; text-align: left; font-weight: 600; border: 1px solid #e0a800;">Categoría</th>
              <th style="padding: 10px; text-align: center; font-weight: 600; border: 1px solid #e0a800;">Stock Actual</th>
              <th style="padding: 10px; text-align: center; font-weight: 600; border: 1px solid #e0a800;">Stock Mínimo</th>
            </tr>
      `;
      
      productosStockBajo.forEach((producto, index) => {
        const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[producto.Categoria] || 5;
        const bgColor = index % 2 === 0 ? '#ffffff' : '#fff8e1';
        contenidoCompleto += `
          <tr style="background-color: ${bgColor};">
            <td style="padding: 8px; border: 1px solid #e9ecef;">${producto.Nombre}</td>
            <td style="padding: 8px; border: 1px solid #e9ecef;">${producto.Marca}</td>
            <td style="padding: 8px; border: 1px solid #e9ecef;">${producto.Categoria}</td>
            <td style="padding: 8px; border: 1px solid #e9ecef; text-align: center; color: #ff9800; font-weight: 600;">${producto.Stock}</td>
            <td style="padding: 8px; border: 1px solid #e9ecef; text-align: center;">${stockMinimo}</td>
          </tr>
        `;
      });
      
      contenidoCompleto += `
          </table>
        </div>
      `;
    }

    // ⚠️ CUENTAS POR PAGAR PENDIENTES - Simulación (puedes conectar con tu modelo real)
    // Como placeholder, creamos una sección similar
    contenidoCompleto += `
      <div style="
        background-color: #fff3e0;
        border: 2px solid #ff9800;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h2 style="
          color: #ff9800; 
          margin: 0 0 10px 0; 
          font-size: 16px; 
          font-weight: 600;
          display: flex; 
          align-items: center;
          gap: 8px;
        ">
          ⚠️ CUENTAS POR PAGAR PENDIENTES (0)
        </h2>
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #495057;">
          Resumen de cuentas pendientes de pago:
        </p>
        
        <div style="
          background-color: white;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
          color: #28a745;
          font-weight: 600;
        ">
          No hay cuentas pendientes por pagar
        </div>
      </div>
    `;

    // 📊 RESUMEN Y ACCIONES RECOMENDADAS
    contenidoCompleto += `
      <div style="
        background-color: #e3f2fd;
        border: 2px solid #006EDF;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <h2 style="
          color: #006EDF; 
          margin: 0 0 15px 0; 
          font-size: 16px; 
          font-weight: 600;
          display: flex; 
          align-items: center;
          gap: 8px;
        ">
          📊 RESUMEN Y ACCIONES RECOMENDADAS
        </h2>
        
        <div style="margin-bottom: 15px;">
          <ul style="margin: 0; padding-left: 20px; color: #495057; line-height: 1.6;">
            <li><strong>🔄 REPOSICIÓN:</strong> Reabastecer ${productosAgotados.length} producto(s) agotado(s)</li>
            <li><strong>📋 SEGUIMIENTO:</strong> Monitorear ${productosStockBajo.length} producto(s) con stock bajo</li>
            <li><strong>💰 PAGOS:</strong> Gestionar 0 cuenta(s) pendiente(s) • Total: $0</li>
          </ul>
        </div>
      </div>
    `;

    // PIE DEL REPORTE - Información adicional
    contenidoCompleto += `
          <!-- PIE DEL REPORTE -->
          <div style="
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
            text-align: center;
          ">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #6c757d; font-style: italic;">
              Este es un reporte automático diario de La Despensa
            </p>
            <p style="margin: 0; font-size: 12px; color: #6c757d;">
              Próximo reporte mañana a las 9:00 AM
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6c757d;">
              Reporte generado el ${today.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })} ${today.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
        </div> <!-- Fin del contenedor principal -->
      </div> <!-- Fin del wrapper -->
    `;

    const asunto = hayAlertas 
      ? `📊 REPORTE DIARIO - La Despensa (${productosVencidos.length + productosPorVencer.length + productosAgotados.length + productosStockBajo.length} alertas)`
      : `📊 REPORTE DIARIO - La Despensa (Todo en orden)`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: asunto,
      html: contenidoCompleto
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Reporte diario completo enviado exitosamente');

    // Enviar alertas WebSocket si hay productos que requieren atención
    if (hayAlertas) {
      const { emitProductoVencidoAlert, emitProductoPorVencerAlert } = await import('./alert.service.js');
      
      if (productosVencidos.length > 0) {
        emitProductoVencidoAlert(productosVencidos);
      }
      
      if (productosPorVencer.length > 0) {
        emitProductoPorVencerAlert(productosPorVencer);
      }
    }

  } catch (error) {
    console.error('❌ Error al enviar reporte diario completo:', error);
  }
};