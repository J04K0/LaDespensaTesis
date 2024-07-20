import axios from './root.service.js';

export const getDeudores = async (page = 1, limit = 6) => {
  try {
    const response = await axios.get('/deudores', {
      params: { page, limit }
    });
    const deudores = response.data.data; // Asegúrate de que esta es la estructura correcta
    console.log('Deudores desde el servicio:', deudores); // Verifica los datos aquí
    return deudores;
  } catch (error) {
    console.error('Error fetching deudores:', error);
    throw error;
  }
};

export const getDeudorById = async (id) => {
  try {
    const response = await axios.get(`/deudores/getbyid/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching deudor by id:', error);
    throw error;
  }
};

export const updateDeudor = async (id, deudorData) => {
  try {
    const response = await axios.patch(`/deudores/actualizar/${id}`, deudorData); // Cambiado a PATCH
    return response.data.data;
  } catch (error) {
    console.error('Error updating deudor:', error);
    throw error;
  }
};

export const deleteDeudor = async (id) => {
  try {
    const response = await axios.delete(`/deudores/eliminar/${id}`);
    return response.data.data; // Asegúrate de que esta es la estructura correcta
  } catch (error) {
    console.error('Error deleting deudor:', error);
    throw error;
  }
};
