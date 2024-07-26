import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/HomeStyles.css';
import { getDeudores, deleteDeudor } from '../services/deudores.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const Home = () => {
  const [showProductOptions, setShowProductOptions] = useState(false);
  const [deudores, setDeudores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeudores = async () => {
      try {
        const data = await getDeudores(1, 8);
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

  const handleViewOutOfStock = () => {
    navigate('/products?filter=unavailable');
  };

  const handleViewExpiringProducts = () => {
    navigate('/products?filter=expiring');
  };

  const handleViewExpiredProducts = () => {
    navigate('/products?filter=expired');
  };

  const handleDelete = async (id) => {
    console.log('Deleting deudor with ID:', id);
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
      <div className="top-buttons-container">
        <div className="top-buttons">
          <button onClick={handleViewOutOfStock} className="ver-productos-sin-stock">Ver productos sin stock</button>
          <button onClick={handleViewExpiredProducts} className="ver-productos-vencidos">Ver productos vencidos</button>
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
          <table className="deudores-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Deuda total</th>
              </tr>
            </thead>
            <tbody>
              {deudores.map((deudor, index) => (
                <tr key={index}>
                  <td><FontAwesomeIcon icon={faUser} /> {deudor.Nombre || 'Nombre desconocido'}</td>
                  <td>${deudor.deudaTotal !== undefined ? deudor.deudaTotal.toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Home;
