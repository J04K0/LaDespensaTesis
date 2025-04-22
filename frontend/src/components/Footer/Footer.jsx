import React from 'react';
import './FooterStyles.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-bottom">
        <p>&copy; {currentYear} La Despensa - Sistema de Gestión para Almacenes. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;