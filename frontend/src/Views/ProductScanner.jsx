import React, { useState } from 'react';
import Navbar from '../components/Navbar'; // Asegúrate de que el componente Navbar esté correctamente importado
import '../styles/ProductScannerStyles.css'; // Crea este archivo para los estilos CSS

const ProductScanner = () => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="scanner-container">
      <Navbar />
      <h2>Escanear Producto</h2>
      <div className="scanner-section">
        <div className="scanner-box">
          {/* Aquí irá la integración del escáner de código de barras */}
          <p>Cámara de escaneo</p>
        </div>
        <p className="scanned-code">Código Escaneado: ---</p>
      </div>
      <div className="product-info">
        <h3>Nombre del Producto</h3>
        <p>Stock restante: ---</p>
        <div className="quantity-controls">
          <button onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}>-</button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
      </div>
      <button className="add-to-cart-button">Agregar al carrito</button>
    </div>
  );
};

export default ProductScanner;
