import React from 'react';
import '../styles/ProductsStyles.css';

const ProductCardSkeleton = () => {
  return (
    <div className="products-skeleton-product-card">
      <div className="products-skeleton-content">
        <div className="products-skeleton-image"></div>
        <div className="products-skeleton-info">
          <div className="products-skeleton-text products-skeleton-title"></div>
          <div className="products-skeleton-text products-skeleton-subtitle"></div>
          <div className="products-skeleton-text"></div>
        </div>
        <div className="products-skeleton-price"></div>
      </div>
      <div className="products-skeleton-actions">
        <div className="products-skeleton-action-btn"></div>
        <div className="products-skeleton-action-btn"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;