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

  export const obtenerVentas = async (filtros = {}) => {
    try {
      // Construir query parameters desde el objeto filtros
      const params = new URLSearchParams();
      
      if (filtros.codigoBarras) {
        params.append('codigoBarras', filtros.codigoBarras);
      }
      
      if (filtros.nombre) {
        params.append('nombre', filtros.nombre);
      }
      
      if (filtros.categoria) {
        params.append('categoria', filtros.categoria);
      }
      
      if (filtros.fechaInicio) {
        params.append('fechaInicio', filtros.fechaInicio);
      }
      
      if (filtros.fechaFin) {
        params.append('fechaFin', filtros.fechaFin);
      }
      
      if (filtros.page) {
        params.append('page', filtros.page);
      }
      
      if (filtros.limit) {
        params.append('limit', filtros.limit);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/ventas/ventas/obtener?${queryString}` : "/ventas/ventas/obtener";
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("❌ Error al obtener las ventas:", error);
      throw error;
    }
  }

  // Función específica para obtener ventas de un producto
  export const obtenerVentasProducto = async (codigoBarras, nombre = null) => {
    try {
      const filtros = { codigoBarras };
      if (nombre) {
        filtros.nombre = nombre;
      }
      
      const response = await obtenerVentas(filtros);
      return response;
    } catch (error) {
      console.error("❌ Error al obtener las ventas del producto:", error);
      throw error;
    }
  };

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

  export const obtenerVentasPropias = async (filtros = {}) => {
    try {
      // Construir query parameters desde el objeto filtros
      const params = new URLSearchParams();
      
      if (filtros.fechaInicio) {
        params.append('fechaInicio', filtros.fechaInicio);
      }
      
      if (filtros.fechaFin) {
        params.append('fechaFin', filtros.fechaFin);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/ventas/ventas/mis-ventas?${queryString}` : "/ventas/ventas/mis-ventas";
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("❌ Error al obtener las ventas propias:", error);
      throw error;
    }
  };