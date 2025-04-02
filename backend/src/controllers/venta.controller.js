import Venta from '../models/venta.model.js';
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
          fecha: new Date()
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
      const ventasPorTicket = await Venta.aggregate([
        { $group: { _id: "$ticketId", ventas: { $push: "$$ROOT" }, fecha: { $first: "$fecha" } } },
        { $sort: { fecha: -1 } } // Ordenar por fecha descendente
      ]);
      handleSuccess(res, 200, "Historial de ventas por ticket obtenido correctamente", ventasPorTicket);
    } catch (error) {
      console.error("Error al obtener ventas por ticket:", error);
      handleErrorServer(res, 500, "Error al obtener las ventas por ticket", error.message);
    }
  };