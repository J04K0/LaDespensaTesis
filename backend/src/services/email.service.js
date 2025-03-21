import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Crear un transportador de correo (puedes usar SMTP o servicios como Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Puedes cambiarlo por otro servicio
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Usa una contraseña de aplicación para Gmail
  }
});

/**
 * Envía una alerta por correo electrónico cuando hay productos con bajo stock
 * @param {Array} productos - Lista de productos con bajo stock
 * @param {Boolean} hayProductosRecienAfectados - Indica si hay productos recién afectados por la venta actual
 * @param {Boolean} hayProductosAgotados - Indica si hay productos agotados en esta venta
 * @param {Boolean} hayProductosYaAgotados - Indica si hay productos que ya estaban agotados antes
 * @param {Array} productosVencidos - Lista de productos vencidos [NUEVO PARÁMETRO]
 * @returns {Promise} Resultado del envío
 */
export const sendLowStockAlert = async (productos, hayProductosRecienAfectados = false, hayProductosAgotados = false, hayProductosYaAgotados = false, productosVencidos = []) => {
  const hayProductosVencidos = productosVencidos && productosVencidos.length > 0;
  
  if (!productos || productos.length === 0 && !hayProductosVencidos) {
    console.log("No hay productos con stock bajo ni vencidos para alertar");
    return;
  }
  
  console.log(`Enviando alerta por correo para ${productos.length} productos ${hayProductosVencidos ? `y ${productosVencidos.length} productos vencidos` : ''}`);
  
  // Agrupar productos por sección
  const productosRecienAfectados = productos.filter(p => p.esRecienAfectado);
  const productosAgotados = productos.filter(p => p.esAgotado);
  const productosYaAgotados = productos.filter(p => p.esYaAgotado);
  const otrosProductosBajoStock = productos.filter(p => !p.esRecienAfectado && !p.esAgotado && !p.esYaAgotado);
  
  let htmlContent = `
    <h2>🚨 ALERTA DE STOCK Y VENCIMIENTO 🚨</h2>
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
      <h3 style="color: #ff0000;">Productos que acaban de quedar con stock bajo:</h3>
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
  
  // Sección para otros productos con stock bajo (igual que antes)
  if (otrosProductosBajoStock.length > 0) {
    htmlContent += `
      <h3>Otros productos con stock bajo:</h3>
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
  }
  
  htmlContent += `
    <p>Por favor, reponga estos productos a la brevedad.</p>
    <p><em>Este es un mensaje automático de La Despensa.</em></p>
  `;
  
  // Actualizar el asunto del correo para incluir información sobre productos vencidos
  let subject = '🚨 Alerta de Stock - La Despensa';
  if (hayProductosVencidos) {
    subject = '⛔ URGENTE: Productos Vencidos - La Despensa';
  } else if (hayProductosAgotados) {
    subject = '⚠️ URGENTE: Productos Agotados - La Despensa';
  } else if (hayProductosRecienAfectados) {
    subject = '🚨 ¡ALERTA! Productos han caído bajo stock mínimo - La Despensa';
  } else if (hayProductosYaAgotados) {
    subject = '📋 Reporte de Productos Sin Stock - La Despensa';
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: subject,
    html: htmlContent
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email enviado: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
};

/**
 * Envía una alerta por correo electrónico para productos vencidos o próximos a vencer
 * @param {Array} productos - Lista de productos vencidos o por vencer
 * @param {String} tipo - Tipo de alerta ('vencidos' o 'porVencer')
 * @returns {Promise} Resultado del envío
 */
export const sendExpirationAlert = async (productos, tipo) => {
  if (!productos || productos.length === 0) {
    console.log(`No hay productos ${tipo} para alertar`);
    return;
  }
  
  console.log(`Enviando alerta por correo para ${productos.length} productos ${tipo}`);
  
  const titulo = tipo === 'vencidos' ? 
    '🚨 ALERTA DE PRODUCTOS VENCIDOS 🚨' : 
    '⚠️ ALERTA DE PRODUCTOS PRÓXIMOS A VENCER ⚠️';
  
  const color = tipo === 'vencidos' ? '#FF0000' : '#FFA500';
  
  let htmlContent = `
    <h2 style="color: ${color};">${titulo}</h2>
    <p>Los siguientes productos ${tipo === 'vencidos' ? 'están vencidos' : 'vencerán próximamente'}:</p>
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
    <p><em>Este es un mensaje automático de La Despensa.</em></p>
  `;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `${tipo === 'vencidos' ? '🚨' : '⚠️'} Alerta de Productos ${tipo === 'vencidos' ? 'Vencidos' : 'Por Vencer'} - La Despensa`,
    html: htmlContent
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email enviado: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
};