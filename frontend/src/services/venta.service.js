import axios from './root.service.js';

export const registrarVenta = async (productosVendidos) => {
    try {
      const response = await axios.post("/ventas/registrar-venta", { productosVendidos });
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