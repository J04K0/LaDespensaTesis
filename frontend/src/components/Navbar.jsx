import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NavbarStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCaretDown, faPerson, faCaretUp, faAdd, faHome, faBoxOpen, 
  faHistory, faChartLine, faTruck, faSignOutAlt, faBarcode, 
  faBars, faTimes, faShoppingCart, faStore, faMoneyBillWave, 
  faCalculator, faWarehouse, faClipboardList, faCoins, faUsers,
  faUserCog, faLock, faFileInvoiceDollar, faFileExport, faSpinner, faTrash
} from '@fortawesome/free-solid-svg-icons';
import { obtenerVentasPorTicket, obtenerVentasPropias } from '../services/venta.service.js';
import { getDeudores } from '../services/deudores.service';
import NotificationCenter from './NotificationCenter';
import { initializeSocket, closeSocket } from '../services/socket.service';
import { ExportService } from '../services/export.service.js';
import { DataCollectionService } from '../services/dataCollection.service';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../helpers/swaHelper';
import { useRole } from '../hooks/useRole';

const Navbar = () => {
  const navigate = useNavigate();
  const { permissions, userRole, canAccessRoute } = useRole();
  const [isNavVisible, setIsNavVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isDownloadingMassive, setIsDownloadingMassive] = useState(false);
  const dropdownRefs = {
    ventas: useRef(null),
    inventario: useRef(null),
    finanzas: useRef(null),
    gestion: useRef(null)
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && 
          dropdownRefs[activeDropdown]?.current && 
          !dropdownRefs[activeDropdown].current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    initializeSocket();
    
    if (!localStorage.getItem('sessionStartTime')) {
      localStorage.setItem('sessionStartTime', new Date().toISOString());
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      closeSocket();
    };
  }, [activeDropdown]);

  const handleNavigation = (path) => {
    if (!canAccessRoute(path)) {
      showErrorAlert(
        'Acceso Denegado', 
        `No tienes permisos para acceder a esta sección. Tu rol actual es: ${userRole}`
      );
      return;
    }
    
    navigate(path);
    setIsNavVisible(false);
    setActiveDropdown(null);
  };

  const toggleDropdown = (dropdown, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleLogout = async () => {
    try {
      await generarReporteDiario();
      
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('sessionStartTime');
      navigate('/auth');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('sessionStartTime');
      navigate('/auth');
    }
  };

  const generarReporteDiario = async () => {
    try {
      const usuarioActual = JSON.parse(localStorage.getItem('user')) || { email: 'Usuario desconocido' };
      
      const sessionStartTime = localStorage.getItem('sessionStartTime') 
        ? new Date(localStorage.getItem('sessionStartTime'))
        : new Date(new Date().setHours(0, 0, 0, 0));
      
      const ahora = new Date();
      const fechaFormateada = ahora.toLocaleDateString();
      const horaFinFormateada = ahora.toLocaleTimeString();
      
      let ventasSesion = [];
      let totalEfectivo = 0;
      let totalTarjeta = 0;
      let totalVentas = 0;
      let cantidadVentasEfectivo = 0;
      let cantidadVentasTarjeta = 0;
      let ventasADeudores = 0;
      let cantidadVentasADeudores = 0;

      try {
        console.log('🔍 DEBUG: Obteniendo todas las ventas para el reporte de sesión...');
        console.log('📅 Sesión iniciada:', sessionStartTime.toISOString());
        console.log('📅 Sesión termina:', ahora.toISOString());
        
        const response = await obtenerVentasPorTicket();
        const todasLasVentas = response.data || [];
        
        console.log('📦 Total de ventas en el sistema:', todasLasVentas.length);
        
        ventasSesion = todasLasVentas.filter(venta => {
          const fechaVenta = new Date(venta.fecha);
          const esDeSesion = fechaVenta >= sessionStartTime && fechaVenta <= ahora;
          if (esDeSesion) {
            console.log(`✅ Venta de sesión encontrada: ${venta._id} - ${fechaVenta.toLocaleString()}`);
          }
          return esDeSesion;
        });
        
        console.log('🎪 Ventas de esta sesión:', ventasSesion.length);
        
        ventasSesion.forEach((venta, index) => {
          console.log(`🛍️ Procesando venta ${index + 1}:`, venta._id);
          
          const importeVenta = Array.isArray(venta.ventas) 
            ? venta.ventas.reduce((sum, producto) => {
                const subtotal = producto.precioVenta * producto.cantidad;
                console.log(`  💰 Producto: ${producto.nombre} - $${producto.precioVenta} x ${producto.cantidad} = $${subtotal}`);
                return sum + subtotal;
              }, 0)
            : 0;
          
          console.log(`💵 Importe total de la venta: $${importeVenta}`);
          
          totalVentas += importeVenta;

          if (venta.deudorId) {
            console.log('👤 Venta a deudor detectada');
            ventasADeudores += importeVenta;
            cantidadVentasADeudores++;
          } else if (venta.metodoPago === 'tarjeta') {
            console.log('💳 Venta con tarjeta detectada');
            totalTarjeta += importeVenta;
            cantidadVentasTarjeta++;
          } else {
            console.log('💵 Venta en efectivo detectada');
            totalEfectivo += importeVenta;
            cantidadVentasEfectivo++;
          }
        });
        
        console.log('📈 Totales calculados:', {
          totalVentas,
          totalEfectivo,
          totalTarjeta,
          ventasADeudores,
          cantidadVentasTotal: ventasSesion.length
        });
        
      } catch (ventasError) {
        console.warn("⚠️ No se pudo obtener el historial de ventas:", ventasError);
      }

      let deudoresData = [];
      let totalPagosDeudoresEfectivo = 0;
      let totalPagosDeudoresTarjeta = 0;
      let cantidadPagosEfectivo = 0;
      let cantidadPagosTarjeta = 0;
      let totalNuevasDeudas = 0;
      let cantidadNuevasDeudas = 0;

      try {
        const respuestaDeudores = await getDeudores(1, 1000);
        const deudores = respuestaDeudores.deudores || [];
        
        const deudoresSesion = deudores.filter(deudor => {
          if (!deudor.historialPagos || !Array.isArray(deudor.historialPagos)) return false;
          
          return deudor.historialPagos.some(pago => {
            const fechaPago = new Date(pago.fecha);
            return fechaPago >= sessionStartTime && fechaPago <= ahora;
          });
        });

        deudoresSesion.forEach(deudor => {
          const pagosSesion = deudor.historialPagos.filter(pago => {
            const fechaPago = new Date(pago.fecha);
            return fechaPago >= sessionStartTime && fechaPago <= ahora;
          });

          pagosSesion.forEach(pago => {
            if (pago.tipo === 'pago') {
              if (pago.metodoPago === 'tarjeta') {
                totalPagosDeudoresTarjeta += pago.monto;
                cantidadPagosTarjeta++;
              } else {
                totalPagosDeudoresEfectivo += pago.monto;
                cantidadPagosEfectivo++;
              }
            } else {
              totalNuevasDeudas += pago.monto;
              cantidadNuevasDeudas++;
            }
            
            deudoresData.push([
              deudor.Nombre,
              pago.tipo === 'pago' ? 
                `Pago (${pago.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo'})` : 
                'Aumento de deuda',
              `$${pago.monto.toLocaleString()}`,
              pago.comentario || '-'
            ]);
          });
        });
      } catch (deudoresError) {
        console.warn("⚠️ No se pudo obtener información de deudores:", deudoresError);
      }

      const balanceEfectivo = totalEfectivo + totalPagosDeudoresEfectivo;
      
      const resumenCajaData = [
        ["Concepto", "Cantidad", "Monto"],
        ["Ventas en Efectivo", cantidadVentasEfectivo, `$${totalEfectivo.toLocaleString('es-ES')}`],
        ["Ventas con Tarjeta", cantidadVentasTarjeta, `$${totalTarjeta.toLocaleString('es-ES')}`],
        ["Ventas a Deudores", cantidadVentasADeudores, `$${ventasADeudores.toLocaleString('es-ES')}`],
        ["Pagos de Deudores (Efectivo)", cantidadPagosEfectivo, `$${totalPagosDeudoresEfectivo.toLocaleString('es-ES')}`],
        ["Pagos de Deudores (Tarjeta)", cantidadPagosTarjeta, `$${totalPagosDeudoresTarjeta.toLocaleString('es-ES')}`],
        ["Nuevas Deudas Registradas", cantidadNuevasDeudas, `$${totalNuevasDeudas.toLocaleString('es-ES')}`],
        ["Total Ventas", ventasSesion.length, `$${totalVentas.toLocaleString('es-ES')}`]
      ];
      
      const mensajeExito = "Reporte de actividad de sesión generado exitosamente";
      
      const result = ExportService.generarReporteCierreCaja({
        usuarioActual,
        sessionStartTime,
        horaFinFormateada,
        fechaFormateada,
        ventasSesion,
        deudoresData,
        resumenCajaData,
        balanceEfectivo,
        tienePermisoHistorial: true
      });
      
      if (result) {
        await showSuccessAlert(
          "Reporte Generado",
          mensajeExito
        );
      }
      
      localStorage.setItem('sessionStartTime', new Date().toISOString());
      
      return result;
    } catch (error) {
      console.error("Error al generar reporte de sesión:", error);
      
      await showWarningAlert(
        "Advertencia",
        "No se pudo generar el reporte de cierre de sesión, pero el cierre continuará normalmente.",
        "Entendido"
      );
      
      return false;
    }
  };

  const toggleNavbar = () => {
    setIsNavVisible(!isNavVisible);
  };

  const handleMassiveReport = async () => {
    try {
      setIsDownloadingMassive(true);
      
      await showWarningAlert(
        "Generando Reporte Completo",
        "Se está recopilando información de todo el sistema. Este proceso puede tomar unos segundos...",
        "Entendido"
      );

      console.log('🚀 Iniciando descarga masiva del reporte completo...');
      
      const datosSistema = await DataCollectionService.recopilarDatosSistema();
      
      const resultado = await ExportService.generarReporteCompletoMasivo(datosSistema);
      
      if (resultado) {
        await showSuccessAlert(
          "¡Reporte Generado Exitosamente!",
          "El reporte completo del sistema ha sido descargado correctamente. Incluye todos los datos de productos, ventas, deudores, proveedores y análisis financiero."
        );
      } else {
        throw new Error('Error al generar el reporte');
      }

    } catch (error) {
      console.error('❌ Error en descarga masiva:', error);
      await showErrorAlert(
        "Error al Generar Reporte",
        "No se pudo generar el reporte completo. Por favor, verifique su conexión e inténtelo nuevamente."
      );
    } finally {
      setIsDownloadingMassive(false);
    }
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
            
            <div className="productos-container" ref={dropdownRefs.ventas}>
              <li className="dropdown" onClick={(e) => toggleDropdown('ventas', e)}>
                <div className="dropdown-trigger">
                  <FontAwesomeIcon icon={faShoppingCart} /> <span>Ventas</span>
                  <FontAwesomeIcon icon={activeDropdown === 'ventas' ? faCaretUp : faCaretDown} className="caret-icon" />
                </div>
              </li>
              
              {activeDropdown === 'ventas' && (
                <div className="product-submenu">
                  <ul className="dropdown-menu">
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/ProductScanner');
                    }}>
                      <FontAwesomeIcon icon={faBarcode} /> Terminal de venta
                    </li>
                    {permissions.canAccessHistorySale && (
                      <li onClick={(e) => {
                        e.stopPropagation();
                        handleNavigation('/HistorySale');
                      }}>
                        <FontAwesomeIcon icon={faHistory} /> Historial de ventas
                      </li>
                    )}
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/deudores');
                    }}>
                      <FontAwesomeIcon icon={faPerson} /> Gestión de deudores
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="productos-container" ref={dropdownRefs.inventario}>
              <li className="dropdown" onClick={(e) => toggleDropdown('inventario', e)}>
                <div className="dropdown-trigger">
                  <FontAwesomeIcon icon={faWarehouse} /> <span>Inventario</span>
                  <FontAwesomeIcon icon={activeDropdown === 'inventario' ? faCaretUp : faCaretDown} className="caret-icon" />
                </div>
              </li>
              
              {activeDropdown === 'inventario' && (
                <div className="product-submenu">
                  <ul className="dropdown-menu">
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/products');
                    }}>
                      <FontAwesomeIcon icon={faBoxOpen} /> Ver productos
                    </li>
                    {permissions.canAddProduct && (
                      <li onClick={(e) => {
                        e.stopPropagation();
                        handleNavigation('/add-product');
                      }}>
                        <FontAwesomeIcon icon={faAdd} /> Agregar productos
                      </li>
                    )}
                    {permissions.canManageProveedores && (
                      <li onClick={(e) => {
                        e.stopPropagation();
                        handleNavigation('/proveedores');
                      }}>
                        <FontAwesomeIcon icon={faTruck} /> Gestión de proveedores
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {permissions.canAccessFinanzas && (
              <div className="productos-container" ref={dropdownRefs.finanzas}>
                <li className="dropdown" onClick={(e) => toggleDropdown('finanzas', e)}>
                  <div className="dropdown-trigger">
                    <FontAwesomeIcon icon={faMoneyBillWave} /> <span>Finanzas</span>
                    <FontAwesomeIcon icon={activeDropdown === 'finanzas' ? faCaretUp : faCaretDown} className="caret-icon" />
                  </div>
                </li>
                
                {activeDropdown === 'finanzas' && (
                  <div className="product-submenu">
                    <ul className="dropdown-menu">
                      <li onClick={(e) => {
                        e.stopPropagation();
                        handleNavigation('/finanzas');
                      }}>
                        <FontAwesomeIcon icon={faChartLine} /> Dashboard financiero
                      </li>
                      {permissions.canAccessCuentasPorPagar && (
                        <li onClick={(e) => {
                          e.stopPropagation();
                          handleNavigation('/cuentas-por-pagar');
                        }}>
                          <FontAwesomeIcon icon={faFileInvoiceDollar} /> Cuentas por pagar
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="navbar-special-actions">
              <div className="navbar-notifications">
                <NotificationCenter />
              </div>
              
              {(permissions.canAccessAll) && (
                <li onClick={handleMassiveReport} className="massive-report-item">
                  <FontAwesomeIcon icon={faFileExport} />
                  <span>Reporte</span>
                  {isDownloadingMassive && <FontAwesomeIcon icon={faSpinner} className="spinner-icon" />}
                </li>
              )}
              
              <li onClick={handleLogout} className="logout-item">
                <FontAwesomeIcon icon={faSignOutAlt} />
                <span>Salir</span>
              </li>
            </div>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;