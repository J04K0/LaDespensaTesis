import axios from './root.service.js';

export const addProducts = async (formData) => {
    try {
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        };
        const response = await axios.post('/products/agregar', formData, config);
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
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    const response = await axios.patch(`/products/actualizar/${id}`, productData, config);
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

export const scanProducts = async (codigoBarras) => {
  try {
    const response = await axios.post('/products/scan', { codigoBarras });
    return response;
  } catch (error) {
    console.error('❌ Error al escanear el producto:', error.response?.data || error.message);
    throw error;
  }
};

export const actualizarStockVenta = async (productosVendidos) => {
  try {
    const response = await axios.post("/products/actualizar-stock-venta", { productosVendidos });
    return response.data;
  } catch (error) {
    console.error("❌ Error al actualizar stock:", error);
    throw error;
  }
};

export const registrarVenta = async (productosVendidos) => {
  try {
    const response = await axios.post("/products/registrar-venta", { productosVendidos });
    return response.data;
  } catch (error) {
    console.error("❌ Error al registrar la venta:", error);
    throw error;
  }
};

export const obtenerVentas = async () => {
  try {
    const response = await axios.get("/products/ventas/obtener");
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener las ventas:", error);
    throw error;
  }
}

export const obtenerVentasPorTicket = async () => {
  try {
    const response = await axios.get("/products/ventas/tickets");
    console.log("Respuesta del servidor:", response);
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener las ventas por ticket:", error);
    throw error;
  }
};

export const getProductByBarcode = async (barcode) => {
  try {
    const response = await axios.get(`/products/getbybarcode/${barcode}`);
    if (response && response.data && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('Respuesta inesperada del servidor');
    }
  } catch (error) {
    console.error('Error fetching product by barcode:', error.response?.data || error.message);
    throw error;
  }
}

export const getProductByBarcodeForCreation = async (barcode) => {
  try {
    const response = await axios.get(`/products/getbybarcodecreate/${barcode}`);
    if (response && response.data && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('Respuesta inesperada del servidor');
    }
  } catch (error) {
    console.error('Error fetching product by barcode:', error.response?.data || error.message);
    throw error;
  }
};