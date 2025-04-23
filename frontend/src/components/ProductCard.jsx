import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/ProductCardStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faChartLine } from '@fortawesome/free-solid-svg-icons';
import PriceHistoryModal from './PriceHistoryModal';

const ProductCard = ({ image, name, marca, stock, venta, fechaVencimiento, onInfo, productId }) => {
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  
  // Verificar si el producto está vencido
  const isExpired = fechaVencimiento ? new Date(fechaVencimiento) < new Date() : false;

  return (
    <>
      <div className={`product-card ${stock === 0 ? 'out-of-stock' : ''} ${isExpired ? 'expired-product' : ''}`}>      
        <div className="product-info">
          <div className="image-container" onClick={onInfo}>
            <img 
              src={image ? `${image}` : "/default-image.jpg"} 
              alt={name} 
              className="product-image" 
            />
            <div className="image-overlay">
              <span>Ver detalles</span>
            </div>
          </div>
          <p className="product-price">${venta}</p>
          <p className="product-brand">{marca}</p>
          <h3 className="product-name">{name}</h3>
          <button 
            className="price-history-btn"
            onClick={() => setShowPriceHistory(true)}
          >
            <FontAwesomeIcon icon={faChartLine} />
            <span>Ver Historial</span>
          </button>
        </div>
      </div>

      <PriceHistoryModal
        isOpen={showPriceHistory}
        onClose={() => setShowPriceHistory(false)}
        productId={productId}
      />
    </>
  );
};

ProductCard.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
  marca: PropTypes.string.isRequired,
  stock: PropTypes.number.isRequired,
  venta: PropTypes.number.isRequired,
  fechaVencimiento: PropTypes.string,
  onInfo: PropTypes.func.isRequired,
  productId: PropTypes.string.isRequired
};

export default ProductCard;
