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
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  useEffect(() => {
    initializeSocket();
    
    if (!localStorage.getItem('sessionStartTime')) {
      localStorage.setItem('sessionStartTime', new Date().toISOString());
    }
    
    return () => {
    };
  }, []);

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
        
        console.log('🔍 DEBUG: Últimas 5 ventas en el sistema:');
        todasLasVentas.slice(-5).forEach((venta, index) => {
          console.log(`  📄 Venta ${index + 1}:`, {
            id: venta._id,
            fecha: venta.fecha,
            fechaFormateada: new Date(venta.fecha).toLocaleString(),
            metodoPago: venta.metodoPago,
            deudorId: venta.deudorId,
            productos: venta.ventas?.length || 0
          });
        });
        
        ventasSesion = todasLasVentas.filter(venta => {
          const fechaVenta = new Date(venta.fecha);
          const esDeSesion = fechaVenta >= sessionStartTime && fechaVenta <= ahora;
          
          if (esDeSesion) {
            console.log(`✅ Venta de sesión encontrada:`, {
              id: venta._id,
              fecha: fechaVenta.toLocaleString(),
              metodoPago: venta.metodoPago,
              deudorId: venta.deudorId ? 'SÍ' : 'NO',
              productos: venta.ventas?.length || 0
            });
          }
          
          return esDeSesion;
        });
        
        console.log('🎪 Ventas de esta sesión:', ventasSesion.length);
        
        if (ventasSesion.length === 0) {
          console.warn('⚠️ No se encontraron ventas en esta sesión. Verificando datos...');
          console.log('🕐 Rango de sesión:', {
            inicio: sessionStartTime.toLocaleString(),
            fin: ahora.toLocaleString(),
            duracionHoras: ((ahora - sessionStartTime) / (1000 * 60 * 60)).toFixed(2)
          });
        }
        
        ventasSesion.forEach((venta, index) => {
          console.log(`🛍️ Procesando venta ${index + 1}:`, {
            id: venta._id,
            metodoPago: venta.metodoPago || 'NO DEFINIDO',
            deudorId: venta.deudorId || 'NO',
            fecha: new Date(venta.fecha).toLocaleString()
          });
          
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
            console.log('👤 Clasificada como: VENTA A DEUDOR');
            ventasADeudores += importeVenta;
            cantidadVentasADeudores++;
          } else if (venta.metodoPago === 'tarjeta') {
            console.log('💳 Clasificada como: VENTA CON TARJETA');
            totalTarjeta += importeVenta;
            cantidadVentasTarjeta++;
          } else if (venta.metodoPago === 'efectivo') {
            console.log('💵 Clasificada como: VENTA EN EFECTIVO');
            totalEfectivo += importeVenta;
            cantidadVentasEfectivo++;
          } else {
            console.warn(`⚠️ VENTA SIN MÉTODO DE PAGO DEFINIDO:`, {
              id: venta._id,
              metodoPago: venta.metodoPago,
              deudorId: venta.deudorId
            });
            totalEfectivo += importeVenta;
            cantidadVentasEfectivo++;
          }
        });
        
        console.log('📈 RESUMEN DE TOTALES CALCULADOS:');
        console.log(`  💵 Efectivo: $${totalEfectivo} (${cantidadVentasEfectivo} ventas)`);
        console.log(`  💳 Tarjeta: $${totalTarjeta} (${cantidadVentasTarjeta} ventas)`);
        console.log(`  👤 Deudores: $${ventasADeudores} (${cantidadVentasADeudores} ventas)`);
        console.log(`  📊 Total: $${totalVentas} (${ventasSesion.length} ventas)`);
        
      } catch (ventasError) {
        console.error("❌ Error al obtener el historial de ventas:", ventasError);
      }

      let deudoresData = [];
      let totalPagosDeudoresEfectivo = 0;
      let totalPagosDeudoresTarjeta = 0;
      let cantidadPagosEfectivo = 0;
      let cantidadPagosTarjeta = 0;
      let totalNuevasDeudas = 0;
      let cantidadNuevasDeudas = 0;

      try {
        console.log('🔍 DEBUG: Obteniendo pagos de deudores...');
        const respuestaDeudores = await getDeudores(1, 1000);
        const deudores = respuestaDeudores.deudores || [];
        
        console.log(`📋 Total de deudores en el sistema: ${deudores.length}`);
        
        const deudoresSesion = deudores.filter(deudor => {
          if (!deudor.historialPagos || !Array.isArray(deudor.historialPagos)) return false;
          
          return deudor.historialPagos.some(pago => {
            const fechaPago = new Date(pago.fecha);
            return fechaPago >= sessionStartTime && fechaPago <= ahora;
          });
        });

        console.log(`👥 Deudores con actividad en esta sesión: ${deudoresSesion.length}`);

        deudoresSesion.forEach(deudor => {
          const pagosSesion = deudor.historialPagos.filter(pago => {
            const fechaPago = new Date(pago.fecha);
            return fechaPago >= sessionStartTime && fechaPago <= ahora;
          });

          console.log(`💰 ${deudor.Nombre}: ${pagosSesion.length} operaciones en esta sesión`);

          pagosSesion.forEach(pago => {
            console.log(`  📝 Operación:`, {
              tipo: pago.tipo,
              monto: pago.monto,
              metodoPago: pago.metodoPago,
              fecha: new Date(pago.fecha).toLocaleString()
            });

            if (pago.tipo === 'pago') {
              if (pago.metodoPago === 'tarjeta') {
                totalPagosDeudoresTarjeta += pago.monto;
                cantidadPagosTarjeta++;
                console.log(`    💳 Sumado a pagos tarjeta: $${pago.monto}`);
              } else {
                totalPagosDeudoresEfectivo += pago.monto;
                cantidadPagosEfectivo++;
                console.log(`    💵 Sumado a pagos efectivo: $${pago.monto}`);
              }
            } else {
              totalNuevasDeudas += pago.monto;
              cantidadNuevasDeudas++;
              console.log(`    📈 Sumado a nuevas deudas: $${pago.monto}`);
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

        console.log('📈 RESUMEN DE PAGOS DE DEUDORES:');
        console.log(`  💵 Pagos efectivo: $${totalPagosDeudoresEfectivo} (${cantidadPagosEfectivo} pagos)`);
        console.log(`  💳 Pagos tarjeta: $${totalPagosDeudoresTarjeta} (${cantidadPagosTarjeta} pagos)`);
        console.log(`  📈 Nuevas deudas: $${totalNuevasDeudas} (${cantidadNuevasDeudas} registros)`);

      } catch (deudoresError) {
        console.error("❌ Error al obtener información de deudores:", deudoresError);
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
      
      console.log('📄 DATOS FINALES PARA EL PDF:');
      resumenCajaData.slice(1).forEach(fila => {
        console.log(`  ${fila[0]}: ${fila[1]} → ${fila[2]}`);
      });
      console.log(`  💰 Balance en Efectivo: $${balanceEfectivo.toLocaleString('es-ES')}`);
      
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
                        <FontAwesomeIcon icon={faChartLine} /> Análisis financiero
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