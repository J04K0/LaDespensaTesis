import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NavbarStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faPerson, faCaretUp, faAdd, faHome, faBoxOpen, faHistory, faChartLine, faTruck, faSignOutAlt, faBarcode, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { logout } from '../services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { obtenerVentasPorTicket } from '../services/venta.service';
import { getDeudores } from '../services/deudores.service';

const Navbar = () => {
  const navigate = useNavigate();
  const [showProductOptions, setShowProductOptions] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProductOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setIsNavVisible(false); // Cerrar menú en móvil después de navegar
    setShowProductOptions(false); // Cerrar el menú desplegable de productos
  };

  const toggleProductOptions = (e) => {
    e.stopPropagation(); // Evitar que el clic se propague
    setShowProductOptions(!showProductOptions);
  };

  const handleLogout = async () => {
    // Generar reporte diario antes de cerrar sesión
    await generarReporteDiario();
    
    // Código de cierre de sesión existente
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const generarReporteDiario = async () => {
    try {
      // Obtener la información del usuario actual
      const usuarioActual = JSON.parse(localStorage.getItem('user')) || { email: 'Usuario desconocido' };
      
      // Obtener la hora de inicio de sesión (si existe) o usar el inicio del día actual
      const sessionStartTime = localStorage.getItem('sessionStartTime') 
        ? new Date(localStorage.getItem('sessionStartTime'))
        : new Date(new Date().setHours(0, 0, 0, 0));
      
      const ahora = new Date();
      const fechaFormateada = ahora.toLocaleDateString();
      const horaInicioFormateada = sessionStartTime.toLocaleTimeString();
      const horaFinFormateada = ahora.toLocaleTimeString();
      
      // 1. Obtener todas las ventas 
      const response = await obtenerVentasPorTicket();
      const todasLasVentas = response.data || [];
      
      // Filtrar solo las ventas realizadas durante esta sesión
      const ventasSesion = todasLasVentas.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta >= sessionStartTime && fechaVenta <= ahora;
      });
      
      // Calcular totales por método de pago
      let totalEfectivo = 0;
      let totalTarjeta = 0;
      let totalVentas = 0;
      let cantidadVentasEfectivo = 0;
      let cantidadVentasTarjeta = 0;

      ventasSesion.forEach(venta => {
        const importeVenta = venta.ventas.reduce((sum, producto) => 
          sum + (producto.precioVenta * producto.cantidad), 0);
        
        totalVentas += importeVenta;

        if (venta.metodoPago === 'tarjeta') {
          totalTarjeta += importeVenta;
          cantidadVentasTarjeta++;
        } else {
          totalEfectivo += importeVenta;
          cantidadVentasEfectivo++;
        }
      });
      
      // 2. Obtener información de deudores
      const respuestaDeudores = await getDeudores(1, 1000);
      const deudores = respuestaDeudores.deudores || [];
      
      // Filtrar deudores con pagos o deudas realizados durante esta sesión
      const deudoresSesion = deudores.filter(deudor => {
        if (!deudor.historialPagos || !Array.isArray(deudor.historialPagos)) return false;
        
        return deudor.historialPagos.some(pago => {
          const fechaPago = new Date(pago.fecha);
          return fechaPago >= sessionStartTime && fechaPago <= ahora;
        });
      });

      // Calcular totales de pagos de deudores (solo pagos en efectivo)
      let totalPagosDeudores = 0;
      let totalNuevasDeudas = 0;

      deudoresSesion.forEach(deudor => {
        const pagosSesion = deudor.historialPagos.filter(pago => {
          const fechaPago = new Date(pago.fecha);
          return fechaPago >= sessionStartTime && fechaPago <= ahora;
        });

        pagosSesion.forEach(pago => {
          if (pago.tipo === 'pago') {
            totalPagosDeudores += pago.monto;
          } else {
            totalNuevasDeudas += pago.monto;
          }
        });
      });

      // Balance final de efectivo
      const balanceEfectivo = totalEfectivo + totalPagosDeudores;
      
      // 3. Generar el PDF
      const doc = new jsPDF();
      
      // Título y fecha
      doc.setFontSize(20);
      doc.text(`Reporte de Sesión - ${fechaFormateada}`, 20, 15);
      doc.setFontSize(12);
      doc.text(`Usuario: ${usuarioActual.email}`, 20, 25);
      doc.text(`Período: ${horaInicioFormateada} - ${horaFinFormateada}`, 20, 32);
      
      // Sección de resumen de caja
      doc.setFontSize(16);
      doc.text("Resumen de Caja", 20, 42);

      const resumenCajaData = [
        ["Concepto", "Cantidad", "Monto"],
        ["Ventas en Efectivo", cantidadVentasEfectivo, `$${totalEfectivo.toLocaleString()}`],
        ["Ventas con Tarjeta", cantidadVentasTarjeta, `$${totalTarjeta.toLocaleString()}`],
        ["Pagos de Deudores", deudoresSesion.length, `$${totalPagosDeudores.toLocaleString()}`],
        ["Total Ventas", ventasSesion.length, `$${totalVentas.toLocaleString()}`],
        ["BALANCE EN EFECTIVO", "", `$${balanceEfectivo.toLocaleString()}`]
      ];

      autoTable(doc, {
        startY: 47,
        head: [resumenCajaData[0]],
        body: resumenCajaData.slice(1),
        theme: 'grid',
        headStyles: { 
          fillColor: [0, 38, 81],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 10,
          cellPadding: 5
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          2: { halign: 'right' }
        },
        foot: [[
          { content: 'EFECTIVO DISPONIBLE EN CAJA', colSpan: 2, styles: { fontStyle: 'bold', fontSize: 12 } },
          { content: `$${balanceEfectivo.toLocaleString()}`, styles: { fontStyle: 'bold', fontSize: 12, halign: 'right' } }
        ]]
      });
      
      // Sección de ventas detalladas
      const ventasY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(16);
      doc.text("Detalle de Ventas de la Sesión", 20, ventasY);
      
      if (ventasSesion.length > 0) {
        const ventasData = ventasSesion.map(venta => [
          venta._id, // Ticket ID
          new Date(venta.fecha).toLocaleTimeString(), // Hora
          venta.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo', // Método de pago
          venta.ventas.length, // Cantidad de productos
          `$${venta.ventas.reduce((total, producto) => 
            total + (producto.precioVenta * producto.cantidad), 0).toLocaleString()}`
        ]);
        
        autoTable(doc, {
          startY: ventasY + 5,
          head: [["Ticket", "Hora", "Método de Pago", "Productos", "Total"]],
          body: ventasData,
        });
      } else {
        doc.text("No se registraron ventas durante esta sesión", 20, ventasY + 10);
      }
      
      // Sección de deudores
      const deudoresY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : ventasY + 30;
      doc.setFontSize(16);
      doc.text("Movimientos de Deudores", 20, deudoresY);
      
      if (deudoresSesion.length > 0) {
        const deudoresData = [];
        
        // Para cada deudor, obtener los movimientos de la sesión
        deudoresSesion.forEach(deudor => {
          const pagosSesion = deudor.historialPagos.filter(pago => {
            const fechaPago = new Date(pago.fecha);
            return fechaPago >= sessionStartTime && fechaPago <= ahora;
          });
          
          pagosSesion.forEach(pago => {
            deudoresData.push([
              deudor.Nombre,
              pago.tipo === 'pago' ? 'Pago' : 'Aumento de deuda',
              `$${pago.monto.toLocaleString()}`,
              pago.comentario || '-'
            ]);
          });
        });
        
        autoTable(doc, {
          startY: deudoresY + 5,
          head: [["Deudor", "Tipo", "Monto", "Comentario"]],
          body: deudoresData,
        });
      } else {
        doc.text("No hubo movimientos de deudores durante esta sesión", 20, deudoresY + 10);
      }
      
      // Agregar pie de página con información del usuario
      doc.setFontSize(10);
      doc.text(`Reporte generado por: ${usuarioActual.email} - ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
      
      // Guardar el PDF
      const timestamp = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
      doc.save(`Cierre_Caja_${usuarioActual.email}_${timestamp}.pdf`);
    } catch (error) {
      console.error("Error al generar reporte de sesión:", error);
    }
  };

  const toggleNavbar = () => {
    setIsNavVisible(!isNavVisible);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <button className="navbar-toggle-btn" onClick={toggleNavbar}>
          <FontAwesomeIcon icon={isNavVisible ? faTimes : faBars} />
        </button>
        <nav className={`navbar-menu ${isNavVisible ? 'visible' : ''}`}>
          <ul className="navbar-items">
            <li onClick={() => handleNavigation('/home')}>
              <FontAwesomeIcon icon={faHome} /> <span>Inicio</span>
            </li>
            
            <div className="productos-container" ref={dropdownRef}>
              <li className="dropdown">
                <div className="dropdown-trigger" onClick={toggleProductOptions}>
                  <FontAwesomeIcon icon={faBoxOpen} /> <span>Productos</span>
                  <FontAwesomeIcon icon={showProductOptions ? faCaretUp : faCaretDown} className="caret-icon" />
                </div>
              </li>
              
              {showProductOptions && (
                <div className="product-submenu">
                  <ul className="dropdown-menu">
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/products');
                    }}>
                      <FontAwesomeIcon icon={faBoxOpen} /> Ver productos
                    </li>
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/add-product');
                    }}>
                      <FontAwesomeIcon icon={faAdd} /> Añadir productos
                    </li>
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/ProductScanner');
                    }}>
                      <FontAwesomeIcon icon={faBarcode} /> Vender producto
                    </li>
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/HistorySale');
                    }}>
                      <FontAwesomeIcon icon={faHistory} /> Historial de ventas
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <li onClick={() => handleNavigation('/deudores')}>
              <FontAwesomeIcon icon={faPerson} /> <span>Deudores</span>
            </li>          
            
            <li onClick={() => handleNavigation('/proveedores')}>
              <FontAwesomeIcon icon={faTruck} /> <span>Proveedores</span>
            </li>

            <li onClick={() => handleNavigation('/finanzas')}>
              <FontAwesomeIcon icon={faChartLine} /> <span>Estadísticas</span>
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