import axios from './root.service.js';

export const addProducts = async (formData) => {
    try {
        // Crear un nuevo FormData para mapear los campos
        const mappedFormData = new FormData();
        
        // Mapear los nombres de campos con prefijo al formato esperado por el backend
        if (formData.has('addproducts-nombre')) mappedFormData.append('Nombre', formData.get('addproducts-nombre'));
        if (formData.has('addproducts-codigo-barras')) mappedFormData.append('codigoBarras', formData.get('addproducts-codigo-barras'));
        if (formData.has('addproducts-marca')) mappedFormData.append('Marca', formData.get('addproducts-marca'));
        if (formData.has('addproducts-stock')) mappedFormData.append('Stock', formData.get('addproducts-stock'));
        if (formData.has('addproducts-categoria')) mappedFormData.append('Categoria', formData.get('addproducts-categoria'));
        if (formData.has('addproducts-precio-compra')) mappedFormData.append('PrecioCompra', formData.get('addproducts-precio-compra'));
        if (formData.has('addproducts-fecha-vencimiento')) mappedFormData.append('fechaVencimiento', formData.get('addproducts-fecha-vencimiento'));
        if (formData.has('addproducts-precio-venta')) mappedFormData.append('PrecioVenta', formData.get('addproducts-precio-venta'));
        
        // Conservar la imagen si existe
        if (formData.has('image')) mappedFormData.append('image', formData.get('image'));
        if (formData.has('imageUrl')) mappedFormData.append('imageUrl', formData.get('imageUrl'));
        
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        };
        const response = await axios.post('/products/agregar', mappedFormData, config);
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

export const disableProduct = async (id, disableData) => {
  try {
    const response = await axios.delete(`/products/eliminar/${id}`, {
      data: disableData
    });
    return response.data;
  } catch (error) {
    console.error('Error disabling product:', error);
    throw error;
  }
};

// 🆕 NUEVO: Función para obtener historial de stock
export const getStockHistory = async (productId) => {
  try {
    const response = await axios.get(`/products/historial-stock/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock history:', error);
    throw error;
  }
};

// 🆕 NUEVO: Función para obtener productos desactivados
export const getDisabledProducts = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`/products/eliminados?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    // Si el error es 404, significa que no hay productos desactivados, devolver estructura vacía
    if (error.response && error.response.status === 404) {
      return {
        data: {
          products: [],
          totalPages: 1,
          currentPage: 1,
          totalCount: 0
        }
      };
    }
    console.error('Error fetching disabled products:', error);
    throw error;
  }
};

// 🆕 NUEVO: Función para restaurar un producto eliminado
export const restoreProduct = async (productId, restoreData) => {
  try {
    const response = await axios.patch(`/products/restaurar/${productId}`, restoreData);
    return response.data;
  } catch (error) {
    console.error('Error restoring product:', error);
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

/*export const registrarVenta = async (productosVendidos) => {
  try {
    const response = await axios.post("/products/registrar-venta", { productosVendidos });
    return response.data;
  } catch (error) {
    console.error("❌ Error al registrar la venta:", error);
    throw error;
  }
}; */

/*export const obtenerVentas = async () => {
  try {
    const response = await axios.get("/products/ventas/obtener");
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener las ventas:", error);
    throw error;
  }
}
*/
/*
export const obtenerVentasPorTicket = async () => {
  try {
    const response = await axios.get("/products/ventas/tickets");
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener las ventas por ticket:", error);
    throw error;
  }
};*/

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
    throw error;
  }
};

export const getProductPriceHistory = async (id) => {
  try {
    const response = await axios.get(`/products/historial-precios/${id}`);
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('No se recibieron datos del historial de precios');
    }
  } catch (error) {
    console.error('Error al obtener el historial de precios:', error);
    throw error.response?.data || error;
  }
};

// 🆕 NUEVO: Función para agregar un nuevo lote a un producto
export const agregarLoteProducto = async (productId, loteData) => {
  try {
    const response = await axios.post(`/products/lotes/${productId}`, loteData);
    return response.data;
  } catch (error) {
    console.error('Error adding product batch:', error);
    throw error;
  }
};

// 🆕 NUEVO: Función para obtener los lotes de un producto
export const getLotesProducto = async (productId) => {
  try {
    const response = await axios.get(`/products/lotes/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product batches:', error);
    throw error;
  }
};

// 🆕 NUEVO: Función para eliminar producto definitivamente
export const deleteProductPermanently = async (id) => {
  try {
    const response = await axios.delete(`/products/eliminar-permanente/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product permanently:', error);
    throw error;
  }
};

// 🆕 NUEVO: Función para editar un lote específico de un producto
export const editarLoteProducto = async (productId, loteId, loteData) => {
  try {
    const response = await axios.put(`/products/lotes/${productId}/${loteId}`, loteData);
    return response.data;
  } catch (error) {
    console.error('Error editing product batch:', error);
    throw error;
  }
};

// 🆕 NUEVO: Función para obtener información del próximo lote a usar (FIFO)
export const getProximoLoteProducto = async (productId) => {
  try {
    const response = await axios.get(`/products/proximo-lote/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching next batch info:', error);
    throw error;
  }
};