import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';

const EditDeudorModal = ({ 
  show, 
  onClose, 
  deudorToEdit, 
  onInputChange, 
  onSubmit 
}) => {
  if (!show) return null;

  return (
    <div className="deudores-modal-overlay" onClick={onClose}>
      <div className="deudores-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="deudores-modal-header">
          <h2 className="deudores-modal-title">Editar Deudor</h2>
        </div>
        
        <div className="deudores-modal-body">
          <div className="deudores-form-group">
            <label className="deudores-form-label" htmlFor="Nombre">Nombre:</label>
            <input
              type="text"
              id="Nombre"
              name="Nombre"
              value={deudorToEdit.Nombre}
              onChange={onInputChange}
              placeholder="Ingrese el nombre"
              required
              className="deudores-form-control"
            />
          </div>

          <div className="deudores-form-group">
            <label className="deudores-form-label" htmlFor="fechaPaga">Fecha a Pagar:</label>
            <input
              type="date"
              id="fechaPaga"
              name="fechaPaga"
              value={deudorToEdit.fechaPaga}
              onChange={onInputChange}
              className="deudores-form-control"
            />
          </div>

          <div className="deudores-form-group">
            <label className="deudores-form-label" htmlFor="numeroTelefono">Número de Teléfono:</label>
            <input
              type="text"
              id="numeroTelefono"
              name="numeroTelefono"
              value={deudorToEdit.numeroTelefono}
              onChange={onInputChange}
              placeholder="Ingrese el número de teléfono"
              className="deudores-form-control"
            />
          </div>

          <div className="deudores-form-group">
            <label className="deudores-form-label" htmlFor="deudaTotal">Deuda Total:</label>
            <input
              type="text"
              id="deudaTotal"
              name="deudaTotal"
              value={deudorToEdit.deudaTotal}
              onChange={onInputChange}
              placeholder="Ingrese la deuda total"
              className="deudores-form-control"
            />
          </div>
        </div>
        
        <div className="deudores-modal-footer">
          <button className="deudores-btn deudores-btn-secondary" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} /> Cancelar
          </button>
          <button className="deudores-btn deudores-btn-primary" onClick={onSubmit}>
            <FontAwesomeIcon icon={faSave} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDeudorModal;