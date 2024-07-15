import React from 'react';
import '../styles/HomeStyles.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="main-content">
        <div className="top-buttons">
          <button>Ver productos sin stock</button>
          <button>Ver productos vencidos</button>
          <button>Producto más vendido</button>
          <button>Pagos por vencer</button>
        </div>
        <div className="content">
          <h2 className="section-title">Personas fiadas</h2>
          <div className="fiadas-card">
            <div className="fiadas-header">
              <h3>Personas fiadas</h3>
              <button>Ver todos</button>
            </div>
            <div className="fiadas-list">
              <div className="fiadas-item">
                <span>Diego Salazar</span>
                <span>$125.0000</span>
              </div>
              <div className="fiadas-item">
                <span>Pablo Castillo</span>
                <span>$15.0000</span>
              </div>
              <div className="fiadas-item">
                <span>Eduardo Riquelme</span>
                <span>$5.0000</span>
              </div>
              <div className="fiadas-item">
                <span>Diego Meza</span>
                <span>$12.0000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sidebar">
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
