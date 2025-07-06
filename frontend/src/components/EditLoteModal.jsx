import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEdit, faCalendarAlt, faDollarSign, faBoxes } from '@fortawesome/free-solid-svg-icons';
import { editarLoteProducto } from '../services/AddProducts.service';
import { showSuccessAlert, showErrorAlert } from '../helpers/swaHelper';
import '../styles/EditLoteModal.css';

const EditLoteModal = ({ isOpen, onClose, lote, productId, productName, onLoteUpdated }) => {
  const [formData, setFormData] = useState({
    cantidad: '',
    precioCompra: '',
    fechaVencimiento: ''
  });
  const [loading, setLoading] = useState(false);

  // Llenar el formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && lote) {
      setFormData({
        cantidad: lote.cantidad || '',
        precioCompra: lote.precioCompra || '',
        fechaVencimiento: lote.fechaVencimiento ? new Date(lote.fechaVencimiento).toISOString().split('T')[0] : ''
      });
    }
  }, [isOpen, lote]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cantidad || !formData.precioCompra || !formData.fechaVencimiento) {
      showErrorAlert('Campos requeridos', 'Cantidad, precio de compra y fecha de vencimiento son obligatorios');
      return;
    }

    if (parseFloat(formData.cantidad) < 0) {
      showErrorAlert('Cantidad inválida', 'La cantidad no puede ser negativa');
      return;
    }

    if (parseFloat(formData.precioCompra) <= 0) {
      showErrorAlert('Precio inválido', 'El precio de compra debe ser mayor a 0');
      return;
    }

    try {
      setLoading(true);
      
      // Solo enviar campos editables, mantener precio de venta original del lote
      const loteData = {
        cantidad: parseInt(formData.cantidad),
        precioCompra: parseFloat(formData.precioCompra),
        precioVenta: parseFloat(lote.precioVenta), // Mantener el precio original
        fechaVencimiento: formData.fechaVencimiento
      };

      const response = await editarLoteProducto(productId, lote._id, loteData);
      
      showSuccessAlert(
        'Lote actualizado',
        `El lote ${lote.numeroLote} ha sido actualizado exitosamente`
      );
      
      onLoteUpdated(response);
      onClose();
    } catch (error) {
      console.error('Error editing lote:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo actualizar el lote';
      showErrorAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-lote-modal-overlay" onClick={handleOverlayClick}>
      <div className="edit-lote-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-lote-modal-header">
          <div className="edit-lote-modal-title">
            <FontAwesomeIcon icon={faEdit} />
            <div>
              <h2>Editar Lote</h2>
              <p>{productName} - {lote?.numeroLote}</p>
            </div>
          </div>
          <button className="edit-lote-modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="edit-lote-modal-content">
          <form onSubmit={handleSubmit} className="edit-lote-form">
            <div className="edit-lote-form-list">
              <div className="edit-lote-form-group">
                <label htmlFor="cantidad" className="edit-lote-form-label">
                  <FontAwesomeIcon icon={faBoxes} /> Cantidad
                </label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  className="edit-lote-form-input"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div className="edit-lote-form-group">
                <label htmlFor="precioCompra" className="edit-lote-form-label">
                  <FontAwesomeIcon icon={faDollarSign} /> Precio de Compra
                </label>
                <input
                  type="number"
                  id="precioCompra"
                  name="precioCompra"
                  value={formData.precioCompra}
                  onChange={handleInputChange}
                  className="edit-lote-form-input"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="edit-lote-form-group">
                <label htmlFor="fechaVencimiento" className="edit-lote-form-label">
                  <FontAwesomeIcon icon={faCalendarAlt} /> Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  id="fechaVencimiento"
                  name="fechaVencimiento"
                  value={formData.fechaVencimiento}
                  onChange={handleInputChange}
                  className="edit-lote-form-input"
                  required
                />
              </div>
            </div>

            <div className="edit-lote-form-actions">
              <button
                type="button"
                onClick={onClose}
                className="edit-lote-btn edit-lote-btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="edit-lote-btn edit-lote-btn-primary"
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Actualizar Lote'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLoteModal;