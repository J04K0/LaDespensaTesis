import React from 'react';
import '../styles/ProductsStyles.css';

const ProductCardSkeleton = () => {
  return (
    <div className="skeleton-product-card">
      <div className="skeleton-content">
        <div className="skeleton-image"></div>
        <div className="skeleton-info">
          <div className="skeleton-text title"></div>
          <div className="skeleton-text subtitle"></div>
          <div className="skeleton-text"></div>
        </div>
        <div className="skeleton-price"></div>
      </div>
      <div className="skeleton-actions">
        <div className="skeleton-action-btn"></div>
        <div className="skeleton-action-btn"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;