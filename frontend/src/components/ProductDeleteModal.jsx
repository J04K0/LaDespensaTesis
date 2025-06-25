import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import '../styles/ProductDeleteModal.css';

const ProductDeleteModal = ({ isOpen, onClose, onConfirm, productName, loading }) => {
  const [motivoEliminacion, setMotivoEliminacion] = useState('');
  const [comentarioEliminacion, setComentarioEliminacion] = useState('');
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
      setMotivoEliminacion('');
      setComentarioEliminacion('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!motivoEliminacion) {
      newErrors.motivo = 'Debe seleccionar un motivo';
    }
    
    if (!comentarioEliminacion.trim()) {
      newErrors.comentario = 'Debe proporcionar un comentario';
    } else if (comentarioEliminacion.trim().length < 10) {
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
    
    const deleteData = {
      motivoEliminacion,
      comentarioEliminacion: comentarioEliminacion.trim()
    };
    
    onConfirm(deleteData);
  };

  const handleClose = () => {
    if (!loading) {
      setMotivoEliminacion('');
      setComentarioEliminacion('');
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
    <div className="product-delete-modal-overlay" onClick={handleOverlayClick}>
      <div className="product-delete-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="product-delete-modal-header">
          <div className="product-delete-modal-icon">
            <FontAwesomeIcon icon={faExclamationTriangle} />
          </div>
          <h2 className="product-delete-modal-title">Eliminar Producto</h2>
          <button 
            className="product-delete-modal-close"
            onClick={handleClose}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="product-delete-modal-body">
          <div className="product-delete-warning">
            <p>
              ¿Está seguro de que desea eliminar el producto 
              <strong> "{productName}"</strong>?
            </p>
            <p className="warning-text">
              Esta acción marcará el producto como eliminado. El producto no se eliminará 
              físicamente y podrá ser restaurado posteriormente desde la sección de productos eliminados.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="product-delete-form">
            <div className="form-group">
              <label htmlFor="motivoEliminacion" className="form-label">
                Motivo de la eliminación <span className="required">*</span>
              </label>
              <select
                id="motivoEliminacion"
                value={motivoEliminacion}
                onChange={(e) => setMotivoEliminacion(e.target.value)}
                className={`form-select ${errors.motivo ? 'error' : ''}`}
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

            <div className="form-group">
              <label htmlFor="comentarioEliminacion" className="form-label">
                Comentario adicional <span className="required">*</span>
              </label>
              <textarea
                id="comentarioEliminacion"
                value={comentarioEliminacion}
                onChange={(e) => setComentarioEliminacion(e.target.value)}
                placeholder="Proporcione detalles adicionales sobre la eliminación del producto..."
                className={`form-textarea ${errors.comentario ? 'error' : ''}`}
                rows={4}
                disabled={loading}
                required
              />
              <small className="form-help">
                Mínimo 10 caracteres. Este comentario se guardará para auditoría.
              </small>
              {errors.comentario && <span className="error-message">{errors.comentario}</span>}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="product-delete-modal-footer">
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-danger"
            disabled={loading || !motivoEliminacion || !comentarioEliminacion.trim()}
          >
            <FontAwesomeIcon icon={faTrash} />
            {loading ? 'Eliminando...' : 'Eliminar Producto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDeleteModal;