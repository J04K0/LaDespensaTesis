import Venta from '../models/venta.model.js';
import mongoose from 'mongoose';
import { handleErrorClient, handleErrorServer, handleSuccess } from '../utils/resHandlers.js';
let ticketCounter = 0; // Variable global para el contador de tickets


export const registrarVenta = async (req, res) => {
    try {
      const { productosVendidos } = req.body;
  
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
          usuario: userId // Guardar el ID del usuario que realizó la venta
        });
        
        await nuevaVenta.save();
        ventasRegistradas.push(nuevaVenta);
      }
      
      handleSuccess(res, 201, "Venta registrada correctamente", { 
        ticketId, 
        productos: ventasRegistradas 
      });
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

  // ✅ Obtener todas las ventas para estadísticas
  export const obtenerVentas = async (req, res) => {
    try {
        const ventas = await Venta.find();
        handleSuccess(res, 200, "Historial de ventas obtenido correctamente", ventas);
    } catch (error) {
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
            usuarioId: { $first: "$usuario" } // Obtener el ID del usuario
          } 
        },
        // Ordenar por fecha descendente
        { $sort: { fecha: -1 } }
      ]);

      // Poblar la información del usuario para cada grupo de ventas
      const ventasConUsuario = await Promise.all(ventasPorTicket.map(async (grupo) => {
        if (grupo.usuarioId) {
          // Importar el modelo de Usuario
          const User = mongoose.model('User');
          
          // Buscar el usuario por ID
          const usuario = await User.findById(grupo.usuarioId).select('nombre username');
          
          // Añadir la información del usuario al grupo
          return {
            ...grupo,
            usuario: usuario
          };
        }
        return grupo;
      }));

      handleSuccess(res, 200, "Historial de ventas por ticket obtenido correctamente", ventasConUsuario);
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

    // Obtener una venta original para preservar el usuario
    const ventaOriginal = await Venta.findOne({ ticketId });
    const usuarioOriginal = ventaOriginal ? ventaOriginal.usuario : null;

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
          usuario: usuarioOriginal // Mantener el usuario original que hizo la venta
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