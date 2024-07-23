import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import '../styles/ProductsStyles.css';
import { getProducts, deleteProduct } from '../services/AddProducts.service';

const Products = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const productsPerPage = 6;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Resetear la página actual a 1 cuando cambia la búsqueda
  };

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const data = await getProducts(1, Number.MAX_SAFE_INTEGER); // Recuperar todos los productos
        if (data && data.products) {
          setAllProducts(data.products);
          setTotalPages(Math.ceil(data.products.length / productsPerPage));
        } else {
          setAllProducts([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setAllProducts([]);
        setTotalPages(1);
      }
    };

    fetchAllProducts();
  }, []);

  const handleDelete = async (id) => {
    console.log('Deleting product with ID:', id); // Verifica el ID aquí
    try {
      await deleteProduct(id);
      setAllProducts(allProducts.filter(product => product._id !== id));
      setTotalPages(Math.ceil(allProducts.filter(product => product._id !== id).length / productsPerPage));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const filteredProducts = allProducts.filter(product =>
    product.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedProducts = filteredProducts.slice(
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
          <button className="filter-button">Ordenar por</button>
          <button className="filter-button">Filtrar por</button>
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
              />
            ))
          ) : (
            <p>No hay productos disponibles.</p>
          )}
        </div>
        <div className="pagination">
          {[...Array(totalPages).keys()].map(page => (
            <button
              key={page}
              className={`pagination-button ${page + 1 === currentPage ? 'active' : ''}`}
              onClick={() => handlePageChange(page + 1)}
            >
              {page + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;
