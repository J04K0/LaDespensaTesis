import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { addProducts, getProductByBarcodeForCreation, updateProduct, getProducts, agregarLoteProducto } from '../services/AddProducts.service';
import { showSuccessAlert, showErrorAlert, showEmpleadoAccessDeniedAlert, showConfirmationAlert } from '../helpers/swaHelper';
import { useRole } from '../hooks/useRole';
import { MARGENES_POR_CATEGORIA, CATEGORIAS } from '../constants/products.constants.js';
import '../styles/AddProductStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faImage, faDollarSign, faBarcode, faTag, faCalendar, faBoxes, faCalculator, faClipboardList, faFile, faSave, faTimes, faSearch, faBox, faCheck, faEdit } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

const AddProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🆕 NUEVO: Estado para controlar el modo de operación
  const [operationMode, setOperationMode] = useState(null); // 'new' | 'stock' | null
  const [existingProduct, setExistingProduct] = useState(null);
  const [stockToAdd, setStockToAdd] = useState('');
  const [stockMotivo, setStockMotivo] = useState('');
  
  // 🆕 NUEVO: Estados para búsqueda inteligente de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
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
  const [precioRecomendado, setPrecioRecomendado] = useState(0);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🆕 NUEVO: Estados para el modal de edición de precio
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPriceValue, setNewPriceValue] = useState('');
  const [priceModalLoading, setPriceModalLoading] = useState(false);

  // 🔧 Obtener el rol del usuario para restricciones
  const { userRole } = useRole();
  const isEmpleado = userRole === 'empleado';

  // 🔧 Verificar permisos al cargar el componente
  useEffect(() => {
    if (isEmpleado) {
      showEmpleadoAccessDeniedAlert("la creación de productos nuevos", "Solo administradores y jefes pueden agregar productos al inventario.");
      navigate('/products');
      return;
    }
  }, [isEmpleado, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const barcode = params.get('barcode');
    
    if (barcode) {
      setFormData(prev => ({ ...prev, 'addproducts-codigo-barras': barcode }));
      handleCodigoBarrasChange(barcode);
    }
  }, []);

  // Calcular precio recomendado cuando cambia el precio de compra o la categoría
  useEffect(() => {
    const precioCompra = parseFloat(formData['addproducts-precio-compra']) || 0;
    const categoria = formData['addproducts-categoria'] || 'Otros';
    const margen = MARGENES_POR_CATEGORIA[categoria] || 0.23;
    const nuevoPrecioRecomendado = precioCompra * (1 + margen);
    setPrecioRecomendado(nuevoPrecioRecomendado);
  }, [formData['addproducts-precio-compra'], formData['addproducts-categoria']]);

  // 🆕 NUEVO: Función para abrir el modal de edición de precio
  const handleOpenPriceModal = () => {
    setNewPriceValue(existingProduct?.precioVenta || formData['addproducts-precio-venta'] || '');
    setShowPriceModal(true);
  };

  // 🆕 NUEVO: Función para cerrar el modal de edición de precio
  const handleClosePriceModal = () => {
    setShowPriceModal(false);
    setNewPriceValue('');
  };

  // 🆕 NUEVO: Función para actualizar el precio del producto
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
      // 🔧 ARREGLO: Enviar todos los campos del producto, no solo el precio
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

  // 🆕 NUEVO: Cargar lista de productos cuando se selecciona modo stock
  const loadProductsList = async () => {
    try {
      setSearchLoading(true);
      const response = await getProducts(1, 1000); // Cargar muchos productos
      const products = response.data?.products || response.products || [];
      setProductsList(products);
      setFilteredProducts(products);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('No se pudieron cargar los productos');
    } finally {
      setSearchLoading(false);
    }
  };

  // 🆕 NUEVO: Función para filtrar productos por búsqueda
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

  // 🆕 NUEVO: Función para seleccionar modo de operación
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

  // 🆕 NUEVO: Función para seleccionar un producto de la lista
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
    
    // 🔄 MODIFICADO: Fijar el precio de venta del producto existente (no modificable)
    setFormData(prev => ({
      ...prev,
      'addproducts-precio-compra': product.PrecioCompra || '',
      'addproducts-precio-venta': product.PrecioVenta || '', // 🆕 FIJO: Usar el precio actual del producto
      'addproducts-categoria': product.Categoria || '', // Necesario para calcular precio recomendado
      'addproducts-fecha-vencimiento': '' // Limpiar fecha para que sea del nuevo lote
    }));
    
    // Limpiar búsqueda para mostrar el producto seleccionado
    setSearchQuery('');
  };

  // 🆕 NUEVO: Función para buscar producto existente para agregar stock
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
    setImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleCodigoBarrasChange = async (value) => {
    setFormData(prev => ({ ...prev, 'addproducts-codigo-barras': value }));

    // Solo buscar automáticamente si estamos en modo nuevo producto
    if (operationMode === 'new' && value.length === 13) {
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

  // 🆕 MODIFICADO: Función para agregar un nuevo lote al producto existente
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
      // 🔄 CAMBIO PRINCIPAL: Usar el servicio en lugar de fetch directo
      const loteData = {
        cantidad: parseInt(stockToAdd),
        precioCompra: parseFloat(formData['addproducts-precio-compra']),
        precioVenta: parseFloat(formData['addproducts-precio-venta']),
        fechaVencimiento: formData['addproducts-fecha-vencimiento']
      };

      console.log('🔍 DEBUGGING - Creando nuevo lote:', loteData);

      // 🆕 USAR EL NUEVO SERVICIO DE LOTES
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

  // 🆕 NUEVO: Función para manejar nuevo producto
  const handleNewProductSubmit = async () => {
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas crear este nuevo producto en el inventario?",
      "Sí, crear",
      "No, cancelar"
    );

    if (!result.isConfirmed) return;

    if (formData['addproducts-categoria'] === '') {
      showErrorAlert('Error', 'Por favor, seleccione una categoría válida.');
      return;
    }

    setLoading(true);
    setError(null);

    const productFormData = new FormData();
    for (const key in formData) {
      productFormData.append(key, formData[key]);
    }

    if (image instanceof File) {
      productFormData.append('image', image);
    } else if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('http')) {
      productFormData.append('imageUrl', imagePreview);
    }

    try {
      await addProducts(productFormData);
      showSuccessAlert('Éxito', 'Producto creado correctamente en el inventario');
      navigate('/products');
    } catch (error) {
      console.error('Error al crear el producto', error);
      setError('Ocurrió un error al intentar crear el producto.');
      showErrorAlert('Error', 'No se pudo crear el producto. Intente nuevamente.');
    } finally {
      setLoading(false);
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

  // 🆕 NUEVO: Función para volver a selección de modo
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

  // 🆕 NUEVO: Renderizar selector de modo si no se ha seleccionado
  if (!operationMode) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="content-container">
          <div className="addproducts-page-header">
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
                // 🆕 NUEVO: Vista de búsqueda inteligente de productos
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
                          {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} 
                          {searchQuery ? ` encontrado${filteredProducts.length !== 1 ? 's' : ''}` : ' disponible'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Lista de productos */}
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
                </div>
              ) : operationMode === 'stock' && existingProduct ? (
                // 🆕 NUEVO: Vista mejorada para agregar stock con formulario completo
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
                            <div className="addproducts-lote-details">
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
                            <div className="addproducts-stock-calculation">
                              <p>
                                <strong>Se actualizará el stock del producto existente</strong>
                              </p>
                              <p className="addproducts-lote-note">
                                ✅ Se agregará al inventario actual sin crear productos duplicados
                              </p>
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
      
      {/* 🆕 NUEVO: Modal para edición de precio */}
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
