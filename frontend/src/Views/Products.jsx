import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import PriceHistoryModal from '../components/PriceHistoryModal';
import '../styles/ProductsStyles.css';
import { getProducts, getProductsByCategory, deleteProduct, getProductsExpiringSoon, getExpiredProducts, getLowStockProducts, updateProduct, getProductById } from '../services/AddProducts.service';
import { obtenerVentas } from '../services/venta.service';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert } from '../helpers/swaHelper';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFilter, faSearch, faPen, faTrash, faInfo, faTimes, faChevronDown, faHistory, faEye, faEyeSlash, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportService } from '../services/export.service.js';

const Products = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('Todos');
  const [sortOption, setSortOption] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [productsByCategory, setProductsByCategory] = useState([]);
  const [categoryFilterActive, setCategoryFilterActive] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState({
    _id: '',
    Nombre: '',
    codigoBarras: '',
    Marca: '',
    Stock: 0,
    Categoria: '',
    PrecioVenta: 0,
    PrecioCompra: 0,
    PrecioRecomendado: 0,
    fechaVencimiento: '',
    precioAntiguo: 0
  });
  const [editImage, setEditImage] = useState(null);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [productInfo, setProductInfo] = useState(null);
  const [productStats, setProductStats] = useState({
    totalVentas: 0,
    ingresos: 0,
    ultimaVenta: null,
    ventasPorMes: []
  });

  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false);
  const [priceHistoryData, setPriceHistoryData] = useState([]);

  const [characteristicsExpanded, setCharacteristicsExpanded] = useState(true);
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [showPriceHistoryTab, setShowPriceHistoryTab] = useState(false);

  const [showFilters, setShowFilters] = useState(true);

  const productsPerPage = 10;
  const navigate = useNavigate();
  const location = useLocation();

  // Efecto para controlar el scroll cuando se abren modales
  useEffect(() => {
    if (showInfoModal || showEditModal || showPriceHistoryModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Limpieza al desmontar
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showInfoModal, showEditModal, showPriceHistoryModal]);

  const categories = [
    'Congelados', 'Carnes', 'Despensa', 'Panaderia y Pasteleria',
    'Quesos y Fiambres', 'Bebidas y Licores', 'Lacteos, Huevos y otros',
    'Desayuno y Dulces', 'Bebes y Niños', 'Cigarros y Tabacos',
    'Limpieza y Hogar', 'Cuidado Personal', 'Mascotas', 'Remedios', 'Otros'
  ];

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'name-asc') return a.Nombre.localeCompare(b.Nombre);
    if (sortOption === 'name-desc') return b.Nombre.localeCompare(a.Nombre);
    if (sortOption === 'stock-asc') return a.Stock - b.Stock;
    if (sortOption === 'stock-desc') return b.Stock - a.Stock;
    if (sortOption === 'price-asc') return a.PrecioVenta - b.PrecioVenta;
    if (sortOption === 'price-desc') return b.PrecioVenta - a.PrecioVenta;
    return 0;
  });

  const filteredAndSearchedProducts = sortedProducts.filter(product =>
    product.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedProducts = filteredAndSearchedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  useEffect(() => {
    // Calcular el número real de páginas basado en los productos filtrados por nombre
    const filteredBySearch = sortedProducts.filter(product =>
      product.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const calculatedPages = Math.max(1, Math.ceil(filteredBySearch.length / productsPerPage));
    
    // Ajustar el número de páginas
    setTotalPages(calculatedPages);
    
    // Si la página current es mayor que el total de páginas calculadas, resetear a la página 1
    if (currentPage > calculatedPages) {
      setCurrentPage(1);
    }
  }, [searchQuery, filteredProducts, sortOption]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = async (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    setCurrentPage(1);

    try {
      if (selectedCategory && selectedCategory !== 'Todos') {
        setCategoryFilterActive(true);
        const response = await getProductsByCategory(selectedCategory);
        const productsArray = Array.isArray(response) ? response : [];
        setProductsByCategory(productsArray);

        applyAvailabilityFilter(productsArray, availabilityFilter);
      } else {
        setCategoryFilterActive(false);
        setProductsByCategory([]);

        applyAvailabilityFilter(allProducts, availabilityFilter);
      }
    } catch (error) {
      console.error('Error fetching products by category:', error);
      setFilteredProducts([]);
      setProductsByCategory([]);
      setTotalPages(1);
    }
  };

  const applyAvailabilityFilter = (productsToFilter, filter) => {
    let result = [];

    switch (filter) {
      case 'Por vencer':
        setFilteredProducts(productsToFilter);
        setTotalPages(Math.ceil(productsToFilter.length / productsPerPage));
        fetchExpiringProducts(categoryFilterActive ? category : null);
        break;
      case 'Vencidos':
        fetchExpiredProducts(categoryFilterActive ? category : null);
        break;
      case 'Poco stock':
        fetchLowStockProducts(categoryFilterActive ? category : null);
        break;
      case 'Disponibles':
        result = productsToFilter.filter(product => product.Stock > 0);
        setFilteredProducts(result);
        setTotalPages(Math.ceil(result.length / productsPerPage));
        break;
      case 'No disponibles':
        result = productsToFilter.filter(product => product.Stock === 0);
        setFilteredProducts(result);
        setTotalPages(Math.ceil(result.length / productsPerPage));
        break;
      default:
        setFilteredProducts(productsToFilter);
        setTotalPages(Math.ceil(productsToFilter.length / productsPerPage));
        break;
    }
  };

  const handleAvailabilityChange = (e) => {
    const filter = e.target.value;
    setAvailabilityFilter(filter);
    setCurrentPage(1);

    const baseProducts = categoryFilterActive ? productsByCategory : allProducts;
    applyAvailabilityFilter(baseProducts, filter);
  };

  const fetchExpiringProducts = async (categoryName = null) => {
    try {
      setLoading(true);
      const data = await getProductsExpiringSoon();

      let filteredData = data;
      if (categoryName) {
        filteredData = data.filter(product => product.Categoria === categoryName);
      }

      setFilteredProducts(filteredData);
      setTotalPages(Math.ceil(filteredData.length / productsPerPage));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expiring products:', error);
      setFilteredProducts([]);
      setTotalPages(1);
      setLoading(false);
    }
  };

  const fetchExpiredProducts = async (categoryName = null) => {
    try {
      setLoading(true);
      const data = await getExpiredProducts();

      let filteredData = data;
      if (categoryName) {
        filteredData = data.filter(product => product.Categoria === categoryName);
      }

      setFilteredProducts(filteredData);
      setTotalPages(Math.ceil(filteredData.length / productsPerPage));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expired products:', error);
      setFilteredProducts([]);
      setTotalPages(1);
      setLoading(false);
    }
  };

  const fetchLowStockProducts = async (categoryName = null) => {
    try {
      setLoading(true);
      const data = await getLowStockProducts();
      const productsWithStock = data.filter(product => product.Stock > 0);

      let filteredData = productsWithStock;
      if (categoryName) {
        filteredData = productsWithStock.filter(product => product.Categoria === categoryName);
      }

      setFilteredProducts(filteredData);
      setTotalPages(Math.ceil(filteredData.length / productsPerPage));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      setFilteredProducts([]);
      setTotalPages(1);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts(1, Number.MAX_SAFE_INTEGER);
        const productsArray = Array.isArray(data.products) ? data.products : data.data.products;
        setAllProducts(productsArray);
        setFilteredProducts(productsArray);
        setTotalPages(Math.ceil(productsArray.length / productsPerPage));
      } catch (error) {
        console.error('Error fetching products:', error);
        setAllProducts([]);
        setFilteredProducts([]);
        setTotalPages(1);
        setError('Error al cargar los productos. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      if (filterParam === 'unavailable') {
        setAvailabilityFilter('No disponibles');
        setFilteredProducts(allProducts.filter(product => product.Stock === 0));
        setTotalPages(Math.ceil(allProducts.filter(product => product.Stock === 0).length / productsPerPage));
      } else if (filterParam === 'expiring') {
        setAvailabilityFilter('Por vencer');
        fetchExpiringProducts();
      } else if (filterParam === 'expired') {
        setAvailabilityFilter('Vencidos');
        fetchExpiredProducts();
      } else if (filterParam === 'lowstock') {
        setAvailabilityFilter('Poco stock');
        fetchLowStockProducts();
      } else {
        setAvailabilityFilter('Disponibles');
        setFilteredProducts(allProducts.filter(product => product.Stock > 0));
        setTotalPages(Math.ceil(allProducts.filter(product => product.Stock > 0).length / productsPerPage));
      }
    }
  }, [location.search, allProducts]);

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      const updatedProducts = allProducts.filter(product => product._id !== id);
      setAllProducts(updatedProducts);

      if (categoryFilterActive) {
        const updatedCategoryProducts = productsByCategory.filter(product => product._id !== id);
        setProductsByCategory(updatedCategoryProducts);
        applyAvailabilityFilter(updatedCategoryProducts, availabilityFilter);
      } else {
        applyAvailabilityFilter(updatedProducts, availabilityFilter);
      }

      showSuccessAlert('Producto eliminado con éxito', '');
    } catch (error) {
      console.error('Error deleting product:', error);
      showErrorAlert('Error al eliminar el producto', 'Ocurrió un error al intentar eliminar el producto.');
    }
  };

  const handleEdit = async (id) => {
    try {
      setLoading(true);
      const data = await getProductById(id);

      const formattedDate = data.fechaVencimiento
        ? new Date(data.fechaVencimiento).toISOString().split('T')[0]
        : '';

      setProductToEdit({
        _id: id,
        Nombre: data.Nombre || '',
        codigoBarras: data.codigoBarras || '',
        Marca: data.Marca || '',
        Stock: Number(data.Stock) || 0,
        Categoria: data.Categoria || '',
        PrecioVenta: Number(data.PrecioVenta) || 0,
        PrecioCompra: Number(data.PrecioCompra) || 0,
        PrecioRecomendado: Number(data.PrecioRecomendado) || 0,
        fechaVencimiento: formattedDate,
        precioAntiguo: Number(data.precioAntiguo) || 0,
      });

      setEditImage(data.image || null);
      setShowEditModal(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
      showErrorAlert('Error al cargar el producto', 'No se pudo cargar la información del producto para editar.');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setProductToEdit({
      ...productToEdit,
      [name]: name === 'Stock' || name === 'PrecioVenta' || name === 'PrecioCompra' || name === 'precioAntiguo' 
        ? Number(value) 
        : value
    });
  };

  const handleImageChange = (e) => {
    setEditImage(e.target.files[0]);
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      const { _id, PrecioRecomendado, ...productData } = productToEdit;

      // Asegurar que todos los campos numéricos se envíen como números
      Object.keys(productData).forEach(key => {
        const value = productData[key];
        if (key === 'Stock' || key === 'PrecioVenta' || key === 'PrecioCompra') {
          formData.append(key, Number(value).toString());
        } else {
          formData.append(key, value);
        }
      });

      // Si hay una nueva imagen seleccionada (un archivo), la añadimos al FormData
      if (editImage instanceof File) {
        formData.append('image', editImage);
      }
      // No enviamos imageUrl, ya que no está permitido en el esquema del backend

      await updateProduct(_id, formData);

      const updatedProductsList = await getProducts(1, Number.MAX_SAFE_INTEGER);
      const productsArray = Array.isArray(updatedProductsList.products)
        ? updatedProductsList.products
        : updatedProductsList.data.products;

      setAllProducts(productsArray);
      setFilteredProducts(productsArray);

      setShowEditModal(false);
      setLoading(false);

      showSuccessAlert('Producto actualizado con éxito', '');
    } catch (error) {
      console.error('Error updating product:', error);
      setLoading(false);
      showErrorAlert('Error al actualizar el producto', 'Ocurrió un error al intentar actualizar el producto.');
    }
  };

  const handleProductInfo = async (product) => {
    setLoading(true);
    setProductInfo(product);

    // Restablecer las pestañas - características siempre visible primero
    setShowPriceHistoryTab(false);
    setCharacteristicsExpanded(true);
    setStatsExpanded(false);

    try {
      const response = await obtenerVentas();
      const ventas = response.data || [];

      const ventasProducto = ventas.filter(venta =>
        venta.nombre === product.Nombre && venta.codigoBarras === product.codigoBarras
      );

      const totalVentas = ventasProducto.reduce((sum, venta) => sum + venta.cantidad, 0);
      const ingresos = ventasProducto.reduce((sum, venta) => sum + (venta.cantidad * venta.precioVenta), 0);

      let ultimaVenta = null;
      if (ventasProducto.length > 0) {
        const fechas = ventasProducto.map(v => new Date(v.fecha));
        ultimaVenta = new Date(Math.max(...fechas));
      }

      const ventasPorMes = {};
      ventasProducto.forEach(venta => {
        const fecha = new Date(venta.fecha);
        const mes = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;

        if (!ventasPorMes[mes]) {
          ventasPorMes[mes] = 0;
        }
        ventasPorMes[mes] += venta.cantidad;
      });

      setProductStats({
        totalVentas,
        ingresos,
        ultimaVenta,
        ventasPorMes: Object.entries(ventasPorMes).map(([mes, cantidad]) => ({ mes, cantidad }))
      });

      setShowInfoModal(true);
    } catch (error) {
      console.error('Error fetching product statistics:', error);
      showErrorAlert('Error', 'No se pudieron cargar las estadísticas del producto');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setCategoryFilterActive(false);
    setProductsByCategory([]);
    setAvailabilityFilter('Todos');
    setSortOption('');
    setFilteredProducts(allProducts);
    setTotalPages(Math.ceil(allProducts.length / productsPerPage));
    setCurrentPage(1);
  };

  const handleExportToPDF = () => {
    ExportService.generarReporteProductos(filteredAndSearchedProducts, category, availabilityFilter, searchQuery);
  };

  // Definir márgenes por categoría (mismos valores que en el backend)
  const margenesPorCategoria = {
    'Congelados': 0.25, // 25% (promedio de 20-30%)
    'Carnes': 0.20, // 20% (promedio de 15-25%)
    'Despensa': 0.20, // 20% (promedio de 15-25%)
    'Panaderia y Pasteleria': 0.25, // 25% (promedio de 20-30%)
    'Quesos y Fiambres': 0.25, // 25% (promedio de 20-30%)
    'Bebidas y Licores': 0.33, // 33% (promedio de 25-40%)
    'Lacteos, Huevos y otros': 0.20, // 20% (promedio de 15-25%)
    'Desayuno y Dulces': 0.30, // 30% (promedio de 25-35%)
    'Bebes y Niños': 0.28, // 28% (promedio de 20-35%)
    'Cigarros y Tabacos': 0.40, // 40% (promedio de 30-50%)
    'Cuidado Personal': 0.28, // 28% (promedio de 20-35%)
    'Limpieza y Hogar': 0.28, // 28% (promedio de 20-35%)
    'Mascotas': 0.28, // 28% (promedio de 20-35%)
    'Remedios': 0.15, // 15% (promedio de 10-20%)
    'Otros': 0.23  // 23% (promedio de 15-30%)
  };

  // Calcular el precio recomendado cuando cambia el precio de compra o la categoría
  useEffect(() => {
    if (productToEdit.PrecioCompra && productToEdit.Categoria) {
      const margen = margenesPorCategoria[productToEdit.Categoria] || 0.23;
      const precioRecomendado = productToEdit.PrecioCompra * (1 + margen);
      setProductToEdit(prev => ({
        ...prev,
        PrecioRecomendado: precioRecomendado
      }));
    }
  }, [productToEdit.PrecioCompra, productToEdit.Categoria]);

  const usarPrecioRecomendado = () => {
    setProductToEdit(prev => ({
      ...prev,
      PrecioVenta: prev.PrecioRecomendado.toFixed(2)
    }));
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        {loading && !showEditModal && !showInfoModal ? (
          <div className="product-list-container">
            {Array.from({ length: productsPerPage }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <>
            <div className="products-page-header">
              <div className="products-title-container">
                <h1 className="products-page-title">Productos</h1>
                <p className="products-page-subtitle">Gestiona tu inventario de manera eficiente</p>
              </div>
              <div className="products-actions">
                <button className="products-btn products-btn-primary" onClick={() => navigate('/add-product')}>
                  <FontAwesomeIcon icon={faPlus} /> Nuevo Producto
                </button>
                <button className="products-btn products-btn-export-pdf" onClick={handleExportToPDF}>
                  <FontAwesomeIcon icon={faFilePdf} /> Descargar PDF
                </button>
              </div>
            </div>
          
            <div className={`products-filters-container ${!showFilters ? 'hidden' : ''}`}>
              <div className="products-search-container">
                <FontAwesomeIcon icon={faSearch} className="products-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="products-search-input"
                />
              </div>
              
              <div className="products-filter-group">
                <select 
                  value={category} 
                  onChange={handleCategoryChange}
                  className="products-form-select"
                >
                  <option value="Todos">Todas las categorías</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="products-filter-group">
                <select 
                  value={availabilityFilter} 
                  onChange={handleAvailabilityChange}
                  className="products-form-select"
                >
                  <option value="Todos">Todos</option>
                  <option value="Disponibles">Disponibles</option>
                  <option value="No disponibles">No disponibles</option>
                  <option value="Por vencer">Por vencer</option>
                  <option value="Vencidos">Vencidos</option>
                  <option value="Poco stock">Poco stock</option>
                </select>
              </div>
              
              <div className="products-filter-group">
                <select 
                  value={sortOption} 
                  onChange={handleSortChange}
                  className="products-form-select"
                >
                  <option value="">Ordenar por</option>
                  <option value="name-asc">Nombre (A-Z)</option>
                  <option value="name-desc">Nombre (Z-A)</option>
                  <option value="stock-asc">Stock (Ascendente)</option>
                  <option value="stock-desc">Stock (Descendente)</option>
                  <option value="price-asc">Precio (Ascendente)</option>
                  <option value="price-desc">Precio (Descendente)</option>
                </select>
              </div>
              
              <button onClick={handleClearFilters} className="products-clear-filters-button">
                <FontAwesomeIcon icon={faFilter} /> Limpiar Filtros
              </button>
            </div>

            {error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <>
                {displayedProducts.length > 0 ? (
                  <div className="product-list">
                    {displayedProducts.map((product, index) => (
                      <ProductCard
                        key={product._id || index}
                        image={product.image}
                        name={product.Nombre}
                        marca={product.Marca}
                        stock={product.Stock}
                        venta={product.PrecioVenta}
                        fechaVencimiento={product.fechaVencimiento}
                        codigoBarras={product.codigoBarras}
                        onDelete={() => {
                          showConfirmationAlert(
                            '¿Estás seguro?',
                            '¿Deseas eliminar este producto? Esta acción no se puede deshacer.',
                            'Sí, eliminar',
                            'Cancelar'
                          ).then((result) => {
                            if (result.isConfirmed) {
                              handleDelete(product._id);
                            }
                          });
                        }}
                        onEdit={() => handleEdit(product._id)}
                        onInfo={() => handleProductInfo(product)}
                        productId={product._id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-results">No hay productos disponibles con los filtros seleccionados.</div>
                )}
                
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => handlePageChange(1)}
                      className="pagination-button"
                      disabled={currentPage === 1}
                    >
                      « Primera
                    </button>
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="pagination-button"
                      disabled={currentPage === 1}
                    >
                      ‹ Anterior
                    </button>
                    
                    {[...Array(totalPages).keys()].map(page => {
                      const pageNum = page + 1;
                      // Solo mostrar el número actual y algunos números cercanos para no sobrecargar la UI
                      if (
                        pageNum === 1 || 
                        pageNum === totalPages || 
                        (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(pageNum)}
                            className={`pagination-button ${pageNum === currentPage ? 'active' : ''}`}
                            disabled={pageNum === currentPage}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        (pageNum === currentPage - 3 && currentPage > 4) || 
                        (pageNum === currentPage + 3 && currentPage < totalPages - 3)
                      ) {
                        // Mostrar puntos suspensivos para indicar páginas omitidas
                        return <span key={page} className="pagination-ellipsis">...</span>;
                      }
                      return null;
                    })}
                    
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="pagination-button"
                      disabled={currentPage === totalPages}
                    >
                      Siguiente ›
                    </button>
                    <button 
                      onClick={() => handlePageChange(totalPages)}
                      className="pagination-button"
                      disabled={currentPage === totalPages}
                    >
                      Última »
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      
      {showInfoModal && productInfo && (
        <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="modal-content product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{productInfo.Nombre}</h2>
              <button className="modal-close" onClick={() => setShowInfoModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="product-header-container">
                <div className="product-detail-image-container">
                  <img 
                    src={productInfo.image || "/default-image.jpg"} 
                    alt={productInfo.Nombre} 
                    className="product-detail-image" 
                  />
                </div>
                
                <div className="product-price-header">
                  <h3 className="product-price-value">${productInfo.PrecioVenta}</h3>
                  {(new Date(productInfo.fechaVencimiento) < new Date() || productInfo.Stock === 0) && (
                    <div className="product-header-badges">
                      {new Date(productInfo.fechaVencimiento) < new Date() && 
                        <span className="product-badge product-badge-vencido">Vencido</span>
                      }
                      {productInfo.Stock === 0 && 
                        <span className="product-badge product-badge-sin-stock">Sin stock</span>
                      }
                    </div>
                  )}
                </div>
              </div>
              
              <div className="product-price-section">
                <div className="product-price-row">
                  <span className="price-label">precio compra:</span>
                  <span className="price-value">${productInfo.PrecioCompra}</span>
                </div>
                
                <div className="product-price-row">
                  <span className="price-label">precio venta:</span>
                  <span className="price-value">${productInfo.PrecioVenta}</span>
                </div>
              </div>

              <div className="product-tabs">
                <button 
                  className={`product-tab ${!showPriceHistoryTab ? 'active' : ''}`}
                  onClick={() => setShowPriceHistoryTab(false)}
                >
                  Características
                </button>
                <button 
                  className={`product-tab ${showPriceHistoryTab ? 'active' : ''}`}
                  onClick={() => setShowPriceHistoryTab(true)}
                >
                  Historial de Precios
                </button>
              </div>
              
              {!showPriceHistoryTab ? (
                <>
                  <button 
                    className="detail-section-button"
                    onClick={() => setCharacteristicsExpanded(!characteristicsExpanded)}
                  >
                    Características
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      className={`accordion-icon ${characteristicsExpanded ? 'expanded' : ''}`}
                    />
                  </button>
                  
                  {characteristicsExpanded && (
                    <div className="accordion-body">
                      <table className="details-table">
                        <tbody>
                          {productInfo.fechaVencimiento && (
                            <tr>
                              <td>Fecha vencimiento:</td>
                              <td>{new Date(productInfo.fechaVencimiento).toLocaleDateString()}</td>
                            </tr>
                          )}
                          <tr>
                            <td>Categoría:</td>
                            <td>{productInfo.Categoria}</td>
                          </tr>
                          <tr>
                            <td>Stock:</td>
                            <td>{productInfo.Stock} unidades</td>
                          </tr>
                          <tr>
                            <td>Código de Barras:</td>
                            <td>{productInfo.codigoBarras}</td>
                          </tr>
                          <tr>
                            <td>Marca:</td>
                            <td>{productInfo.Marca}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <button 
                    className="detail-section-button"
                    onClick={() => setStatsExpanded(!statsExpanded)}
                  >
                    Estadísticas de Venta
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      className={`accordion-icon ${statsExpanded ? 'expanded' : ''}`}
                    />
                  </button>
                  
                  {statsExpanded && productStats.totalVentas > 0 && (
                    <div className="accordion-body">
                      <table className="details-table">
                        <tbody>
                          <tr>
                            <td>Total Unidades Vendidas:</td>
                            <td>{productStats.totalVentas}</td>
                          </tr>
                          <tr>
                            <td>Ingresos Generados:</td>
                            <td>${productStats.ingresos.toLocaleString()}</td>
                          </tr>
                          {productStats.ultimaVenta && (
                            <tr>
                              <td>Última Venta:</td>
                              <td>{productStats.ultimaVenta.toLocaleDateString()}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      
                      {productStats.ventasPorMes && productStats.ventasPorMes.length > 0 && (
                        <div className="sales-by-month">
                          <h5>Ventas por Mes:</h5>
                          <ul>
                            {productStats.ventasPorMes.map((item, idx) => (
                              <li key={idx}>{item.mes}: {item.cantidad} unidades</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {statsExpanded && productStats.totalVentas === 0 && (
                    <div className="accordion-body">
                      <p>Este producto aún no tiene historial de ventas.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="product-price-history-container">
                  <PriceHistoryModal 
                    isOpen={true}
                    onClose={() => setShowPriceHistoryTab(false)}
                    productId={productInfo._id}
                    embedded={true}
                  />
                </div>
              )}
              
              <div className="product-detail-actions">
                <button 
                  onClick={() => { setShowInfoModal(false); handleEdit(productInfo._id); }} 
                  className="btn btn-primary"
                >
                  <FontAwesomeIcon icon={faPen} /> Editar
                </button>
                <button 
                  onClick={async () => {
                    const result = await showConfirmationAlert(
                      '¿Estás seguro?',
                      'Esta acción no se puede deshacer',
                      'Sí, eliminar',
                      'Cancelar'
                    );
                    if (result.isConfirmed) {
                      handleDelete(productInfo._id);
                      setShowInfoModal(false);
                    }
                  }} 
                  className="btn btn-danger"
                >
                  <FontAwesomeIcon icon={faTrash} /> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="products-modal-content products-product-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="products-modal-header">
              <h2 className="products-modal-title">Editar Producto</h2>
              <button className="products-modal-close" onClick={() => setShowEditModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="products-modal-body">
              <div className="products-form-grid">
                <div className="products-form-group">
                  <label className="products-form-label" htmlFor="Nombre">Nombre del producto</label>
                  <input
                    type="text"
                    id="Nombre"
                    name="Nombre"
                    value={productToEdit.Nombre}
                    onChange={handleEditChange}
                    required
                    className="products-form-control"
                  />
                </div>
                
                <div className="products-form-group">
                  <label className="products-form-label" htmlFor="codigoBarras">Código de Barras</label>
                  <input
                    type="text"
                    id="codigoBarras"
                    name="codigoBarras"
                    value={productToEdit.codigoBarras}
                    onChange={handleEditChange}
                    required
                    className="products-form-control"
                  />
                </div>
                
                <div className="products-form-group">
                  <label className="products-form-label" htmlFor="Marca">Marca</label>
                  <input
                    type="text"
                    id="Marca"
                    name="Marca"
                    value={productToEdit.Marca}
                    onChange={handleEditChange}
                    required
                    className="products-form-control"
                  />
                </div>
                
                <div className="products-form-group">
                  <label className="products-form-label" htmlFor="Categoria">Categoría</label>
                  <select
                    id="Categoria"
                    name="Categoria"
                    value={productToEdit.Categoria}
                    onChange={handleEditChange}
                    required
                    className="products-form-select"
                  >
                    <option value="">Seleccione una categoría</option>
                    {categories.map((cat, index) => (
                      <option key={index} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="products-form-group">
                  <label className="products-form-label" htmlFor="Stock">Stock</label>
                  <input
                    type="number"
                    id="Stock"
                    name="Stock"
                    value={productToEdit.Stock}
                    onChange={handleEditChange}
                    required
                    className="products-form-control"
                    min="0"
                  />
                </div>
                
                <div className="products-form-group">
                  <label className="products-form-label" htmlFor="fechaVencimiento">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    id="fechaVencimiento"
                    name="fechaVencimiento"
                    value={productToEdit.fechaVencimiento}
                    onChange={handleEditChange}
                    className="products-form-control"
                  />
                </div>
                
                <div className="products-form-group">
                  <label className="products-form-label" htmlFor="PrecioCompra">Precio de Compra</label>
                  <div className="products-input-with-icon">
                    <span className="products-input-prefix">$</span>
                    <input
                      type="number"
                      id="PrecioCompra"
                      name="PrecioCompra"
                      value={productToEdit.PrecioCompra}
                      onChange={handleEditChange}
                      required
                      className="products-form-control"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="products-form-group">
                  <label className="products-form-label">Precio Recomendado (10% sobre precio de compra)</label>
                  <div className="products-precio-recomendado-container">
                    <div className="products-input-with-icon">
                      <span className="products-input-prefix">$</span>
                      <input
                        type="text"
                        value={productToEdit.PrecioRecomendado.toFixed(2)}
                        className="products-form-control"
                        disabled
                      />
                    </div>
                    <button 
                      type="button"
                      className="products-btn products-btn-usar-recomendado"
                      onClick={usarPrecioRecomendado}
                    >
                      Usar este precio
                    </button>
                  </div>
                </div>
                
                <div className="products-form-group">
                  <label className="products-form-label" htmlFor="PrecioVenta">Precio de Venta Final</label>
                  <div className="products-input-with-icon">
                    <span className="products-input-prefix">$</span>
                    <input
                      type="number"
                      id="PrecioVenta"
                      name="PrecioVenta"
                      value={productToEdit.PrecioVenta}
                      onChange={handleEditChange}
                      required
                      className="products-form-control"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
                      
              <div className="products-form-group-full">
                <label className="products-form-label" htmlFor="image">Imagen del Producto</label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="products-form-control products-file-input"
                />
                <small className="products-form-text">Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB</small>
                
                {typeof editImage === 'string' && (
                  <div className="products-current-image">
                    <p>Imagen actual:</p>
                    <img src={editImage} alt="Imagen actual del producto" className="products-preview-image" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="products-modal-buttons">
              <button onClick={handleEditSubmit} className="products-confirm-button">
                <FontAwesomeIcon icon={faPen} /> Guardar Cambios
              </button>
              <button onClick={() => setShowEditModal(false)} className="products-cancel-button">
                <FontAwesomeIcon icon={faTimes} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showPriceHistoryModal && (
        <PriceHistoryModal 
          isOpen={showPriceHistoryModal}
          onClose={() => setShowPriceHistoryModal(false)}
          productId={displayedProducts.find(p => p._id === priceHistoryData)._id}
        />
      )}
    </div>
  );
};

export default Products;