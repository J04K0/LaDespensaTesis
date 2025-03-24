import React from 'react';
import '../styles/SkeletonStyles.css';

const ProductScannerSkeleton = () => {
  return (
    <div className="skeleton-scanner">
      <div className="skeleton-search-bar"></div>
      <div className="skeleton-scanner-content">
        <div className="skeleton-product-info">
          <div className="skeleton-image"></div>
          <div className="skeleton-title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-quantity-controls">
            <div className="skeleton-button-round small"></div>
            <div className="skeleton-text small"></div>
            <div className="skeleton-button-round small"></div>
          </div>
          <div className="skeleton-button"></div>
        </div>
        <div className="skeleton-cart">
          <div className="skeleton-title"></div>
          {[...Array(3)].map((_, index) => (
            <div key={index} className="skeleton-cart-item">
              <div className="skeleton-cart-info">
                <div className="skeleton-text"></div>
                <div className="skeleton-text small"></div>
              </div>
              <div className="skeleton-cart-actions">
                <div className="skeleton-button-round small"></div>
                <div className="skeleton-text small"></div>
                <div className="skeleton-button-round small"></div>
              </div>
            </div>
          ))}
          <div className="skeleton-total"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductScannerSkeleton;