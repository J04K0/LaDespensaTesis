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

export const getProducts = async (page, limit) => {
  try {
    const response = await axios.get(`/products?page=${page}&limit=${limit}`);
    const products = response.data.data; // Asegúrate de que esta es la estructura correcta
    console.log('Productos desde el servicio:', products); // Verifica los datos aquí
    return response.data; // Ajusta según sea necesario
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`/products/eliminar/${id}`);
    return response.data.data; // Asegúrate de que esta es la estructura correcta
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const getProductsByCategory = async (category) => {
  try {
    const response = await axios.get(`/products/getbycategory/${category}`);
    const products = response.data.data; // Ajustar según la estructura de tu respuesta
    console.log('Productos por categoría desde el servicio:', products); // Verifica los datos aquí
    return products; // Ajusta según sea necesario
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await axios.patch(`products/actualizar/${id}`, productData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await axios.get(`products/getbyid/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching product by id:', error);
    throw error;
  }
};