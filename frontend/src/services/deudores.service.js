import axios from './root.service.js';

export const getDeudores = async (page = 1, limit = 6, incluirInactivos = false) => {
  try {
    const response = await axios.get('/deudores', {
      params: { page, limit, incluirInactivos }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching deudores:', error);
    throw error;
  }
};

export const getDeudoresSimple = async () => {
  try {
    const response = await axios.get('/deudores/simple');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching simple deudores list:', error);
    throw error;
  }
};

export const getDeudorById = async (id) => {
  try {
    const response = await axios.get(`/deudores/getbyid/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching deudor by ID:', error);
    throw error;
  }
};

export const updateDeudor = async (id, deudorData) => {
  try {
    const response = await axios.patch(`/deudores/actualizar/${id}`, deudorData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating deudor:', error);
    throw error;
  }
};

export const deleteDeudor = async (id) => {
  try {
    const response = await axios.delete(`/deudores/eliminar/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting deudor:', error);
    throw error;
  }
};

export const addDeudor = async (deudorData) => {
  try {
    const response = await axios.post('/deudores/agregar', deudorData);
    return response.data.data;
  } catch (error) {
    console.error('Error adding deudor:', error);
    throw error;
  }
};

export const cambiarEstadoDeudor = async (id, activo) => {
  try {
    const response = await axios.patch(`/deudores/cambiar-estado/${id}`, { activo });
    return response.data.data;
  } catch (error) {
    console.error('Error al cambiar estado del deudor:', error);
    throw error;
  }
};
