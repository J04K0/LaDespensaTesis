import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import '../styles/ProductsStyles.css';
import { getProducts, getProductsByCategory, deleteProduct, getProductsExpiringSoon, getExpiredProducts, getLowStockProducts, updateProduct, getProductById } from '../services/AddProducts.service';
import { obtenerVentas } from '../services/venta.service';
import { showSuccessAlert, showErrorAlert } from '../helpers/swaHelper';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

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

  const [showEditModal, setShowEditModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState({
    Nombre: '',
    codigoBarras: '',
    Marca: '',
    Stock: 0,
    Categoria: '',
    PrecioVenta: 0,
    PrecioCompra: 0,
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

  const [characteristicsExpanded, setCharacteristicsExpanded] = useState(true);
  const [statsExpanded, setStatsExpanded] = useState(true);

  const productsPerPage = 9;
  const navigate = useNavigate();
  const location = useLocation();

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
        const response = await getProductsByCategory(selectedCategory);
        const productsArray = Array.isArray(response) ? response : [];
        setFilteredProducts(productsArray);
        setTotalPages(Math.ceil(productsArray.length / productsPerPage));
      } else {
        setFilteredProducts(allProducts);
        setTotalPages(Math.ceil(allProducts.length / productsPerPage));
      }
    } catch (error) {
      console.error('Error fetching products by category:', error);
      setFilteredProducts([]);
      setTotalPages(1);
    }
  };

  const handleAvailabilityChange = (e) => {
    const filter = e.target.value;
    setAvailabilityFilter(filter);
    setCurrentPage(1);

    if (filter === 'Por vencer') {
      fetchExpiringProducts();
    } else if (filter === 'Vencidos') {
      fetchExpiredProducts();
    } else if (filter === 'Poco stock') {
      fetchLowStockProducts();
    } else if (filter === 'Disponibles') {
      setFilteredProducts(allProducts.filter(product => product.Stock > 0));
      setTotalPages(Math.ceil(allProducts.filter(product => product.Stock > 0).length / productsPerPage));
    } else if (filter === 'No disponibles') {
      setFilteredProducts(allProducts.filter(product => product.Stock === 0));
      setTotalPages(Math.ceil(allProducts.filter(product => product.Stock === 0).length / productsPerPage));
    } else {
      setFilteredProducts(allProducts);
      setTotalPages(Math.ceil(allProducts.length / productsPerPage));
    }
  };

  const fetchExpiringProducts = async () => {
    try {
      const data = await getProductsExpiringSoon();
      setFilteredProducts(data);
      setTotalPages(Math.ceil(data.length / productsPerPage));
    } catch (error) {
      console.error('Error fetching expiring products:', error);
      setFilteredProducts([]);
      setTotalPages(1);
    }
  };

  const fetchExpiredProducts = async () => {
    try {
      const data = await getExpiredProducts();
      setFilteredProducts(data);
      setTotalPages(Math.ceil(data.length / productsPerPage));
    } catch (error) {
      console.error('Error fetching expired products:', error);
      setFilteredProducts([]);
      setTotalPages(1);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const data = await getLowStockProducts();
      const filteredData = data.filter(product => product.Stock > 0);
      setFilteredProducts(filteredData);
      setTotalPages(Math.ceil(filteredData.length / productsPerPage));
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      setFilteredProducts([]);
      setTotalPages(1);
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
      setFilteredProducts(updatedProducts);
      setTotalPages(Math.ceil(updatedProducts.length / productsPerPage));
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
      const { _id, ...productData } = productToEdit;

      Object.keys(productData).forEach(key => {
        formData.append(key, productData[key]);
      });

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

      // Asegurar que las secciones estén expandidas cuando se abre el modal
    setCharacteristicsExpanded(false);
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
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setAvailabilityFilter('Todos');
    setSortOption('');
    setFilteredProducts(allProducts);
    setTotalPages(Math.ceil(allProducts.length / productsPerPage));
    setCurrentPage(1);
  };

  return (
    <div className="products-page">
      <Navbar />
      <div className="products-content">
        <div className="products-header">
          <div className="control">
            <input
              id="search"
              type="text"
              className="barra-de-busqueda"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar productos..."
            />
          </div>
          <select onChange={handleCategoryChange} value={category} className="filter-select">
            <option value="Todos">Todas las categorías</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
          <select onChange={handleAvailabilityChange} value={availabilityFilter} className="filter-select">
            <option value="Todos">Todos</option>
            <option value="Disponibles">Disponibles</option>
            <option value="No disponibles">No disponibles</option>
            <option value="Por vencer">Por vencer</option>
            <option value="Vencidos">Vencidos</option>
            <option value="Poco stock">Poco stock</option>
          </select>
          <select onChange={handleSortChange} value={sortOption} className="filter-select">
            <option value="">Ordenar por</option>
            <option value="name-asc">Nombre (A-Z)</option>
            <option value="name-desc">Nombre (Z-A)</option>
            <option value="stock-asc">Stock (Ascendente)</option>
            <option value="stock-desc">Stock (Descendente)</option>
            <option value="price-asc">Precio (Ascendente)</option>
            <option value="price-desc">Precio (Descendente)</option>
          </select>
          <button onClick={handleClearFilters} className="clear-filters-button">
            Limpiar Filtros
          </button>
          <button onClick={() => navigate('/add-product')} className="add-product-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16 12.75H12.75V16C12.75 16.41 12.41 16.75 12 16.75C11.59 16.75 11.25 16.41 11.25 16V12.75H8C7.59 12.75 7.25 12.41 7.25 12C7.25 11.59 7.59 11.25 8 11.25H11.25V8C11.25 7.59 11.59 7.25 12 7.25C12.41 7.25 12.75 7.59 12.75 8V11.25H16C16.41 11.25 16.75 11.59 16.75 12C16.75 12.41 16.41 12.75 16 12.75Z" fill="currentColor"/>
            </svg>
            Añadir Producto
          </button>
        </div>
        {loading ? (
          <div className="product-list">
            {Array.from({ length: productsPerPage }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="product-list">
            {displayedProducts.length > 0 ? (
              displayedProducts.map((product, index) => (
                <ProductCard
                  key={index}
                  image={product.image}
                  name={product.Nombre}
                  marca={product.Marca}
                  stock={product.Stock}
                  venta={product.PrecioVenta}
                  fechaVencimiento={product.fechaVencimiento}
                  onDelete={() => handleDelete(product._id)}
                  onEdit={() => handleEdit(product._id)}
                  onInfo={() => handleProductInfo(product)}
                  productId={product._id}
                />
              ))
            ) : (
              <p>No hay productos disponibles.</p>
            )}
          </div>
        )}
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`pagination-button ${index + 1 === currentPage ? 'active' : ''}`}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      {showInfoModal && productInfo && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="product-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="product-detail-content">
              {/* Columna de imagen */}
              <div className="product-detail-image-container">
                <img 
                  src={productInfo.image || "/default-image.jpg"} 
                  alt={productInfo.Nombre} 
                  className="product-detail-image" 
                />
              </div>
              
              {/* Columna de detalles */}
              <div className="product-detail-info">
                <p className="product-detail-brand">{productInfo.Marca}</p>
                <h2 className="product-detail-name">{productInfo.Nombre}</h2>
                
                <div className="product-detail-price-info">
                  <p>Compra <span className="product-detail-old-price">${productInfo.PrecioCompra}</span></p>
                  <p className="product-detail-current-price">${productInfo.PrecioVenta}</p>
                </div>
                <div className="product-detail-actions">
                  <button onClick={() => { setShowInfoModal(false); handleEdit(productInfo._id); }} className="product-detail-edit-btn">
                    Editar
                  </button>
                  <button onClick={() => { if(window.confirm('¿Estás seguro de eliminar este producto?')) { handleDelete(productInfo._id); setShowInfoModal(false); } }} className="product-detail-delete-btn">
                    Eliminar
                  </button>
                </div>
                
                {/* Sección de Características */}
                <div className="product-detail-characteristics">
                  <h3 
                    className="product-detail-section-title"
                    onClick={() => setCharacteristicsExpanded(!characteristicsExpanded)}
                    style={{ cursor: 'pointer' }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ 
                        transform: characteristicsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    Características
                  </h3>
                  
                  {characteristicsExpanded && (
                    <ul className="product-detail-characteristics-list">
                      {productInfo.fechaVencimiento && (
                        <li>
                          <span className="characteristic-bullet">-</span>
                          <span>Fecha vencimiento: {new Date(productInfo.fechaVencimiento).toLocaleDateString()}</span>
                        </li>
                      )}
                      <li>
                        <span className="characteristic-bullet">-</span>
                        <span>Categoría: {productInfo.Categoria}</span>
                      </li>
                      <li>
                        <span className="characteristic-bullet">-</span>
                        <span>Stock: {productInfo.Stock} unidades</span>
                      </li>
                      <li>
                        <span className="characteristic-bullet">-</span>
                        <span>Código de Barras: {productInfo.codigoBarras}</span>
                      </li>
                    </ul>
                  )}
                </div>
                
                {/* Sección de Estadísticas de Venta */}
                {productStats.totalVentas > 0 && (
                  <div className="product-detail-sales">
                    <h3 
                      className="product-detail-section-title"
                      onClick={() => setStatsExpanded(!statsExpanded)}
                      style={{ cursor: 'pointer' }}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        style={{ 
                          transform: statsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                      Estadísticas de Venta
                    </h3>
                    
                    {statsExpanded && (
                      <ul className="product-detail-characteristics-list">
                        <li>
                          <span className="characteristic-bullet">-</span>
                          <span>Total de Unidades Vendidas: {productStats.totalVentas}</span>
                        </li>
                        <li>
                          <span className="characteristic-bullet">-</span>
                          <span>Ingresos Generados: ${productStats.ingresos}</span>
                        </li>
                        {productStats.ultimaVenta && (
                          <li>
                            <span className="characteristic-bullet">-</span>
                            <span>Última Venta: {productStats.ultimaVenta.toLocaleDateString()}</span>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
                
                <button onClick={() => setShowInfoModal(false)} className="product-detail-close-btn">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showEditModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="modal-content product-edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Editar Producto</h3>
            
            <div className="modal-form-group">
              <label htmlFor="Nombre">Nombre del producto</label>
              <input
                type="text"
                id="Nombre"
                name="Nombre"
                value={productToEdit.Nombre}
                onChange={handleEditChange}
                required
              />
            </div>
            
            <div className="modal-form-group">
              <label htmlFor="codigoBarras">Código de Barras</label>
              <input
                type="text"
                id="codigoBarras"
                name="codigoBarras"
                value={productToEdit.codigoBarras}
                onChange={handleEditChange}
                required
              />
            </div>
            
            <div className="modal-form-group">
              <label htmlFor="Marca">Marca</label>
              <input
                type="text"
                id="Marca"
                name="Marca"
                value={productToEdit.Marca}
                onChange={handleEditChange}
                required
              />
            </div>
            
            <div className="modal-form-group">
              <label htmlFor="Stock">Stock</label>
              <input
                type="number"
                id="Stock"
                name="Stock"
                value={productToEdit.Stock}
                onChange={handleEditChange}
                required
              />
            </div>
            
            <div className="modal-form-group">
              <label htmlFor="Categoria">Categoría</label>
              <select
                id="Categoria"
                name="Categoria"
                value={productToEdit.Categoria}
                onChange={handleEditChange}
                required
              >
                <option value="">Seleccione una categoría</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* Grid de 3 columnas para los valores numéricos y fecha */}
            <div className="form-grid">
              <div className="modal-form-group">
                <label htmlFor="PrecioCompra">Precio de Compra</label>
                <input
                  type="number"
                  id="PrecioCompra"
                  name="PrecioCompra"
                  value={productToEdit.PrecioCompra}
                  onChange={handleEditChange}
                  required
                />
              </div>
              
              <div className="modal-form-group">
                <label htmlFor="fechaVencimiento">Fecha de Vencimiento</label>
                <input
                  type="date"
                  id="fechaVencimiento"
                  name="fechaVencimiento"
                  value={productToEdit.fechaVencimiento}
                  onChange={handleEditChange}
                  required
                />
              </div>
              
              <div className="modal-form-group">
                <label htmlFor="PrecioVenta">Precio de Venta</label>
                <input
                  type="number"
                  id="PrecioVenta"
                  name="PrecioVenta"
                  value={productToEdit.PrecioVenta}
                  onChange={handleEditChange}
                  required
                />
              </div>
            </div>
                    
            <div className="modal-form-group">
              <label htmlFor="image">Imagen</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleImageChange}
                  accept="image/*"
                />
              </div>
              {typeof editImage === 'string' && (
                <div className="current-image">
                  <p>Imagen actual:</p>
                  <img src={editImage} alt="Imagen actual del producto" />
                </div>
              )}
            </div>
            
            <div className="modal-buttons">
              <button onClick={handleEditSubmit} className="confirm-button">
                Editar producto
                <svg className="edit-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.9 7.5C12.2 6.8 11.1 6.3 10 6.3C7.6 6.3 5.7 8.2 5.7 10.6C5.7 13 7.6 14.9 10 14.9C12.4 14.9 14.3 13 14.3 10.6" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.2 2.43L14.1 4.53C13.8 4.83 13.5 5.41 13.5 5.85V7.29C13.5 8.06 14.14 8.7 14.91 8.7H16.35C16.79 8.7 17.38 8.4 17.67 8.11L19.77 6.01C20.74 5.04 21.2 3.95 19.77 2.52C18.34 1.07 17.25 1.45 16.2 2.43Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={() => setShowEditModal(false)} className="cancel-button">
                Cancelar
                <svg className="cancel-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 5.97998C17.67 5.64998 14.32 5.47998 10.98 5.47998C9 5.47998 7.02 5.57998 5.04 5.77998L3 5.97998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.85 9.14001L18.2 19.21C18.09 20.78 18 22 15.21 22H8.79002C6.00002 22 5.91002 20.78 5.80002 19.21L5.15002 9.14001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;