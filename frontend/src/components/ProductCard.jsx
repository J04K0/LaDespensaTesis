import React from 'react';
import PropTypes from 'prop-types';
import '../styles/ProductCardStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { STOCK_MINIMO_POR_CATEGORIA } from '../constants/products.constants.js';

const ProductCard = React.memo(({ image, name, stock, venta, fechaVencimiento, categoria, onInfo, productId }) => {
  const isExpired = React.useMemo(() => {
    return fechaVencimiento ? new Date(fechaVencimiento) < new Date() : false;
  }, [fechaVencimiento]);
  
  const stockIndicatorClass = React.useMemo(() => {
    const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[categoria] || 5;

    if (stock === 0) return 'productcard-stock-low';
    if (stock <= stockMinimo) return 'productcard-stock-medium';
    return 'productcard-stock-high';
  }, [stock, categoria]);

  const formatNumberWithDots = (number) => {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formattedPrice = React.useMemo(() => {
    return typeof venta === 'number' ? formatNumberWithDots(venta) : venta;
  }, [venta]);

  const cardClasses = React.useMemo(() => {
    let classes = 'productcard';
    if (stock === 0) classes += ' productcard-out-of-stock';
    if (isExpired) classes += ' productcard-expired';
    return classes;
  }, [stock, isExpired]);

  const shouldShowBadges = React.useMemo(() => {
    return isExpired || stock === 0;
  }, [isExpired, stock]);

  return (
    <div className="productcard-container">
      <div className={cardClasses}>
        <div className="productcard-inner">
          <div className="productcard-content-wrapper">
            <div className="productcard-main-info">
              <div className="productcard-image-container">
                <img
                  src={image || "/default-image.jpg"}
                  alt={name}
                  className="productcard-image"
                  loading="lazy"
                />
              </div>
              
              <div className="productcard-basic-info">
                <div className="productcard-title-container">
                  <h3 className="productcard-title">{name}</h3>
                  {shouldShowBadges && (
                    <div className="productcard-inline-badges">
                      {isExpired && <div className="productcard-badge productcard-vencido">Vencido</div>}
                      {stock === 0 && <div className="productcard-badge productcard-sin-stock">Sin stock</div>}
                    </div>
                  )}
                </div>
                <div className="productcard-stock">
                  <span className={`productcard-stock-indicator ${stockIndicatorClass}`}></span>
                  Stock: {stock} unidades
                </div>
              </div>
            </div>
          </div>

          <div className="productcard-price-section">
            <div className="productcard-price-container">
              <span className="productcard-price">$&nbsp;{formattedPrice}</span>
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
});

ProductCard.propTypes = process.env.NODE_ENV === 'development' ? {
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
  stock: PropTypes.number.isRequired,
  venta: PropTypes.number.isRequired,
  fechaVencimiento: PropTypes.string,
  categoria: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onInfo: PropTypes.func.isRequired,
  productId: PropTypes.string.isRequired,
} : {};

ProductCard.displayName = 'ProductCard';

export default ProductCard;
