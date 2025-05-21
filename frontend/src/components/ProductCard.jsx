import React from 'react';
import PropTypes from 'prop-types';
import '../styles/ProductCardStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faHistory } from '@fortawesome/free-solid-svg-icons';

const ProductCard = ({ image, name, marca, stock, venta, fechaVencimiento, onInfo, onPriceHistory, productId }) => {
  const isExpired = fechaVencimiento ? new Date(fechaVencimiento) < new Date() : false;
  
  const getStockIndicatorClass = (stock) => {
    if (stock > 10) return 'stock-high';
    if (stock > 5) return 'stock-medium';
    return 'stock-low';
  };

  return (
    <div className="product-card-container">
      <div className={`product-card ${stock === 0 ? 'out-of-stock' : ''} ${isExpired ? 'expired-product' : ''}`}>
        <div className="product-card-inner">
          <div className="product-content-wrapper">
            <div className="product-main-info">
              <div className="product-image-container">
                <img
                  src={image || "/default-image.jpg"}
                  alt={name}
                  className="product-image"
                />
              </div>
              
              <div className="product-basic-info">
                <h3 className="product-title">{name}</h3>
                <div className="product-brand">{marca}</div>
                <div className="product-stock">
                  <span className={`stock-indicator ${getStockIndicatorClass(stock)}`}></span>
                  Stock: {stock} unidades
                </div>
                
                {(isExpired || stock === 0) && (
                  <div className="product-badges">
                    {isExpired && <div className="product-badge vencido">Vencido</div>}
                    {stock === 0 && <div className="product-badge sin-stock">Sin stock</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="product-action-buttons">
              <button onClick={onInfo} className="product-action-btn">
                <FontAwesomeIcon icon={faInfoCircle} />
                Detalles
              </button>
              <button onClick={onPriceHistory} className="product-action-btn">
                <FontAwesomeIcon icon={faHistory} />
                Historial
              </button>
            </div>
          </div>

          <div className="product-price-container">
            <span className="product-price">${typeof venta === 'number' ? venta.toLocaleString("es-ES") : venta}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
  marca: PropTypes.string,
  stock: PropTypes.number.isRequired,
  venta: PropTypes.number.isRequired,
  fechaVencimiento: PropTypes.string,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onInfo: PropTypes.func.isRequired,
  onPriceHistory: PropTypes.func.isRequired,
  productId: PropTypes.string.isRequired,
};

export default ProductCard;
