import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/EditDeudorStyles.css';
import { getDeudorById, updateDeudor } from '../services/deudores.service.js';
import Swal from 'sweetalert2';

const EditDeudor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { deudors } = location.state;

  const [deudor, setDeudor] = useState({
    Nombre: '',
    fechaPaga: '',
    numeroTelefono: '',
    deudaTotal: ''
  });

  useEffect(() => {
    const fetchDeudor = async () => {
      try {
        const deudorData = await getDeudorById(deudors._id);
        setDeudor({
          ...deudorData,
          fechaPaga: new Date(deudorData.fechaPaga).toISOString().split('T')[0]
        });
      } catch (error) {
        console.error('Error fetching deudor:', error);
      }
    };

    fetchDeudor();
  }, [deudors._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeudor({ ...deudor, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDeudor(deudors._id, {
        Nombre: deudor.Nombre,
        fechaPaga: deudor.fechaPaga,
        numeroTelefono: deudor.numeroTelefono.toString(),
        deudaTotal: deudor.deudaTotal,
      });
      Swal.fire({
        icon: 'success',
        title: 'Deudor actualizado con éxito',
        showConfirmButton: false,
        timer: 1500
      });
      navigate('/deudores');
    } catch (error) {
      console.error('Error updating deudor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar el deudor',
        text: 'Ocurrió un error al intentar actualizar el deudor.',
      });
    }
  };

  return (
    <div className="edit-deudor-container">
      <Navbar />
      <div className="edit-deudor-main-content">
        <h2>Editar Deudor</h2>
        <form onSubmit={handleSubmit} className="edit-deudor-form">
          <div className="edit-deudor-form-group">
            <label htmlFor="Nombre">Nombre</label>
            <input
              type="text"
              id="Nombre"
              name="Nombre"
              value={deudor.Nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div className="edit-deudor-form-group">
            <label htmlFor="fechaPaga">Fecha a Pagar</label>
            <input
              type="date"
              id="fechaPaga"
              name="fechaPaga"
              value={deudor.fechaPaga}
              onChange={handleChange}
              required
            />
          </div>
          <div className="edit-deudor-form-group">
            <label htmlFor="numeroTelefono">Número de Teléfono</label>
            <input
              type="text"
              id="numeroTelefono"
              name="numeroTelefono"
              value={deudor.numeroTelefono}
              onChange={handleChange}
              required
            />
          </div>
          <div className="edit-deudor-form-group">
            <label htmlFor="deudaTotal">Deuda Total</label>
            <input
              type="number"
              id="deudaTotal"
              name="deudaTotal"
              value={deudor.deudaTotal}
              onChange={handleChange}
              required
            />
          </div>
          <div className="edit-deudor-button-group">
            <button type="submit" className="submit-button">Guardar Cambios</button>
            <button type="button" className="edit-deudor-cancel-button" onClick={() => navigate('/deudores')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDeudor;
