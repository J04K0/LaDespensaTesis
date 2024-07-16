import React from 'react';
import { useNavigate } from 'react-router-dom';
import LaDespensaLogo from '../../public/LaDespensaLogo.png';
import '../styles/NavbarStyles.css';

const Navbar = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src={LaDespensaLogo} alt="La Despensa Logo" />
      </div>
      <ul>
        <li onClick={() => handleNavigation('/home')}>Página Principal</li>
        <li onClick={() => handleNavigation('/products')}>Productos</li>
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
