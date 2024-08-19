import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LaDespensaLogo from '../../public/LaDespensaLogo.png';
import '../styles/NavbarStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretUp, faHome, faBoxOpen, faHistory, faChartLine, faDollarSign, faTruck, faFileInvoiceDollar, faSignOutAlt, faBarcode } from '@fortawesome/free-solid-svg-icons'; // Añadido faBarcode
import { logout } from '../services/auth.service';

const Navbar = () => {
  const navigate = useNavigate();
  const [showProductOptions, setShowProductOptions] = useState(false);

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

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src={LaDespensaLogo} alt="La Despensa Logo" />
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
              <FontAwesomeIcon icon={faBoxOpen} /> Añadir productos
            </li>
            <li onClick={() => handleNavigation('/ProductScanner')}> {/* Nueva opción añadida */}
              <FontAwesomeIcon icon={faBarcode} /> Escanear Producto
            </li>
          </ul>
        )}
        <li onClick={() => handleNavigation('/historial-precios')}>
          <FontAwesomeIcon icon={faHistory} /> Historial Precios
        </li>
        <li onClick={() => handleNavigation('/estadisticas')}>
          <FontAwesomeIcon icon={faChartLine} /> Estadísticas
        </li>
        <li onClick={() => handleNavigation('/finanzas')}>
          <FontAwesomeIcon icon={faDollarSign} /> Finanzas
        </li>
        <li onClick={() => handleNavigation('/proveedores')}>
          <FontAwesomeIcon icon={faTruck} /> Proveedores
        </li>
        <li onClick={() => handleNavigation('/finanzas-boletas')}>
          <FontAwesomeIcon icon={faFileInvoiceDollar} /> Finanzas Boletas
        </li>
        <li className="logout-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar sesión
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
