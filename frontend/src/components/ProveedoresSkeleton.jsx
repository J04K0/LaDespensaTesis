import React from 'react';
import '../styles/SkeletonStyles.css';

const ProveedoresSkeleton = () => {
  return (
    <div className="skeleton-proveedores">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-button"></div>
      </div>
      <div className="skeleton-controls">
        <div className="skeleton-search"></div>
        <div className="skeleton-dropdown"></div>
        <div className="skeleton-dropdown"></div>
      </div>
      <div className="skeleton-table">
        <div className="skeleton-row header">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="skeleton-cell"></div>
          ))}
        </div>
        {[...Array(5)].map((_, index) => (
          <div key={index} className="skeleton-row">
            {[...Array(8)].map((_, cellIndex) => (
              <div key={cellIndex} className="skeleton-cell"></div>
            ))}
          </div>
        ))}
      </div>
      <div className="skeleton-pagination">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="skeleton-page-button"></div>
        ))}
      </div>
    </div>
  );
};

export default ProveedoresSkeleton;