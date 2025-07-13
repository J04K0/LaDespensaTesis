import axios from './root.service.js';

export const addProducts = async (formData) => {
    try {
        const mappedFormData = new FormData();
        
        if (!formData || typeof formData.entries !== 'function') {
            throw new Error('FormData inválido o corrupto');
        }
        
        let originalEntries = [];
        try {
            for (let [key, value] of formData.entries()) {
                originalEntries.push([key, value]);
            }
        } catch (entriesError) {
            console.error('❌ Error al leer entradas del FormData:', entriesError);
            throw new Error('Error al procesar los datos del formulario');
        }
        
        // Mapear los nombres de campos con prefijo al formato esperado por el backend
        if (formData.has('addproducts-nombre')) mappedFormData.append('Nombre', formData.get('addproducts-nombre'));
        if (formData.has('addproducts-codigo-barras')) mappedFormData.append('codigoBarras', formData.get('addproducts-codigo-barras'));
        if (formData.has('addproducts-marca')) mappedFormData.append('Marca', formData.get('addproducts-marca'));
        if (formData.has('addproducts-stock')) mappedFormData.append('Stock', formData.get('addproducts-stock'));
        if (formData.has('addproducts-categoria')) mappedFormData.append('Categoria', formData.get('addproducts-categoria'));
        if (formData.has('addproducts-precio-compra')) mappedFormData.append('PrecioCompra', formData.get('addproducts-precio-compra'));
        if (formData.has('addproducts-fecha-vencimiento')) mappedFormData.append('fechaVencimiento', formData.get('addproducts-fecha-vencimiento'));
        if (formData.has('addproducts-precio-venta')) mappedFormData.append('PrecioVenta', formData.get('addproducts-precio-venta'));
        
        const imageFile = formData.get('image');
        const imageUrl = formData.get('imageUrl');
        
        if (imageFile && imageFile instanceof File) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const maxSize = 5 * 1024 * 1024;
            
            if (!imageFile.name || imageFile.size === 0) {
                throw new Error('Archivo de imagen corrupto o vacío');
            }
            
            if (!allowedTypes.includes(imageFile.type)) {
                throw new Error('Formato de imagen no válido. Solo se permiten JPG, PNG y WebP');
            }
            
            if (imageFile.size > maxSize) {
                throw new Error('La imagen no puede exceder 5MB');
            }
            
            try {
                const arrayBuffer = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
                    reader.readAsArrayBuffer(imageFile);
                });
                
                const newBlob = new Blob([arrayBuffer], { type: imageFile.type });
                const newImageFile = new File([newBlob], imageFile.name, {
                    type: imageFile.type,
                    lastModified: Date.now() // Usar timestamp actual para evitar conflictos
                });
                
                // Verificar que el nuevo archivo se creó correctamente
                if (newImageFile.size !== imageFile.size) {
                    console.warn('⚠️ Tamaño del archivo cambió durante la recreación');
                }
                
                mappedFormData.append('image', newImageFile);
                console.log('🖼️ Imagen recreada exitosamente:', {
                    originalName: imageFile.name,
                    newName: newImageFile.name,
                    originalSize: imageFile.size,
                    newSize: newImageFile.size,
                    type: newImageFile.type
                });
            } catch (fileProcessingError) {
                console.error('❌ Error al procesar archivo de imagen:', fileProcessingError);
                throw new Error('Error al procesar la imagen. Por favor, seleccione la imagen nuevamente.');
            }
        } else if (imageUrl && typeof imageUrl === 'string') {
            mappedFormData.append('imageUrl', imageUrl);
            console.log('🔗 URL de imagen agregada:', imageUrl);
        }
        
        let finalEntries = [];
        for (let [key, value] of mappedFormData.entries()) {
            finalEntries.push([key, value]);
        }
        
        if (finalEntries.length === 0) {
            throw new Error('No se pudieron procesar los datos del formulario');
        }
        
        
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
            maxContentLength: 10 * 1024 * 1024,
            maxBodyLength: 10 * 1024 * 1024,
            validateStatus: function (status) {
                return status < 500;
            },
            maxRedirects: 0,
        };
        
        const response = await axios.post('/products/agregar', mappedFormData, config);
        return response;
    } catch (error) {
        console.error('❌ Error al añadir el producto:', error);
        
        if (error.code === 'ERR_UPLOAD_FILE_CHANGED') {
            throw new Error('Error al procesar la imagen. La imagen se modificó durante el envío. Por favor, seleccione la imagen nuevamente y vuelva a intentar.');
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('La operación tardó demasiado tiempo. Verifique su conexión e intente nuevamente.');
        } else if (error.code === 'ERR_NETWORK') {
            throw new Error('Error de conexión. Verifique su conexión a internet y que el servidor esté disponible.');
        } else if (error.message && error.message.includes('imagen')) {
            throw error;
        } else if (error.message && error.message.includes('archivo')) {
            throw error;
        } else if (error.response) {
            const serverMessage = error.response.data?.message || error.response.data?.error || 'Error del servidor';
            throw new Error(serverMessage);
        }
        
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

export const getStockHistory = async (productId) => {
  try {
    const response = await axios.get(`/products/historial-stock/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock history:', error);
    throw error;
  }
};

export const getDisabledProducts = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`/products/eliminados?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
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

export const agregarLoteProducto = async (productId, loteData) => {
  try {
    const response = await axios.post(`/products/lotes/${productId}`, loteData);
    return response.data;
  } catch (error) {
    console.error('Error adding product batch:', error);
    throw error;
  }
};

export const getLotesProducto = async (productId) => {
  try {
    const response = await axios.get(`/products/lotes/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product batches:', error);
    throw error;
  }
};

export const deleteProductPermanently = async (id) => {
  try {
    const response = await axios.delete(`/products/eliminar-permanente/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product permanently:', error);
    throw error;
  }
};

export const editarLoteProducto = async (productId, loteId, loteData) => {
  try {
    const response = await axios.put(`/products/lotes/${productId}/${loteId}`, loteData);
    return response.data;
  } catch (error) {
    console.error('Error editing product batch:', error);
    throw error;
  }
};

export const getProximoLoteProducto = async (productId) => {
  try {
    const response = await axios.get(`/products/proximo-lote/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching next batch info:', error);
    throw error;
  }
};