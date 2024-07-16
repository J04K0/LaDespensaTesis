import React from 'react';
import '../styles/HomeStyles.css';
import LaDespensaLogo from '../../public/LaDespensaLogo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const Home = () => {
  return (
    <div className="home-container">
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
          <div className="section-title">Personas fiadas</div>
          <div className="fiadas-card">
            <div className="fiadas-header">
              <h3>Personas fiadas</h3>
              <button>Ver todos</button>
            </div>
            <div className="fiadas-list">
              <div className="fiadas-item">
                <span><FontAwesomeIcon icon={faUser} /> Diego Salazar</span>
                <span>$125.0000</span>
              </div>
              <div className="fiadas-item">
                <span><FontAwesomeIcon icon={faUser} /> Pablo Castillo</span>
                <span>$15.0000</span>
              </div>
              <div className="fiadas-item">
                <span><FontAwesomeIcon icon={faUser} /> Eduardo Riquelme</span>
                <span>$5.0000</span>
              </div>
              <div className="fiadas-item">
                <span><FontAwesomeIcon icon={faUser} /> Diego Meza</span>
                <span>$12.0000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sidebar">
        <div className="logo-container">
          <img src={LaDespensaLogo} alt="La Despensa Logo" />
        </div>
        <ul>
          <li>Página Principal</li>
          <li>Productos</li>
          <li>Historial Precios</li>
          <li>Estadísticas</li>
          <li>Finanzas</li>
          <li>Proveedores</li>
          <li>Finanzas Boletas</li>
        </ul>
        <div className="footer">La despensa</div>
      </div>
    </div>
  );
};

export default Home;
