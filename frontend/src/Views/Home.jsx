// src/Views/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/HomeStyles.css';
import { getDeudores, deleteDeudor } from '../services/deudores.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const Home = () => {
  const [showProductOptions, setShowProductOptions] = useState(false);
  const [deudores, setDeudores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeudores = async () => {
      try {
        const data = await getDeudores(1, 5);
        setDeudores(data.deudores);
      } catch (error) {
        console.error('Error fetching deudores:', error);
      }
    };

    fetchDeudores();
  }, []);

  const toggleProductOptions = () => {
    setShowProductOptions(!showProductOptions);
  };

  const handleViewAllClick = () => {
    navigate('/deudores');
  };

  const handleDelete = async (id) => {
    console.log('Deleting deudor with ID:', id); // Verifica el ID aquí
    try {
      await deleteDeudor(id);
      setDeudores(deudores.filter(deudor => deudor._id !== id));
    } catch (error) {
      console.error('Error deleting deudor:', error);
    }
  };

  return (
    <div className="home-container">
      <Navbar />
      <div className="main-content">
        <div className="top-buttons-container">
          <div className="top-buttons">
            <button className="ver-productos-sin-stock">Ver productos sin stock</button>
            <button className="ver-productos-vencidos">Ver productos vencidos</button>
            <button className="producto-mas-vendido">Producto más vendido</button>
            <button className="pagos-por-vencer">Pagos por vencer</button>
          </div>
        </div>
        <div className="content">
          <div className="section-title">Personas deudoras</div>
          <div className="deudores-card">
            <div className="deudores-header">
              <h3>Personas deudoras</h3>
              <button onClick={handleViewAllClick}>Ver todos</button>
            </div>
            <div className="deudores-list">
              {deudores.map((deudor, index) => (
                <div key={index} className="deudores-item">
                  <span><FontAwesomeIcon icon={faUser} /> {deudor.Nombre || 'Nombre desconocido'}</span>
                  <span>${deudor.deudaTotal !== undefined ? deudor.deudaTotal.toLocaleString() : 'N/A'}</span>
                  <span>
                    <button onClick={() => handleDelete(deudor._id)} className="delete-button">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
