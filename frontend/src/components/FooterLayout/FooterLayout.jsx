import React from 'react';
import Footer from '../Footer/Footer';
import './FooterLayout.css';

const FooterLayout = ({ children }) => {
  return (
    <div className="footer-layout-container">
      <div className="footer-layout-content">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default FooterLayout;