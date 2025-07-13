import React from 'react';
import './SkeletonStyles.css';

const AddProductsSkeleton = () => {
  return (
    <div className="skeleton-add-products">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
      </div>

      <div className="skeleton-form-container">
        <div className="skeleton-card">
          {/* Sección de información básica */}
          <div className="skeleton-form-section">
            <div className="skeleton-section-header">
              <div className="skeleton-icon"></div>
              <div className="skeleton-text"></div>
            </div>
            
            <div className="skeleton-form-row">
              <div className="skeleton-form-group">
                <div className="skeleton-form-label"></div>
                <div className="skeleton-form-input"></div>
              </div>
              <div className="skeleton-form-group">
                <div className="skeleton-form-label"></div>
                <div className="skeleton-form-input"></div>
              </div>
            </div>

            <div className="skeleton-form-row">
              <div className="skeleton-form-group">
                <div className="skeleton-form-label"></div>
                <div className="skeleton-form-input"></div>
              </div>
              <div className="skeleton-form-group">
                <div className="skeleton-form-label"></div>
                <div className="skeleton-dropdown"></div>
              </div>
            </div>
          </div>

          {/* Sección de inventario */}
          <div className="skeleton-form-section">
            <div className="skeleton-section-header">
              <div className="skeleton-icon"></div>
              <div className="skeleton-text"></div>
            </div>
            
            <div className="skeleton-form-row">
              <div className="skeleton-form-group">
                <div className="skeleton-form-label"></div>
                <div className="skeleton-form-input"></div>
              </div>
              <div className="skeleton-form-group">
                <div className="skeleton-form-label"></div>
                <div className="skeleton-form-input"></div>
              </div>
            </div>
          </div>

          {/* Sección de precios */}
          <div className="skeleton-form-section">
            <div className="skeleton-section-header">
              <div className="skeleton-icon"></div>
              <div className="skeleton-text"></div>
            </div>
            
            <div className="skeleton-form-row">
              <div className="skeleton-form-group">
                <div className="skeleton-form-label"></div>
                <div className="skeleton-form-input"></div>
              </div>
              <div className="skeleton-form-group">
                <div className="skeleton-form-label"></div>
                <div className="skeleton-form-input"></div>
              </div>
            </div>
          </div>

          {/* Sección de imagen */}
          <div className="skeleton-form-section">
            <div className="skeleton-section-header">
              <div className="skeleton-icon"></div>
              <div className="skeleton-text"></div>
            </div>
            
            <div className="skeleton-image-upload">
              <div className="skeleton-image"></div>
              <div className="skeleton-button"></div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="skeleton-form-actions">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductsSkeleton;