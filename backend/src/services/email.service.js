import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Cache para controlar el envío de emails y evitar spam
const emailCache = new Map();
const EMAIL_COOLDOWN = 2 * 60 * 60 * 1000; // 2 horas en milisegundos

// Crear un transportador de correo (puedes usar SMTP o servicios como Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Puedes cambiarlo por otro servicio
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Usa una contraseña de aplicación para Gmail
  }
});

/**
 * Crea una clave única para identificar emails similares
 */
const createEmailKey = (type, productos) => {
  if (Array.isArray(productos)) {
    const productIds = productos.map(p => p._id || p.codigoBarras || p.Nombre).sort().join('|');
    return `${type}_${productIds}`;
  }
  return `${type}_${productos._id || productos.codigoBarras || productos.Nombre}`;
};

/**
 * Verifica si un email fue enviado recientemente
 */
const isRecentEmail = (emailKey) => {
  const now = Date.now();
  
  // Limpiar emails antiguos del cache
  for (const [key, timestamp] of emailCache.entries()) {
    if (now - timestamp > EMAIL_COOLDOWN) {
      emailCache.delete(key);
    }
  }
  
  return emailCache.has(emailKey);
};

/**
 * Marcar email como enviado
 */
const markEmailSent = (emailKey) => {
  emailCache.set(emailKey, Date.now());
};

export const sendLowStockAlert = async (productos, hayProductosRecienAfectados = false, hayProductosAgotados = false, hayProductosYaAgotados = false, productosVencidos = []) => {
  const hayProductosVencidos = productosVencidos && productosVencidos.length > 0;
  
  if (!productos || productos.length === 0 && !hayProductosVencidos) {
    return;
  }
  
  // Crear clave para verificar si ya se envió un email similar recientemente
  const productosParaKey = [...productos];
  if (hayProductosVencidos) {
    productosParaKey.push(...productosVencidos);
  }
  
  const emailKey = createEmailKey('stock_alert', productosParaKey);
  
  // Verificar si ya se envió un email similar recientemente
  if (isRecentEmail(emailKey)) {
    console.log('📧 Email de stock ignorado - enviado recientemente');
    return;
  }
  
  // Agrupar productos por sección
  const productosRecienAfectados = productos.filter(p => p.esRecienAfectado);
  const productosAgotados = productos.filter(p => p.esAgotado);
  const productosYaAgotados = productos.filter(p => p.esYaAgotado);
  const otrosProductosBajoStock = productos.filter(p => !p.esRecienAfectado && !p.esAgotado && !p.esYaAgotado);
  
  let htmlContent = `
    <h2>🚨 ALERTA DE STOCK Y VENCIMIENTO 🚨</h2>
    <p style="color: #666; font-style: italic;">Reporte automático generado el ${new Date().toLocaleString('es-ES')}</p>
  `;
  
  // NUEVA SECCIÓN para productos vencidos
  if (hayProductosVencidos) {
    htmlContent += `
      <h3 style="color: #FF0000; font-weight: bold;">⛔ PRODUCTOS VENCIDOS ⛔</h3>
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
  
  // Sección para productos agotados en esta venta
  if (productosAgotados.length > 0) {
    htmlContent += `
      <h3 style="color: #ff0000; font-weight: bold;">⚠️ PRODUCTOS RECIÉN AGOTADOS ⚠️</h3>
      <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th>Producto</th>
          <th>Marca</th>
          <th>Categoría</th>
          <th>Estado</th>
        </tr>
    `;
    
    productosAgotados.forEach(producto => {
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
  
  // NUEVA SECCIÓN para productos que ya estaban agotados
  if (productosYaAgotados.length > 0) {
    htmlContent += `
      <h3 style="color: #9c27b0; font-weight: bold;">📋 PRODUCTOS SIN STOCK 📋</h3>
      <p style="color: #666;">Los siguientes productos continúan sin stock:</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th>Producto</th>
          <th>Marca</th>
          <th>Categoría</th>
          <th>Estado</th>
        </tr>
    `;
    
    productosYaAgotados.forEach(producto => {
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
  
  // Sección para productos recién afectados (igual que antes)
  if (productosRecienAfectados.length > 0) {
    htmlContent += `
      <h3 style="color: #ff0000;">🚨 NUEVOS PRODUCTOS CON STOCK BAJO 🚨</h3>
      <p style="color: #d32f2f; font-weight: bold;">Los siguientes productos acaban de quedar con stock bajo:</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th>Producto</th>
          <th>Marca</th>
          <th>Categoría</th>
          <th>Stock Actual</th>
        </tr>
    `;
    
    productosRecienAfectados.forEach(producto => {
      htmlContent += `
        <tr style="background-color: #fff0f0;">
          <td><strong>${producto.Nombre}</strong></td>
          <td>${producto.Marca}</td>
          <td>${producto.Categoria}</td>
          <td style="text-align: center; color: red;"><strong>${producto.Stock}</strong></td>
        </tr>
      `;
    });
    
    htmlContent += `</table>`;
  }
  
  // Sección para otros productos con stock bajo (solo si hay menos de 5)
  if (otrosProductosBajoStock.length > 0 && otrosProductosBajoStock.length <= 5) {
    htmlContent += `
      <h3>📦 Otros productos con stock bajo:</h3>
      <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th>Producto</th>
          <th>Marca</th>
          <th>Categoría</th>
          <th>Stock Actual</th>
        </tr>
    `;
    
    otrosProductosBajoStock.forEach(producto => {
      htmlContent += `
        <tr>
          <td>${producto.Nombre}</td>
          <td>${producto.Marca}</td>
          <td>${producto.Categoria}</td>
          <td style="text-align: center; color: orange;"><strong>${producto.Stock}</strong></td>
        </tr>
      `;
    });
    
    htmlContent += `</table>`;
  } else if (otrosProductosBajoStock.length > 5) {
    htmlContent += `
      <h3>📦 Otros productos con stock bajo:</h3>
      <p style="color: #ff9800; font-weight: bold;">
        Hay ${otrosProductosBajoStock.length} productos adicionales con stock bajo. 
        <br>Consulte el sistema para ver la lista completa.
      </p>
    `;
  }
  
  htmlContent += `
    <hr style="margin: 20px 0;">
    <p style="color: #333; font-weight: bold;">Por favor, reponga estos productos a la brevedad.</p>
    <p style="color: #666; font-size: 12px;">
      <em>Este es un mensaje automático de La Despensa.</em>
      <br><em>Próximo reporte automático en 2 horas (si hay cambios significativos).</em>
    </p>
  `;
  
  // Actualizar el asunto del correo para incluir información sobre productos vencidos
  let subject = '🚨 Alerta de Stock - La Despensa';
  let priority = 'normal';
  
  if (hayProductosVencidos) {
    subject = '⛔ URGENTE: Productos Vencidos - La Despensa';
    priority = 'high';
  } else if (hayProductosAgotados) {
    subject = '⚠️ URGENTE: Productos Agotados - La Despensa';
    priority = 'high';
  } else if (hayProductosRecienAfectados) {
    subject = '🚨 ¡ALERTA! Productos han caído bajo stock mínimo - La Despensa';
    priority = 'high';
  } else if (hayProductosYaAgotados) {
    subject = '📋 Reporte de Productos Sin Stock - La Despensa';
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
    markEmailSent(emailKey);
    console.log('📧 Email de alerta enviado correctamente:', subject);
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

  // Verificar si ya se envió un email similar recientemente
  const emailKey = createEmailKey(`expiration_${tipo}`, productos);
  if (isRecentEmail(emailKey)) {
    console.log(`📧 Email de ${tipo} ignorado - enviado recientemente`);
    return;
  }

  const titulo = tipo === 'vencidos' ? 
    '🚨 ALERTA DE PRODUCTOS VENCIDOS 🚨' : 
    '⚠️ ALERTA DE PRODUCTOS PRÓXIMOS A VENCER ⚠️';
  
  const color = tipo === 'vencidos' ? '#FF0000' : '#FFA500';
  
  let htmlContent = `
    <h2 style="color: ${color};">${titulo}</h2>
    <p>Los siguientes productos ${tipo === 'vencidos' ? 'están vencidos' : 'vencerán próximamente'}:</p>
    <p style="color: #666; font-style: italic;">Reporte generado el ${new Date().toLocaleString('es-ES')}</p>
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
      <br><em>Próximo reporte en 2 horas (si hay cambios).</em>
    </p>
  `;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `${tipo === 'vencidos' ? '🚨' : '⚠️'} Alerta de Productos ${tipo === 'vencidos' ? 'Vencidos' : 'Por Vencer'} - La Despensa`,
    html: htmlContent,
    priority: tipo === 'vencidos' ? 'high' : 'normal'
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    markEmailSent(emailKey);
    console.log(`📧 Email de ${tipo} enviado correctamente`);
    return info;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw error;
  }
};

export const sendMail = async (options) => {
  try {
    const info = await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html
    });
    
    return info;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw error;
  }
};

/**
 * Limpia el cache de emails para testing
 */
export const clearEmailCache = () => {
  emailCache.clear();
  console.log('🧹 Cache de emails limpiado');
};