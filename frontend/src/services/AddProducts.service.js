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