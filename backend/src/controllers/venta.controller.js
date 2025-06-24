import Venta from '../models/venta.model.js';
import mongoose from 'mongoose';
import Deudores from '../models/deudores.model.js';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../utils/resHandlers.js';
let ticketCounter = 0; // Variable global para el contador de tickets


export const registrarVenta = async (req, res) => {
    try {
      const { productosVendidos, metodoPago, deudorId } = req.body;
  
      if (!productosVendidos || !Array.isArray(productosVendidos) || productosVendidos.length === 0) {
        return handleErrorClient(res, 400, "Lista de productos vendidos inválida");
      }
  
      // Incrementar el contador y generar un ID de ticket secuencial
      ticketCounter++;
      const ticketId = `TK-${ticketCounter.toString().padStart(6, '0')}`;
      
      // Obtener el ID del usuario que está realizando la venta
      const userId = req.userId;
      
      // Crear registros de venta para cada producto
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
          usuario: userId, // Guardar el ID del usuario que realizó la venta
          metodoPago: metodoPago || 'efectivo', // Usar el método de pago proporcionado o efectivo por defecto
          deudorId: deudorId || null // Guardar el ID del deudor si existe
        });
        
        await nuevaVenta.save();
        ventasRegistradas.push(nuevaVenta);
        totalVenta += producto.precioVenta * producto.cantidad;
      }
      
      // Si hay un deudor asignado, actualizar su deuda
      if (deudorId) {
        const deudor = await Deudores.findById(deudorId);
        if (deudor) {
          // Crear un nuevo registro de deuda en el historial de pagos
          const nuevaDeuda = {
            fecha: new Date(),
            monto: totalVenta,
            tipo: 'deuda',
            comentario: `Venta ticket ${ticketId}`
          };
          
          // Agregar la deuda al historial y actualizar la deuda total
          deudor.historialPagos.push(nuevaDeuda);
          deudor.deudaTotal += totalVenta;
          
          await deudor.save();
          
          // Incluir información del deudor en la respuesta
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

  // Añadir al inicio del archivo o en una función de inicialización
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

  // Llamar a esta función al iniciar la aplicación
    inicializarTicketCounter();

  // ✅ Obtener ventas con filtros optimizados
  export const obtenerVentas = async (req, res) => {
    try {
        const { codigoBarras, nombre, categoria, fechaInicio, fechaFin, page = 1, limit = 100, incluirAnuladas = false } = req.query;
        
        // Construir el filtro dinámicamente
        const filtro = {};
        
        // Por defecto, solo mostrar ventas activas, a menos que se solicite explícitamente incluir anuladas
        if (incluirAnuladas !== 'true') {
          filtro.$or = [
            { estado: 'activa' },
            { estado: { $exists: false } }, // Ventas anteriores sin campo estado
            { estado: null }, // Ventas con estado null
            { estado: 'devuelta_parcial', cantidad: { $gt: 0 } } // 🆕 Devoluciones parciales que aún tienen cantidad
          ];
        }
        
        // Filtro por código de barras (coincidencia exacta)
        if (codigoBarras) {
            filtro.codigoBarras = codigoBarras;
        }
        
        // Filtro por nombre (búsqueda parcial, insensible a mayúsculas)
        if (nombre) {
            filtro.nombre = { $regex: nombre, $options: 'i' };
        }
        
        // Filtro por categoría
        if (categoria) {
            filtro.categoria = categoria;
        }
        
        // Filtro por rango de fechas
        if (fechaInicio || fechaFin) {
            filtro.fecha = {};
            if (fechaInicio) {
                filtro.fecha.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const fechaFinDate = new Date(fechaFin);
                fechaFinDate.setHours(23, 59, 59, 999); // Incluir todo el día
                filtro.fecha.$lte = fechaFinDate;
            }
        }
        
        // Calcular paginación
        const skip = (page - 1) * limit;
        
        // Ejecutar consulta con filtros y paginación
        const ventas = await Venta.find(filtro)
            .sort({ fecha: -1 }) // Ordenar por fecha descendente
            .skip(skip)
            .limit(parseInt(limit))
            .populate('usuario', 'nombre username') // Incluir datos del usuario
            .populate('usuarioAnulacion', 'nombre username') // Incluir datos del usuario que anuló
            .populate('usuarioDevolucion', 'nombre username') // Incluir datos del usuario que hizo devolución
            .populate('deudorId', 'Nombre'); // Incluir datos del deudor si existe
        
        // Contar total de documentos que coinciden con el filtro
        const totalVentas = await Venta.countDocuments(filtro);
        const totalPages = Math.ceil(totalVentas / limit);
        
        // Preparar respuesta con metadatos de paginación
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

  export const obtenerVentasPorTicket = async (req, res) => {
    try {
      const { incluirAnuladas = false } = req.query;
      
      // Construir filtro para el aggregate
      const matchStage = {};
      
      // 🔧 FIX: Incluir ventas que no tienen estado definido (ventas anteriores) y ventas activas
      if (incluirAnuladas !== 'true') {
        // Incluir ventas activas Y ventas sin estado definido (ventas anteriores) Y devoluciones parciales con cantidad > 0
        matchStage.$or = [
          { estado: 'activa' },
          { estado: { $exists: false } }, // Ventas anteriores sin campo estado
          { estado: null }, // Ventas con estado null
          { estado: 'devuelta_parcial', cantidad: { $gt: 0 } } // 🆕 Devoluciones parciales que aún tienen cantidad
        ];
      }
      
      // Primero obtenemos el primer registro de cada ticketId para conseguir el ID del usuario
      const ventasPorTicket = await Venta.aggregate([
        // Filtrar ventas según el estado
        { $match: matchStage },
        // Agrupar por ticketId
        { 
          $group: { 
            _id: "$ticketId", 
            ventas: { $push: "$$ROOT" }, 
            fecha: { $first: "$fecha" },
            usuarioId: { $first: "$usuario" }, // Obtener el ID del usuario
            metodoPago: { $first: "$metodoPago" }, // Obtener el método de pago
            deudorId: { $first: "$deudorId" }, // Obtener el ID del deudor si existe
            estado: { $first: "$estado" }, // Obtener el estado del ticket
            fechaAnulacion: { $first: "$fechaAnulacion" },
            usuarioAnulacion: { $first: "$usuarioAnulacion" },
            motivoAnulacion: { $first: "$motivoAnulacion" }
          } 
        },
        // Ordenar por fecha descendente
        { $sort: { fecha: -1 } }
      ]);

      // Poblar la información del usuario y del deudor para cada grupo de ventas
      const ventasCompletas = await Promise.all(ventasPorTicket.map(async (grupo) => {
        let resultado = { ...grupo };
        
        // Buscar el usuario si existe
        if (grupo.usuarioId) {
          const User = mongoose.model('User');
          const usuario = await User.findById(grupo.usuarioId).select('nombre username');
          resultado.usuario = usuario;
        }
        
        // Buscar el usuario que anuló si existe
        if (grupo.usuarioAnulacion) {
          const User = mongoose.model('User');
          const usuarioAnulacion = await User.findById(grupo.usuarioAnulacion).select('nombre username');
          resultado.usuarioAnulacion = usuarioAnulacion;
        }
        
        // Buscar el deudor si existe
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

export const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { motivo } = req.body;
    
    // 🔧 VALIDACIÓN MEJORADA: Verificar parámetros con más detalle
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

    // 🔧 SEGURIDAD: Sanitizar motivo para prevenir inyecciones
    const motivoSanitizado = motivoLimpio.replace(/[<>]/g, ''); // Remover caracteres peligrosos básicos
    
    console.log('🔍 Backend - ticketId:', ticketId.trim());
    console.log('🔍 Backend - motivo sanitizado:', motivoSanitizado);

    // Buscar todas las ventas del ticket para verificar que existan y estén activas
    const ventasTicket = await Venta.find({ 
      ticketId: ticketId.trim(),
      $or: [
        { estado: 'activa' },
        { estado: { $exists: false } }, // Ventas anteriores sin campo estado
        { estado: null } // Ventas con estado null
      ]
    });
    
    if (ventasTicket.length === 0) {
      return handleErrorClient(res, 404, "Ticket no encontrado o ya fue anulado");
    }

    // Obtener el ID del usuario que está anulando
    const usuarioAnulacion = req.userId;

    // 🔧 TRANSACCIÓN: Usar transacción para asegurar consistencia
    const session = await Venta.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Marcar todas las ventas del ticket como anuladas
        const result = await Venta.updateMany(
          { 
            ticketId: ticketId.trim(),
            $or: [
              { estado: 'activa' },
              { estado: { $exists: false } }, // Ventas anteriores sin campo estado
              { estado: null } // Ventas con estado null
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

        // Si había un deudor asociado, revertir la deuda
        const ventaConDeudor = ventasTicket.find(venta => venta.deudorId);
        if (ventaConDeudor && ventaConDeudor.deudorId) {
          const deudor = await Deudores.findById(ventaConDeudor.deudorId).session(session);
          if (deudor) {
            // Calcular el total de la venta anulada
            const totalAnulado = ventasTicket.reduce((total, venta) => 
              total + (venta.precioVenta * venta.cantidad), 0
            );

            // Restar la deuda del total
            deudor.deudaTotal = Math.max(0, deudor.deudaTotal - totalAnulado);

            // Agregar registro en el historial de pagos
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

export const editTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { productos, comentario = '' } = req.body; // 🆕 Recibir comentario obligatorio
    
    if (!ticketId) {
      return handleErrorClient(res, 400, "ID de ticket es requerido");
    }
    
    if (!productos || !Array.isArray(productos)) {
      return handleErrorClient(res, 400, "Lista de productos es requerida");
    }

    // 🆕 Validar que el comentario sea obligatorio
    if (!comentario || comentario.trim() === '') {
      return handleErrorClient(res, 400, "El comentario de devolución es obligatorio");
    }
    
    if (comentario.trim().length < 5) {
      return handleErrorClient(res, 400, "El comentario debe tener al menos 5 caracteres");
    }

    // 🆕 Sanitizar comentario
    const comentarioSanitizado = comentario.trim().replace(/[<>]/g, '');

    // Obtener las ventas originales del ticket que están activas
    // 🔧 FIX: Obtener las ventas originales del ticket, incluyendo devoluciones parciales con cantidad > 0
    const ventasOriginales = await Venta.find({ 
      ticketId,
      $or: [
        { estado: 'activa' },
        { estado: { $exists: false } }, // Ventas anteriores sin campo estado
        { estado: null }, // Ventas con estado null
        { estado: 'devuelta_parcial', cantidad: { $gt: 0 } } // 🆕 Devoluciones parciales que aún tienen cantidad
      ]
    });
    
    if (ventasOriginales.length === 0) {
      return handleErrorClient(res, 404, "Ticket no encontrado o ya fue procesado");
    }

    const usuarioDevolucion = req.userId;
    const fechaDevolucion = new Date();
    
    // Procesar cada producto original comparándolo con los nuevos
    for (const ventaOriginal of ventasOriginales) {
      const productoActualizado = productos.find(p => 
        p.codigoBarras === ventaOriginal.codigoBarras && 
        p.nombre === ventaOriginal.nombre
      );
      
      if (!productoActualizado || productoActualizado.cantidad === 0) {
        // El producto fue completamente devuelto - marcar como devuelto
        await Venta.updateOne(
          { _id: ventaOriginal._id },
          {
            $set: {
              estado: 'devuelta_parcial',
              cantidadOriginal: ventaOriginal.cantidad,
              cantidad: 0,
              fechaDevolucion,
              usuarioDevolucion,
              comentarioDevolucion: comentarioSanitizado // 🆕 Guardar comentario
            }
          }
        );
      } else if (productoActualizado.cantidad < ventaOriginal.cantidad) {
        // 🔧 FIX: Devolución parcial - solo marcar como 'devuelta_parcial' si la cantidad final es 0
        // Si la cantidad final > 0, mantener como 'activa' pero guardar la información de devolución
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
              comentarioDevolucion: comentarioSanitizado // 🆕 Guardar comentario
            }
          }
        );
      }
      // Si la cantidad es igual o mayor, no se hace nada (no hay devolución)
    }

    // Obtener las ventas actualizadas para la respuesta
    const ventasActualizadas = await Venta.find({ 
      ticketId,
      $or: [
        { estado: 'activa' },
        { estado: 'devuelta_parcial', cantidad: { $gt: 0 } }
      ]
    });
    
    // Calcular el monto total devuelto para actualizar deuda si es necesario
    const ventaConDeudor = ventasOriginales.find(venta => venta.deudorId);
    if (ventaConDeudor && ventaConDeudor.deudorId) {
      try {
        const deudor = await Deudores.findById(ventaConDeudor.deudorId);
        if (deudor) {
          // Calcular el monto total original y el nuevo monto
          const montoOriginal = ventasOriginales.reduce((total, venta) => 
            total + (venta.precioVenta * venta.cantidad), 0
          );
          
          const montoNuevo = ventasActualizadas.reduce((total, venta) => 
            total + (venta.precioVenta * venta.cantidad), 0
          );
          
          const montoDevuelto = montoOriginal - montoNuevo;
          
          if (montoDevuelto > 0) {
            // Reducir la deuda
            deudor.deudaTotal = Math.max(0, deudor.deudaTotal - montoDevuelto);
            
            // 🆕 Incluir comentario en el historial si existe
            const comentarioHistorial = comentarioSanitizado 
              ? `Devolución parcial en ticket ${ticketId} - ${comentarioSanitizado}`
              : `Devolución parcial en ticket ${ticketId}`;
            
            // Agregar registro en el historial
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
        // No fallar la devolución por error en deudor
      }
    }
    
    if (ventasActualizadas.length === 0) {
      handleSuccess(res, 200, "Ticket completamente devuelto (registro conservado)", { 
        ticketId,
        estadoFinal: 'completamente_devuelto',
        comentario: comentarioSanitizado // 🆕 Incluir comentario en respuesta
      });
    } else {
      handleSuccess(res, 200, "Devolución parcial procesada correctamente", { 
        ticketId, 
        productos: ventasActualizadas,
        fechaDevolucion,
        comentario: comentarioSanitizado // 🆕 Incluir comentario en respuesta
      });
    }
  } catch (error) {
    console.error("Error al procesar devolución:", error);
    handleErrorServer(res, 500, "Error al procesar la devolución", error.message);
  }
};

export const obtenerVentasPropias = async (req, res) => {
  try {
    const userId = req.userId; // ID del usuario autenticado
    const { fechaInicio, fechaFin } = req.query;
    
    // Construir filtro para obtener solo las ventas del usuario actual
    const filtro = { usuario: userId };
    
    // Filtro por rango de fechas si se proporciona
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
    
    // Agrupar ventas por ticket del usuario actual
    const ventasPorTicket = await Venta.aggregate([
      // Filtrar solo las ventas del usuario actual
      { $match: filtro },
      // Agrupar por ticketId
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
      // Ordenar por fecha descendente
      { $sort: { fecha: -1 } }
    ]);

    // Poblar la información del usuario y del deudor
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

export const obtenerVentasAnuladas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, page = 1, limit = 50 } = req.query;
    
    // Construir filtro para ventas anuladas
    const filtro = { 
      estado: { $in: ['anulada', 'devuelta_parcial'] }
    };
    
    // Filtro por rango de fechas
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
    
    // Calcular paginación
    const skip = (page - 1) * limit;
    
    // Obtener ventas anuladas con información completa
    const ventasAnuladas = await Venta.find(filtro)
      .sort({ fechaAnulacion: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('usuario', 'nombre username')
      .populate('usuarioAnulacion', 'nombre username')
      .populate('usuarioDevolucion', 'nombre username')
      .populate('deudorId', 'Nombre');
    
    // Agrupar por ticket para mostrar información completa
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
          comentarioDevolucion: venta.comentarioDevolucion, // 🆕 Incluir comentario de devolución
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