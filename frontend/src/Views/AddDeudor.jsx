import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/AddDeudorStyles.css';
import { addDeudor } from '../services/deudores.service.js';
import { showSuccessAlert, showErrorAlert } from '../helpers/swaHelper';

const AddDeudor = () => {
  const [nombre, setNombre] = useState('');
  const [fechaPaga, setFechaPaga] = useState('');
  const [numeroTelefono, setNumeroTelefono] = useState('');
  const [deudaTotal, setDeudaTotal] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newDeudor = {
      Nombre: nombre,
      fechaPaga,
      numeroTelefono,
      deudaTotal: parseFloat(deudaTotal),
    };
    try {
      await addDeudor(newDeudor);
      showSuccessAlert('Deudor creado con éxito', '');
      navigate('/deudores');
    } catch (error) {
      console.error('Error creando deudor:', error);
      showErrorAlert('Error al crear el deudor', 'Ocurrió un error al intentar crear el deudor.');
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
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="add-deudor-form-group">
            <label htmlFor="fechaPaga">Fecha a Pagar:</label>
            <input
              type="date"
              id="fechaPaga"
              value={fechaPaga}
              onChange={(e) => setFechaPaga(e.target.value)}
              required
            />
          </div>
          <div className="add-deudor-form-group">
            <label htmlFor="numeroTelefono">Número de Teléfono:</label>
            <input
              type="text"
              id="numeroTelefono"
              value={numeroTelefono}
              onChange={(e) => setNumeroTelefono(e.target.value)}
              required
            />
          </div>
          <div className="add-deudor-form-group">
            <label htmlFor="deudaTotal">Deuda Total:</label>
            <input
              type="number"
              id="deudaTotal"
              value={deudaTotal}
              onChange={(e) => setDeudaTotal(e.target.value)}
              required
            />
          </div>
          <div className="add-deudor-button-group">
            <button type="submit" className="submit-button">Agregar Deudor</button>
            <button type="button" className="add-deudor-cancel-button" onClick={() => navigate('/deudores')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeudor;
