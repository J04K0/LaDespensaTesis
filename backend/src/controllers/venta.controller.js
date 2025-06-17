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
        const { codigoBarras, nombre, categoria, fechaInicio, fechaFin, page = 1, limit = 100 } = req.query;
        
        // Construir el filtro dinámicamente
        const filtro = {};
        
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
                fechaFin: fechaFin || null
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
      // Primero obtenemos el primer registro de cada ticketId para conseguir el ID del usuario
      const ventasPorTicket = await Venta.aggregate([
        // Agrupar por ticketId
        { 
          $group: { 
            _id: "$ticketId", 
            ventas: { $push: "$$ROOT" }, 
            fecha: { $first: "$fecha" },
            usuarioId: { $first: "$usuario" }, // Obtener el ID del usuario
            metodoPago: { $first: "$metodoPago" }, // Obtener el método de pago
            deudorId: { $first: "$deudorId" } // Obtener el ID del deudor si existe
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
    
    if (!ticketId) {
      return handleErrorClient(res, 400, "ID de ticket es requerido");
    }

    // Encontrar y eliminar todas las ventas asociadas a este ticket
    const result = await Venta.deleteMany({ ticketId });
    
    if (result.deletedCount === 0) {
      return handleErrorClient(res, 404, "Ticket no encontrado o ya fue eliminado");
    }
    
    handleSuccess(res, 200, "Ticket eliminado correctamente", { ticketId, deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error al eliminar ticket:", error);
    handleErrorServer(res, 500, "Error al eliminar el ticket", error.message);
  }
};

export const editTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { productos } = req.body;
    
    if (!ticketId) {
      return handleErrorClient(res, 400, "ID de ticket es requerido");
    }
    
    if (!productos || !Array.isArray(productos)) {
      return handleErrorClient(res, 400, "Lista de productos es requerida");
    }

    // Obtener una venta original para preservar el usuario, método de pago y deudor
    const ventaOriginal = await Venta.findOne({ ticketId });
    const usuarioOriginal = ventaOriginal ? ventaOriginal.usuario : null;
    const metodoPagoOriginal = ventaOriginal ? ventaOriginal.metodoPago : 'efectivo';
    const deudorIdOriginal = ventaOriginal ? ventaOriginal.deudorId : null;

    // Primero eliminamos todas las ventas asociadas a este ticket
    await Venta.deleteMany({ ticketId });
    
    // Luego creamos nuevos registros con los productos actualizados
    const ventasActualizadas = [];
    for (const producto of productos) {
      // Solo crear registros para productos con cantidad > 0
      if (producto.cantidad > 0) {
        const nuevaVenta = new Venta({
          ticketId,
          nombre: producto.nombre,
          codigoBarras: producto.codigoBarras,
          categoria: producto.categoria,
          cantidad: producto.cantidad,
          precioVenta: producto.precioVenta,
          precioCompra: producto.precioCompra,
          fecha: new Date(),
          usuario: usuarioOriginal, // Mantener el usuario original que hizo la venta
          metodoPago: metodoPagoOriginal, // Mantener el método de pago original
          deudorId: deudorIdOriginal // Mantener el deudor original
        });
        
        await nuevaVenta.save();
        ventasActualizadas.push(nuevaVenta);
      }
    }
    
    // Si no quedan productos, eliminamos completamente el ticket
    if (ventasActualizadas.length === 0) {
      handleSuccess(res, 200, "Ticket eliminado ya que no quedan productos", { ticketId });
    } else {
      handleSuccess(res, 200, "Ticket actualizado correctamente", { 
        ticketId, 
        productos: ventasActualizadas 
      });
    }
  } catch (error) {
    console.error("Error al editar ticket:", error);
    handleErrorServer(res, 500, "Error al editar el ticket", error.message);
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