import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/AddDeudorStyles.css';
import { addDeudor } from '../services/deudores.service.js';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert, showEmpleadoAccessDeniedAlert } from '../helpers/swaHelper';
import { useRole } from '../hooks/useRole';

const AddDeudor = () => {
  const [nombre, setNombre] = useState('');
  const [fechaPaga, setFechaPaga] = useState('');
  const [numeroTelefono, setNumeroTelefono] = useState('');
  const [deudaTotal, setDeudaTotal] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { userRole } = useRole();
  const isEmpleado = userRole === 'empleado';

  useEffect(() => {
    if (isEmpleado) {
      showEmpleadoAccessDeniedAlert("la creación de deudores", "Solo administradores y jefes pueden agregar nuevos deudores al sistema.");
      navigate('/deudores');
      return;
    }
  }, [isEmpleado, navigate]);

  // Si es empleado, no renderizar nada (ya fue redirigido)
  if (isEmpleado) {
    return null;
  }

  // Función para validar el formulario
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (nombre.trim().length > 20) {
      newErrors.nombre = 'El nombre no puede exceder los 20 caracteres';
    }

    // Validar fecha de pago
    if (!fechaPaga) {
      newErrors.fechaPaga = 'La fecha de pago es obligatoria';
    } else {
      const fechaSeleccionada = new Date(fechaPaga);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSeleccionada < hoy) {
        newErrors.fechaPaga = 'La fecha de pago no puede ser anterior a hoy';
      }
    }

    // Validar número de teléfono
    if (!numeroTelefono.trim()) {
      newErrors.numeroTelefono = 'El número de teléfono es obligatorio';
    } else if (!/^\d{9}$/.test(numeroTelefono.trim())) {
      newErrors.numeroTelefono = 'El número de teléfono debe tener exactamente 9 dígitos';
    }

    // Validar deuda total
    if (!deudaTotal.trim()) {
      newErrors.deudaTotal = 'La deuda total es obligatoria';
    } else {
      const deudaNum = parseFloat(deudaTotal);
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
  const handleInputChange = (field, value) => {
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Actualizar el valor según el campo
    switch (field) {
      case 'nombre':
        setNombre(value);
        break;
      case 'fechaPaga':
        setFechaPaga(value);
        break;
      case 'numeroTelefono':
        // Solo permitir números
        const telefonoValue = value.replace(/\D/g, '').slice(0, 9);
        setNumeroTelefono(telefonoValue);
        break;
      case 'deudaTotal':
        // Permitir solo números y punto decimal
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
          setDeudaTotal(value);
        }
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar el formulario
    if (!validateForm()) {
      showErrorAlert('Datos inválidos', 'Por favor, corrija los errores en el formulario.');
      return;
    }

    // Mostrar confirmación antes de agregar el deudor
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas agregar este deudor?",
      "Sí, agregar",
      "No, cancelar"
    );

    if (!result.isConfirmed) return;

    setIsSubmitting(true);

    const newDeudor = {
      Nombre: nombre.trim(),
      fechaPaga,
      numeroTelefono: numeroTelefono.trim(),
      deudaTotal: parseFloat(deudaTotal),
    };

    try {
      await addDeudor(newDeudor);
      showSuccessAlert('Deudor creado con éxito', '');
      navigate('/deudores');
    } catch (error) {
      console.error('Error creando deudor:', error);
      
      // Manejar errores específicos del servidor
      if (error.response && error.response.data && error.response.data.message) {
        const serverMessage = error.response.data.message;
        
        // Mapear errores del servidor a campos específicos
        if (serverMessage.includes('nombre')) {
          setErrors({ nombre: 'Error en el nombre: ' + serverMessage });
        } else if (serverMessage.includes('teléfono')) {
          setErrors({ numeroTelefono: 'Error en el teléfono: ' + serverMessage });
        } else if (serverMessage.includes('fecha')) {
          setErrors({ fechaPaga: 'Error en la fecha: ' + serverMessage });
        } else if (serverMessage.includes('deuda')) {
          setErrors({ deudaTotal: 'Error en la deuda: ' + serverMessage });
        } else {
          showErrorAlert('Error al crear el deudor', serverMessage);
        }
      } else {
        showErrorAlert('Error al crear el deudor', 'Ocurrió un error inesperado al intentar crear el deudor.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    // Verificar si hay cambios sin guardar
    const hasChanges = nombre.trim() || fechaPaga || numeroTelefono.trim() || deudaTotal.trim();
    
    if (hasChanges) {
      // Mostrar confirmación antes de cancelar
      const result = await showConfirmationAlert(
        "¿Estás seguro?",
        "¿Deseas cancelar la creación del deudor? Los cambios no se guardarán.",
        "Sí, cancelar",
        "No, volver"
      );

      if (result.isConfirmed) {
        navigate('/deudores');
      }
    } else {
      navigate('/deudores');
    }
  };

  return (
    <div className="add-deudor-container">
      <Navbar />
      <div className="add-deudor-main-content">
        <h2>Agregar Nuevo Deudor</h2>
        <form onSubmit={handleSubmit} className="add-deudor-form">
          <div className="add-deudor-form-group add-deudor-form-group-full">
            <label htmlFor="nombre">Nombre:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className={errors.nombre ? 'error' : ''}
              disabled={isSubmitting}
              placeholder="Ingrese el nombre del deudor"
              required
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>
          
          <div className="add-deudor-form-group">
            <label htmlFor="fechaPaga">Fecha a Pagar:</label>
            <input
              type="date"
              id="fechaPaga"
              value={fechaPaga}
              onChange={(e) => handleInputChange('fechaPaga', e.target.value)}
              className={errors.fechaPaga ? 'error' : ''}
              disabled={isSubmitting}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            {errors.fechaPaga && <span className="error-message">{errors.fechaPaga}</span>}
          </div>
          
          <div className="add-deudor-form-group">
            <label htmlFor="numeroTelefono">Número de Teléfono:</label>
            <input
              type="text"
              id="numeroTelefono"
              value={numeroTelefono}
              onChange={(e) => handleInputChange('numeroTelefono', e.target.value)}
              className={errors.numeroTelefono ? 'error' : ''}
              disabled={isSubmitting}
              placeholder="Ej: 912345678"
              maxLength="9"
              required
            />
            {errors.numeroTelefono && <span className="error-message">{errors.numeroTelefono}</span>}
          </div>
          
          <div className="add-deudor-form-group">
            <label htmlFor="deudaTotal">Deuda Total:</label>
            <input
              type="text"
              id="deudaTotal"
              value={deudaTotal}
              onChange={(e) => handleInputChange('deudaTotal', e.target.value)}
              className={errors.deudaTotal ? 'error' : ''}
              disabled={isSubmitting}
              placeholder="Ingrese la deuda total"
              required
            />
            {errors.deudaTotal && <span className="error-message">{errors.deudaTotal}</span>}
          </div>
          
          <div className="add-deudor-button-group">
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Agregando...' : 'Agregar Deudor'}
            </button>
            <button 
              type="button" 
              className="add-deudor-cancel-button" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeudor;
