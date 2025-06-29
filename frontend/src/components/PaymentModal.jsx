import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { showConfirmationAlert } from '../helpers/swaHelper';

const PaymentModal = ({
  show,
  onClose,
  selectedDeudor,
  amount,
  setAmount,
  isPayment,
  setIsPayment,
  comment,
  setComment,
  metodoPago,
  setMetodoPago,
  onSubmit,
  sanitizeNumber
}) => {
  if (!show || !selectedDeudor) return null;

  const handleCancel = async () => {
    const hasData = amount || comment;
    
    if (hasData) {
      const result = await showConfirmationAlert(
        "¿Estás seguro?",
        "¿Deseas cancelar esta operación? Los datos ingresados se perderán.",
        "Sí, cancelar",
        "No, volver"
      );

      if (!result.isConfirmed) return;
    }

    setComment('');
    setAmount('');
    onClose();
  };

  const handleOverlayClick = async () => {
    await handleCancel();
  };

  return (
    <div className="deudores-modal-overlay" onClick={handleOverlayClick}>
      <div className="deudores-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="deudores-modal-header">
          <h2 className="deudores-modal-title">
            {isPayment ? 'Registrar Pago' : 'Añadir a la Deuda'}
          </h2>
        </div>
        
        <div className="deudores-modal-body">
          <div className="deudores-modal-info">
            <p><strong>Deudor:</strong> {selectedDeudor.Nombre}</p>
            <span className="deuda-actual">
              Deuda actual: ${selectedDeudor.deudaTotal}
            </span>
          </div>

          <div className="deudores-form-group">
            <label className="deudores-form-label" htmlFor="amount">Monto:</label>
            <div className="input-with-icon">
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(sanitizeNumber(e.target.value))}
                placeholder="Ingrese el monto"
                min="0"
                required
                className="deudores-form-control"
              />
            </div>
          </div>

          {isPayment && (
            <div className="deudores-form-group">
              <label className="deudores-form-label">Método de Pago:</label>
              <div className="deudores-payment-method-select">
                <label className="deudores-radio-group">
                  <input
                    type="radio"
                    name="metodoPago"
                    value="efectivo"
                    checked={metodoPago === 'efectivo'}
                    onChange={() => setMetodoPago('efectivo')}
                  />
                  <span className="deudores-radio-checkmark"></span>
                  Efectivo
                </label>
                <label className="deudores-radio-group">
                  <input
                    type="radio"
                    name="metodoPago"
                    value="tarjeta"
                    checked={metodoPago === 'tarjeta'}
                    onChange={() => setMetodoPago('tarjeta')}
                  />
                  <span className="deudores-radio-checkmark"></span>
                  Tarjeta
                </label>
              </div>
            </div>
          )}

          <div className="deudores-form-group">
            <label className="deudores-form-label" htmlFor="comment">
              Comentario (opcional):
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ingrese un comentario (opcional)"
              className="deudores-form-control"
            ></textarea>
          </div>
        </div>
        
        <div className="deudores-modal-footer">
          <button 
            className="deudores-btn deudores-btn-secondary" 
            onClick={handleCancel}
          >
            <FontAwesomeIcon icon={faTimes} /> Cancelar
          </button>
          <button 
            className="deudores-btn deudores-btn-primary" 
            onClick={onSubmit}
          >
            <FontAwesomeIcon icon={faSave} /> 
            {isPayment ? 'Registrar Pago' : 'Añadir a la Deuda'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;