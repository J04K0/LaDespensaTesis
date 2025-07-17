import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxes, faTag, faDollarSign, faCalendarAlt, faCamera, faBarcode, faInfoCircle, faSearch, faPlus, faStore, faShoppingCart, faClipboardList, faTimes, faImage, faChevronLeft, faChevronRight, faBox, faCalendar, faCheck, faEdit, faCalculator, faSave } from '@fortawesome/free-solid-svg-icons';
import { addProducts, getProducts, getProductByBarcode, agregarLoteProducto, getProductByBarcodeForCreation, updateProduct } from "../services/AddProducts.service";
import { CATEGORIAS, MARGENES_POR_CATEGORIA } from '../constants/products.constants.js';
import SmartPagination from '../components/SmartPagination';
import AddProductsSkeleton from '../components/Skeleton/AddProductsSkeleton';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert } from "../helpers/swaHelper";
import { useRole } from '../hooks/useRole';
import "../styles/AddProductStyles.css";

const AddProducts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estado para el modo de operación: null para mostrar selector, 'new' para nuevo producto, 'stock' para agregar stock
  const [operationMode, setOperationMode] = useState(null);
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    'addproducts-nombre': '',
    'addproducts-codigo-barras': '',
    'addproducts-marca': '',
    'addproducts-stock': '',
    'addproducts-categoria': '',
    'addproducts-precio-compra': '',
    'addproducts-fecha-vencimiento': '',
    'addproducts-precio-venta': '',
  });
  
  // Estado para manejar la imagen del producto
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Estado para manejar el loading y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado para el precio recomendado
  const [precioRecomendado, setPrecioRecomendado] = useState(0);
  
  // Estado para el producto existente (al agregar stock)
  const [existingProduct, setExistingProduct] = useState(null);
  
  // Estados para búsqueda y paginación de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Estados para el modal de edición de precio
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPriceValue, setNewPriceValue] = useState('');
  const [priceModalLoading, setPriceModalLoading] = useState(false);

  // Estados para el modo de agregar stock
  const [stockToAdd, setStockToAdd] = useState('');
  const [stockMotivo, setStockMotivo] = useState('');

  // Obtener el rol del usuario
  const { userRole } = useRole();
  const isEmpleado = userRole === 'empleado';

  // Redirigir a la lista de productos si el usuario es empleado
  useEffect(() => {
    if (isEmpleado) {
      showErrorAlert('Acceso denegado', 'No tienes permiso para acceder a esta sección');
      navigate('/products');
    }
  }, [isEmpleado, navigate]);

  // Cargar datos del producto si se proporciona un código de barras en la URL
  useEffect(() => {
    const barcode = searchParams.get('barcode');
    
    if (barcode) {
      setFormData(prev => ({ ...prev, 'addproducts-codigo-barras': barcode }));
      handleCodigoBarrasChange(barcode);
    }
  }, [searchParams]);

  // Calcular el precio recomendado al cambiar el precio de compra o la categoría
  useEffect(() => {
    const precioCompra = parseFloat(formData['addproducts-precio-compra']) || 0;
    const categoria = formData['addproducts-categoria'] || 'Otros';
    const margen = MARGENES_POR_CATEGORIA[categoria] || 0.23;
    const nuevoPrecioRecomendado = precioCompra * (1 + margen);
    setPrecioRecomendado(nuevoPrecioRecomendado);
  }, [formData['addproducts-precio-compra'], formData['addproducts-categoria']]);

  // Función para abrir el modal de edición de precio
  const handleOpenPriceModal = () => {
    setNewPriceValue(existingProduct?.precioVenta || formData['addproducts-precio-venta'] || '');
    setShowPriceModal(true);
  };

  // Función para cerrar el modal de edición de precio
  const handleClosePriceModal = () => {
    setShowPriceModal(false);
    setNewPriceValue('');
  };

  // Función para actualizar el precio del producto
  const handleUpdatePrice = async () => {
    if (!newPriceValue || parseFloat(newPriceValue) <= 0) {
      showErrorAlert('Error', 'Debe ingresar un precio válido mayor a 0');
      return;
    }

    const result = await showConfirmationAlert(
      "¿Actualizar precio?",
      `¿Deseas actualizar el precio de venta de "${existingProduct.nombre}" de $${existingProduct.precioVenta} a $${parseFloat(newPriceValue).toLocaleString()}?`,
      "Sí, actualizar",
      "No, cancelar"
    );

    if (!result.isConfirmed) return;

    setPriceModalLoading(true);

    try {
      // Enviar todos los campos del producto, no solo el precio
      const formData = new FormData();
      
      // Agregar todos los campos necesarios del producto existente
      formData.append('Nombre', existingProduct.nombre);
      formData.append('codigoBarras', existingProduct.codigoBarras);
      formData.append('Marca', existingProduct.marca);
      formData.append('Stock', existingProduct.stock);
      formData.append('Categoria', existingProduct.categoria);
      formData.append('PrecioCompra', existingProduct.precioCompra);
      formData.append('PrecioVenta', parseFloat(newPriceValue)); // El nuevo precio
      
      // Agregar fecha de vencimiento si existe
      if (existingProduct.fechaVencimiento) {
        formData.append('fechaVencimiento', existingProduct.fechaVencimiento);
      }
      
      // Agregar imagen si existe
      if (existingProduct.image) {
        formData.append('imageUrl', existingProduct.image);
      }

      await updateProduct(existingProduct._id, formData);
      
      // Actualizar el estado local
      setExistingProduct(prev => ({
        ...prev,
        precioVenta: parseFloat(newPriceValue)
      }));
      
      setFormData(prev => ({
        ...prev,
        'addproducts-precio-venta': parseFloat(newPriceValue)
      }));

      showSuccessAlert(
        'Precio actualizado exitosamente',
        `El precio de venta se actualizó a $${parseFloat(newPriceValue).toLocaleString()}`
      );
      
      handleClosePriceModal();
    } catch (error) {
      console.error('Error al actualizar precio:', error);
      showErrorAlert('Error', 'No se pudo actualizar el precio. Intente nuevamente.');
    } finally {
      setPriceModalLoading(false);
    }
  };

  // Cargar lista de productos con paginación
  const loadProductsList = async (page = 1) => {
    try {
      setSearchLoading(true);
      const response = await getProducts(page, productsPerPage);
      
      const products = response.data?.products || response.products || [];
      const totalPagesFromBackend = response.data?.totalPages || response.totalPages || 1;
      const currentPageFromBackend = response.data?.currentPage || response.currentPage || 1;
      const totalProductsFromBackend = response.data?.total || response.total || 0;
      
      setProductsList(products);
      setFilteredProducts(products);
      setTotalProducts(totalProductsFromBackend);
      setTotalPages(totalPagesFromBackend);
      setCurrentPage(parseInt(currentPageFromBackend));
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('No se pudieron cargar los productos');
    } finally {
      setSearchLoading(false);
    }
  };

  // Función para cambiar de página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      loadProductsList(newPage);
    }
  };

  // Función para generar números de páginas a mostrar
  const getPaginationNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // Función para filtrar productos por búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(productsList);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = productsList.filter(product => 
      product.Nombre?.toLowerCase().includes(query) ||
      product.Marca?.toLowerCase().includes(query) ||
      product.codigoBarras?.includes(query)
    );
    
    setFilteredProducts(filtered);
  }, [searchQuery, productsList]);

  // Función para seleccionar modo de operación
  const handleSelectMode = (mode) => {
    setOperationMode(mode);
    setError(null);
    
    if (mode === 'new') {
      // Limpiar formulario para producto nuevo
      setFormData({
        'addproducts-nombre': '',
        'addproducts-codigo-barras': '',
        'addproducts-marca': '',
        'addproducts-stock': '',
        'addproducts-categoria': '',
        'addproducts-precio-compra': '',
        'addproducts-fecha-vencimiento': '',
        'addproducts-precio-venta': '',
      });
      setExistingProduct(null);
      setImagePreview(null);
      setImage(null);
    } else if (mode === 'stock') {
      // Preparar para búsqueda de productos
      setStockToAdd('');
      setStockMotivo('');
      setSearchQuery('');
      loadProductsList();
    }
  };

  // Función para seleccionar un producto de la lista
  const handleSelectProduct = (product) => {
    setExistingProduct({
      _id: product._id,
      nombre: product.Nombre,
      marca: product.Marca,
      categoria: product.Categoria,
      stock: product.Stock,
      precioVenta: product.PrecioVenta,
      precioCompra: product.PrecioCompra,
      image: product.image,
      codigoBarras: product.codigoBarras,
      fechaVencimiento: product.fechaVencimiento
    });
    
    //Fijar el precio de venta del producto existente
    setFormData(prev => ({
      ...prev,
      'addproducts-precio-compra': product.PrecioCompra || '',
      'addproducts-precio-venta': product.PrecioVenta || '', 
      'addproducts-categoria': product.Categoria || '', // Necesario para calcular precio recomendado
      'addproducts-fecha-vencimiento': '' // Limpiar fecha para que sea del nuevo lote
    }));
    
    // Limpiar búsqueda para mostrar el producto seleccionado
    setSearchQuery('');
  };

  // Función para buscar producto existente para agregar stock
  const handleSearchExistingProduct = async () => {
    const barcode = formData['addproducts-codigo-barras'];
    
    if (!barcode || barcode.length < 8) {
      setError('Ingrese un código de barras válido');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const product = await getProductByBarcodeForCreation(barcode);
      
      if (product) {
        setExistingProduct(product);
        setFormData(prev => ({
          ...prev,
          'addproducts-nombre': product.nombre || '',
          'addproducts-marca': product.marca || '',
          'addproducts-categoria': product.categoria || '',
          'addproducts-precio-compra': product.precioCompra || '',
          'addproducts-precio-venta': product.precioVenta || '',
        }));
        
        if (product.image) {
          setImagePreview(product.image);
        }
      } else {
        setError('No se encontró un producto con este código de barras');
        setExistingProduct(null);
      }
    } catch (error) {
      setError('No se encontró un producto con este código de barras');
      setExistingProduct(null);
      console.error('Error al buscar producto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    // Limpiar imagen anterior
    setImage(null);
    setImagePreview(null);
    
    if (!file) {
      return;
    }
    
    // Validaciones del archivo
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      showErrorAlert('Formato no válido', 'Solo se permiten archivos JPG, PNG');
      return;
    }
    
    if (file.size > maxSize) {
      showErrorAlert('Archivo muy grande', 'La imagen no puede exceder 5MB');
      return;
    }
    
    // Crear una copia inmutable del archivo para evitar cambios
    const fileClone = new File([file], file.name, {
      type: file.type,
      lastModified: file.lastModified
    });
    
    setImage(fileClone);
    
    // Crear preview
    if (fileClone) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        console.error('Error al leer el archivo');
        setImage(null);
        setImagePreview(null);
        showErrorAlert('Error', 'No se pudo procesar la imagen seleccionada');
      };
      reader.readAsDataURL(fileClone);
    }
  };

  const handleCodigoBarrasChange = async (value) => {
    setFormData(prev => ({ ...prev, 'addproducts-codigo-barras': value }));

    // Solo buscar automáticamente si estamos en modo nuevo producto y el código tiene entre 8 a 20 dígitos
    if (operationMode === 'new' && value.length >= 8 && value.length <= 20 && /^\d+$/.test(value)) {
      setLoading(true);
      setError(null);
      try {
        const product = await getProductByBarcodeForCreation(value);

        if (product) {
          setFormData(prev => ({
            ...prev,
            'addproducts-nombre': product.nombre || '',
            'addproducts-marca': product.marca || '',
            'addproducts-categoria': product.categoria || ''
          }));

          if (product.image) {
            setImagePreview(product.image);
          }
        }
      } catch (error) {
        // No mostrar error aquí, es normal que no exista el producto
        console.log('Producto no encontrado, se creará uno nuevo');
      } finally {
        setLoading(false);
      }
    }
  };

  const usarPrecioRecomendado = () => {
    setFormData(prev => ({ 
      ...prev, 
      'addproducts-precio-venta': precioRecomendado.toFixed(0) 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (operationMode === 'stock') {
      return handleStockSubmit();
    } else {
      return handleNewProductSubmit();
    }
  };

  const handleStockSubmit = async () => {
    if (!existingProduct) {
      setError('Debe buscar y seleccionar un producto existente');
      return;
    }

    if (!stockToAdd || parseInt(stockToAdd) <= 0) {
      setError('Debe ingresar una cantidad válida de stock');
      return;
    }

    if (!formData['addproducts-fecha-vencimiento']) {
      setError('Debe especificar la fecha de vencimiento del nuevo lote');
      return;
    }

    if (!formData['addproducts-precio-compra'] || !formData['addproducts-precio-venta']) {
      setError('Debe especificar los precios de compra y venta del nuevo lote');
      return;
    }

    const result = await showConfirmationAlert(
      "¿Crear nuevo lote?",
      `¿Deseas crear un nuevo lote para "${existingProduct.nombre || existingProduct.Nombre}"? Se agregará como un lote independiente con ${stockToAdd} unidades.`,
      "Sí, crear lote",
      "No, cancelar"
    );

    if (!result.isConfirmed) return;

    setLoading(true);
    setError(null);
    
    try {
      const loteData = {
        cantidad: parseInt(stockToAdd),
        precioCompra: parseFloat(formData['addproducts-precio-compra']),
        precioVenta: parseFloat(formData['addproducts-precio-venta']),
        fechaVencimiento: formData['addproducts-fecha-vencimiento']
      };

      const result = await agregarLoteProducto(existingProduct._id, loteData);
      
      showSuccessAlert(
        'Nuevo lote creado exitosamente', 
        `Se creó el lote ${result.data.nuevoLote.numeroLote} con ${stockToAdd} unidades. Stock total actualizado: ${result.data.stockTotal} unidades.`
      );
      navigate('/products');
    } catch (error) {
      console.error('Error al crear nuevo lote:', error);
      setError('Ocurrió un error al intentar crear el nuevo lote.');
      showErrorAlert('Error', 'No se pudo crear el nuevo lote. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewProductSubmit = async () => {
    
    // Limpiar errores previos
    clearFormOnError();
    
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas crear este nuevo producto en el inventario?",
      "Sí, crear",
      "No, cancelar"
    );

    if (!result.isConfirmed) {
      console.log('❌ Usuario canceló la operación');
      return;
    }

    console.log('✅ Usuario confirmó, procediendo con validaciones...');

    // Validación adicional del frontend
    if (!formData['addproducts-nombre'] || formData['addproducts-nombre'].trim().length < 2) {
      const errorMsg = 'El nombre del producto debe tener al menos 2 caracteres';
      console.log('❌ Error de validación - Nombre:', errorMsg);
      setError(errorMsg);
      showErrorAlert('Error de validación', errorMsg);
      return;
    }

    if (!formData['addproducts-marca'] || formData['addproducts-marca'].trim().length < 2) {
      const errorMsg = 'La marca del producto debe tener al menos 2 caracteres';
      console.log('❌ Error de validación - Marca:', errorMsg);
      setError(errorMsg);
      showErrorAlert('Error de validación', errorMsg);
      return;
    }

    if (!formData['addproducts-codigo-barras'] || !/^\d{8,20}$/.test(formData['addproducts-codigo-barras'])) {
      const errorMsg = 'El código de barras debe contener solo números y 8 a 20 digitos';
      console.log('❌ Error de validación - Código de barras:', {
        valor: formData['addproducts-codigo-barras'],
        longitud: formData['addproducts-codigo-barras']?.length,
        esNumero: /^\d+$/.test(formData['addproducts-codigo-barras'] || ''),
        regex: /^\d{8,20}$/.test(formData['addproducts-codigo-barras'] || '')
      });
      setError(errorMsg);
      showErrorAlert('Error de validación', errorMsg);
      return;
    }

    if (formData['addproducts-categoria'] === '') {
      const errorMsg = 'Por favor, seleccione una categoría válida';
      console.log('❌ Error de validación - Categoría:', errorMsg);
      setError(errorMsg);
      showErrorAlert('Error de validación', errorMsg);
      return;
    }

    console.log('✅ Todas las validaciones frontend pasaron, enviando al servidor...');

    setLoading(true);
    setError(null);

    try {
      const productFormData = new FormData();
      
      const cleanedData = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== '') {
          cleanedData[key] = typeof value === 'string' ? value.trim() : value;
        }
      });
      
      // Asegurar que todos los campos se envíen correctamente
      Object.keys(cleanedData).forEach(key => {
        productFormData.append(key, cleanedData[key]);
      });

      if (image instanceof File) {
        // Verificar que la imagen sigue siendo válida
        if (!image.name || image.size === 0) {
          throw new Error('La imagen seleccionada está corrupta. Por favor, seleccione la imagen nuevamente.');
        }
        
        // Crear una nueva referencia del archivo para evitar modificaciones
        const imageClone = new File([image], image.name, {
          type: image.type,
          lastModified: image.lastModified
        });
        
        productFormData.append('image', imageClone);
        console.log('🖼️ Imagen agregada al FormData:', {
          name: imageClone.name,
          size: imageClone.size,
          type: imageClone.type
        });
      } else if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('http')) {
        productFormData.append('imageUrl', imagePreview);
        console.log('🔗 URL de imagen agregada al FormData:', imagePreview);
      }

      let formDataEntries = 0;
      for (let [key, value] of productFormData.entries()) {
        formDataEntries++;
      }
      
      if (formDataEntries === 0) {
        throw new Error('No se pudieron preparar los datos para enviar. Por favor, verifique que todos los campos estén completados.');
      }

      const response = await addProducts(productFormData);
      
      showSuccessAlert('Éxito', 'Producto creado correctamente en el inventario');
      navigate('/products');
    } catch (error) {
      console.error('❌ Error completo al crear el producto:', error);
      console.error('❌ Error object keys:', Object.keys(error));
      console.error('❌ Error response:', error.response);
      console.error('❌ Error request:', error.request);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      if (error.response) {
        console.error('📋 Response details:');
        console.error('  - Status:', error.response.status);
        console.error('  - Status Text:', error.response.statusText);
        console.error('  - Headers:', error.response.headers);
        console.error('  - Data:', error.response.data);
        console.error('  - Config:', error.response.config);
      }
      
      let errorMessage = 'Ocurrió un error al intentar crear el producto.';
      
      if (error.message && error.message.includes('imagen se modificó durante el envío')) {
        errorMessage = error.message;
        setImage(null);
        setImagePreview(null);
      } else if (error.message && error.message.includes('imagen corrupta')) {
        errorMessage = error.message;
        setImage(null);
        setImagePreview(null);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message.startsWith('Error:') ? error.message : `Error: ${error.message}`;
      }
      
      console.log('🔍 Mensaje de error final que se mostrará:', errorMessage);
      setError(errorMessage);
      showErrorAlert('Error al crear producto', errorMessage);
    } finally {
      setLoading(false);
      console.log('🏁 Finalizando handleNewProductSubmit');
    }
  };

  const clearFormOnError = () => {
    console.log('🧹 Limpiando estado de errores...');
    setError(null);
    setLoading(false);
    
    try {
      // Verificar que la imagen sigue siendo válida si existe
      if (image instanceof File) {
        if (!image.name || image.size === 0) {
          console.log('⚠️ Imagen corrupta detectada, limpiando...');
          setImage(null);
          setImagePreview(null);
        }
      }
      
      // Limpiar cualquier estado de validación HTML5 que pueda estar interfiriendo
      const form = document.querySelector('.addproducts-form');
      if (form) {
        // Resetear validación HTML5
        console.log('🔄 Reseteando validación HTML5...');
        form.noValidate = true;
        setTimeout(() => {
          form.noValidate = false;
        }, 100);
      }
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.update();
          }
        });
      }
      
    } catch (cleanupError) {
      console.error('❌ Error durante limpieza:', cleanupError);
    }
  };

  const handleCancel = async () => {
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas cancelar la operación? Los cambios no se guardarán.",
      "Sí, cancelar",
      "No, volver"
    );

    if (result.isConfirmed) {
      navigate('/products');
    }
  };

  const handleBackToModeSelection = () => {
    setOperationMode(null);
    setExistingProduct(null);
    setStockToAdd('');
    setStockMotivo('');
    setError(null);
    setFormData({
      'addproducts-nombre': '',
      'addproducts-codigo-barras': '',
      'addproducts-marca': '',
      'addproducts-stock': '',
      'addproducts-categoria': '',
      'addproducts-precio-compra': '',
      'addproducts-fecha-vencimiento': '',
      'addproducts-precio-venta': '',
    });
    setImagePreview(null);
    setImage(null);
  };

  // Si es empleado, no renderizar nada (ya fue redirigido)
  if (isEmpleado) {
    return null;
  }

  if (!operationMode) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="content-container">
          <div className="addproducts-page-header">
            <button 
              className="addproducts-back-btn"
              onClick={() => navigate('/products')}
              type="button"
            >
              ← Volver a Productos
            </button>
            <h1 className="addproducts-page-title">Gestión de Inventario</h1>
            <p className="addproducts-page-subtitle">Selecciona la acción que deseas realizar</p>
          </div>
          
          <div className="addproducts-mode-selector">
            <div className="addproducts-mode-options">
              <div 
                className="addproducts-mode-card"
                onClick={() => handleSelectMode('new')}
              >
                <div className="addproducts-mode-icon">
                  <FontAwesomeIcon icon={faPlus} />
                </div>
                <h3>Crear Producto Nuevo</h3>
                <p>Registra un producto completamente nuevo en el inventario con toda su información</p>
                <button className="addproducts-mode-btn">
                  <FontAwesomeIcon icon={faPlus} />
                  Crear Nuevo
                </button>
              </div>
              
              <div 
                className="addproducts-mode-card"
                onClick={() => handleSelectMode('stock')}
              >
                <div className="addproducts-mode-icon">
                  <FontAwesomeIcon icon={faBoxes} />
                </div>
                <h3>Agregar Stock</h3>
                <p>Agrega más unidades a un producto que ya existe en el inventario</p>
                <button className="addproducts-mode-btn">
                  <FontAwesomeIcon icon={faBoxes} />
                  Agregar Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        <div className="addproducts-page-header">
          <button 
            className="addproducts-back-btn"
            onClick={handleBackToModeSelection}
            type="button"
          >
            ← Volver a selección
          </button>
          <h1 className="addproducts-page-title">
            {operationMode === 'new' ? 'Crear Producto Nuevo' : 'Agregar Stock'}
          </h1>
          <p className="addproducts-page-subtitle">
            {operationMode === 'new' 
              ? 'Registra un nuevo producto en tu inventario' 
              : 'Agrega más unidades a un producto existente'
            }
          </p>
        </div>
        
        <div className="addproducts-form-container">
          <div className="addproducts-card">
            <div className="addproducts-card-body">
              {operationMode === 'stock' && !existingProduct ? (
                <div className="addproducts-search-section">
                  <div className="addproducts-section-header">
                    <FontAwesomeIcon icon={faSearch} className="addproducts-section-icon" />
                    <h3 className="addproducts-section-title">Buscar Producto para Agregar Stock</h3>
                  </div>
                  
                  {error && (
                    <div className="addproducts-alert addproducts-alert-danger">{error}</div>
                  )}
                  
                  {/* Barra de búsqueda inteligente */}
                  <div className="addproducts-smart-search">
                    <div className="addproducts-search-input-container">
                      <FontAwesomeIcon icon={faSearch} className="addproducts-search-icon" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="addproducts-smart-search-input"
                        placeholder="Buscar por nombre, marca o código de barras..."
                      />
                      {searchQuery && (
                        <button 
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="addproducts-clear-search"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      )}
                    </div>
                    
                    <div className="addproducts-search-info">
                      {searchLoading ? (
                        <p>Cargando productos...</p>
                      ) : (
                        <p>
                          {searchQuery ? (
                            <>
                              {filteredProducts.length} Producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''} de {totalProducts}
                            </>
                          ) : (
                            <>
                              {totalProducts} Productos creados en el sistema
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="addproducts-products-grid">
                    {searchLoading ? (
                      <div className="addproducts-loading-state">
                        <FontAwesomeIcon icon={faSearch} size="2x" />
                        <p>Cargando productos...</p>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="addproducts-empty-state">
                        <FontAwesomeIcon icon={faBox} size="3x" />
                        <h4>No se encontraron productos</h4>
                        <p>
                          {searchQuery 
                            ? `No hay productos que coincidan con "${searchQuery}"`
                            : 'No hay productos disponibles en el inventario'
                          }
                        </p>
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div 
                          key={product._id}
                          className="addproducts-product-card"
                          onClick={() => handleSelectProduct(product)}
                        >
                          <div className="addproducts-product-image">
                            {product.image ? (
                              <img src={product.image} alt={product.Nombre} />
                            ) : (
                              <div className="addproducts-no-image">
                                <FontAwesomeIcon icon={faImage} />
                              </div>
                            )}
                          </div>
                          
                          <div className="addproducts-product-info">
                            <h4 className="addproducts-product-name">{product.Nombre}</h4>
                            <p className="addproducts-product-brand">{product.Marca}</p>
                            <p className="addproducts-product-category">{product.Categoria}</p>
                            
                            <div className="addproducts-product-details">
                              <div className="addproducts-product-stock">
                                <FontAwesomeIcon icon={faBoxes} />
                                <span>Stock: {product.Stock} unidades</span>
                              </div>
                              <div className="addproducts-product-price">
                                <FontAwesomeIcon icon={faDollarSign} />
                                <span>${product.PrecioVenta}</span>
                              </div>
                              <div className="addproducts-product-barcode">
                                <FontAwesomeIcon icon={faBarcode} />
                                <span>{product.codigoBarras}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="addproducts-select-indicator">
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Seleccionar</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="addproducts-pagination">
                      <button 
                        className="addproducts-pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || searchLoading}
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                        Anterior
                      </button>
                      
                      <div className="addproducts-pagination-numbers">
                        {getPaginationNumbers().map(page => (
                          <button
                            key={page}
                            className={`addproducts-pagination-number ${currentPage === page ? 'active' : ''}`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button 
                        className="addproducts-pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || searchLoading}
                      >
                        Siguiente
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </div>
                  )}
                </div>
              ) : operationMode === 'stock' && existingProduct ? (
                <form onSubmit={handleSubmit} className="addproducts-form">
                  {error && (
                    <div className="addproducts-alert addproducts-alert-danger">{error}</div>
                  )}
                  
                  {/* Producto seleccionado - Solo info de referencia */}
                  <div className="addproducts-form-section">
                    <div className="addproducts-section-header">
                      <FontAwesomeIcon icon={faBox} className="addproducts-section-icon" />
                      <h3 className="addproducts-section-title">Producto Seleccionado</h3>
                    </div>
                    
                    <div className="addproducts-selected-product">
                      {existingProduct.image && (
                        <img 
                          src={existingProduct.image} 
                          alt={existingProduct.nombre}
                          className="addproducts-selected-product-image"
                        />
                      )}
                      <div className="addproducts-selected-product-info">
                        <h4>{existingProduct.nombre}</h4>
                        <div className="addproducts-selected-product-details">
                          <span><strong>Marca:</strong> {existingProduct.marca}</span>
                          <span><strong>Categoría:</strong> {existingProduct.categoria}</span>
                          <span><strong>Código:</strong> {existingProduct.codigoBarras}</span>
                          <span><strong>Stock actual:</strong> {existingProduct.stock} unidades</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="addproducts-change-product-btn"
                        onClick={() => setExistingProduct(null)}
                      >
                        <FontAwesomeIcon icon={faSearch} />
                        Cambiar producto
                      </button>
                    </div>
                  </div>
                  
                  {/* Información del nuevo lote */}
                  <div className="addproducts-form-section">
                    <div className="addproducts-section-header">
                      <FontAwesomeIcon icon={faBoxes} className="addproducts-section-icon" />
                      <h3 className="addproducts-section-title">Información del Stock a Agregar</h3>
                    </div>
                    
                    <div className="addproducts-form-row">
                      <div className="addproducts-form-group">
                        <label htmlFor="stock-to-add" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faBoxes} /> Cantidad a Agregar *
                        </label>
                        <input
                          type="number"
                          id="stock-to-add"
                          value={stockToAdd}
                          onChange={(e) => setStockToAdd(e.target.value)}
                          className="addproducts-form-control"
                          placeholder="0"
                          min="1"
                          required
                        />
                      </div>
                      
                      <div className="addproducts-form-group">
                        <label htmlFor="fecha-vencimiento-stock" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faCalendar} /> Fecha de Vencimiento del Stock *
                        </label>
                        <input
                          type="date"
                          id="fecha-vencimiento-stock"
                          name="addproducts-fecha-vencimiento"
                          value={formData['addproducts-fecha-vencimiento']}
                          onChange={handleChange}
                          className="addproducts-form-control"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Precios - Solo precio de compra editable */}
                  <div className="addproducts-form-section">
                    <div className="addproducts-section-header">
                      <FontAwesomeIcon icon={faDollarSign} className="addproducts-section-icon" />
                      <h3 className="addproducts-section-title">Precios del Lote</h3>
                      <p className="addproducts-section-subtitle">
                        ⚠️ El precio de venta se mantiene igual al del producto existente para evitar inconsistencias
                      </p>
                    </div>
                    
                    <div className="addproducts-form-row">
                      <div className="addproducts-form-group">
                        <label htmlFor="precio-compra-lote" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faDollarSign} /> Precio de Compra *
                        </label>
                        <input
                          type="number"
                          id="precio-compra-lote"
                          name="addproducts-precio-compra"
                          value={formData['addproducts-precio-compra']}
                          onChange={handleChange}
                          className="addproducts-form-control"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      
                      <div className="addproducts-form-group">
                        <label htmlFor="precio-venta-lote" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faDollarSign} /> Precio de Venta (Fijo)
                        </label>
                        <div className="addproducts-price-input-container">
                          <input
                            type="number"
                            id="precio-venta-lote"
                            name="addproducts-precio-venta"
                            value={formData['addproducts-precio-venta']}
                            className="addproducts-form-control addproducts-readonly-input"
                            placeholder="0"
                            min="0"
                            step="0.01"
                            readOnly
                            disabled
                            title="El precio de venta se mantiene igual al del producto existente"
                          />
                          <div className="addproducts-fixed-price-indicator">
                            <FontAwesomeIcon icon={faCheck} />
                            <span>Precio fijo del producto</span>
                            <button
                              type="button"
                              className="addproducts-edit-price-btn"
                              onClick={handleOpenPriceModal}
                              title="Editar precio de venta"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                              Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resumen del stock a agregar */}
                  {stockToAdd && parseInt(stockToAdd) > 0 && (
                    <div className="addproducts-form-section">
                      <div className="addproducts-section-header">
                        <FontAwesomeIcon icon={faCheck} className="addproducts-section-icon" />
                        <h3 className="addproducts-section-title">Resumen del Stock a Agregar</h3>
                      </div>
                      
                      <div className="addproducts-confirmation-panel">
                        <div className="addproducts-confirmation-content">
                          <div className="addproducts-lote-summary">
                            <h4>Agregar stock a {existingProduct.nombre}</h4>
                            <div className="addproducts-lote-details-grid">
                              <div className="addproducts-lote-item">
                                <span className="addproducts-lote-label">Stock actual:</span>
                                <span className="addproducts-lote-value">{existingProduct.stock} unidades</span>
                              </div>
                              <div className="addproducts-lote-item">
                                <span className="addproducts-lote-label">Cantidad a agregar:</span>
                                <span className="addproducts-lote-value">{stockToAdd} unidades</span>
                              </div>
                              <div className="addproducts-lote-item">
                                <span className="addproducts-lote-label">Stock final:</span>
                                <span className="addproducts-lote-value">{parseInt(existingProduct.stock) + parseInt(stockToAdd)} unidades</span>
                              </div>
                              <div className="addproducts-lote-item">
                                <span className="addproducts-lote-label">Fecha de vencimiento:</span>
                                <span className="addproducts-lote-value">
                                  {formData['addproducts-fecha-vencimiento'] 
                                    ? new Date(formData['addproducts-fecha-vencimiento']).toLocaleDateString()
                                    : 'No especificada'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Botones de acción */}
                  <div className="addproducts-form-actions">
                    <button 
                      type="button" 
                      onClick={handleCancel}
                      className="addproducts-btn addproducts-btn-secondary"
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="addproducts-btn addproducts-btn-primary"
                      disabled={loading || !stockToAdd || parseInt(stockToAdd) <= 0 || !formData['addproducts-fecha-vencimiento']}
                    >
                      <FontAwesomeIcon icon={loading ? faCalculator : faSave} />
                      {loading ? 'Agregando Stock...' : 'Agregar Stock al Producto'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="addproducts-form">
                  {error && (
                    <div className="addproducts-alert addproducts-alert-danger">{error}</div>
                  )}
                  
                  {/* Información básica */}
                  <div className="addproducts-form-section">
                    <div className="addproducts-section-header">
                      <FontAwesomeIcon icon={faTag} className="addproducts-section-icon" />
                      <h3 className="addproducts-section-title">Información Básica</h3>
                    </div>
                    
                    <div className="addproducts-form-row">
                      <div className="addproducts-form-group">
                        <label htmlFor="addproducts-nombre" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faTag} /> Nombre del Producto *
                        </label>
                        <input
                          type="text"
                          id="addproducts-nombre"
                          name="addproducts-nombre"
                          value={formData['addproducts-nombre']}
                          onChange={handleChange}
                          className="addproducts-form-control"
                          placeholder="Ingrese el nombre del producto"
                          required
                        />
                      </div>
                      
                      <div className="addproducts-form-group">
                        <label htmlFor="addproducts-codigo-barras" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faBarcode} /> Código de Barras *
                        </label>
                        <input
                          type="text"
                          id="addproducts-codigo-barras"
                          name="addproducts-codigo-barras"
                          value={formData['addproducts-codigo-barras']}
                          onChange={(e) => handleCodigoBarrasChange(e.target.value)}
                          className="addproducts-form-control"
                          placeholder="Escanee o ingrese el código"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="addproducts-form-row">
                      <div className="addproducts-form-group">
                        <label htmlFor="addproducts-marca" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faTag} /> Marca *
                        </label>
                        <input
                          type="text"
                          id="addproducts-marca"
                          name="addproducts-marca"
                          value={formData['addproducts-marca']}
                          onChange={handleChange}
                          className="addproducts-form-control"
                          placeholder="Ingrese la marca"
                          required
                        />
                      </div>
                      
                      <div className="addproducts-form-group">
                        <label htmlFor="addproducts-categoria" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faClipboardList} /> Categoría *
                        </label>
                        <select
                          id="addproducts-categoria"
                          name="addproducts-categoria"
                          value={formData['addproducts-categoria']}
                          onChange={handleChange}
                          className="addproducts-form-control"
                          required
                        >
                          <option value="">Seleccione una categoría</option>
                          {CATEGORIAS.map(categoria => (
                            <option key={categoria} value={categoria}>{categoria}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Información de inventario */}
                  <div className="addproducts-form-section">
                    <div className="addproducts-section-header">
                      <FontAwesomeIcon icon={faBoxes} className="addproducts-section-icon" />
                      <h3 className="addproducts-section-title">Inventario y Stock</h3>
                    </div>
                    
                    <div className="addproducts-form-row">
                      <div className="addproducts-form-group">
                        <label htmlFor="addproducts-stock" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faBoxes} /> Stock Inicial *
                        </label>
                        <input
                          type="number"
                          id="addproducts-stock"
                          name="addproducts-stock"
                          value={formData['addproducts-stock']}
                          onChange={handleChange}
                          className="addproducts-form-control"
                          placeholder="0"
                          min="0"
                          required
                        />
                      </div>
                      
                      <div className="addproducts-form-group">
                        <label htmlFor="addproducts-fecha-vencimiento" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faCalendar} /> Fecha de Vencimiento
                        </label>
                        <input
                          type="date"
                          id="addproducts-fecha-vencimiento"
                          name="addproducts-fecha-vencimiento"
                          value={formData['addproducts-fecha-vencimiento']}
                          onChange={handleChange}
                          className="addproducts-form-control"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Información de precios */}
                  <div className="addproducts-form-section">
                    <div className="addproducts-section-header">
                      <FontAwesomeIcon icon={faDollarSign} className="addproducts-section-icon" />
                      <h3 className="addproducts-section-title">Precios</h3>
                    </div>
                    
                    <div className="addproducts-form-row">
                      <div className="addproducts-form-group">
                        <label htmlFor="addproducts-precio-compra" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faDollarSign} /> Precio de Compra *
                        </label>
                        <input
                          type="number"
                          id="addproducts-precio-compra"
                          name="addproducts-precio-compra"
                          value={formData['addproducts-precio-compra']}
                          onChange={handleChange}
                          className="addproducts-form-control"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      
                      <div className="addproducts-form-group">
                        <label htmlFor="addproducts-precio-venta" className="addproducts-form-label">
                          <FontAwesomeIcon icon={faDollarSign} /> Precio de Venta *
                        </label>
                        <div className="addproducts-price-input-container">
                          <input
                            type="number"
                            id="addproducts-precio-venta"
                            name="addproducts-precio-venta"
                            value={formData['addproducts-precio-venta']}
                            onChange={handleChange}
                            className="addproducts-form-control"
                            placeholder="0"
                            min="0"
                            step="0.01"
                            required
                          />
                          {precioRecomendado > 0 && (
                            <button
                              type="button"
                              onClick={usarPrecioRecomendado}
                              className="addproducts-use-recommended-btn"
                              title={`Usar precio recomendado: $${precioRecomendado.toFixed(0)}`}
                            >
                              <FontAwesomeIcon icon={faCalculator} />
                              Usar ${precioRecomendado.toFixed(0)}
                            </button>
                          )}
                        </div>
                        {precioRecomendado > 0 && (
                          <div className="addproducts-price-recommendation">
                            <p>
                              <FontAwesomeIcon icon={faCalculator} />
                              Precio recomendado: <strong>${precioRecomendado.toFixed(0)}</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Imagen del producto */}
                  <div className="addproducts-form-section">
                    <div className="addproducts-section-header">
                      <FontAwesomeIcon icon={faImage} className="addproducts-section-icon" />
                      <h3 className="addproducts-section-title">Imagen del Producto</h3>
                    </div>
                    
                    <div className="addproducts-image-upload">
                      <div className="addproducts-image-preview">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Vista previa" className="addproducts-preview-img" />
                        ) : (
                          <div className="addproducts-no-image-placeholder">
                            <FontAwesomeIcon icon={faImage} size="3x" />
                            <p>Sin imagen</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="addproducts-upload-controls">
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="addproducts-file-input"
                        />
                        <label htmlFor="image-upload" className="addproducts-upload-btn">
                          <FontAwesomeIcon icon={faImage} />
                          Seleccionar Imagen
                        </label>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setImage(null);
                              setImagePreview(null);
                            }}
                            className="addproducts-remove-image-btn"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="addproducts-form-actions">
                    <button 
                      type="button" 
                      onClick={handleCancel}
                      className="addproducts-btn addproducts-btn-secondary"
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="addproducts-btn addproducts-btn-primary"
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={loading ? faCalculator : faSave} />
                      {loading ? 'Creando...' : 'Crear Producto'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showPriceModal && (
        <div className="addproducts-price-modal">
          <div className="addproducts-price-modal-content">
            <div className="addproducts-price-modal-header">
              <h3>Editar Precio de Venta</h3>
              <button 
                className="addproducts-price-modal-close"
                onClick={handleClosePriceModal}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="addproducts-price-modal-body">
              <p>
                Producto: <strong>{existingProduct.nombre}</strong>
              </p>
              <p>
                Precio Actual: <strong>${existingProduct.precioVenta}</strong>
              </p>
              
              <div className="addproducts-price-modal-field">
                <label htmlFor="new-price" className="addproducts-price-modal-label">
                  Nuevo Precio de Venta *
                </label>
                <input
                  type="number"
                  id="new-price"
                  value={newPriceValue}
                  onChange={(e) => setNewPriceValue(e.target.value)}
                  className="addproducts-price-modal-input"
                  placeholder="Ingrese el nuevo precio"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            <div className="addproducts-price-modal-footer">
              <button 
                className="addproducts-price-modal-cancel"
                onClick={handleClosePriceModal}
              >
                <FontAwesomeIcon icon={faTimes} />
                Cancelar
              </button>
              <button 
                className="addproducts-price-modal-save"
                onClick={handleUpdatePrice}
                disabled={priceModalLoading}
              >
                {priceModalLoading ? (
                  <>
                    <FontAwesomeIcon icon={faCalculator} spin />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} />
                    Guardar Nuevo Precio
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProducts;
