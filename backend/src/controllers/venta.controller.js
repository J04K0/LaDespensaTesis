import Venta from '../models/venta.model.js';
import mongoose from 'mongoose';
import Deudores from '../models/deudores.model.js';
import Product from '../models/products.model.js';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../utils/resHandlers.js';
import { sendLowStockAlert } from '../services/email.service.js';
import { emitStockBajoAlert } from '../services/alert.service.js';
import { STOCK_MINIMO_POR_CATEGORIA } from '../constants/products.constants.js';

let ticketCounter = 0; // Variable global para el contador de tickets

export const registrarVenta = async (req, res) => {
    try {
      console.log('📦 Datos recibidos:', { productosVendidos: req.body.productosVendidos, metodoPago: req.body.metodoPago, deudorId: req.body.deudorId });
      
      const { productosVendidos, metodoPago, deudorId } = req.body;
  
      if (!productosVendidos || !Array.isArray(productosVendidos) || productosVendidos.length === 0) {
        return handleErrorClient(res, 400, "Lista de productos vendidos inválida");
      }

      ticketCounter++;
      const ticketId = `TK-${ticketCounter.toString().padStart(6, '0')}`;
      console.log('🎫 Ticket generado:', ticketId);
      
      const userId = req.userId;
      
      const productosAfectadosEnVenta = [];
      const productosAgotados = [];
      const productosVencidosVendidos = [];
      const today = new Date();
      
      const ventasRegistradas = [];
      let totalVenta = 0;

      console.log('🔄 INICIANDO ACTUALIZACIÓN DE STOCK...');
      
      // 🆕 NUEVO: Actualizar stock antes de registrar la venta
      for (const { codigoBarras, cantidad } of productosVendidos) {
        console.log(`\n📋 Procesando producto: ${codigoBarras}, cantidad: ${cantidad}`);
        let cantidadRestante = cantidad;

        // Obtener todos los productos con el mismo código de barras, ordenados por fecha de vencimiento
        const productos = await Product.find({ 
          codigoBarras, 
          Stock: { $gt: 0 }
        }).sort({ fechaVencimiento: 1 });

        console.log(`🔍 Productos encontrados con stock: ${productos.length}`);
        productos.forEach((p, index) => {
          console.log(`   Producto ${index + 1}: ${p.Nombre}, Stock: ${p.Stock}, ID: ${p._id}, Lotes: ${p.lotes?.length || 0}`);
        });

        if (!productos.length) {
          console.log(`❌ NO HAY STOCK DISPONIBLE para ${codigoBarras}`);
          return handleErrorClient(res, 400, `No hay stock disponible para el producto ${codigoBarras}`);
        }

        // Verificar si hay productos vencidos y guardarlos para notificar
        const productoVencido = productos.find(p => new Date(p.fechaVencimiento) < today);
        if (productoVencido) {
          console.log(`⚠️ Producto vencido detectado: ${productoVencido.Nombre}`);
          productosVencidosVendidos.push({
            ...productoVencido.toObject(),
            cantidadVendida: cantidad
          });
        }

        // Resta la cantidad vendida de cada lote hasta que se complete la venta
        for (const producto of productos) {
          if (cantidadRestante <= 0) break;

          console.log(`\n🔧 Procesando lote: ${producto.Nombre}`);
          console.log(`   Stock antes: ${producto.Stock}`);
          console.log(`   Cantidad a descontar: ${Math.min(cantidadRestante, producto.Stock)}`);

          // Guardar el stock anterior para comparar después
          const stockAnterior = producto.Stock;
          const cantidadADescontar = Math.min(cantidadRestante, producto.Stock);

          // 🆕 ACTUALIZACIÓN DE LOTES: Si el producto tiene lotes, actualizar también los lotes
          if (producto.lotes && producto.lotes.length > 0) {
            console.log(`   📦 Producto con ${producto.lotes.length} lotes, actualizando lotes...`);
            
            let cantidadRestanteLotes = cantidadADescontar;
            // Ordenar lotes por fecha de vencimiento (FIFO)
            const lotesActivos = producto.lotes
              .filter(lote => lote.activo && lote.cantidad > 0)
              .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));
            
            for (const lote of lotesActivos) {
              if (cantidadRestanteLotes <= 0) break;
              
              const cantidadLote = Math.min(cantidadRestanteLotes, lote.cantidad);
              console.log(`     Lote ${lote.numeroLote}: ${lote.cantidad} -> ${lote.cantidad - cantidadLote}`);
              
              lote.cantidad -= cantidadLote;
              cantidadRestanteLotes -= cantidadLote;
              
              if (lote.cantidad === 0) {
                lote.activo = false;
                console.log(`     Lote ${lote.numeroLote} agotado y desactivado`);
              }
            }
          }

          // Actualizar stock principal
          if (producto.Stock >= cantidadRestante) {
            producto.Stock -= cantidadRestante;
            cantidadRestante = 0;
          } else {
            cantidadRestante -= producto.Stock;
            producto.Stock = 0;
          }

          console.log(`   Stock después: ${producto.Stock}`);
          
          // 🆕 MARCAR PARA EVITAR RECALCULO AUTOMÁTICO
          producto._skipStockRecalculation = true;
          
          // 🆕 DEBUGGING: Verificar antes y después de guardar
          console.log(`💾 Guardando producto: ${producto._id}`);
          console.log(`   Stock antes de save(): ${producto.Stock}`);
          
          const savedProduct = await producto.save();
          
          console.log(`✅ Producto guardado exitosamente`);
          console.log(`   Stock después de save(): ${savedProduct.Stock}`);
          
          // 🆕 VERIFICACIÓN ADICIONAL: Revisar en la BD
          const verificacion = await Product.findById(producto._id);
          console.log(`🔍 Verificación en BD - Stock actual: ${verificacion.Stock}`);
          
          const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[producto.Categoria];
          
          // Verificar si el producto llegó al stock mínimo en esta venta
          if (stockMinimo && stockAnterior > stockMinimo && producto.Stock <= stockMinimo && producto.Stock > 0) {
            productosAfectadosEnVenta.push(producto);
            console.log(`📉 Producto agregado a stock bajo: ${producto.Nombre}`);
          }

          // Verificar si el producto se agotó en esta venta
          if (stockAnterior > 0 && producto.Stock === 0) {
            productosAgotados.push(producto);
            console.log(`🚫 Producto agotado: ${producto.Nombre}`);
          }
        }

        if (cantidadRestante > 0) {
          console.log(`❌ STOCK INSUFICIENTE - Cantidad restante: ${cantidadRestante}`);
          return handleErrorClient(res, 400, `No hay suficiente stock para el producto ${codigoBarras}`);
        }
        
        console.log(`✅ Stock actualizado correctamente para ${codigoBarras}`);
      }

      console.log('\n📝 REGISTRANDO VENTAS...');
      
      // Registrar las ventas después de actualizar el stock
      for (const producto of productosVendidos) {
        console.log(`💰 Registrando venta: ${producto.nombre} x ${producto.cantidad}`);
        
        const nuevaVenta = new Venta({
          ticketId,
          nombre: producto.nombre,
          codigoBarras: producto.codigoBarras,
          categoria: producto.categoria,
          cantidad: producto.cantidad,
          precioVenta: producto.precioVenta,
          precioCompra: producto.precioCompra,
          fecha: new Date(),
          usuario: userId,
          metodoPago: metodoPago || 'efectivo',
          deudorId: deudorId || null
        });
        
        await nuevaVenta.save();
        ventasRegistradas.push(nuevaVenta);
        totalVenta += producto.precioVenta * producto.cantidad;
        
        console.log(`✅ Venta registrada: ${nuevaVenta._id}`);
      }

      console.log(`💵 Total venta: $${totalVenta}`);

      // 🆕 NUEVO: Enviar alertas de stock si es necesario
      if (productosAfectadosEnVenta.length > 0 || productosAgotados.length > 0) {
        try {
          // Combinar todos los productos afectados para el email
          const todosLosProductosAfectados = [...productosAfectadosEnVenta, ...productosAgotados];
          
          // Enviar email solo una vez con toda la información
          await sendLowStockAlert(
            todosLosProductosAfectados.map(producto => ({
              ...producto.toObject(),
              esRecienAfectado: productosAfectadosEnVenta.some(p => p._id.toString() === producto._id.toString()),
              esAgotado: productosAgotados.some(p => p._id.toString() === producto._id.toString())
            })),
            productosAfectadosEnVenta.length > 0,
            productosAgotados.length > 0
          );

          // Emitir alertas WebSocket individuales
          if (productosAfectadosEnVenta.length > 0) {
            emitStockBajoAlert(productosAfectadosEnVenta);
          }
          if (productosAgotados.length > 0) {
            emitStockBajoAlert(productosAgotados);
          }
        } catch (alertError) {
          console.error("❌ Error al enviar alertas de stock:", alertError);
          // No fallar la venta por errores de alertas
        }
      }
      
      // Manejar deudor si aplica
      if (deudorId) {
        const deudor = await Deudores.findById(deudorId);
        if (deudor) {
          const nuevaDeuda = {
            fecha: new Date(),
            monto: totalVenta,
            tipo: 'deuda',
            comentario: `Venta ticket ${ticketId}`
          };
          
          deudor.historialPagos.push(nuevaDeuda);
          deudor.deudaTotal += totalVenta;
          
          await deudor.save();

          // Preparar mensaje con información de productos vencidos si aplica
          let mensaje = "Venta registrada correctamente y deuda asignada";
          if (productosVencidosVendidos.length > 0) {
            mensaje += ". ADVERTENCIA: Se han vendido productos vencidos";
          }
          
          handleSuccess(res, 201, mensaje, { 
            ticketId, 
            productos: ventasRegistradas,
            deudor: {
              id: deudor._id,
              nombre: deudor.Nombre,
              deudaTotal: deudor.deudaTotal
            },
            productosVencidosVendidos: productosVencidosVendidos.length > 0 ? productosVencidosVendidos : null
          });
        } else {
          handleSuccess(res, 201, "Venta registrada correctamente pero el deudor no fue encontrado", { 
            ticketId, 
            productos: ventasRegistradas,
            productosVencidosVendidos: productosVencidosVendidos.length > 0 ? productosVencidosVendidos : null
          });
        }
      } else {
        // Preparar mensaje con información de productos vencidos si aplica
        let mensaje = "Venta registrada correctamente";
        if (productosVencidosVendidos.length > 0) {
          mensaje += ". ADVERTENCIA: Se han vendido productos vencidos";
        }

        handleSuccess(res, 201, mensaje, { 
          ticketId, 
          productos: ventasRegistradas,
          productosVencidosVendidos: productosVencidosVendidos.length > 0 ? productosVencidosVendidos : null
        });
      }
    } catch (error) {
      console.error("❌ ERROR COMPLETO AL REGISTRAR VENTA:", error);
      console.error("📋 Stack trace:", error.stack);
      handleErrorServer(res, 500, "Error al registrar la venta", error.message);
    }
  };

  // Función para inicializar el contador de tickets al iniciar la aplicación
  const inicializarTicketCounter = async () => {
    try {
      const ultimaVenta = await Venta.findOne().sort({ ticketId: -1 });
      if (ultimaVenta && ultimaVenta.ticketId) {
        const match = ultimaVenta.ticketId.match(/TK-(\d+)/);
        if (match && match[1]) {
          ticketCounter = parseInt(match[1], 10);
        }
      }
    } catch (error) {
      console.error("Error al inicializar el contador de tickets:", error);
    }
  };
    inicializarTicketCounter();

  // Función para obtener las ventas con filtros y paginación
  export const obtenerVentas = async (req, res) => {
    try {
        const { codigoBarras, nombre, categoria, fechaInicio, fechaFin, page = 1, limit = 100, incluirAnuladas = false } = req.query;
        const filtro = {};
        
        if (incluirAnuladas !== 'true') {
          filtro.$or = [
            { estado: 'activa' },
            { estado: { $exists: false } },
            { estado: null },
            { estado: 'devuelta_parcial', cantidad: { $gt: 0 } }
          ];
        }
        
        if (codigoBarras) {
            filtro.codigoBarras = codigoBarras;
        }
        
        if (nombre) {
            filtro.nombre = { $regex: nombre, $options: 'i' };
        }
        
        if (categoria) {
            filtro.categoria = categoria;
        }
        
        if (fechaInicio || fechaFin) {
            filtro.fecha = {};
            if (fechaInicio) {
                filtro.fecha.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const fechaFinDate = new Date(fechaFin);
                fechaFinDate.setHours(23, 59, 59, 999);
                filtro.fecha.$lte = fechaFinDate;
            }
        }
        
        const skip = (page - 1) * limit;
        
        const ventas = await Venta.find(filtro)
            .sort({ fecha: -1 }) 
            .skip(skip)
            .limit(parseInt(limit))
             // reemplaza el id del mongoose
            .populate('usuario', 'nombre username')
            .populate('usuarioAnulacion', 'nombre username')
            .populate('usuarioDevolucion', 'nombre username')
            .populate('deudorId', 'Nombre');
        
        const totalVentas = await Venta.countDocuments(filtro);
        const totalPages = Math.ceil(totalVentas / limit);
        
        const respuesta = {
            ventas,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalVentas,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit: parseInt(limit)
            },
            filtros: {
                codigoBarras: codigoBarras || null,
                nombre: nombre || null,
                categoria: categoria || null,
                fechaInicio: fechaInicio || null,
                fechaFin: fechaFin || null,
                incluirAnuladas: incluirAnuladas === 'true'
            }
        };
        
        handleSuccess(res, 200, "Ventas obtenidas correctamente", respuesta);
    } catch (error) {
        console.error("Error al obtener las ventas:", error);
        handleErrorServer(res, 500, "Error al obtener las ventas", error.message);
    }
  };

// Función para obtener las ventas agrupadas por ticket
  export const obtenerVentasPorTicket = async (req, res) => {
    try {
      const { incluirAnuladas = false } = req.query;
      
      const matchStage = {};
      
      if (incluirAnuladas !== 'true') {
        matchStage.$or = [
          { estado: 'activa' },
          { estado: { $exists: false } },
          { estado: null },
          { estado: 'devuelta_parcial', cantidad: { $gt: 0 } } 
        ];
      }
   
      const ventasPorTicket = await Venta.aggregate([
        { $match: matchStage },
        { 
          $group: { 
            _id: "$ticketId", 
            ventas: { $push: "$$ROOT" }, 
            fecha: { $first: "$fecha" },
            usuarioId: { $first: "$usuario" },
            metodoPago: { $first: "$metodoPago" },
            deudorId: { $first: "$deudorId" },
            estado: { $first: "$estado" },
            fechaAnulacion: { $first: "$fechaAnulacion" },
            usuarioAnulacion: { $first: "$usuarioAnulacion" },
            motivoAnulacion: { $first: "$motivoAnulacion" }
          } 
        },
        { $sort: { fecha: -1 } }
      ]);

      const ventasCompletas = await Promise.all(ventasPorTicket.map(async (grupo) => {
        let resultado = { ...grupo };
        
        if (grupo.usuarioId) {
          const User = mongoose.model('User');
          const usuario = await User.findById(grupo.usuarioId).select('nombre username');
          resultado.usuario = usuario;
        }
        
        if (grupo.usuarioAnulacion) {
          const User = mongoose.model('User');
          const usuarioAnulacion = await User.findById(grupo.usuarioAnulacion).select('nombre username');
          resultado.usuarioAnulacion = usuarioAnulacion;
        }
        
        if (grupo.deudorId) {
          const deudor = await Deudores.findById(grupo.deudorId).select('Nombre');
          resultado.deudor = deudor;
        }
        
        return resultado;
      }));

      handleSuccess(res, 200, "Historial de ventas por ticket obtenido correctamente", ventasCompletas);
    } catch (error) {
      console.error("Error al obtener ventas por ticket:", error);
      handleErrorServer(res, 500, "Error al obtener las ventas por ticket", error.message);
    }
  };

// Función para anular un ticket y sus ventas asociadas
export const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { motivo } = req.body;
    
    if (!ticketId || typeof ticketId !== 'string' || ticketId.trim() === '') {
      return handleErrorClient(res, 400, "ID de ticket es requerido y debe ser válido");
    }

    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      return handleErrorClient(res, 400, "El motivo de anulación es obligatorio");
    }

    const motivoLimpio = motivo.trim();
    
    if (motivoLimpio.length < 3) {
      return handleErrorClient(res, 400, "El motivo debe tener al menos 3 caracteres");
    }

    if (motivoLimpio.length > 255) {
      return handleErrorClient(res, 400, "El motivo no puede exceder 255 caracteres");
    }

    const motivoSanitizado = motivoLimpio.replace(/[<>]/g, '');
    
    const ventasTicket = await Venta.find({ 
      ticketId: ticketId.trim(),
      $or: [
        { estado: 'activa' },
        { estado: { $exists: false } },
        { estado: null }
      ]
    });
    
    if (ventasTicket.length === 0) {
      return handleErrorClient(res, 404, "Ticket no encontrado o ya fue anulado");
    }

    const usuarioAnulacion = req.userId;

    const session = await Venta.startSession();
    
    try {
      await session.withTransaction(async () => {
        const result = await Venta.updateMany(
          { 
            ticketId: ticketId.trim(),
            $or: [
              { estado: 'activa' },
              { estado: { $exists: false } },
              { estado: null }
            ]
          },
          {
            $set: {
              estado: 'anulada',
              fechaAnulacion: new Date(),
              usuarioAnulacion: usuarioAnulacion,
              motivoAnulacion: motivoSanitizado
            }
          },
          { session }
        );
        
        if (result.modifiedCount === 0) {
          throw new Error("No se pudieron anular las ventas del ticket");
        }

        const ventaConDeudor = ventasTicket.find(venta => venta.deudorId);
        if (ventaConDeudor && ventaConDeudor.deudorId) {
          const deudor = await Deudores.findById(ventaConDeudor.deudorId).session(session);
          if (deudor) {
            const totalAnulado = ventasTicket.reduce((total, venta) => 
              total + (venta.precioVenta * venta.cantidad), 0
            );
            deudor.deudaTotal = Math.max(0, deudor.deudaTotal - totalAnulado);
            deudor.historialPagos.push({
              fecha: new Date(),
              monto: -totalAnulado,
              tipo: 'anulacion',
              comentario: `Anulación de ticket ${ticketId.trim()} - Motivo: ${motivoSanitizado}`
            });

            await deudor.save({ session });
          }
        }
      });
      
      await session.endSession();
      
      handleSuccess(res, 200, "Venta anulada correctamente (registro conservado)", { 
        ticketId: ticketId.trim(), 
        ventasAnuladas: ventasTicket.length,
        fechaAnulacion: new Date(),
        motivo: motivoSanitizado
      });
      
    } catch (transactionError) {
      await session.endSession();
      console.error("Error en la transacción:", transactionError);
      return handleErrorServer(res, 500, "Error al procesar la anulación", transactionError.message);
    }
    
  } catch (error) {
    console.error("Error al anular ticket:", error);
    handleErrorServer(res, 500, "Error al anular el ticket", error.message);
  }
};

// Función para editar un ticket y procesar devoluciones parciales
export const editTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { productos, comentario = '' } = req.body;
    
    if (!ticketId) {
      return handleErrorClient(res, 400, "ID de ticket es requerido");
    }
    
    if (!productos || !Array.isArray(productos)) {
      return handleErrorClient(res, 400, "Lista de productos es requerida");
    }

    if (!comentario || comentario.trim() === '') {
      return handleErrorClient(res, 400, "El comentario de devolución es obligatorio");
    }
    
    if (comentario.trim().length < 5) {
      return handleErrorClient(res, 400, "El comentario debe tener al menos 5 caracteres");
    }

    const comentarioSanitizado = comentario.trim().replace(/[<>]/g, '');
    const ventasOriginales = await Venta.find({ 
      ticketId,
      $or: [
        { estado: 'activa' },
        { estado: { $exists: false } },
        { estado: null },
        { estado: 'devuelta_parcial', cantidad: { $gt: 0 } }
      ]
    });
    
    if (ventasOriginales.length === 0) {
      return handleErrorClient(res, 404, "Ticket no encontrado o ya fue procesado");
    }

    const usuarioDevolucion = req.userId;
    const fechaDevolucion = new Date();
    
    for (const ventaOriginal of ventasOriginales) {
      const productoActualizado = productos.find(p => 
        p.codigoBarras === ventaOriginal.codigoBarras && 
        p.nombre === ventaOriginal.nombre
      );
      
      if (!productoActualizado || productoActualizado.cantidad === 0) {
        await Venta.updateOne(
          { _id: ventaOriginal._id },
          {
            $set: {
              estado: 'devuelta_parcial',
              cantidadOriginal: ventaOriginal.cantidad,
              cantidad: 0,
              fechaDevolucion,
              usuarioDevolucion,
              comentarioDevolucion: comentarioSanitizado
            }
          }
        );
      } else if (productoActualizado.cantidad < ventaOriginal.cantidad) {
        const estadoFinal = productoActualizado.cantidad > 0 ? 'activa' : 'devuelta_parcial';
        
        await Venta.updateOne(
          { _id: ventaOriginal._id },
          {
            $set: {
              estado: estadoFinal,
              cantidadOriginal: ventaOriginal.cantidad,
              cantidad: productoActualizado.cantidad,
              fechaDevolucion,
              usuarioDevolucion,
              comentarioDevolucion: comentarioSanitizado
            }
          }
        );
      }
    }
    // Obtener las ventas actualizadas después de la devolución
    const ventasActualizadas = await Venta.find({ 
      ticketId,
      $or: [
        { estado: 'activa' },
        { estado: 'devuelta_parcial', cantidad: { $gt: 0 } }
      ]
    });
    
    const ventaConDeudor = ventasOriginales.find(venta => venta.deudorId);
    if (ventaConDeudor && ventaConDeudor.deudorId) {
      try {
        const deudor = await Deudores.findById(ventaConDeudor.deudorId);
        if (deudor) {
          const montoOriginal = ventasOriginales.reduce((total, venta) => 
            total + (venta.precioVenta * venta.cantidad), 0
          );
          
          const montoNuevo = ventasActualizadas.reduce((total, venta) => 
            total + (venta.precioVenta * venta.cantidad), 0
          );
          
          const montoDevuelto = montoOriginal - montoNuevo;
          
          if (montoDevuelto > 0) {
            deudor.deudaTotal = Math.max(0, deudor.deudaTotal - montoDevuelto);
            
            const comentarioHistorial = comentarioSanitizado 
              ? `Devolución parcial en ticket ${ticketId} - ${comentarioSanitizado}`
              : `Devolución parcial en ticket ${ticketId}`;
            
            deudor.historialPagos.push({
              fecha: fechaDevolucion,
              monto: -montoDevuelto,
              tipo: 'devolucion',
              comentario: comentarioHistorial
            });
            
            await deudor.save();
          }
        }
      } catch (deudorError) {
        console.error("Error al actualizar deuda del deudor:", deudorError);
      }
    }
    
    if (ventasActualizadas.length === 0) {
      handleSuccess(res, 200, "Ticket completamente devuelto (registro conservado)", { 
        ticketId,
        estadoFinal: 'completamente_devuelto',
        comentario: comentarioSanitizado
      });
    } else {
      handleSuccess(res, 200, "Devolución parcial procesada correctamente", { 
        ticketId, 
        productos: ventasActualizadas,
        fechaDevolucion,
        comentario: comentarioSanitizado
      });
    }
  } catch (error) {
    console.error("Error al procesar devolución:", error);
    handleErrorServer(res, 500, "Error al procesar la devolución", error.message);
  }
};

// Función para obtener las ventas propias del usuario autenticado
export const obtenerVentasPropias = async (req, res) => {
  try {
    const userId = req.userId;
    const { fechaInicio, fechaFin } = req.query;
    
    const filtro = { usuario: userId };
    
    if (fechaInicio || fechaFin) {
      filtro.fecha = {};
      if (fechaInicio) {
        filtro.fecha.$gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999);
        filtro.fecha.$lte = fechaFinDate;
      }
    }
    
    const ventasPorTicket = await Venta.aggregate([
      { $match: filtro },
      { 
        $group: { 
          _id: "$ticketId", 
          ventas: { $push: "$$ROOT" }, 
          fecha: { $first: "$fecha" },
          usuarioId: { $first: "$usuario" },
          metodoPago: { $first: "$metodoPago" },
          deudorId: { $first: "$deudorId" }
        } 
      },
      { $sort: { fecha: -1 } }
    ]);

    const ventasCompletas = await Promise.all(ventasPorTicket.map(async (grupo) => {
      let resultado = { ...grupo };
      
      // Buscar el usuario
      if (grupo.usuarioId) {
        const User = mongoose.model('User');
        const usuario = await User.findById(grupo.usuarioId).select('nombre username');
        resultado.usuario = usuario;
      }
      
      // Buscar el deudor si existe
      if (grupo.deudorId) {
        const deudor = await Deudores.findById(grupo.deudorId).select('Nombre');
        resultado.deudor = deudor;
      }
      
      return resultado;
    }));

    handleSuccess(res, 200, "Ventas propias obtenidas correctamente", ventasCompletas);
  } catch (error) {
    console.error("Error al obtener ventas propias:", error);
    handleErrorServer(res, 500, "Error al obtener las ventas propias", error.message);
  }
};

// Función para obtener el historial de ventas anuladas
export const obtenerVentasAnuladas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, page = 1, limit = 50 } = req.query;
    const filtro = { 
      estado: { $in: ['anulada', 'devuelta_parcial'] }
    };
    
    if (fechaInicio || fechaFin) {
      filtro.fechaAnulacion = {};
      if (fechaInicio) {
        filtro.fechaAnulacion.$gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999);
        filtro.fechaAnulacion.$lte = fechaFinDate;
      }
    }
    
    const skip = (page - 1) * limit;
    
    const ventasAnuladas = await Venta.find(filtro)
      .sort({ fechaAnulacion: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('usuario', 'nombre username')
      .populate('usuarioAnulacion', 'nombre username')
      .populate('usuarioDevolucion', 'nombre username')
      .populate('deudorId', 'Nombre');
    
    const ventasPorTicket = {};
    ventasAnuladas.forEach(venta => {
      if (!ventasPorTicket[venta.ticketId]) {
        ventasPorTicket[venta.ticketId] = {
          _id: venta.ticketId,
          ventas: [],
          fecha: venta.fecha,
          fechaAnulacion: venta.fechaAnulacion,
          fechaDevolucion: venta.fechaDevolucion,
          usuario: venta.usuario,
          usuarioAnulacion: venta.usuarioAnulacion,
          usuarioDevolucion: venta.usuarioDevolucion,
          metodoPago: venta.metodoPago,
          deudor: venta.deudorId,
          motivoAnulacion: venta.motivoAnulacion,
          comentarioDevolucion: venta.comentarioDevolucion,
          estado: venta.estado
        };
      }
      ventasPorTicket[venta.ticketId].ventas.push(venta);
    });
    
    const totalVentas = await Venta.countDocuments(filtro);
    const totalPages = Math.ceil(totalVentas / limit);
    
    handleSuccess(res, 200, "Historial de ventas anuladas obtenido", {
      ventas: Object.values(ventasPorTicket),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalVentas,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error al obtener ventas anuladas:", error);
    handleErrorServer(res, 500, "Error al obtener el historial de ventas anuladas", error.message);
  }
};