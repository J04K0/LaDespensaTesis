import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { obtenerVentasPorTicket } from "../services/venta.service.js";
import { getProducts } from "../services/AddProducts.service.js";
import { ExportService } from '../services/export.service.js';
import "../styles/FinanzasStyles.css";
import FinanzasSkeleton from '../components/FinanzasSkeleton';
import { 
  faInfoCircle, 
  faFilePdf, 
  faChartBar, 
  faCoins, 
  faMoneyBillWave, 
  faShoppingCart,
  faChartLine,
  faWarehouse,
  faPercentage,
  faArrowUp,
  faArrowDown,
  faCalendarAlt,
  faBoxOpen,
  faTags,
  faCashRegister,
  faPercent,
  faChartPie
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Finanzas = () => {
  const [datosFinancieros, setDatosFinancieros] = useState({
    ingresosTotales: 0,
    transacciones: 0,
    costosTotales: 0,
    gananciasTotales: 0,
    inversionMercaderia: 0,
    rentabilidadPromedio: 0,
    valorPromedioTransaccion: 0,
    tendenciaIngresos: 10.5, // Ejemplo: +10.5%
    tendenciaCostos: -2.3,   // Ejemplo: -2.3%
    topCategorias: [],
    datosDisponibles: false,
    ingresosPorPeriodo: {},
    ingresosPorMes: {},
    productosMasVendidos: [],
    categoriasPorVolumen: [],
    inversionPorCategoria: {},
    margenPorCategoria: [],
    rentabilidadTemporal: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("semana");
  const [seccionActiva, setSeccionActiva] = useState("general");

  useEffect(() => {
    obtenerDatosFinancieros();
    obtenerDatosInventario();
  }, [timeRange]);

  // Efecto adicional para garantizar la actualización cuando cambia la sección activa
  useEffect(() => {
    // No es necesario volver a cargar los datos si ya se cargaron antes
    if (!loading && datosFinancieros.datosDisponibles) {
      console.log(`Cambiando a sección: ${seccionActiva} con período: ${timeRange}`);
    }
  }, [seccionActiva, loading]);

  const obtenerDatosFinancieros = async () => {
    try {
      setLoading(true);
      const response = await obtenerVentasPorTicket();
      const ventas = response.data || [];
      
      if (!ventas || ventas.length === 0) {
        console.warn("⚠️ No hay datos de ventas disponibles.");
        setLoading(false);
        return;
      }

      procesarDatosFinancieros(ventas);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener datos financieros:", error);
      setError("Error al obtener los datos financieros.");
      setLoading(false);
    }
  };

  const obtenerDatosInventario = async () => {
    try {
      const response = await getProducts(1, Number.MAX_SAFE_INTEGER);
      const productos = response.products || response.data?.products || response.data || [];
      
      if (!productos || productos.length === 0) {
        console.warn("⚠️ No hay productos en inventario.");
        return;
      }

      procesarDatosInventario(productos);
    } catch (error) {
      console.error("Error al obtener datos de inventario:", error);
    }
  };

  const procesarDatosFinancieros = (ventas) => {
    // Filtrar ventas por rango de tiempo
    const hoy = new Date();
    const fechaInicio = new Date();
    
    if (timeRange === "semana") {
      fechaInicio.setDate(hoy.getDate() - 7);
    } else if (timeRange === "mes") {
      fechaInicio.setMonth(hoy.getMonth() - 1);
    } else if (timeRange === "año") {
      fechaInicio.setFullYear(hoy.getFullYear() - 1);
    }
  
    const ventasFiltradas = ventas.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= fechaInicio && fechaVenta <= hoy;
    });
    
    // Calcular métricas generales
    let ingresosTotales = 0;
    let costosTotales = 0;
    const ingresosPorCategoria = {};
    const ingresosPorDia = {};
    const ingresosPorMes = {};
    const productoVendido = {};
    const ventasPorCategoria = {};
    
    // Inicializar días en ingresosPorDia
    const fechaActual = new Date(fechaInicio);
    while (fechaActual <= hoy) {
      const fechaStr = fechaActual.toISOString().split('T')[0];
      ingresosPorDia[fechaStr] = 0;
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    // Inicializar meses en ingresosPorMes (año actual)
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    meses.forEach(mes => {
      ingresosPorMes[mes] = 0;
    });
    
    // Procesar las ventas
    ventasFiltradas.forEach(venta => {
      const fecha = new Date(venta.fecha);
      const fechaStr = fecha.toISOString().split('T')[0];
      const mes = meses[fecha.getMonth()];
      
      let ingresoVenta = 0;
      let costoVenta = 0;
      
      venta.ventas.forEach(producto => {
        ingresoVenta += producto.precioVenta * producto.cantidad;
        costoVenta += (producto.precioCompra || (producto.precioVenta * 0.7)) * producto.cantidad;
        
        // Agregar a categoría
        const categoria = producto.categoria || "Sin categoría";
        if (!ingresosPorCategoria[categoria]) {
          ingresosPorCategoria[categoria] = 0;
          ventasPorCategoria[categoria] = 0;
        }
        ingresosPorCategoria[categoria] += producto.precioVenta * producto.cantidad;
        ventasPorCategoria[categoria] += producto.cantidad;

        // Tracking de productos más vendidos
        const productoKey = producto.nombre;
        if (!productoVendido[productoKey]) {
          productoVendido[productoKey] = {
            nombre: producto.nombre,
            ventas: 0,
            ingreso: 0
          };
        }
        productoVendido[productoKey].ventas += producto.cantidad;
        productoVendido[productoKey].ingreso += producto.precioVenta * producto.cantidad;
      });
      
      ingresosTotales += ingresoVenta;
      costosTotales += costoVenta;
      
      // Actualizar ingresos por día si es del período actual
      if (fechaStr in ingresosPorDia) {
        ingresosPorDia[fechaStr] += ingresoVenta;
      }
      
      // Actualizar ingresos por mes del año actual
      if (fecha.getFullYear() === new Date().getFullYear()) {
        ingresosPorMes[mes] += ingresoVenta;
      }
    });
    
    // Calcular ganancias y rentabilidad
    const gananciasTotales = ingresosTotales - costosTotales;
    const rentabilidadPromedio = ingresosTotales > 0 ? (gananciasTotales / ingresosTotales) * 100 : 0;
    
    // Top categorías por ingresos
    const categoriasOrdenadas = Object.keys(ingresosPorCategoria)
      .map(categoria => ({ 
        nombre: categoria, 
        ingresos: ingresosPorCategoria[categoria],
        porcentaje: (ingresosPorCategoria[categoria] / ingresosTotales) * 100
      }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5); // Top 5
    
    // Categorías por volumen de ventas
    const categoriasPorVolumen = Object.keys(ventasPorCategoria)
      .map(categoria => {
        const totalVentas = Object.values(ventasPorCategoria).reduce((a, b) => a + b, 0);
        return {
          nombre: categoria,
          ventas: ventasPorCategoria[categoria],
          porcentaje: totalVentas > 0 ? (ventasPorCategoria[categoria] / totalVentas) * 100 : 0
        };
      })
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 5); // Top 5
    
    // Productos más vendidos
    const productosMasVendidos = Object.values(productoVendido)
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 5); // Top 5
    
    // Valor promedio por transacción
    const valorPromedioTransaccion = ventasFiltradas.length > 0 ? ingresosTotales / ventasFiltradas.length : 0;
    
    // Márgenes por categoría (simulados, en una app real vendrían de cálculos reales)
    const margenPorCategoria = [
      { categoria: "Cigarros y Tabacos", margen: 40, rendimiento: "alto" },
      { categoria: "Cuidado Personal", margen: 28, rendimiento: "medio" },
      { categoria: "Limpieza y Hogar", margen: 28, rendimiento: "medio" },
      { categoria: "Bebidas Alcohólicas", margen: 25, rendimiento: "medio" },
      { categoria: "Bebidas", margen: 24, rendimiento: "medio" },
      { categoria: "Almacén", margen: 23, rendimiento: "medio" },
      { categoria: "Mascotas", margen: 20, rendimiento: "bajo" },
      { categoria: "Remedios", margen: 15, rendimiento: "bajo" }
    ];
    
    // Rentabilidad temporal (simulada para el periodo actual)
    const rentabilidadTemporal = [];
    // Tomamos los últimos 7 días para mostrar la rentabilidad temporal
    const ultimos7Dias = Object.keys(ingresosPorDia)
      .sort((a, b) => new Date(b) - new Date(a))
      .reverse()
      .slice(-7);
    
    ultimos7Dias.forEach(fecha => {
      const ingresos = Math.floor(Math.random() * 15000) + 10000;
      const costos = ingresos * (Math.random() * 0.3 + 0.5); // entre 50% y 80% de los ingresos
      const ganancias = ingresos - costos;
      const margen = (ganancias / ingresos) * 100;
      
      rentabilidadTemporal.push({
        fecha: new Date(fecha),
        ingresos,
        costos,
        ganancias,
        margen
      });
    });
    
    // Actualizar estado con todos los datos procesados
    setDatosFinancieros(prevState => ({
      ...prevState,
      ingresosTotales,
      transacciones: ventasFiltradas.length,
      costosTotales,
      gananciasTotales,
      rentabilidadPromedio,
      valorPromedioTransaccion,
      topCategorias: categoriasOrdenadas,
      datosDisponibles: true,
      ingresosPorPeriodo: ingresosPorDia,
      ingresosPorMes,
      productosMasVendidos,
      categoriasPorVolumen,
      margenPorCategoria,
      rentabilidadTemporal
    }));
  };

  const procesarDatosInventario = (productos) => {
    let inversionTotal = 0;
    const inversionPorCategoria = {};
    
    productos.forEach(producto => {
      if (!producto) return;
      
      const categoria = producto.Categoria || producto.categoria || "Sin categoría";
      if (!inversionPorCategoria[categoria]) {
        inversionPorCategoria[categoria] = 0;
      }
      
      const precioCompra = producto.PrecioCompra || producto.precioCompra || 0;
      const stock = producto.Stock || producto.stock || 0;
      
      if (precioCompra > 0 && stock > 0) {
        const valorInventario = precioCompra * stock;
        inversionTotal += valorInventario;
        inversionPorCategoria[categoria] += valorInventario;
      }
    });
    
    // Actualizar el estado con la información de inventario
    setDatosFinancieros(prevState => ({
      ...prevState,
      inversionMercaderia: inversionTotal,
      inversionPorCategoria
    }));
  };

  const handleTimeRangeChange = (e) => {
    const newTimeRange = e.target.value;
    setTimeRange(newTimeRange);
    
    // Forzar una actualización inmediata de los datos cuando cambia el período
    // Esto garantiza que las secciones de productos y rentabilidad se actualicen correctamente
    obtenerDatosFinancieros();
    obtenerDatosInventario();
    
    console.log(`Cambiando período a: ${newTimeRange}, actualizando datos...`);
  };

  const handleCambioSeccion = (seccion) => {
    setSeccionActiva(seccion);
    
    // Cuando se cambia a las secciones de productos o rentabilidad,
    // nos aseguramos de que estén usando los datos actualizados
    if ((seccion === 'productos' || seccion === 'rentabilidad') && datosFinancieros.datosDisponibles) {
      console.log(`Actualizando datos para la sección ${seccion} con período ${timeRange}`);
    }
  };

  const descargarReporteFinanciero = () => {
    ExportService.generarReporteFinanciero({
      ...datosFinancieros,
      periodo: timeRange
    }, timeRange);
  };

  // Formatear valores monetarios
  const formatMoney = (value) => {
    return '$' + value.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Formatear valores porcentuales
  const formatPercent = (value) => {
    return value.toFixed(1) + '%';
  };

  // Calcular tendencias (simuladas)
  const getTendencia = (tipo) => {
    // En una implementación real, calcularías tendencias comparando períodos
    if (tipo === 'ingresos') return Math.random() > 0.5 ? 8.3 : -5.2;
    if (tipo === 'costos') return Math.random() > 0.3 ? -3.1 : 4.7;
    if (tipo === 'ganancias') return Math.random() > 0.6 ? 12.4 : -7.8;
    return 0;
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        {loading ? (
          <FinanzasSkeleton />
        ) : (
          <>
            <div className="page-header">
              <div className="title-container">
                <h1 className="page-title">Dashboard Financiero</h1>
                <p className="page-subtitle">Analiza el rendimiento económico y tendencias de ventas de tu negocio</p>
              </div>
              <button className="btn-export-pdf" onClick={descargarReporteFinanciero}>
                <FontAwesomeIcon icon={faFilePdf} /> Descargar PDF
              </button>
            </div>
            
            <div className="filters-container" style={{ alignSelf: 'flex-start' }}>
              <div className="filter-group">
                <label className="form-label">Periodo:</label>
                <select 
                  value={timeRange} 
                  onChange={handleTimeRangeChange}
                  className="form-select"
                >
                  <option value="semana">Última semana</option>
                  <option value="mes">Último mes</option>
                  <option value="año">Último año</option>
                </select>
              </div>
            </div>

            {/* Navegación entre secciones */}
            <div className="finanzas-nav">
              <button 
                className={`finanzas-nav-btn ${seccionActiva === 'general' ? 'active' : ''}`}
                onClick={() => handleCambioSeccion('general')}
              >
                <FontAwesomeIcon icon={faChartPie} /> General
              </button>
              <button 
                className={`finanzas-nav-btn ${seccionActiva === 'ingresos' ? 'active' : ''}`}
                onClick={() => handleCambioSeccion('ingresos')}
              >
                <FontAwesomeIcon icon={faCoins} /> Ingresos
              </button>
              <button 
                className={`finanzas-nav-btn ${seccionActiva === 'productos' ? 'active' : ''}`}
                onClick={() => handleCambioSeccion('productos')}
              >
                <FontAwesomeIcon icon={faBoxOpen} /> Productos
              </button>
              <button 
                className={`finanzas-nav-btn ${seccionActiva === 'rentabilidad' ? 'active' : ''}`}
                onClick={() => handleCambioSeccion('rentabilidad')}
              >
                <FontAwesomeIcon icon={faPercent} /> Rentabilidad
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* SECCIÓN GENERAL - Resumen financiero y métricas principales */}
            {seccionActiva === 'general' && (
              <div className="finanzas-section">
                <h2 className="section-title">Resumen financiero</h2>
                
                {/* Tarjetas de métricas principales */}
                <div className="stats-cards">
                  <div className="stat-card primary">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faCoins} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Ingresos totales</h3>
                        <div className="stat-trend">
                          {getTendencia('ingresos') > 0 ? (
                            <span className="trend-up"><FontAwesomeIcon icon={faArrowUp} /> {getTendencia('ingresos')}%</span>
                          ) : (
                            <span className="trend-down"><FontAwesomeIcon icon={faArrowDown} /> {Math.abs(getTendencia('ingresos'))}%</span>
                          )}
                          <span className="trend-period">vs. periodo anterior</span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-value">{formatMoney(datosFinancieros.ingresosTotales)}</div>
                    <div className="stat-caption">
                      <FontAwesomeIcon icon={faCalendarAlt} /> {timeRange === 'semana' ? 'Últimos 7 días' : timeRange === 'mes' ? 'Último mes' : 'Último año'}
                    </div>
                  </div>

                  <div className="stat-card danger">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faMoneyBillWave} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Costos totales</h3>
                        <div className="stat-trend">
                          {getTendencia('costos') > 0 ? (
                            <span className="trend-down"><FontAwesomeIcon icon={faArrowUp} /> {getTendencia('costos')}%</span>
                          ) : (
                            <span className="trend-up"><FontAwesomeIcon icon={faArrowDown} /> {Math.abs(getTendencia('costos'))}%</span>
                          )}
                          <span className="trend-period">vs. periodo anterior</span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-value">{formatMoney(datosFinancieros.costosTotales)}</div>
                    <div className="stat-caption">
                      <FontAwesomeIcon icon={faCalendarAlt} /> {timeRange === 'semana' ? 'Últimos 7 días' : timeRange === 'mes' ? 'Último mes' : 'Último año'}
                    </div>
                  </div>

                  <div className="stat-card success">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faChartLine} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Ganancias totales</h3>
                        <div className="stat-trend">
                          {getTendencia('ganancias') > 0 ? (
                            <span className="trend-up"><FontAwesomeIcon icon={faArrowUp} /> {getTendencia('ganancias')}%</span>
                          ) : (
                            <span className="trend-down"><FontAwesomeIcon icon={faArrowDown} /> {Math.abs(getTendencia('ganancias'))}%</span>
                          )}
                          <span className="trend-period">vs. periodo anterior</span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-value">{formatMoney(datosFinancieros.gananciasTotales)}</div>
                    <div className="stat-caption">
                      <div className="profit-margin">Margen: {formatPercent(datosFinancieros.rentabilidadPromedio)}</div>
                    </div>
                  </div>
                </div>

                {/* Segunda fila de métricas */}
                <div className="stats-cards">
                  <div className="stat-card warning">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faWarehouse} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Inversión en inventario</h3>
                      </div>
                    </div>
                    <div className="stat-value">{formatMoney(datosFinancieros.inversionMercaderia)}</div>
                    <div className="stat-caption">
                      <div className="inventory-info">Total de productos en stock</div>
                    </div>
                  </div>

                  <div className="stat-card info">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faShoppingCart} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Transacciones</h3>
                      </div>
                    </div>
                    <div className="stat-value">{datosFinancieros.transacciones}</div>
                    <div className="stat-caption">
                      <div className="transactions-info">Promedio: {formatMoney(datosFinancieros.valorPromedioTransaccion)}</div>
                    </div>
                  </div>

                  <div className="stat-card secondary">
                    <div className="stat-card-header">
                      <div className="stat-icon">
                        <FontAwesomeIcon icon={faPercentage} />
                      </div>
                      <div className="stat-header-info">
                        <h3>Rentabilidad</h3>
                      </div>
                    </div>
                    <div className="stat-value">{formatPercent(datosFinancieros.rentabilidadPromedio)}</div>
                    <div className="stat-caption">
                      <div className="roi-info">Retorno sobre inversión</div>
                    </div>
                  </div>
                </div>
                
                {/* Resumen por categoría */}
                <div className="category-summary-container">
                  <h2 className="section-title">Categorías principales</h2>
                  
                  <div className="category-cards">
                    {datosFinancieros.topCategorias.map((categoria, index) => (
                      <div key={index} className="category-card">
                        <div className="category-card-header">
                          <div className="category-name">{categoria.nombre}</div>
                          <div className="category-percent">{formatPercent(categoria.porcentaje)}</div>
                        </div>
                        <div className="category-value">{formatMoney(categoria.ingresos)}</div>
                        <div className="progress-bar">
                          <div className="progress" style={{ width: `${categoria.porcentaje}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN INGRESOS - Detalles de ventas e ingresos */}
            {seccionActiva === 'ingresos' && (
              <div className="finanzas-section">
                <h2 className="section-title">Análisis de ingresos</h2>
                
                <div className="section-cards">
                  <div className="analysis-card">
                    <h3 className="card-title">Distribución por días</h3>#
                    <div className="time-distribution">
                      {Object.entries(datosFinancieros.ingresosPorPeriodo).map(([fecha, valor], index) => (
                        <div key={index} className="time-bar-container">
                          <div className="time-label">
                            {new Date(fecha).toLocaleDateString('es-AR', {weekday: 'short'})}<br/>
                            {new Date(fecha).getDate()}
                          </div>
                          <div className="time-bar-wrapper">
                            <div 
                              className="time-bar" 
                              style={{ 
                                height: `${Math.max(
                                  5, 
                                  (valor / Math.max(...Object.values(datosFinancieros.ingresosPorPeriodo))) * 100
                                )}%` 
                              }}
                              title={`${new Date(fecha).toLocaleDateString()}: ${formatMoney(valor)}`}
                            >
                              <span className="time-bar-value">{formatMoney(valor)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="analysis-card">
                    <h3 className="card-title">Ventas por día de la semana</h3>
                    <div className="day-distribution">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => {
                        // Simulación de datos para el ejemplo
                        const valor = Math.floor(Math.random() * 15000) + 5000;
                        const porcentaje = Math.floor(Math.random() * 30) + 5;
                        
                        return (
                          <div key={index} className="day-stat">
                            <div className="day-name">{dia}</div>
                            <div className="day-value">{formatMoney(valor)}</div>
                            <div className="day-progress-container">
                              <div className="day-progress" style={{ width: `${porcentaje}%` }}></div>
                            </div>
                            <div className="day-percent">{porcentaje}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="section-cards">
                  <div className="analysis-card full-width">
                    <h3 className="card-title">Ventas mensuales (año actual)</h3>
                    <div className="monthly-distribution">
                      {Object.entries(datosFinancieros.ingresosPorMes).map(([mes, valor], index) => {
                        const porcentaje = datosFinancieros.ingresosTotales > 0 
                          ? (valor / Object.values(datosFinancieros.ingresosPorMes).reduce((a, b) => a + b, 0)) * 100 
                          : 0;
                          
                        return (
                          <div key={index} className="month-stat">
                            <div className="month-name">{mes.substring(0, 3)}</div>
                            <div className="month-bar-container">
                              <div className="month-bar" style={{ height: `${Math.max(4, porcentaje)}%` }}>
                                <span className="month-bar-value">{formatMoney(valor)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN PRODUCTOS - Análisis de productos */}
            {seccionActiva === 'productos' && (
              <div className="finanzas-section">
                <h2 className="section-title">Análisis de productos</h2>
                
                <div className="section-cards">
                  <div className="analysis-card">
                    <h3 className="card-title">Productos más vendidos</h3>
                    <div className="product-list">
                      {datosFinancieros.productosMasVendidos.length > 0 ? (
                        datosFinancieros.productosMasVendidos.map((producto, index) => (
                          <div key={index} className="product-item">
                            <div className="product-rank">{index + 1}</div>
                            <div className="product-info">
                              <div className="product-name">{producto.nombre}</div>
                              <div className="product-meta">{producto.ventas} unidades vendidas</div>
                            </div>
                            <div className="product-revenue">{formatMoney(producto.ingreso)}</div>
                          </div>
                        ))
                      ) : (
                        <div className="no-data">No hay datos disponibles para el período seleccionado</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="analysis-card">
                    <h3 className="card-title">Categorías por volumen</h3>
                    <div className="category-volume">
                      {datosFinancieros.categoriasPorVolumen.length > 0 ? (
                        datosFinancieros.categoriasPorVolumen.map((categoria, index) => (
                          <div key={index} className="category-volume-item">
                            <div className="category-volume-info">
                              <div className="category-volume-name">{categoria.nombre}</div>
                              <div className="category-volume-count">{categoria.ventas} unidades</div>
                            </div>
                            <div className="category-volume-bar-container">
                              <div className="category-volume-bar" style={{ width: `${categoria.porcentaje}%` }}></div>
                              <span className="category-volume-percent">{categoria.porcentaje.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-data">No hay datos disponibles para el período seleccionado</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="section-cards">
                  <div className="analysis-card">
                    <h3 className="card-title">Inversión por categoría</h3>
                    <div className="inventory-distribution">
                      {Object.entries(datosFinancieros.inversionPorCategoria || {})
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([categoria, valor], index) => {
                          const porcentaje = datosFinancieros.inversionMercaderia > 0 
                            ? (valor / datosFinancieros.inversionMercaderia) * 100 
                            : 0;
                            
                          return (
                            <div key={index} className="inventory-category">
                              <div className="inventory-category-header">
                                <span className="inventory-category-name">{categoria}</span>
                                <span className="inventory-category-value">{formatMoney(valor)}</span>
                              </div>
                              <div className="inventory-progress-container">
                                <div className="inventory-progress" style={{ width: `${porcentaje}%` }}></div>
                                <span className="inventory-percent">{porcentaje.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  
                  <div className="analysis-card">
                    <h3 className="card-title">Rotación de inventario</h3>
                    <div className="inventory-turnover">
                      {/* Datos simulados - En una implementación real, estos vendrían de la API */}
                      <div className="turnover-gauge">
                        <div className="turnover-value">4.8</div>
                        <div className="turnover-label">veces/año</div>
                      </div>
                      <div className="turnover-stats">
                        <div className="turnover-stat">
                          <div className="turnover-stat-value">76</div>
                          <div className="turnover-stat-label">días en inventario</div>
                        </div>
                        <div className="turnover-stat">
                          <div className="turnover-stat-value">12%</div>
                          <div className="turnover-stat-label">bajo mínimo</div>
                        </div>
                        <div className="turnover-stat">
                          <div className="turnover-stat-value">8%</div>
                          <div className="turnover-stat-label">sobre máximo</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN RENTABILIDAD - Análisis de rentabilidad */}
            {seccionActiva === 'rentabilidad' && (
              <div className="finanzas-section">
                <h2 className="section-title">Análisis de rentabilidad</h2>
                
                <div className="section-cards">
                  <div className="analysis-card">
                    <h3 className="card-title">Margen de ganancia por categoría</h3>
                    <div className="margin-by-category">
                      {datosFinancieros.margenPorCategoria.map((cat, index) => (
                        <div key={index} className="margin-category">
                          <div className="margin-category-name">{cat.categoria}</div>
                          <div className="margin-meter-container">
                            <div 
                              className={`margin-meter ${cat.rendimiento}`}
                              style={{ width: `${cat.margen * 2}px` }}
                            ></div>
                            <span className="margin-value">{cat.margen}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="analysis-card">
                    <h3 className="card-title">Comparativa Ingresos vs. Costos</h3>
                    <div className="comparison-stats">
                      <div className="comparison-stat">
                        <div className="comparison-header">
                          <div className="comparison-label">Ingresos</div>
                          <div className="comparison-value">{formatMoney(datosFinancieros.ingresosTotales)}</div>
                        </div>
                        <div className="comparison-bar-container">
                          <div className="comparison-bar income" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      
                      <div className="comparison-stat">
                        <div className="comparison-header">
                          <div className="comparison-label">Costos</div>
                          <div className="comparison-value">{formatMoney(datosFinancieros.costosTotales)}</div>
                        </div>
                        <div className="comparison-bar-container">
                          <div 
                            className="comparison-bar expenses" 
                            style={{ width: `${(datosFinancieros.costosTotales / Math.max(datosFinancieros.ingresosTotales, 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="comparison-stat">
                        <div className="comparison-header">
                          <div className="comparison-label">Ganancias</div>
                          <div className="comparison-value">{formatMoney(datosFinancieros.gananciasTotales)}</div>
                        </div>
                        <div className="comparison-bar-container">
                          <div 
                            className="comparison-bar profits" 
                            style={{ width: `${(datosFinancieros.gananciasTotales / Math.max(datosFinancieros.ingresosTotales, 1)) * 100}%` }}
                          ></div>
                        </div>
                        <div className="comparison-percentage">
                          Margen de ganancia: <span className="profit-percentage">{formatPercent(datosFinancieros.rentabilidadPromedio)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Finanzas;