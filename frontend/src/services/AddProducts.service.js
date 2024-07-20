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

export const getProducts = async () => {
  try {
    const response = await axios.get('/products/');
    const products = response.data.data; // Asegúrate de que esta es la estructura correcta
    console.log('Productos desde el servicio:', products); // Verifica los datos aquí
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
}


