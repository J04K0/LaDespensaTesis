import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import '../styles/ProductsStyles.css';
import { getProducts, getProductsByCategory, deleteProduct, getProductsExpiringSoon, getExpiredProducts, getLowStockProducts, updateProduct, getProductById, obtenerVentas } from '../services/AddProducts.service';
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
            className="modal-content info-modal product-info-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Información de Producto: {productInfo.Nombre}</h3>
            
            <div className="product-info-container">
              <div className="product-basic-info">
                <img 
                  src={productInfo.image || "/default-image.jpg"} 
                  alt={productInfo.Nombre} 
                  className="product-info-image" 
                />
                <div className="product-details">
                  <p><strong>Código de Barras:</strong> {productInfo.codigoBarras}</p>
                  <p><strong>Marca:</strong> {productInfo.Marca}</p>
                  <p><strong>Categoría:</strong> {productInfo.Categoria}</p>
                  <p><strong>Stock Actual:</strong> {productInfo.Stock} unidades</p>
                  <p><strong>Precio de Venta:</strong> ${productInfo.PrecioVenta}</p>
                  <p><strong>Precio de Compra:</strong> ${productInfo.PrecioCompra}</p>
                  {productInfo.fechaVencimiento && (
                    <p><strong>Fecha de Vencimiento:</strong> {new Date(productInfo.fechaVencimiento).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              
              <div className="product-stats">
                <h4>Estadísticas de Ventas</h4>
                {productStats.totalVentas > 0 ? (
                  <>
                    <p><strong>Total de Unidades Vendidas:</strong> {productStats.totalVentas}</p>
                    <p><strong>Ingresos Generados:</strong> ${productStats.ingresos}</p>
                    {productStats.ultimaVenta && (
                      <p><strong>Última Venta:</strong> {productStats.ultimaVenta.toLocaleDateString()}</p>
                    )}
                    
                    {productStats.ventasPorMes.length > 0 && (
                      <div className="sales-by-month">
                        <h5>Ventas por Mes</h5>
                        <ul>
                          {productStats.ventasPorMes.map((item, index) => (
                            <li key={index}>{item.mes}: {item.cantidad} unidades</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p>Este producto aún no tiene registros de ventas</p>
                )}
              </div>
            </div>
            
            <div className="modal-buttons">
              <button onClick={() => setShowInfoModal(false)} className="cancel-button">
                Cerrar
              </button>
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
            className="modal-content edit-modal product-edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Editar Producto</h3>
            
            <div className="modal-form-group">
              <label htmlFor="Nombre">Nombre:</label>
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
              <label htmlFor="codigoBarras">Código de Barras:</label>
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
              <label htmlFor="Marca">Marca:</label>
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
              <label htmlFor="Stock">Stock:</label>
              <input
                type="text"
                id="Stock"
                name="Stock"
                value={productToEdit.Stock}
                onChange={handleEditChange}
                required
              />
            </div>
            
            <div className="modal-form-group">
              <label htmlFor="Categoria">Categoría:</label>
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
            
            <div className="modal-form-group">
              <label htmlFor="PrecioCompra">Precio de Compra:</label>
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
              <label htmlFor="PrecioVenta">Precio de Venta:</label>
              <input
                type="number"
                id="PrecioVenta"
                name="PrecioVenta"
                value={productToEdit.PrecioVenta}
                onChange={handleEditChange}
                required
              />
            </div>
            
            <div className="modal-form-group">
              <label htmlFor="fechaVencimiento">Fecha de Vencimiento:</label>
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
              <label htmlFor="precioAntiguo">Precio Antiguo (opcional):</label>
              <input
                type="number"
                id="precioAntiguo"
                name="precioAntiguo"
                value={productToEdit.precioAntiguo}
                onChange={handleEditChange}
              />
            </div>
            
            <div className="modal-form-group">
              <label htmlFor="image">Imagen:</label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleImageChange}
                accept="image/*"
              />
              {typeof editImage === 'string' && (
                <div className="current-image">
                  <p>Imagen actual:</p>
                  <img src={editImage} alt="Imagen actual del producto" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                </div>
              )}
            </div>
            
            <div className="modal-buttons">
              <button onClick={handleEditSubmit} className="confirm-button">
                Guardar Cambios
              </button>
              <button onClick={() => setShowEditModal(false)} className="cancel-button">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;