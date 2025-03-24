import React from 'react';
import '../styles/SkeletonStyles.css';

const DeudoresTableSkeleton = () => {
  return (
    <div className="skeleton-deudores-table">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-button"></div>
      </div>
      <div className="skeleton-table">
        <div className="skeleton-row header">
          <div className="skeleton-cell"></div>
          <div className="skeleton-cell"></div>
        </div>
        {[...Array(5)].map((_, index) => (
          <div key={index} className="skeleton-row">
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeudoresTableSkeleton;