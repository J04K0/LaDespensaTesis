import axios from './root.service.js';

export const getProveedores = async (page = 1, limit = 10, incluirInactivos = false) => {
  try {
    const response = await axios.get('/proveedores', {
      params: { page, limit, incluirInactivos }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    throw error;
  }
};

export const getProveedorById = async (id) => {
  try {
    const response = await axios.get(`/proveedores/getbyid/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener proveedor por ID:', error);
    throw error;
  }
};

export const createProveedor = async (proveedorData) => {
  try {
    const response = await axios.post('/proveedores/agregar', proveedorData);
    return response.data.data;
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    throw error;
  }
};

export const updateProveedor = async (id, proveedorData) => {
  try {
    const response = await axios.patch(`/proveedores/actualizar/${id}`, proveedorData);
    return response.data.data;
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    throw error;
  }
};

export const deleteProveedor = async (id) => {
  try {
    const response = await axios.delete(`/proveedores/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    throw error;
  }
};

export const cambiarEstadoProveedor = async (id, activo) => {
  try {
    const response = await axios.patch(`/proveedores/cambiar-estado/${id}`, { activo });
    return response.data.data;
  } catch (error) {
    console.error('Error al cambiar estado del proveedor:', error);
    throw error;
  }
};

export const vincularProductosAProveedor = async (proveedorId, productosIds) => {
  try {
    const response = await axios.patch(`/proveedores/vincular-productos/${proveedorId}`, {
      productos: productosIds
    });
    return response.data.data;
  } catch (error) {
    console.error('Error al vincular productos al proveedor:', error);
    throw error;
  }
};

export const getProductosProveedor = async (id) => {
  try {
    const response = await axios.get(`/proveedores/productos/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener productos del proveedor:', error);
    throw error;
  }
};