import React from 'react';
import '../styles/SkeletonStyles.css';

const HistorySaleSkeleton = () => {
  return (
    <div className="skeleton-history-sale">
      <div className="skeleton-controls">
        <div className="skeleton-search"></div>
        <div className="skeleton-dropdown"></div>
        <div className="skeleton-dropdown"></div>
      </div>
      <div className="skeleton-table">
        <div className="skeleton-row header">
          <div className="skeleton-cell"></div>
          <div className="skeleton-cell"></div>
          <div className="skeleton-cell"></div>
          <div className="skeleton-cell"></div>
        </div>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="skeleton-row">
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
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

export default HistorySaleSkeleton;