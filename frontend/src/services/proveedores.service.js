import axios from './root.service.js';

export const getProveedores = async (page = 1, limit = 8) => {
  try {
    const response = await axios.get('/proveedores', {
      params: { page, limit }
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
    const response = await axios.delete(`/proveedores/eliminar/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    throw error;
  }
};