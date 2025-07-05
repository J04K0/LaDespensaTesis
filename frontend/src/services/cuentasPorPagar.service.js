import axios from './root.service.js';

// Obtener todas las cuentas por pagar con filtros
export const getCuentasPorPagar = async (page = 1, limit = 1000, categoria = '', estado = '', year = '') => {
  try {
    const params = { page, limit };
    if (categoria) params.categoria = categoria;
    if (estado) params.estado = estado;
    if (year) params.year = year;
    
    const response = await axios.get('/cuentasPorPagar', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener cuentas por pagar:', error);
    throw error;
  }
};

// Obtener una cuenta por pagar por ID
export const getCuentaPorPagarById = async (id) => {
  try {
    const response = await axios.get(`/cuentasPorPagar/getbyid/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener cuenta por pagar por ID:', error);
    throw error;
  }
};

// Crear una nueva cuenta por pagar
export const createCuentaPorPagar = async (cuentaData) => {
  try {
    const response = await axios.post('/cuentasPorPagar/agregar', cuentaData);
    return response.data;
  } catch (error) {
    console.error('Error al crear cuenta por pagar:', error);
    throw error;
  }
};

// Actualizar una cuenta por pagar
export const updateCuentaPorPagar = async (id, cuentaData) => {
  try {
    const response = await axios.patch(`/cuentasPorPagar/actualizar/${id}`, cuentaData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar cuenta por pagar:', error);
    throw error;
  }
};

// Eliminar una cuenta por pagar
export const deleteCuentaPorPagar = async (id) => {
  try {
    const response = await axios.delete(`/cuentasPorPagar/eliminar/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar cuenta por pagar:', error);
    throw error;
  }
};

// Marcar una cuenta como pagada
export const marcarComoPagada = async (id) => {
  try {
    const response = await axios.patch(`/cuentasPorPagar/pagar/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al marcar cuenta como pagada:', error);
    throw error;
  }
};

// Desmarcar una cuenta como pagada
export const desmarcarComoPagada = async (id) => {
  try {
    const response = await axios.patch(`/cuentasPorPagar/desmarcar/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al desmarcar cuenta como pagada:', error);
    throw error;
  }
};

// Obtener cuentas por categoría
export const getCuentasPorCategoria = async (categoria) => {
  try {
    const response = await axios.get(`/cuentasPorPagar/categoria/${categoria}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener cuentas por categoría:', error);
    throw error;
  }
};

// Cambiar el estado de una cuenta por pagar (activo/inactivo)
export const cambiarEstadoCuenta = async (id, activo) => {
  try {
    const response = await axios.patch(`/cuentasPorPagar/cambiar-estado/${id}`, { activo });
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado de la cuenta:', error);
    throw error;
  }
};