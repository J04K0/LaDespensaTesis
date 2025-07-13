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
      
      // Nuevo parámetro para incluir ventas anuladas
      if (filtros.incluirAnuladas) {
        params.append('incluirAnuladas', filtros.incluirAnuladas);
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

  export const obtenerVentasPorTicket = async (incluirAnuladas = false) => {
    try {
      const params = incluirAnuladas ? '?incluirAnuladas=true' : '';
      const response = await axios.get(`/ventas/ventas/tickets${params}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error al obtener las ventas por ticket:", error);
      throw error;
    }
  };

  // Nueva función para obtener ventas anuladas
  export const obtenerVentasAnuladas = async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      
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
      const url = queryString ? `/ventas/ventas/anuladas?${queryString}` : "/ventas/ventas/anuladas";
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("❌ Error al obtener las ventas anuladas:", error);
      throw error;
    }
  };

  export const eliminarTicket = async (ticketId, motivo) => {
    try {
      if (!ticketId || typeof ticketId !== 'string' || ticketId.trim() === '') {
        throw new Error('ID de ticket inválido');
      }
      
      if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
        throw new Error('El motivo de anulación es obligatorio');
      }
      
      if (motivo.trim().length < 3) {
        throw new Error('El motivo debe tener al menos 3 caracteres');
      }
      
      if (motivo.trim().length > 255) {
        throw new Error('El motivo no puede exceder 255 caracteres');
      }
      
      console.log('🔍 Motivo validado a enviar:', motivo.trim()); // DEBUG
      
      const response = await axios.delete(`/ventas/ticket/${encodeURIComponent(ticketId.trim())}`, { 
        data: { motivo: motivo.trim() } 
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error al anular el ticket:", error);
      // Propagar errores de validación tal como están
      if (error.message.includes('motivo') || error.message.includes('ticket')) {
        throw error;
      }
      // Para otros errores, crear un mensaje más amigable
      throw new Error('No se pudo anular la venta. Por favor, intente nuevamente.');
    }
  };

  export const editarTicket = async (ticketId, productos, comentario = '') => {
    try {
      const response = await axios.put(`/ventas/ticket/${ticketId}`, { 
        productos,
        comentario: comentario.trim() // 🆕 Enviar comentario al backend
      });
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