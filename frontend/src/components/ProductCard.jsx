import React from 'react';
import PropTypes from 'prop-types';
import '../styles/ProductCardStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const ProductCard = ({ image, name, stock, venta, fechaVencimiento, onInfo, productId }) => {
  const isExpired = fechaVencimiento ? new Date(fechaVencimiento) < new Date() : false;
  
  const getStockIndicatorClass = (stock) => {
    if (stock > 10) return 'productcard-stock-high';
    if (stock > 5) return 'productcard-stock-medium';
    return 'productcard-stock-low';
  };

  return (
    <div className="productcard-container">
      <div className={`productcard ${stock === 0 ? 'productcard-out-of-stock' : ''} ${isExpired ? 'productcard-expired' : ''}`}>
        <div className="productcard-inner">
          <div className="productcard-content-wrapper">
            <div className="productcard-main-info">
              <div className="productcard-image-container">
                <img
                  src={image || "/default-image.jpg"}
                  alt={name}
                  className="productcard-image"
                />
              </div>
              
              <div className="productcard-basic-info">
                <div className="productcard-title-container">
                  <h3 className="productcard-title">{name}</h3>
                  {(isExpired || stock === 0) && (
                    <div className="productcard-inline-badges">
                      {isExpired && <div className="productcard-badge productcard-vencido">Vencido</div>}
                      {stock === 0 && <div className="productcard-badge productcard-sin-stock">Sin stock</div>}
                    </div>
                  )}
                </div>
                <div className="productcard-stock">
                  <span className={`productcard-stock-indicator ${getStockIndicatorClass(stock)}`}></span>
                  Stock: {stock} unidades
                </div>
              </div>
            </div>
          </div>

          <div className="productcard-price-section">
            <div className="productcard-price-container">
              <span className="productcard-price">${typeof venta === 'number' ? venta.toLocaleString("es-ES") : venta}</span>
            </div>
            
            <div className="productcard-action-buttons">
              <button onClick={onInfo} className="productcard-action-btn productcard-action-btn-full">
                <FontAwesomeIcon icon={faInfoCircle} />
                Detalles
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
  stock: PropTypes.number.isRequired,
  venta: PropTypes.number.isRequired,
  fechaVencimiento: PropTypes.string,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onInfo: PropTypes.func.isRequired,
  productId: PropTypes.string.isRequired,
};

export default ProductCard;
