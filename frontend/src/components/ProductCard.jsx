import React from 'react';
import PropTypes from 'prop-types';
import '../styles/ProductCardStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

// Constantes fuera del componente para evitar recalcular en cada render
const STOCK_MINIMO_POR_CATEGORIA = {
  'Congelados': 10,
  'Carnes': 5,
  'Despensa': 8,
  'Panaderia y Pasteleria': 10,
  'Quesos y Fiambres': 5,
  'Bebidas y Licores': 5,
  'Lacteos, Huevos y otros': 10,
  'Desayuno y Dulces': 10,
  'Bebes y Niños': 10,
  'Cigarros y Tabacos': 5,
  'Cuidado Personal': 8,
  'Remedios': 3,
  'Limpieza y Hogar': 5,
  'Mascotas': 5,
  'Otros': 5
};

const ProductCard = React.memo(({ image, name, stock, venta, fechaVencimiento, categoria, onInfo, productId }) => {
  // Memoizar el cálculo de expiración
  const isExpired = React.useMemo(() => {
    return fechaVencimiento ? new Date(fechaVencimiento) < new Date() : false;
  }, [fechaVencimiento]);
  
  // Optimizar cálculo de indicador de stock
  const stockIndicatorClass = React.useMemo(() => {
    const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[categoria] || 5;

    if (stock === 0) return 'productcard-stock-low';
    if (stock <= stockMinimo) return 'productcard-stock-medium';
    return 'productcard-stock-high';
  }, [stock, categoria]);

  // Optimizar formato de precio
  const formattedPrice = React.useMemo(() => {
    return typeof venta === 'number' ? venta.toLocaleString("es-ES") : venta;
  }, [venta]);

  // Optimizar las clases CSS del contenedor principal
  const cardClasses = React.useMemo(() => {
    let classes = 'productcard';
    if (stock === 0) classes += ' productcard-out-of-stock';
    if (isExpired) classes += ' productcard-expired';
    return classes;
  }, [stock, isExpired]);

  // Optimizar el cálculo de badges
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
              <span className="productcard-price">${formattedPrice}</span>
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

// Optimizar PropTypes - solo verificar en desarrollo
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
