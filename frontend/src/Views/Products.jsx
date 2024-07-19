import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import '../styles/ProductsStyles.css';
import { getProducts } from '../services/AddProducts.service';

const Products = () => {
  const [productList, setProductList] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        console.log("data desde el front",response)
        setProductList(response);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="products-page">
      <Navbar />
      <div className="products-content">
        <div className="products-header">
          <button className="filter-button">Buscar por nombre</button>
          <button className="filter-button">Ordenar por</button>
          <button className="filter-button">Filtrar por</button>
        </div>
        <div className="product-list">
        {productList.map((product, index) => {
      console.log('Product:', product); // Verifica cada producto aquí
      return (
    <ProductCard
      key={index}
      name={product.Nombre}
      marca={product.Marca}
      stock={product.Stock}
      venta={product.PrecioVenta}
    />
  );
})}

        </div>
      </div>
    </div>
  );
};

export default Products;
