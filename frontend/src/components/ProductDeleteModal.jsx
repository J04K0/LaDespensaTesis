import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEyeSlash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import '../styles/ProductDeleteModal.css';

const ProductDeleteModal = ({ isOpen, onClose, onConfirm, productName, loading }) => {
  const [motivoDesactivacion, setMotivoDesactivacion] = useState('');
  const [comentarioDesactivacion, setComentarioDesactivacion] = useState('');
  const [errors, setErrors] = useState({});

  const motivosDisponibles = [
    { value: '', label: 'Seleccione un motivo...' },
    { value: 'sin_stock_permanente', label: 'Sin stock permanente' },
    { value: 'producto_dañado', label: 'Producto dañado' },
    { value: 'vencido', label: 'Producto vencido' },
    { value: 'descontinuado', label: 'Producto descontinuado' },
    { value: 'error_registro', label: 'Error en el registro' },
    { value: 'otro', label: 'Otro motivo' }
  ];

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

  useEffect(() => {
    if (isOpen) {
      setMotivoDesactivacion('');
      setComentarioDesactivacion('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!motivoDesactivacion) {
      newErrors.motivo = 'Debe seleccionar un motivo';
    }
    
    if (!comentarioDesactivacion.trim()) {
      newErrors.comentario = 'Debe proporcionar un comentario';
    } else if (comentarioDesactivacion.trim().length < 10) {
      newErrors.comentario = 'El comentario debe tener al menos 10 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const deactivateData = {
      motivoEliminacion: motivoDesactivacion,
      comentarioEliminacion: comentarioDesactivacion.trim()
    };
    
    onConfirm(deactivateData);
  };

  const handleClose = () => {
    if (!loading) {
      setMotivoDesactivacion('');
      setComentarioDesactivacion('');
      setErrors({});
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={handleOverlayClick}>
      <div className="delete-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <div className="delete-modal-icon">
            <FontAwesomeIcon icon={faEyeSlash} />
          </div>
          <h2 className="delete-modal-title">Desactivar Producto</h2>
          <button 
            className="delete-modal-close"
            onClick={handleClose}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="delete-modal-content">
          <div className="delete-warning-card">
            <div className="delete-warning-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="delete-warning-content">
              <h4>¿Está seguro de que desea desactivar el producto?</h4>
              <p className="delete-product-name">"{productName}"</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="delete-form">
            <div className="delete-form-grid">
              <div className="delete-form-group">
                <label htmlFor="motivoDesactivacion" className="delete-form-label">
                  Motivo de la desactivación <span className="required">*</span>
                </label>
                <select
                  id="motivoDesactivacion"
                  value={motivoDesactivacion}
                  onChange={(e) => setMotivoDesactivacion(e.target.value)}
                  className={`delete-form-control ${errors.motivo ? 'error' : ''}`}
                  disabled={loading}
                  required
                >
                  {motivosDisponibles.map((motivo) => (
                    <option key={motivo.value} value={motivo.value}>
                      {motivo.label}
                    </option>
                  ))}
                </select>
                {errors.motivo && <span className="error-message">{errors.motivo}</span>}
              </div>

              <div className="delete-form-group delete-form-group-full">
                <label htmlFor="comentarioDesactivacion" className="delete-form-label">
                  Comentario adicional <span className="required">*</span>
                </label>
                <textarea
                  id="comentarioDesactivacion"
                  value={comentarioDesactivacion}
                  onChange={(e) => setComentarioDesactivacion(e.target.value)}
                  placeholder="Proporcione detalles adicionales sobre la desactivación del producto..."
                  className={`delete-form-control delete-textarea ${errors.comentario ? 'error' : ''}`}
                  rows={4}
                  disabled={loading}
                  required
                />
                <small className="delete-form-help">
                  Mínimo 10 caracteres. Este comentario se guardará para auditoría.
                </small>
                {errors.comentario && <span className="error-message">{errors.comentario}</span>}
              </div>
            </div>
          </form>
        </div>

        <div className="delete-modal-footer">
          <button
            type="button"
            onClick={handleClose}
            className="delete-btn delete-btn-secondary"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} />
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="delete-btn delete-btn-danger"
            disabled={loading || !motivoDesactivacion || !comentarioDesactivacion.trim()}
          >
            <FontAwesomeIcon icon={faEyeSlash} />
            {loading ? 'Desactivando...' : 'Desactivar Producto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDeleteModal;