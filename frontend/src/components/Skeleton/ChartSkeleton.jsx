import React from 'react';
import './SkeletonStyles.css';

const ChartSkeleton = () => {
  return (
    <div className="skeleton-chart-container">
      <div className="skeleton-chart-controls">
        <div className="skeleton-button-round"></div>
        <div className="skeleton-button-round"></div>
      </div>
      <div className="skeleton-chart-title"></div>
      <div className="skeleton-chart"></div>
    </div>
  );
};

export default ChartSkeleton;