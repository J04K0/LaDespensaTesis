import React, { useEffect, useState } from 'react';
import { getProductsExpiringSoon } from '../services/AddProducts.service';
import ProductCard from '../components/ProductCard';
import Navbar from '../components/Navbar';

const ExpiringProducts = () => {
  const [expiringProducts, setExpiringProducts] = useState([]);

  useEffect(() => {
    const fetchExpiringProducts = async () => {
      try {
        const data = await getProductsExpiringSoon();
        setExpiringProducts(data);
      } catch (error) {
        console.error('Error fetching products expiring soon:', error);
      }
    };

    fetchExpiringProducts();
  }, []);

  return (
    <div className="expiring-products-page">
      <Navbar />
      <h1>Productos próximos a caducar</h1>
      <div className="product-list">
        {expiringProducts.length === 0 ? (
          <p>No hay productos próximos a caducar.</p>
        ) : (
          expiringProducts.map(product => (
            <ProductCard
              key={product._id}
              name={product.Nombre}
              marca={product.Marca}
              stock={product.Stock}
              venta={product.PrecioVenta}
              fechaVencimiento={product.fechaVencimiento}
              onDelete={() => {}}
              onEdit={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ExpiringProducts;
