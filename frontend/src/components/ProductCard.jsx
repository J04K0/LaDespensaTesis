import React from 'react';
import PropTypes from 'prop-types';
import '../styles/ProductCardStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const ProductCard = ({ image, name, marca, stock, venta, fechaVencimiento, onInfo }) => {
  return (
    <div className={`product-card ${stock === 0 ? 'out-of-stock' : ''}`}>      
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
        
      </div>
    </div>
  );
};
ProductCard.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
  marca: PropTypes.string.isRequired,
  stock: PropTypes.number.isRequired,
  venta: PropTypes.number.isRequired,
  fechaVencimiento: PropTypes.string,
  onInfo: PropTypes.func.isRequired
};

export default ProductCard;
