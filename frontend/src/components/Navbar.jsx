import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LaDespensaLogo from '../../public/LaDespensaLogo.png';
import '../styles/NavbarStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faCaretDown, faCaretUp,faAdd ,faHome, faBoxOpen, faHistory, faChartLine, faDollarSign, faTruck, faSignOutAlt, faBarcode } from '@fortawesome/free-solid-svg-icons';
import { logout } from '../services/auth.service';

const Navbar = () => {
  const navigate = useNavigate();
  const [showProductOptions, setShowProductOptions] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleProductOptions = () => {
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
    <>
      {!isNavVisible && (
        <button className="open-navbar-btn" onClick={toggleNavbar} aria-label="Abrir menú de navegación">
          <FontAwesomeIcon icon={faBars} />
        </button>
      )}
      <div className={`sidebar ${isNavVisible ? 'visible' : 'hidden'}`} role="navigation">
        <div className="logo-container">
          <img src={LaDespensaLogo} alt="La Despensa Logo" />
          <button className="toggle-navbar-btn" onClick={toggleNavbar} aria-label="Cerrar menú de navegación">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <ul>
          <li onClick={() => handleNavigation('/home')}>
            <FontAwesomeIcon icon={faHome} /> Página Principal
          </li>
          <li onClick={toggleProductOptions}>
            <FontAwesomeIcon icon={faBoxOpen} /> Productos <FontAwesomeIcon icon={showProductOptions ? faCaretUp : faCaretDown} />
          </li>
          {showProductOptions && (
            <ul className="submenu">
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
          <li onClick={() => handleNavigation('/estadisticas')}>
            <FontAwesomeIcon icon={faChartLine} /> Estadísticas
          </li>
          <li onClick={() => handleNavigation('/finanzas')}>
            <FontAwesomeIcon icon={faDollarSign} /> Finanzas
          </li>
          <li onClick={() => handleNavigation('/proveedores')}>
            <FontAwesomeIcon icon={faTruck} /> Proveedores
          </li>
          <li onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar sesión
          </li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;