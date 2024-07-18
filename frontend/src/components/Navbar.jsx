import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LaDespensaLogo from '../../public/LaDespensaLogo.png';
import '../styles/NavbarStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';

const Navbar = () => {
  const navigate = useNavigate();
  const [showProductOptions, setShowProductOptions] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleProductOptions = () => {
    setShowProductOptions(!showProductOptions);
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src={LaDespensaLogo} alt="La Despensa Logo" />
      </div>
      <ul>
        <li onClick={() => handleNavigation('/home')}>Página Principal</li>
        <li onClick={toggleProductOptions}>
          Productos <FontAwesomeIcon icon={showProductOptions ? faCaretUp : faCaretDown} />
        </li>
        {showProductOptions && (
          <ul className="submenu">
            <li onClick={() => handleNavigation('/products')}>Ver productos</li>
            <li onClick={() => handleNavigation('/add-product')}>Añadir productos</li>
          </ul>
        )}
        <li onClick={() => handleNavigation('/historial-precios')}>Historial Precios</li>
        <li onClick={() => handleNavigation('/estadisticas')}>Estadísticas</li>
        <li onClick={() => handleNavigation('/finanzas')}>Finanzas</li>
        <li onClick={() => handleNavigation('/proveedores')}>Proveedores</li>
        <li onClick={() => handleNavigation('/finanzas-boletas')}>Finanzas Boletas</li>
      </ul>
      <div className="footer">La despensa</div>
    </div>
  );
};

export default Navbar;
