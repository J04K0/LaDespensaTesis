import React from 'react';
import '../styles/ProductCardStyles.css';

const ProductCard = ({ image, price, brand, description }) => {
  return (
    <div className="product-card">
      <img src={image} alt={description} className="product-image" />
      <div className="product-info">
        <p className="product-price">${price}</p>
        <p className="product-brand">{brand}</p>
        <p className="product-description">{description}</p>
      </div>
    </div>
  );
};

export default ProductCard;
