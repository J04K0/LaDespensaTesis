import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import '../styles/ProductsStyles.css';
import { getProducts, getProductsByCategory, deleteProduct, getProductsExpiringSoon, getExpiredProducts, getLowStockProducts } from '../services/AddProducts.service';
import Swal from 'sweetalert2';

const Products = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('Todos');
  const productsPerPage = 9;
  const navigate = useNavigate();
  const location = useLocation();

  const categories = [
    'Congelados', 'Carnes', 'Despensa', 'Panaderia y Pasteleria',
    'Quesos y Fiambres', 'Bebidas y Licores', 'Lacteos, Huevos y Refrigerados',
    'Desayuno y Dulces', 'Bebes y Niños', 'Cigarros'
  ];

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
      const filteredData = data.filter(product => product.Stock > 0); // Filtrar productos con stock 0
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
      Swal.fire({
        icon: 'success',
        title: 'Producto eliminado con éxito',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar el producto',
        text: 'Ocurrió un error al intentar eliminar el producto.',
      });
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-product`, { state: { productId: id } });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const filteredAndSearchedProducts = filteredProducts.filter(product =>
    product.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedProducts = filteredAndSearchedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  return (
    <div className="products-page">
      <Navbar />
      <div className="products-content">
        <div className="products-header">
          <div className="control">
            <input
              id="search"
              type="text"
              className="input search-input"
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
        </div>
        <div className="product-list">
          {displayedProducts.length > 0 ? (
            displayedProducts.map((product, index) => (
              <ProductCard
                key={index}
                name={product.Nombre}
                marca={product.Marca}
                stock={product.Stock}
                venta={product.PrecioVenta}
                fechaVencimiento={product.fechaVencimiento}
                onDelete={() => handleDelete(product._id)}
                onEdit={() => handleEdit(product._id)}
              />
            ))
          ) : (
            <p>No hay productos disponibles.</p>
          )}
        </div>
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
    </div>
  );
};

export default Products;
