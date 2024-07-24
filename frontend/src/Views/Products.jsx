import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import '../styles/ProductsStyles.css';
import { getProducts, getProductsByCategory, deleteProduct } from '../services/AddProducts.service';

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

  const categories = [
    'Congelados', 'Carnes', 'Despensa', 'Panaderia y Pasteleria',
    'Quesos y Fiambres', 'Bebidas y Licores', 'Lacteos, Huevos y Refrigerados',
    'Desayuno y Dulces', 'Bebes y Niños', 'Cigarros', 'Todos'
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
    setAvailabilityFilter(e.target.value);
    setCurrentPage(1);
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

  const handleDelete = async (id) => {
    console.log('Deleting product with ID:', id);
    try {
      await deleteProduct(id);
      const updatedProducts = allProducts.filter(product => product._id !== id);
      setAllProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      setTotalPages(Math.ceil(updatedProducts.length / productsPerPage));
    } catch (error) {
      console.error('Error deleting product:', error);
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

  const displayedProducts = filteredAndSearchedProducts.filter(product => {
    if (availabilityFilter === 'Disponibles') {
      return product.Stock > 0;
    } else if (availabilityFilter === 'No disponibles') {
      return product.Stock === 0;
    }
    return true;
  }).slice(
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
