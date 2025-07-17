import React, { useState, useEffect, forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTimes } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import '../styles/ProductEditModal.css';

const ProductEditModal = forwardRef(({ 
  isOpen, 
  onClose, 
  productToEdit, 
  onProductChange, 
  onImageChange, 
  editImage, 
  onSubmit, 
  loading, 
  categories 
}, ref) => {

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.pageYOffset;
      document.body.style.cssText = `
        position: fixed;
        top: -${scrollY}px;
        width: 100%;
        overflow-y: scroll;
      `;
      document.body.dataset.scrollY = scrollY;
    } else {
      const scrollY = document.body.dataset.scrollY;
      document.body.style.cssText = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
      delete document.body.dataset.scrollY;
    }

    return () => {
      const scrollY = document.body.dataset.scrollY;
      document.body.style.cssText = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
      delete document.body.dataset.scrollY;
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas guardar los cambios realizados a este producto?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "No, cancelar"
    });

    if (result.isConfirmed) {
      onSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="product-edit-modal-overlay" onClick={onClose}>
      <div className="product-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="product-edit-modal-header">
          <h2 className="product-edit-modal-title">
            <FontAwesomeIcon icon={faPen} /> Editar Producto
          </h2>
          <button 
            className="product-edit-modal-close"
            onClick={onClose}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="product-edit-modal-body">
          <div className="product-edit-form-grid">
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="Nombre">Nombre del producto</label>
              <input
                type="text"
                id="Nombre"
                name="Nombre"
                value={productToEdit.Nombre}
                onChange={onProductChange}
                required
                className="product-edit-form-control"
                disabled={loading}
              />
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="codigoBarras">Código de Barras</label>
              <input
                type="text"
                id="codigoBarras"
                name="codigoBarras"
                value={productToEdit.codigoBarras}
                onChange={onProductChange}
                required
                className="product-edit-form-control"
                disabled={loading}
              />
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="Marca">Marca</label>
              <input
                type="text"
                id="Marca"
                name="Marca"
                value={productToEdit.Marca}
                onChange={onProductChange}
                required
                className="product-edit-form-control"
                disabled={loading}
              />
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="Categoria">Categoría</label>
              <select
                id="Categoria"
                name="Categoria"
                value={productToEdit.Categoria}
                onChange={onProductChange}
                required
                className="product-edit-form-select"
                disabled={loading}
              >
                <option value="">Seleccione una categoría</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="PrecioVenta">Precio de Venta Final</label>
              <div className="product-edit-input-with-icon">
                <span className="product-edit-input-prefix">$</span>
                <input
                  type="number"
                  id="PrecioVenta"
                  name="PrecioVenta"
                  value={productToEdit.PrecioVenta}
                  onChange={onProductChange}
                  required
                  className="product-edit-form-control"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
                  
          <div className="product-edit-form-group-full">
            <label className="product-edit-form-label" htmlFor="image">Imagen del Producto</label>
            <input
              type="file"
              id="image"
              name="image"
              onChange={onImageChange}
              accept="image/*"
              className="product-edit-form-control product-edit-file-input"
              disabled={loading}
            />
            <small className="product-edit-form-text">Formatos aceptados: JPG, PNG, JPEG. Tamaño máximo: 5MB</small>
            
            {typeof editImage === 'string' && (
              <div className="product-edit-current-image">
                <p>Imagen actual:</p>
                <img src={editImage} alt="Imagen actual del producto" className="product-edit-preview-image" />
              </div>
            )}
          </div>
        </div>
        
        <div className="product-edit-modal-footer">
          <button 
            onClick={handleSubmit} 
            className="product-edit-btn product-edit-btn-primary"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPen} /> 
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button 
            onClick={onClose} 
            className="product-edit-btn product-edit-btn-secondary"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
});

ProductEditModal.displayName = 'ProductEditModal';

export default ProductEditModal;