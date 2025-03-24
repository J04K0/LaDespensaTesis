import React from 'react';
import '../styles/SkeletonStyles.css';

const FinanzasSkeleton = () => {
  return (
    <div className="skeleton-finanzas">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
      </div>
      <div className="skeleton-filter-container">
        <div className="skeleton-filter-group">
          <div className="skeleton-text small"></div>
          <div className="skeleton-dropdown"></div>
        </div>
        <div className="skeleton-button"></div>
      </div>
      <div className="skeleton-summary-cards">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="skeleton-summary-card">
            <div className="skeleton-text"></div>
            <div className="skeleton-amount"></div>
          </div>
        ))}
      </div>
      {[...Array(3)].map((_, index) => (
        <div key={index} className="skeleton-chart-container">
          <div className="skeleton-chart-title"></div>
          <div className="skeleton-chart"></div>
        </div>
      ))}
    </div>
  );
};

export default FinanzasSkeleton;