import Venta from '../models/venta.model.js';
import mongoose from 'mongoose';
import Deudores from '../models/deudores.model.js';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../utils/resHandlers.js';
let ticketCounter = 0; // Variable global para el contador de tickets

// Función para registrar una venta con un ID de ticket secuencial
export const registrarVenta = async (req, res) => {
    try {
      const { productosVendidos, metodoPago, deudorId } = req.body;
  
      if (!productosVendidos || !Array.isArray(productosVendidos) || productosVendidos.length === 0) {
        return handleErrorClient(res, 400, "Lista de productos vendidos inválida");
      }

      ticketCounter++;
      const ticketId = `TK-${ticketCounter.toString().padStart(6, '0')}`;
      
      const userId = req.userId;
      
      const ventasRegistradas = [];
      let totalVenta = 0;

      for (const producto of productosVendidos) {
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
      }
      
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
          
          handleSuccess(res, 201, "Venta registrada correctamente y deuda asignada", { 
            ticketId, 
            productos: ventasRegistradas,
            deudor: {
              id: deudor._id,
              nombre: deudor.Nombre,
              deudaTotal: deudor.deudaTotal
            }
          });
        } else {
          handleSuccess(res, 201, "Venta registrada correctamente pero el deudor no fue encontrado", { 
            ticketId, 
            productos: ventasRegistradas 
          });
        }
      } else {
        handleSuccess(res, 201, "Venta registrada correctamente", { 
          ticketId, 
          productos: ventasRegistradas 
        });
      }
    } catch (error) {
      console.error("Error al registrar venta:", error);
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