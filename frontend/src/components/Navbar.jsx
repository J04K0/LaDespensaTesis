import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NavbarStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faCaretDown, faCaretUp, faAdd, faHome, faBoxOpen, faHistory, faChartLine, faTruck, faSignOutAlt, faBarcode } from '@fortawesome/free-solid-svg-icons';
import { logout } from '../services/auth.service';

const Navbar = () => {
  const navigate = useNavigate();
  const [showProductOptions, setShowProductOptions] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
    setIsNavVisible(false); // Cerrar menú en móvil después de navegar
  };

  const toggleProductOptions = (e) => {
    e.stopPropagation(); // Evitar que el clic se propague
    setShowProductOptions(!showProductOptions);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const toggleNavbar = () => {
    setIsNavVisible(!isNavVisible);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <nav className={`navbar-menu ${isNavVisible ? 'visible' : ''}`}>
          <ul className="navbar-items">
            <li onClick={() => handleNavigation('/home')}>
              <FontAwesomeIcon icon={faHome} /> <span>Inicio</span>
            </li>
            
            <li className="dropdown">
              <div className="dropdown-trigger" onClick={toggleProductOptions}>
                <FontAwesomeIcon icon={faBoxOpen} /> <span>Productos</span>
                <FontAwesomeIcon icon={showProductOptions ? faCaretUp : faCaretDown} className="caret-icon" />
              </div>
              
              {showProductOptions && (
                <ul className="dropdown-menu">
                  <li onClick={() => handleNavigation('/products')}>
                    <FontAwesomeIcon icon={faBoxOpen} /> Ver productos
                  </li>
                  <li onClick={() => handleNavigation('/add-product')}>
                    <FontAwesomeIcon icon={faAdd} /> Añadir productos
                  </li>
                  <li onClick={() => handleNavigation('/ProductScanner')}>
                    <FontAwesomeIcon icon={faBarcode} /> Vender producto
                  </li>
                  <li onClick={() => handleNavigation('/HistorySale')}>
                    <FontAwesomeIcon icon={faHistory} /> Historial de ventas
                  </li>
                </ul>
              )}
            </li>
            
            <li onClick={() => handleNavigation('/finanzas')}>
              <FontAwesomeIcon icon={faChartLine} /> <span>Estadísticas</span>
            </li>
            
            <li onClick={() => handleNavigation('/proveedores')}>
              <FontAwesomeIcon icon={faTruck} /> <span>Proveedores</span>
            </li>

            <li onClick={() => handleNavigation('/cuentas-por-pagar')}>
              <FontAwesomeIcon icon={faHistory} /> <span>Cuentas por pagar</span>
            </li>
            
            <li onClick={handleLogout} className="logout-item">
              <FontAwesomeIcon icon={faSignOutAlt} /> <span>Cerrar sesión</span>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;