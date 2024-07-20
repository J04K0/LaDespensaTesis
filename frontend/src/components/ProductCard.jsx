import React from 'react';
import PropTypes from 'prop-types';
import '../styles/ProductCardStyles.css';

const ProductCard = ({ venta, name, marca }) => {
  return (
    <div className="product-card">
      <div className="product-info">
        <div className="product-price">Precio: ${venta}</div>
        <div className="product-name">{name}</div>
        <div className="product-brand">{marca}</div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  venta: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  marca: PropTypes.string.isRequired,
};

export default ProductCard;
