import React from 'react';
import './SkeletonStyles.css';

const DeudoresListSkeleton = () => {
  return (
    <div className="skeleton-deudores-list">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-button"></div>
      </div>
      <div className="skeleton-controls">
        <div className="skeleton-search"></div>
        <div className="skeleton-dropdown"></div>
        <div className="skeleton-button"></div>
      </div>
      <div className="skeleton-table">
        <div className="skeleton-row header">
          <div className="skeleton-cell"></div>
          <div className="skeleton-cell"></div>
          <div className="skeleton-cell"></div>
          <div className="skeleton-cell"></div>
          <div className="skeleton-cell"></div>
        </div>
        {[...Array(8)].map((_, index) => (
          <div key={index} className="skeleton-row">
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell actions">
              <div className="skeleton-action-button"></div>
              <div className="skeleton-action-button"></div>
              <div className="skeleton-action-button"></div>
            </div>
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

export default DeudoresListSkeleton;