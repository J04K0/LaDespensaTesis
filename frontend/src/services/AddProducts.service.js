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
    const products = response.data.data;
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`/products/eliminar/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const getProductsByCategory = async (category) => {
  try {
    const response = await axios.get(`/products/getbycategory/${category}`);
    const products = response.data.data;
    return products;
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

export const getOutOfStockProducts = async () => {
  try {
    const response = await axios.get('/products/verificarstock');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching out of stock products:', error);
    throw error;
  }
};

export const getLowStockProducts = async () => {
  try {
    const response = await axios.get('/products/verificarstock');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    throw error;
  }
};


export const getProductsExpiringSoon = async () => {
  try {
    const response = await axios.get('/products/expiringsoon');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching products expiring soon:', error);
    throw error;
  }
};

export const getExpiredProducts = async () => {
  try {
    const response = await axios.get('/products/expired');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching expired products:', error);
    throw error;
  }
};

