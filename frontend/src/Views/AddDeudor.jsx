import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/AddDeudorStyles.css';
import { addDeudor } from '../services/deudores.service.js';
import Swal from 'sweetalert2';

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
      Swal.fire({
        icon: 'success',
        title: 'Deudor creado con éxito',
        showConfirmButton: false,
        timer: 1500
      });
      navigate('/deudores');
    } catch (error) {
      console.error('Error creando deudor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al crear el deudor',
        text: 'Ocurrió un error al intentar crear el deudor.',
      });
    }
  };

  return (
    <div className="add-deudor-container">
      <Navbar />
      <div className="main-content">
        <h2>Agregar Nuevo Deudor</h2>
        <form onSubmit={handleSubmit} className="add-deudor-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="fechaPaga">Fecha a Pagar:</label>
            <input
              type="date"
              id="fechaPaga"
              value={fechaPaga}
              onChange={(e) => setFechaPaga(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="numeroTelefono">Número de Teléfono:</label>
            <input
              type="text"
              id="numeroTelefono"
              value={numeroTelefono}
              onChange={(e) => setNumeroTelefono(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="deudaTotal">Deuda Total:</label>
            <input
              type="number"
              id="deudaTotal"
              value={deudaTotal}
              onChange={(e) => setDeudaTotal(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">Agregar Deudor</button>
        </form>
      </div>
    </div>
  );
};

export default AddDeudor;
