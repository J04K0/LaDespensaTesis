import axios from './root.service.js';

export const registrarVenta = async (productosVendidos, metodoPago = 'efectivo', deudorId = null) => {
    try {
      const response = await axios.post("/ventas/registrar-venta", { 
        productosVendidos,
        metodoPago,
        deudorId
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error al registrar la venta:", error);
      throw error;
    }
  };

  export const obtenerVentas = async () => {
    try {
      const response = await axios.get("/ventas/ventas/obtener");
      return response.data;
    } catch (error) {
      console.error("❌ Error al obtener las ventas:", error);
      throw error;
    }
  }

  export const obtenerVentasPorTicket = async () => {
    try {
      const response = await axios.get("/ventas/ventas/tickets");
      return response.data;
    } catch (error) {
      console.error("❌ Error al obtener las ventas por ticket:", error);
      throw error;
    }
  };

  export const eliminarTicket = async (ticketId) => {
    try {
      const response = await axios.delete(`/ventas/ticket/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error al eliminar el ticket:", error);
      throw error;
    }
  };

  export const editarTicket = async (ticketId, productos) => {
    try {
      const response = await axios.put(`/ventas/ticket/${ticketId}`, { productos });
      return response.data;
    } catch (error) {
      console.error("❌ Error al editar el ticket:", error);
      throw error;
    }
  };