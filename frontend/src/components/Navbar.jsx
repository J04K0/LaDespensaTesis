import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NavbarStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCaretDown, faPerson, faCaretUp, faAdd, faHome, faBoxOpen, 
  faHistory, faChartLine, faTruck, faSignOutAlt, faBarcode, 
  faBars, faTimes, faShoppingCart, faStore, faMoneyBillWave, 
  faCalculator, faWarehouse, faClipboardList, faCoins, faUsers,
  faUserCog, faLock, faFileInvoiceDollar, faFileExport, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { obtenerVentasPorTicket } from '../services/venta.service';
import { getDeudores } from '../services/deudores.service';
import NotificationCenter from './NotificationCenter';
import { initializeSocket, closeSocket } from '../services/socket.service';
import { ExportService } from '../services/export.service.js';
import { DataCollectionService } from '../services/dataCollection.service';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../helpers/swaHelper';

const Navbar = () => {
  const navigate = useNavigate();
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
      // Cerrar cualquier dropdown activo si se hace clic fuera de él
      if (activeDropdown && 
          dropdownRefs[activeDropdown]?.current && 
          !dropdownRefs[activeDropdown].current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Inicializar la conexión WebSocket al montar el componente
    initializeSocket();
    
    // Guardar la hora de inicio de sesión solo si no existe ya
    if (!localStorage.getItem('sessionStartTime')) {
      localStorage.setItem('sessionStartTime', new Date().toISOString());
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cerrar la conexión WebSocket al desmontar
      closeSocket();
    };
  }, [activeDropdown]);

  const handleNavigation = (path) => {
    navigate(path);
    setIsNavVisible(false); // Cerrar menú en móvil después de navegar
    setActiveDropdown(null); // Cerrar dropdowns activos
  };

  const toggleDropdown = (dropdown, e) => {
    e.stopPropagation(); // Evitar que el clic se propague
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleLogout = async () => {
    try {
      // Generar reporte diario antes de cerrar sesión
      await generarReporteDiario();
      
      // Código de cierre de sesión existente
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // También eliminamos el tiempo de inicio de sesión al cerrar sesión
      localStorage.removeItem('sessionStartTime');
      navigate('/auth');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Continuar con el cierre de sesión incluso si hay error en el reporte
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('sessionStartTime');
      navigate('/auth');
    }
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
      let ventasADeudores = 0;
      let cantidadVentasADeudores = 0;

      ventasSesion.forEach(venta => {
        const importeVenta = venta.ventas.reduce((sum, producto) => 
          sum + (producto.precioVenta * producto.cantidad), 0);
        
        totalVentas += importeVenta;

        // Si es una venta a deudor, no afecta al efectivo ni tarjeta directamente
        if (venta.deudorId) {
          ventasADeudores += importeVenta;
          cantidadVentasADeudores++;
        } else if (venta.metodoPago === 'tarjeta') {
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

      // Calcular totales de pagos de deudores, separando por método de pago
      let totalPagosDeudoresEfectivo = 0;
      let totalPagosDeudoresTarjeta = 0;
      let cantidadPagosEfectivo = 0;
      let cantidadPagosTarjeta = 0;
      let totalNuevasDeudas = 0;
      let cantidadNuevasDeudas = 0;
      
      // Array para almacenar los movimientos de deudores para el reporte
      const deudoresData = [];

      deudoresSesion.forEach(deudor => {
        const pagosSesion = deudor.historialPagos.filter(pago => {
          const fechaPago = new Date(pago.fecha);
          return fechaPago >= sessionStartTime && fechaPago <= ahora;
        });

        pagosSesion.forEach(pago => {
          if (pago.tipo === 'pago') {
            // Diferenciar entre pagos en efectivo y con tarjeta
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
          
          // Agregar al array de datos para el reporte
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

      // Balance final de efectivo (solo operaciones en efectivo)
      const balanceEfectivo = totalEfectivo + totalPagosDeudoresEfectivo;
      
      // Crear el objeto con los datos para el reporte
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
      
      // Usar el servicio de exportación centralizado
      const result = ExportService.generarReporteCierreCaja({
        usuarioActual,
        sessionStartTime,
        horaFinFormateada,
        fechaFormateada,
        ventasSesion,
        deudoresData,
        resumenCajaData,
        balanceEfectivo
      });
      
      // Actualizar el tiempo de inicio de sesión para la próxima sesión
      localStorage.setItem('sessionStartTime', new Date().toISOString());
      
      return result;
    } catch (error) {
      console.error("Error al generar reporte de sesión:", error);
      return false;
    }
  };

  const toggleNavbar = () => {
    setIsNavVisible(!isNavVisible);
  };

  const handleMassiveReport = async () => {
    try {
      setIsDownloadingMassive(true);
      
      // Mostrar alerta de inicio
      await showWarningAlert(
        "Generando Reporte Completo",
        "Se está recopilando información de todo el sistema. Este proceso puede tomar unos segundos...",
        "Entendido"
      );

      console.log('🚀 Iniciando descarga masiva del reporte completo...');
      
      // Recopilar todos los datos del sistema
      const datosSistema = await DataCollectionService.recopilarDatosSistema();
      
      // Generar el reporte completo
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
            
            {/* VENTAS */}
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
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/HistorySale');
                    }}>
                      <FontAwesomeIcon icon={faHistory} /> Historial de ventas
                    </li>
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

            {/* INVENTARIO */}
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
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/add-product');
                    }}>
                      <FontAwesomeIcon icon={faAdd} /> Agregar productos
                    </li>
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/proveedores');
                    }}>
                      <FontAwesomeIcon icon={faTruck} /> Gestión de proveedores
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* FINANZAS */}
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
                    <li onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('/cuentas-por-pagar');
                    }}>
                      <FontAwesomeIcon icon={faFileInvoiceDollar} /> Cuentas por pagar
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            {/* Contenedor de acciones especiales a la derecha */}
            <div className="navbar-special-actions">
              <div className="navbar-notifications">
                <NotificationCenter />
              </div>
              
              {/* Botón de reporte masivo compacto */}
              <li onClick={handleMassiveReport} className="massive-report-item">
                <FontAwesomeIcon icon={faFileExport} />
                <span>Reporte</span>
                {isDownloadingMassive && <FontAwesomeIcon icon={faSpinner} className="spinner-icon" />}
              </li>
              
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