import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { showConfirmationAlert, showErrorAlert } from '../helpers/swaHelper';

const EditDeudorModal = ({ 
  show, 
  onClose, 
  deudorToEdit, 
  onInputChange, 
  onSubmit,
  originalDeudor
}) => {
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Limpiar errores cuando se abre el modal
  useEffect(() => {
    if (show) {
      setErrors({});
      setIsSubmitting(false);
    }
  }, [show]);

  if (!show) return null;

  // Función para validar el formulario
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!deudorToEdit.Nombre || !deudorToEdit.Nombre.trim()) {
      newErrors.Nombre = 'El nombre es obligatorio';
    } else if (deudorToEdit.Nombre.trim().length < 2) {
      newErrors.Nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (deudorToEdit.Nombre.trim().length > 100) {
      newErrors.Nombre = 'El nombre no puede exceder los 100 caracteres';
    }

    // Validar fecha de pago
    if (!deudorToEdit.fechaPaga) {
      newErrors.fechaPaga = 'La fecha de pago es obligatoria';
    } else {
      const fechaSeleccionada = new Date(deudorToEdit.fechaPaga);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (isNaN(fechaSeleccionada.getTime())) {
        newErrors.fechaPaga = 'La fecha proporcionada no es válida';
      }
      // Nota: Permitimos fechas pasadas en edición ya que puede ser necesario para correcciones
    }

    // Validar número de teléfono
    if (!deudorToEdit.numeroTelefono || !deudorToEdit.numeroTelefono.toString().trim()) {
      newErrors.numeroTelefono = 'El número de teléfono es obligatorio';
    } else {
      const telefonoStr = deudorToEdit.numeroTelefono.toString().trim();
      if (!/^\d{9}$/.test(telefonoStr)) {
        newErrors.numeroTelefono = 'El número de teléfono debe tener 9 dígitos y no contener letras';
      }
    }

    // Validar deuda total
    if (deudorToEdit.deudaTotal === '' || deudorToEdit.deudaTotal === null || deudorToEdit.deudaTotal === undefined) {
      newErrors.deudaTotal = 'La deuda total es obligatoria';
    } else {
      const deudaNum = parseFloat(deudorToEdit.deudaTotal);
      if (isNaN(deudaNum)) {
        newErrors.deudaTotal = 'La deuda total debe ser un número válido';
      } else if (deudaNum < 0) {
        newErrors.deudaTotal = 'La deuda total no puede ser negativa';
      } else if (deudaNum > 999999999) {
        newErrors.deudaTotal = 'La deuda total es demasiado alta';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en los inputs y limpiar errores
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validaciones específicas por campo
    let processedValue = value;
    
    if (name === 'numeroTelefono') {
      // Solo permitir números para el teléfono
      processedValue = value.replace(/\D/g, '').slice(0, 15);
    } else if (name === 'deudaTotal') {
      // Permitir solo números y punto decimal para la deuda
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        processedValue = value;
      } else {
        return; // No actualizar si no es un número válido
      }
    } else if (name === 'Nombre') {
      // Limitar longitud del nombre
      processedValue = value.slice(0, 100);
    }

    // Crear evento modificado para pasar al componente padre
    const modifiedEvent = {
      target: {
        name,
        value: processedValue
      }
    };
    
    onInputChange(modifiedEvent);
  };

  const handleSubmit = async () => {
    // Validar el formulario antes de enviar
    if (!validateForm()) {
      showErrorAlert('Datos inválidos', 'Por favor, corrija los errores en el formulario.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit();
    } catch (error) {
      console.error('Error al actualizar deudor:', error);
      showErrorAlert('Error', 'Ocurrió un error al actualizar el deudor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    const hasChanges = originalDeudor && (
      deudorToEdit.Nombre !== originalDeudor.Nombre ||
      deudorToEdit.fechaPaga !== originalDeudor.fechaPaga ||
      deudorToEdit.numeroTelefono !== originalDeudor.numeroTelefono ||
      deudorToEdit.deudaTotal !== originalDeudor.deudaTotal
    );
    
    if (hasChanges) {
      const result = await showConfirmationAlert(
        "¿Estás seguro?",
        "¿Deseas cancelar la edición? Los cambios no guardados se perderán.",
        "Sí, cancelar",
        "No, volver"
      );

      if (!result.isConfirmed) return;
    }

    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleOverlayClick = async () => {
    await handleCancel();
  };

  return (
    <div className="deudores-modal-overlay" onClick={handleOverlayClick}>
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
              onChange={handleInputChange}
              placeholder="Ingrese el nombre"
              required
              className={`deudores-form-control ${errors.Nombre ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.Nombre && <span className="error-message">{errors.Nombre}</span>}
          </div>

          <div className="deudores-form-group">
            <label className="deudores-form-label" htmlFor="fechaPaga">Fecha a Pagar:</label>
            <input
              type="date"
              id="fechaPaga"
              name="fechaPaga"
              value={deudorToEdit.fechaPaga}
              onChange={handleInputChange}
              className={`deudores-form-control ${errors.fechaPaga ? 'error' : ''}`}
              disabled={isSubmitting}
              required
            />
            {errors.fechaPaga && <span className="error-message">{errors.fechaPaga}</span>}
          </div>

          <div className="deudores-form-group">
            <label className="deudores-form-label" htmlFor="numeroTelefono">Número de Teléfono:</label>
            <input
              type="text"
              id="numeroTelefono"
              name="numeroTelefono"
              value={deudorToEdit.numeroTelefono}
              onChange={handleInputChange}
              placeholder="Ej: 912345678"
              className={`deudores-form-control ${errors.numeroTelefono ? 'error' : ''}`}
              disabled={isSubmitting}
              maxLength="15"
              required
            />
            {errors.numeroTelefono && <span className="error-message">{errors.numeroTelefono}</span>}
          </div>

          <div className="deudores-form-group">
            <label className="deudores-form-label" htmlFor="deudaTotal">Deuda Total:</label>
            <input
              type="text"
              id="deudaTotal"
              name="deudaTotal"
              value={deudorToEdit.deudaTotal}
              onChange={handleInputChange}
              placeholder="0.00"
              className={`deudores-form-control ${errors.deudaTotal ? 'error' : ''}`}
              disabled={isSubmitting}
              required
            />
            {errors.deudaTotal && <span className="error-message">{errors.deudaTotal}</span>}
          </div>
        </div>
        
        <div className="deudores-modal-footer">
          <button 
            className="deudores-btn deudores-btn-secondary" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faTimes} /> Cancelar
          </button>
          <button 
            className="deudores-btn deudores-btn-primary" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faSave} /> 
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDeudorModal;