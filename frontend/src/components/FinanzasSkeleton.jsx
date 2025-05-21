import React from 'react';
import '../styles/SkeletonStyles.css';

const FinanzasSkeleton = () => {
  return (
    <div className="skeleton-finanzas">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-button"></div>
      </div>

      <div className="skeleton-filter-container">
        <div className="skeleton-filter-group">
          <div className="skeleton-text small"></div>
          <div className="skeleton-dropdown"></div>
        </div>
      </div>

      {/* Dashboard de métricas */}
      <div className="skeleton-metrics-grid">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="skeleton-metric-card">
            <div className="skeleton-metric-icon"></div>
            <div className="skeleton-metric-content">
              <div className="skeleton-text small"></div>
              <div className="skeleton-text large"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      {[...Array(2)].map((_, index) => (
        <div key={index} className="skeleton-chart-container">
          <div className="skeleton-chart-header">
            <div className="skeleton-chart-title"></div>
            <div className="skeleton-icon small"></div>
          </div>
          <div className="skeleton-chart"></div>
        </div>
      ))}
    </div>
  );
};

export default FinanzasSkeleton;