import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import ProductTableView from '../components/ProductTableView';
import ProductInfoModal from '../components/ProductInfoModal';
import ProductEditModal from '../components/ProductEditModal';
import PriceHistoryModal from '../components/PriceHistoryModal';
import ProductDisabledModal from '../components/ProductDisabledModal';
import StockHistoryModal from '../components/StockHistoryModal';
import DisabledProductsModal from '../components/DisabledProductsModal';
import ProductLotesModal from '../components/ProductLotesModal';
import StockControlModal from '../components/StockControlModal';
import '../styles/ProductsStyles.css';
import { getProducts, getProductsByCategory, disableProduct, deleteProductPermanently, getProductsExpiringSoon, getExpiredProducts, getLowStockProducts, updateProduct, getProductById } from '../services/AddProducts.service';
import { obtenerVentas, obtenerVentasProducto } from '../services/venta.service';
import { useVentas } from '../context/VentasContext';
import { useRole } from '../hooks/useRole';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert, showEmpleadoAccessDeniedAlert } from '../helpers/swaHelper';
import ProductCardSkeleton from '../components/Skeleton/ProductCardSkeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFilter, faSearch, faPen, faTrash, faInfo, faTimes, faChevronDown, faHistory, faEye, faEyeSlash, faFilePdf, faList, faThLarge, faTrashRestore, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { ExportService } from '../services/export.service.js';
import SmartPagination from '../components/SmartPagination';
import { MARGENES_POR_CATEGORIA, STOCK_MINIMO_POR_CATEGORIA, CATEGORIAS } from '../constants/products.constants.js';

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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showStockHistoryModal, setShowStockHistoryModal] = useState(false);
  const [stockHistoryProductId, setStockHistoryProductId] = useState(null);
  const [stockHistoryProductName, setStockHistoryProductName] = useState('');
  
  const [showDeletedProductsModal, setShowDeletedProductsModal] = useState(false);

  const [showLotesModal, setShowLotesModal] = useState(false);
  const [lotesProductId, setLotesProductId] = useState(null);
  const [lotesProductName, setLotesProductName] = useState('');

  // 🆕 Estado para el modal de control de stock
  const [showStockControlModal, setShowStockControlModal] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [lotesExpandedState, setLotesExpandedState] = useState({});

  const [productCardRefs, setProductCardRefs] = useState({});

  const [characteristicsExpanded, setCharacteristicsExpanded] = useState(true);
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [showPriceHistoryTab, setShowPriceHistoryTab] = useState(false);

  const [showFilters, setShowFilters] = useState(true);
  
  // Estado para controlar la vista (tarjetas o tabla)
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'

  // Productos por página dinámico según la vista
  const productsPerPage = viewMode === 'table' ? 20 : 10;

  const navigate = useNavigate();
  const location = useLocation();

  // Obtener el rol del usuario para controlar permisos
  const { userRole } = useRole();
  const isEmpleado = userRole === 'empleado';

  // Memoizar cálculos costosos
  const sortedProducts = useMemo(() => {
    if (!filteredProducts.length) return [];
    
    const products = [...filteredProducts];
    if (!sortOption) return products;
    
    return products.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc': return a.Nombre.localeCompare(b.Nombre);
        case 'name-desc': return b.Nombre.localeCompare(a.Nombre);
        case 'stock-asc': return a.Stock - b.Stock;
        case 'stock-desc': return b.Stock - a.Stock;
        case 'price-asc': return a.PrecioVenta - b.PrecioVenta;
        case 'price-desc': return b.PrecioVenta - a.PrecioVenta;
        default: return 0;
      }
    });
  }, [filteredProducts, sortOption]);

  const filteredAndSearchedProducts = useMemo(() => {
    if (!searchQuery.trim()) return sortedProducts;
    const query = searchQuery.toLowerCase();
    return sortedProducts.filter(product =>
      product.Nombre.toLowerCase().includes(query)
    );
  }, [sortedProducts, searchQuery]);

  const displayedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredAndSearchedProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredAndSearchedProducts, currentPage, productsPerPage]);

  // Memoizar cálculo de páginas totales
  const totalPagesCalculated = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAndSearchedProducts.length / productsPerPage));
  }, [filteredAndSearchedProducts.length, productsPerPage]);

  // Optimizar useEffect para páginas
  useEffect(() => {
    setTotalPages(totalPagesCalculated);
    if (currentPage > totalPagesCalculated) {
      setCurrentPage(1);
    }
  }, [totalPagesCalculated, currentPage]);

  // Optimizar control de scroll del modal
  useEffect(() => {
    const isModalOpen = showInfoModal || showEditModal || showPriceHistoryModal;
    
    if (isModalOpen) {
      // Usar técnica más eficiente para bloquear scroll
      const scrollY = window.pageYOffset;
      document.body.style.cssText = `
        position: fixed;
        top: -${scrollY}px;
        width: 100%;
        overflow-y: scroll;
      `;
      document.body.dataset.scrollY = scrollY;
    } else {
      // Restaurar scroll de manera eficiente
      const scrollY = document.body.dataset.scrollY;
      document.body.style.cssText = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
      delete document.body.dataset.scrollY;
    }

    return () => {
      // Cleanup
      const scrollY = document.body.dataset.scrollY;
      document.body.style.cssText = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
      delete document.body.dataset.scrollY;
    };
  }, [showInfoModal, showEditModal, showPriceHistoryModal]);

  // Usar las categorías centralizadas
  const categories = CATEGORIAS;

  // Optimizar handlers con useCallback
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    // Asegurar que siempre haga scroll al inicio
    setTimeout(() => {
      window.scrollTo({ 
        top: 0, 
        left: 0,
        behavior: 'smooth' 
      });
    }, 100);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setCategory('');
    setCategoryFilterActive(false);
    setProductsByCategory([]);
    setAvailabilityFilter('Todos');
    setSortOption('');
    setFilteredProducts(allProducts);
    setCurrentPage(1);
  }, [allProducts]);

  const handleCategoryChange = useCallback(async (e) => {
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
  }, [allProducts, availabilityFilter]);

  const applyAvailabilityFilter = useCallback((productsToFilter, filter) => {
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
  }, [categoryFilterActive, category, productsPerPage]);

  const handleAvailabilityChange = useCallback((e) => {
    const filter = e.target.value;
    setAvailabilityFilter(filter);
    setCurrentPage(1);

    const baseProducts = categoryFilterActive ? productsByCategory : allProducts;
    applyAvailabilityFilter(baseProducts, filter);
  }, [categoryFilterActive, productsByCategory, allProducts, applyAvailabilityFilter]);

  const fetchExpiringProducts = useCallback(async (categoryName = null) => {
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
  }, [productsPerPage]);

  const fetchExpiredProducts = useCallback(async (categoryName = null) => {
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
  }, [productsPerPage]);

  const fetchLowStockProducts = useCallback(async (categoryName = null) => {
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
  }, [productsPerPage]);

  const getStockColorClass = useCallback((stock, categoria) => {
    const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[categoria] || 5;

    if (stock === 0) return 'modern-stock-value-red';
    if (stock <= stockMinimo) return 'modern-stock-value-yellow';
    return 'modern-stock-value-green';
  }, []);

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

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (deleteData) => {
    if (!productToDelete) return;

    try {
      setLoading(true);
      await disableProduct(productToDelete._id, deleteData);
      
      // Actualizar la lista de productos
      const updatedProducts = allProducts.filter(product => product._id !== productToDelete._id);
      setAllProducts(updatedProducts);

      if (categoryFilterActive) {
        const updatedCategoryProducts = productsByCategory.filter(product => product._id !== productToDelete._id);
        setProductsByCategory(updatedCategoryProducts);
        applyAvailabilityFilter(updatedCategoryProducts, availabilityFilter);
      } else {
        applyAvailabilityFilter(updatedProducts, availabilityFilter);
      }

      setShowDeleteModal(false);
      setProductToDelete(null);
      showSuccessAlert('Producto eliminado', 'El producto ha sido marcado como eliminado correctamente.');
    } catch (error) {
      console.error('Error deleting product:', error);
      showErrorAlert('Error al eliminar', 'No se pudo eliminar el producto. Verifique la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowStockHistory = (product) => {
    setStockHistoryProductId(product._id);
    setStockHistoryProductName(product.Nombre);
    setShowStockHistoryModal(true);
  };

  const handleShowLotes = (product) => {
    setLotesProductId(product._id);
    setLotesProductName(product.Nombre);
    setShowLotesModal(true);
  };

  const handleDirectDelete = async (product) => {
    // Mostrar alerta de confirmación antes de eliminar
    const result = await showConfirmationAlert(
      "¿Eliminar producto definitivamente?",
      `¿Está seguro que desea eliminar "${product.Nombre}" de manera PERMANENTE? Esta acción NO se puede deshacer y eliminará el producto completamente de la base de datos.`,
      "Sí, eliminar definitivamente",
      "Cancelar"
    );

    if (!result.isConfirmed) return; // Si el usuario cancela, no hacer nada

    try {
      setLoading(true);
      
      // Usar la nueva función de eliminación definitiva
      await deleteProductPermanently(product._id);
      
      // Actualizar la lista de productos
      const updatedProducts = allProducts.filter(p => p._id !== product._id);
      setAllProducts(updatedProducts);

      if (categoryFilterActive) {
        const updatedCategoryProducts = productsByCategory.filter(p => p._id !== product._id);
        setProductsByCategory(updatedCategoryProducts);
        applyAvailabilityFilter(updatedCategoryProducts, availabilityFilter);
      } else {
        applyAvailabilityFilter(updatedProducts, availabilityFilter);
      }

      showSuccessAlert('Producto eliminado definitivamente', `"${product.Nombre}" ha sido eliminado permanentemente de la base de datos.`);
    } catch (error) {
      console.error('Error deleting product permanently:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo eliminar el producto. Intente nuevamente.';
      showErrorAlert('Error al eliminar', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await disableProduct(id);
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

      const stockOriginal = data.Stock;
      
      console.log('🔍 DATOS DEL SERVIDOR - Stock:', data.Stock, 'Tipo:', typeof data.Stock);

      setProductToEdit({
        _id: id,
        Nombre: data.Nombre || '',
        codigoBarras: data.codigoBarras || '',
        Marca: data.Marca || '',
        Stock: stockOriginal,
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

  const handleEditSubmit = async (additionalData = {}) => {
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

      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });

      // Si hay una nueva imagen seleccionada (un archivo), la añadimos al FormData
      if (editImage instanceof File) {
        formData.append('image', editImage);
      }

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

    setShowPriceHistoryTab(false);
    setCharacteristicsExpanded(true);
    setStatsExpanded(false);

    try {
      const response = await obtenerVentasProducto(product.codigoBarras, product.Nombre);
      const ventas = response.data?.ventas || [];

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

  const handleExportToPDF = () => {
    ExportService.generarReporteProductos(filteredAndSearchedProducts, category, availabilityFilter, searchQuery);
  };

  useEffect(() => {
    if (productToEdit.PrecioCompra && productToEdit.Categoria) {
      const margen = MARGENES_POR_CATEGORIA[productToEdit.Categoria] || 0.23;
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

  const { ventasGlobales, loading: ventasLoading, getVentasProducto } = useVentas();

  const ventasProducto = useMemo(() => {
    return (ventasGlobales || []).filter(v => 
      v.codigoBarras === productInfo?.codigoBarras && v.nombre === productInfo?.Nombre
    );
  }, [ventasGlobales, productInfo]);

  const productStatsOptimized = useMemo(() => {
    if (!productInfo || !ventasGlobales) {
      return {
        totalVentas: 0,
        ingresos: 0,
        ultimaVenta: null,
        ventasPorMes: []
      };
    }

    const ventasProductoFiltered = getVentasProducto(productInfo.codigoBarras, productInfo.Nombre);

    const totalVentas = ventasProductoFiltered.reduce((sum, venta) => sum + venta.cantidad, 0);
    const ingresos = ventasProductoFiltered.reduce((sum, venta) => sum + (venta.cantidad * venta.precioVenta), 0);

    let ultimaVenta = null;
    if (ventasProductoFiltered.length > 0) {
      const fechas = ventasProductoFiltered.map(v => new Date(v.fecha));
      ultimaVenta = new Date(Math.max(...fechas));
    }

    const ventasPorMes = {};
    ventasProductoFiltered.forEach(venta => {
      const fecha = new Date(venta.fecha);
      const mes = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;

      if (!ventasPorMes[mes]) {
        ventasPorMes[mes] = 0;
      }
      ventasPorMes[mes] += venta.cantidad;
    });

    return {
      totalVentas,
      ingresos,
      ultimaVenta,
      ventasPorMes: Object.entries(ventasPorMes).map(([mes, cantidad]) => ({ mes, cantidad }))
    };
  }, [productInfo, ventasGlobales, getVentasProducto]);

  // Actualizar productStats cuando cambien las estadísticas optimizadas
  useEffect(() => {
    if (productInfo && ventasGlobales) {
      setProductStats(productStatsOptimized);
    }
  }, [productStatsOptimized, productInfo, ventasGlobales]);

  // Agregar función para refrescar productos cuando se entra desde productos eliminados
  const refreshProductsFromDeleted = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProducts(1, Number.MAX_SAFE_INTEGER);
      const productsArray = Array.isArray(data.products) ? data.products : data.data.products;
      setAllProducts(productsArray);
      
      // Mantener filtros actuales
      if (categoryFilterActive) {
        const categoryProducts = productsArray.filter(product => product.Categoria === category);
        setProductsByCategory(categoryProducts);
        applyAvailabilityFilter(categoryProducts, availabilityFilter);
      } else {
        applyAvailabilityFilter(productsArray, availabilityFilter);
      }
      
    } catch (error) {
      console.error('Error al actualizar productos:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilterActive, category, availabilityFilter, applyAvailabilityFilter]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromDeleted = searchParams.get('fromDeleted');
    
    if (fromDeleted === 'true') {
      refreshProductsFromDeleted();
      
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]fromDeleted=true/, '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search, refreshProductsFromDeleted]);

  const showEmpleadoAlert = () => {
    showEmpleadoAccessDeniedAlert("la gestión de productos eliminados");
  };

  const handleAddProductClick = () => {
    if (isEmpleado) {
      showEmpleadoAccessDeniedAlert("la creación de productos nuevos", "Puede consultar productos existentes pero no crear nuevos.");
      return;
    }
    navigate('/add-product');
  };

  const handleDeletedProductsClick = () => {
    if (isEmpleado) {
      showEmpleadoAlert();
      return;
    }
    setShowDeletedProductsModal(true);
  };

  const handleProductReactivated = useCallback(async () => {
    try {
      const data = await getProducts(1, Number.MAX_SAFE_INTEGER);
      const productsArray = Array.isArray(data.products) ? data.products : data.data.products;
      setAllProducts(productsArray);
      
      if (categoryFilterActive) {
        const categoryProducts = productsArray.filter(product => product.Categoria === category);
        setProductsByCategory(categoryProducts);
        applyAvailabilityFilter(categoryProducts, availabilityFilter);
      } else {
        applyAvailabilityFilter(productsArray, availabilityFilter);
      }
    } catch (error) {
      console.error('Error al actualizar productos después de reactivación:', error);
    }
  }, [categoryFilterActive, category, availabilityFilter, applyAvailabilityFilter]);

  const handleLotesToggle = useCallback((productId, isExpanded) => {
    setLotesExpandedState(prev => ({
      ...prev,
      [productId]: isExpanded
    }));
  }, []);

  const handleLoteUpdatedCallback = useCallback(async () => {
    try {
      const data = await getProducts(1, Number.MAX_SAFE_INTEGER);
      const productsArray = Array.isArray(data.products) ? data.products : data.data.products;
      setAllProducts(productsArray);
      
      if (categoryFilterActive) {
        const categoryProducts = productsArray.filter(product => product.Categoria === category);
        setProductsByCategory(categoryProducts);
        applyAvailabilityFilter(categoryProducts, availabilityFilter);
      } else {
        applyAvailabilityFilter(productsArray, availabilityFilter);
      }
      
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Error al actualizar productos después de editar lote:', error);
    }
  }, [categoryFilterActive, category, availabilityFilter, applyAvailabilityFilter]);

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
                <button className="products-btn products-btn-primary" onClick={handleAddProductClick}>
                  <FontAwesomeIcon icon={faPlus} /> Nuevo Producto
                </button>
                <button className="products-btn products-btn-warning" onClick={handleDeletedProductsClick}>
                  <FontAwesomeIcon icon={faEyeSlash} /> Productos Desactivados
                </button>
                <button className="products-btn products-btn-export-pdf" onClick={handleExportToPDF}>
                  <FontAwesomeIcon icon={faFilePdf} /> Descargar PDF
                </button>
                <button 
                  className="products-btn products-btn-stock-control" 
                  onClick={() => setShowStockControlModal(true)}
                  title="Control de stock manual"
                >
                  <FontAwesomeIcon icon={faClipboardList} /> Control de Stock
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
              
              {/* Botones de cambio de vista */}
              <div className="products-view-toggle">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  title="Vista de tarjetas"
                >
                  <FontAwesomeIcon icon={faThLarge} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  title="Vista de tabla"
                >
                  <FontAwesomeIcon icon={faList} />
                </button>
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
                    {viewMode === 'cards' ? (
                      displayedProducts.map((product) => (
                        <ProductCard
                          key={`${product._id}-${refreshTrigger}`}
                          image={product.image}
                          name={product.Nombre}
                          marca={product.Marca}
                          stock={product.Stock}
                          venta={product.PrecioVenta}
                          fechaVencimiento={product.fechaVencimiento}
                          categoria={product.Categoria}
                          codigoBarras={product.codigoBarras}
                          onInfo={() => handleProductInfo(product)}
                          onShowLotes={handleShowLotes}
                          onDelete={handleDirectDelete}
                          productId={product._id}
                          lotesExpanded={lotesExpandedState[product._id] || false}
                          onLotesToggle={handleLotesToggle}
                        />
                      ))
                    ) : (
                      <ProductTableView
                        products={displayedProducts}
                        onDelete={handleDeleteClick}
                        onDeletePermanently={handleDirectDelete}
                        onEdit={handleEdit}
                        onInfo={handleProductInfo}
                        onShowLotes={handleShowLotes}
                        getStockColorClass={getStockColorClass}
                        userRole={userRole}
                      />
                    )}
                  </div>
                ) : (
                  <div className="no-results">No hay productos disponibles con los filtros seleccionados.</div>
                )}
                
                <SmartPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  maxVisiblePages={5}
                />
              </>
            )}
          </>
        )}
      </div>
      
      {/* NUEVO MODAL SEPARADO Y OPTIMIZADO */}
      <ProductInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        productInfo={productInfo}
        productStats={productStats}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onDeletePermanently={handleDirectDelete}
        onShowPriceHistory={(productId) => {
          setPriceHistoryData(productId);
          setShowPriceHistoryModal(true);
        }}
        onShowStockHistory={handleShowStockHistory}
      />
      
      {showEditModal && (
        <ProductEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          productToEdit={productToEdit}
          onProductChange={handleEditChange}
          onImageChange={handleImageChange}
          onSubmit={handleEditSubmit}
          editImage={editImage}
          loading={loading}
          categories={categories}
        />
      )}
      
      {showPriceHistoryModal && priceHistoryData && (
        <PriceHistoryModal 
          isOpen={showPriceHistoryModal}
          onClose={() => setShowPriceHistoryModal(false)}
          productId={priceHistoryData}
        />
      )}
      
      {/* 🆕 NUEVO MODAL DE ELIMINACIÓN */}
      <ProductDisabledModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        productName={productToDelete?.Nombre || ''}
        loading={loading}
      />
      
      {/* 🆕 NUEVO MODAL DE HISTORIAL DE STOCK */}
      <StockHistoryModal
        isOpen={showStockHistoryModal}
        onClose={() => {
          setShowStockHistoryModal(false);
          setStockHistoryProductId(null);
          setStockHistoryProductName('');
        }}
        productId={stockHistoryProductId}
        productName={stockHistoryProductName}
      />
      
      <DisabledProductsModal
        isOpen={showDeletedProductsModal}
        onClose={() => setShowDeletedProductsModal(false)}
        onProductReactivated={handleProductReactivated}
      />
      
      <ProductLotesModal
        isOpen={showLotesModal}
        onClose={() => {
          setShowLotesModal(false);
          setLotesProductId(null);
          setLotesProductName('');
        }}
        productId={lotesProductId}
        productName={lotesProductName}
        onLoteUpdated={handleLoteUpdatedCallback}
        onToggleLotes={handleLotesToggle}
      />
      
      {/* 🆕 NUEVO MODAL DE CONTROL DE STOCK */}
      <StockControlModal
        isOpen={showStockControlModal}
        onClose={() => setShowStockControlModal(false)}
      />
    </div>
  );
};

export default Products;