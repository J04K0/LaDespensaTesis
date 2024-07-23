import axios from './root.service.js';

export const addProducts = async (product) => {
  try {
    const response = await axios.post('/products/agregar', product);
    return response;
  } catch (error) {
    console.error('Error al añadir el producto:', error);
    throw error;
  }
};

export const getProducts = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get('/products/', {
      params: { page, limit }
    });
    const { data } = response;
    const products = response.data.data;
    console.log("Productos desde el servicio", products);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {  
  try {
    const response = await axios.delete(`/products/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};
