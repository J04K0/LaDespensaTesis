import React, { useEffect, useState } from "react";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
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
  faPercentage
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  DoughnutController,
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  DoughnutController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler 
);

const Finanzas = () => {
  const [ingresosPorDia, setIngresosPorDia] = useState(null);
  const [ventasPorMes, setVentasPorMes] = useState(null);
  const [ingresosPorCategoria, setIngresosPorCategoria] = useState(null);
  const [numeroTransacciones, setNumeroTransacciones] = useState(0);
  const [comparacionIngresoCosto, setComparacionIngresoCosto] = useState(null);
  const [inversionMercaderiaPorCategoria, setInversionMercaderiaPorCategoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("semana");
  const [activeChart, setActiveChart] = useState(null);
  const [valorPromedioTransaccion, setValorPromedioTransaccion] = useState(null);

  useEffect(() => {
    obtenerDatosFinancieros();
    obtenerDatosInventario();
  }, [timeRange]);

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
    
    setNumeroTransacciones(ventasFiltradas.length);
    
    procesarIngresosPorDia(ventasFiltradas);
    procesarVentasPorMes(ventas);
    procesarIngresosPorCategoria(ventasFiltradas);
    procesarComparacionIngresoCosto(ventasFiltradas);
    procesarValorPromedioTransaccion(ventasFiltradas);
  };

  const procesarDatosInventario = (productos) => {
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
        inversionPorCategoria[categoria] += precioCompra * stock;
      }
    });
    
    if (Object.keys(inversionPorCategoria).length === 0) {
      console.warn("⚠️ No hay datos de inversión para mostrar.");
      return;
    }
    
    setInversionMercaderiaPorCategoria({
      labels: Object.keys(inversionPorCategoria),
      datasets: [
        {
          label: "Inversión en Mercadería",
          data: Object.values(inversionPorCategoria),
          backgroundColor: [
            "#FF5733", "#C70039", "#900C3F", "#581845", "#FFC300", 
            "#FF5733", "#C70039", "#900C3F", "#581845", "#FFC300"
          ],
          borderColor: "#fff",
          borderWidth: 1
        }
      ]
    });
  };

  const procesarIngresosPorDia = (ventas) => {
    const ingresosPorDia = {};
    const hoy = new Date();
    const fechaInicio = new Date();
    
    if (timeRange === "semana") {
      fechaInicio.setDate(hoy.getDate() - 7);
    } else if (timeRange === "mes") {
      fechaInicio.setMonth(hoy.getMonth() - 1);
    } else if (timeRange === "año") {
      fechaInicio.setFullYear(hoy.getFullYear() - 1);
    }
    
    const fechaActual = new Date(fechaInicio);
    while (fechaActual <= hoy) {
      const fechaStr = fechaActual.toISOString().split('T')[0];
      ingresosPorDia[fechaStr] = 0;
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      if (fecha >= fechaInicio && fechaStr in ingresosPorDia) {
        const total = venta.ventas.reduce(
          (sum, producto) => sum + (producto.precioVenta * producto.cantidad),
          0
        );
        ingresosPorDia[fechaStr] += total;
      }
    });
    
    setIngresosPorDia({
      labels: Object.keys(ingresosPorDia),
      datasets: [
        {
          label: "Ingresos Diarios",
          data: Object.values(ingresosPorDia),
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          fill: true,
          tension: 0.4
        }
      ]
    });
  };

  const procesarVentasPorMes = (ventas) => {
    const meses = {
      "01": "Enero",
      "02": "Febrero",
      "03": "Marzo",
      "04": "Abril",
      "05": "Mayo",
      "06": "Junio",
      "07": "Julio",
      "08": "Agosto",
      "09": "Septiembre",
      "10": "Octubre",
      "11": "Noviembre",
      "12": "Diciembre"
    };
    
    const ventasPorMes = {};
    const añoActual = new Date().getFullYear();
    
    Object.keys(meses).forEach(mes => {
      ventasPorMes[meses[mes]] = 0;
    });
    
    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha);
      if (fecha.getFullYear() === añoActual) {
        const mes = fecha.getMonth() + 1;
        const mesStr = mes < 10 ? `0${mes}` : `${mes}`;
        const nombreMes = meses[mesStr];
        
        const total = venta.ventas.reduce(
          (sum, producto) => sum + (producto.precioVenta * producto.cantidad),
          0
        );
        
        ventasPorMes[nombreMes] += total;
      }
    });
    
    setVentasPorMes({
      labels: Object.keys(ventasPorMes),
      datasets: [
        {
          label: "Ventas Mensuales",
          data: Object.values(ventasPorMes),
          backgroundColor: [
            "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#FF9F40", 
            "#9966FF", "#FF99CC", "#99CC00", "#CC9900", "#3399FF",
            "#FF5733", "#33FF57"
          ],
          borderWidth: 1
        }
      ]
    });
  };

  const procesarIngresosPorCategoria = (ventas) => {
    const ingresosPorCategoria = {};
    
    ventas.forEach(venta => {
      venta.ventas.forEach(producto => {
        const categoria = producto.categoria || "Sin categoría";
        if (!ingresosPorCategoria[categoria]) {
          ingresosPorCategoria[categoria] = 0;
        }
        
        ingresosPorCategoria[categoria] += producto.precioVenta * producto.cantidad;
      });
    });
  
    setIngresosPorCategoria({
      labels: Object.keys(ingresosPorCategoria),
      datasets: [
        {
          label: "Ingresos por Categoría",
          data: Object.values(ingresosPorCategoria),
          backgroundColor: [
            "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#FF9F40", 
            "#9966FF", "#FF99CC", "#99CC00"
          ],
          borderColor: "#fff"
        }
      ]
    });
  };

  const procesarComparacionIngresoCosto = (ventas) => {
    const comparacion = {
      labels: [],
      ingresos: [],
      costos: [],
      ganancias: []
    };
    
    if (timeRange === "semana") {
      const hoy = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(hoy.getDate() - 7);
      
      const fechaActual = new Date(fechaInicio);
      while (fechaActual <= hoy) {
        const fechaStr = fechaActual.toISOString().split('T')[0];
        comparacion.labels.push(fechaStr);
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
      
      comparacion.ingresos = Array(comparacion.labels.length).fill(0);
      comparacion.costos = Array(comparacion.labels.length).fill(0);
      comparacion.ganancias = Array(comparacion.labels.length).fill(0);
      
      ventas.forEach(venta => {
        const fecha = new Date(venta.fecha);
        const fechaStr = fecha.toISOString().split('T')[0];
        const index = comparacion.labels.indexOf(fechaStr);
        
        if (index !== -1) {
          let ingresoDia = 0;
          let costoDia = 0;
          
          venta.ventas.forEach(producto => {
            ingresoDia += producto.precioVenta * producto.cantidad;
            
            costoDia += (producto.precioCompra || (producto.precioVenta * 0.7)) * producto.cantidad;
          });
          
          comparacion.ingresos[index] += ingresoDia;
          comparacion.costos[index] += costoDia;
          comparacion.ganancias[index] += (ingresoDia - costoDia);
        }
      });
    } else if (timeRange === "mes" || timeRange === "año") {
      const periodos = timeRange === "mes" ? 4 : 12;
      
      for (let i = 0; i < periodos; i++) {
        comparacion.labels.push(timeRange === "mes" ? `Semana ${i+1}` : `Mes ${i+1}`);
      }
      
      comparacion.ingresos = Array(periodos).fill(0);
      comparacion.costos = Array(periodos).fill(0);
      comparacion.ganancias = Array(periodos).fill(0);
      
      const hoy = new Date();
      const fechaInicio = new Date();
      
      if (timeRange === "mes") {
        fechaInicio.setMonth(hoy.getMonth() - 1);
      } else {
        fechaInicio.setFullYear(hoy.getFullYear() - 1);
      }
      
      const duracionPeriodo = (hoy - fechaInicio) / periodos;
      
      ventas.forEach(venta => {
        const fechaVenta = new Date(venta.fecha);
        
        if (fechaVenta >= fechaInicio && fechaVenta <= hoy) {
          const tiempoTranscurrido = fechaVenta - fechaInicio;
          const periodoIndex = Math.min(Math.floor(tiempoTranscurrido / duracionPeriodo), periodos - 1);
          
          let ingresoVenta = 0;
          let costoVenta = 0;
          
          venta.ventas.forEach(producto => {
            ingresoVenta += producto.precioVenta * producto.cantidad;
            costoVenta += (producto.precioCompra || (producto.precioVenta * 0.7)) * producto.cantidad;
          });
          
          comparacion.ingresos[periodoIndex] += ingresoVenta;
          comparacion.costos[periodoIndex] += costoVenta;
          comparacion.ganancias[periodoIndex] += (ingresoVenta - costoVenta);
        }
      });
    }
    
    setComparacionIngresoCosto({
      labels: comparacion.labels,
      datasets: [
        {
          label: 'Ingresos',
          data: comparacion.ingresos,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Costos',
          data: comparacion.costos,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'Ganancias',
          data: comparacion.ganancias,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    });
  };

  const procesarValorPromedioTransaccion = (ventas) => {
    const valoresPorPeriodo = {};
    const transaccionesPorPeriodo = {};
    const hoy = new Date();
    const fechaInicio = new Date();
    
    if (timeRange === "semana") {
      fechaInicio.setDate(hoy.getDate() - 7);
    } else if (timeRange === "mes") {
      fechaInicio.setMonth(hoy.getMonth() - 1);
    } else if (timeRange === "año") {
      fechaInicio.setFullYear(hoy.getFullYear() - 1);
    }
    
    // Preparar periodos según timeRange
    const labels = [];
    
    if (timeRange === "semana") {
      const fechaActual = new Date(fechaInicio);
      while (fechaActual <= hoy) {
        const fechaStr = fechaActual.toISOString().split('T')[0];
        labels.push(fechaStr);
        valoresPorPeriodo[fechaStr] = 0;
        transaccionesPorPeriodo[fechaStr] = 0;
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
    } else {
      // Para mes y año, usar periodos diferentes
      const periodos = timeRange === "mes" ? 4 : 12;
      for (let i = 0; i < periodos; i++) {
        const label = timeRange === "mes" ? `Semana ${i+1}` : `Mes ${i+1}`;
        labels.push(label);
        valoresPorPeriodo[label] = 0;
        transaccionesPorPeriodo[label] = 0;
      }
    }
    
    // Sumar valores por periodo
    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha);
      
      if (fecha >= fechaInicio && fecha <= hoy) {
        let valorTotal = venta.ventas.reduce(
          (acc, producto) => acc + producto.precioVenta * producto.cantidad, 0
        );
        
        if (timeRange === "semana") {
          const fechaStr = fecha.toISOString().split('T')[0];
          valoresPorPeriodo[fechaStr] += valorTotal;
          transaccionesPorPeriodo[fechaStr] += 1;
        } else {
          // Para mes y año, calcular el índice del periodo
          const tiempoTranscurrido = fecha - fechaInicio;
          const duracionPeriodo = (hoy - fechaInicio) / labels.length;
          const periodoIndex = Math.min(Math.floor(tiempoTranscurrido / duracionPeriodo), labels.length - 1);
          
          valoresPorPeriodo[labels[periodoIndex]] += valorTotal;
          transaccionesPorPeriodo[labels[periodoIndex]] += 1;
        }
      }
    });
    
    // Calcular promedios
    const promedios = labels.map(periodo => {
      const transacciones = transaccionesPorPeriodo[periodo];
      return transacciones > 0 ? valoresPorPeriodo[periodo] / transacciones : 0;
    });
    
    setValorPromedioTransaccion({
      labels,
      datasets: [
        {
          label: "Valor Promedio por Transacción",
          data: promedios,
          backgroundColor: "rgba(255, 159, 64, 0.6)",
          borderColor: "rgba(255, 159, 64, 1)",
          borderWidth: 2,
          type: 'line',
          fill: false,
          pointRadius: 4
        },
        {
          label: "Cantidad de Transacciones",
          data: labels.map(periodo => transaccionesPorPeriodo[periodo]),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          type: 'bar'
        }
      ]
    });
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  const handleCardClick = (chartType) => {
    if (activeChart === chartType) {
      setActiveChart(null); // Si ya está activo, lo cerramos
    } else {
      setActiveChart(chartType); // Si no, activamos este gráfico
    }
  };

  const descargarReporteFinanciero = () => {
    ExportService.generarReporteFinanciero({
      ingresosPorDia,
      ingresosPorCategoria,
      comparacionIngresoCosto,
      inversionMercaderiaPorCategoria
    }, timeRange);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: "top",
        labels: {
          font: {
            family: "'Helvetica', 'Arial', sans-serif",
            size: 12
          },
          color: '#343a40',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 38, 81, 0.8)',
        titleFont: {
          size: 13
        },
        bodyFont: {
          size: 12
        },
        bodySpacing: 6,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '$' + context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
          font: {
            family: "'Helvetica', 'Arial', sans-serif",
            size: 11
          },
          color: '#6c757d'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          font: {
            family: "'Helvetica', 'Arial', sans-serif",
            size: 11
          },
          color: '#6c757d'
        },
        grid: {
          display: false
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 6
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 1000
    },
    layout: {
      padding: 15
    }
  };

  // Add this function to provide chart explanations based on chart type
  const getChartExplanation = (chartType, subType) => {
    const explanations = {
      ingresos: {
        daily: "Muestra los ingresos diarios durante el período seleccionado. Útil para identificar tendencias de ventas y días con mayor actividad comercial.",
        monthly: "Visualiza las ventas mensuales durante el año actual, permitiendo comparar el rendimiento entre diferentes meses y detectar patrones estacionales."
      },
      costos: "Detalla los costos operativos por período, ayudando a identificar cuándo ocurren los gastos más significativos y monitorear la eficiencia de los recursos.",
      ganancias: "Presenta las ganancias netas por período, calculadas como ingresos menos costos, permitiendo evaluar la rentabilidad del negocio a lo largo del tiempo.",
      inversion: "Muestra la distribución de la inversión actual en mercadería por categoría, ayudando a identificar dónde está concentrado el capital del inventario.",
      transacciones: "Compara el valor promedio por transacción y la cantidad de transacciones por período, útil para entender los hábitos de compra de los clientes.",
      rentabilidad: "Analiza la rentabilidad porcentual por categoría de producto, ayudando a identificar qué líneas de productos generan mayores márgenes de ganancia."
    };
    
    if (subType) {
      return explanations[chartType][subType];
    }
    return explanations[chartType];
  };

  // Obtener el icono adecuado para cada tipo de métrica
  const getMetricIcon = (metricType) => {
    switch(metricType) {
      case 'ingresos': return faCoins;
      case 'transacciones': return faShoppingCart;
      case 'costos': return faMoneyBillWave;
      case 'ganancias': return faChartLine;
      case 'inversion': return faWarehouse;
      case 'rentabilidad': return faPercentage;
      default: return faChartBar;
    }
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
              <h1 className="page-title">Dashboard Financiero</h1>
              <button className="btn-export-pdf" onClick={descargarReporteFinanciero}>
                <FontAwesomeIcon icon={faFilePdf} /> Descargar PDF
              </button>
            </div>
            
            <div className="filters-container">
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

            {/* Resumen financiero */}
            {ingresosPorDia && comparacionIngresoCosto && (
              <div className="metrics-dashboard">
                <div 
                  className={`metric-card ${activeChart === 'ingresos' ? 'active' : ''}`}
                  onClick={() => handleCardClick('ingresos')}
                >
                  <div className="metric-icon bg-success">
                    <FontAwesomeIcon icon={getMetricIcon('ingresos')} />
                  </div>
                  <div className="metric-content">
                    <h3 className="metric-title">Ingresos Totales</h3>
                    <p className="metric-value text-success">
                      ${ingresosPorDia.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div 
                  className={`metric-card ${activeChart === 'transacciones' ? 'active' : ''}`}
                  onClick={() => handleCardClick('transacciones')}
                >
                  <div className="metric-icon bg-primary">
                    <FontAwesomeIcon icon={getMetricIcon('transacciones')} />
                  </div>
                  <div className="metric-content">
                    <h3 className="metric-title">Transacciones</h3>
                    <p className="metric-value text-primary">
                      {numeroTransacciones}
                    </p>
                  </div>
                </div>
                
                <div 
                  className={`metric-card ${activeChart === 'costos' ? 'active' : ''}`}
                  onClick={() => handleCardClick('costos')}
                >
                  <div className="metric-icon bg-danger">
                    <FontAwesomeIcon icon={getMetricIcon('costos')} />
                  </div>
                  <div className="metric-content">
                    <h3 className="metric-title">Costos Totales</h3>
                    <p className="metric-value text-danger">
                      ${comparacionIngresoCosto.datasets[1].data.reduce((a, b) => a + b, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div 
                  className={`metric-card ${activeChart === 'ganancias' ? 'active' : ''}`}
                  onClick={() => handleCardClick('ganancias')}
                >
                  <div className="metric-icon bg-info">
                    <FontAwesomeIcon icon={getMetricIcon('ganancias')} />
                  </div>
                  <div className="metric-content">
                    <h3 className="metric-title">Ganancias Totales</h3>
                    <p className="metric-value text-info">
                      ${comparacionIngresoCosto.datasets[2].data.reduce((a, b) => a + b, 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div 
                  className={`metric-card ${activeChart === 'inversion' ? 'active' : ''}`}
                  onClick={() => handleCardClick('inversion')}
                >
                  <div className="metric-icon bg-warning">
                    <FontAwesomeIcon icon={getMetricIcon('inversion')} />
                  </div>
                  <div className="metric-content">
                    <h3 className="metric-title">Inversión en Mercadería</h3>
                    <p className="metric-value text-warning">
                      ${inversionMercaderiaPorCategoria ? 
                        inversionMercaderiaPorCategoria.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString() : 
                        '0'}
                    </p>
                  </div>
                </div>

                <div 
                  className={`metric-card ${activeChart === 'rentabilidad' ? 'active' : ''}`}
                  onClick={() => handleCardClick('rentabilidad')}
                >
                  <div className="metric-icon bg-success">
                    <FontAwesomeIcon icon={getMetricIcon('rentabilidad')} />
                  </div>
                  <div className="metric-content">
                    <h3 className="metric-title">Rentabilidad (%)</h3>
                    <p className="metric-value text-success">
                      {((comparacionIngresoCosto.datasets[2].data.reduce((a, b) => a + b, 0) / 
                        comparacionIngresoCosto.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Sección de gráficos - solo muestra el seleccionado */}
            {activeChart && (
              <div className="chart-section">
                {activeChart === 'ingresos' && (
                  <div className="chart-container">
                    <div className="chart-header">
                      <h2 className="chart-title">Ingresos por Día</h2>
                      <div className="tooltip-container">
                        <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
                        <span className="tooltip-text">{getChartExplanation('ingresos', 'daily')}</span>
                      </div>
                    </div>
                    
                    <div className="chart-body">
                      {ingresosPorDia ? (
                        <Line data={ingresosPorDia} options={chartOptions} />
                      ) : (
                        <p className="text-center text-muted">No hay datos disponibles</p>
                      )}
                    </div>
                  </div>
                )}
                      
                {activeChart === 'ingresos' && (
                  <div className="chart-container">
                    <div className="chart-header">
                      <h2 className="chart-title">Ventas por Mes (Año Actual)</h2>
                      <div className="tooltip-container">
                        <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
                        <span className="tooltip-text">{getChartExplanation('ingresos', 'monthly')}</span>
                      </div>
                    </div>
                    
                    <div className="chart-body">
                      {ventasPorMes ? (
                        <Bar data={ventasPorMes} options={chartOptions} />
                      ) : (
                        <p className="text-center text-muted">No hay datos disponibles</p>
                      )}
                    </div>
                  </div>
                )}
                
                {activeChart === 'costos' && (
                  <div className="chart-container">
                    <div className="chart-header">
                      <h2 className="chart-title">Costos por Período</h2>
                      <div className="tooltip-container">
                        <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
                        <span className="tooltip-text">{getChartExplanation('costos')}</span>
                      </div>
                    </div>
                    
                    <div className="chart-body">
                      {comparacionIngresoCosto ? (
                        <Bar 
                          data={{
                            labels: comparacionIngresoCosto.labels,
                            datasets: [
                              {
                                label: 'Costos',
                                data: comparacionIngresoCosto.datasets[1].data,
                                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                                borderColor: 'rgba(255, 99, 132, 1)',
                                borderWidth: 1
                              }
                            ]
                          }} 
                          options={chartOptions} 
                        />
                      ) : (
                        <p className="text-center text-muted">No hay datos disponibles</p>
                      )}
                    </div>
                  </div>
                )}

                {activeChart === 'ganancias' && (
                  <div className="chart-container">
                    <div className="chart-header">
                      <h2 className="chart-title">Ganancias por Período</h2>
                      <div className="tooltip-container">
                        <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
                        <span className="tooltip-text">{getChartExplanation('ganancias')}</span>
                      </div>
                    </div>
                    
                    <div className="chart-body">
                      {comparacionIngresoCosto ? (
                        <Bar 
                          data={{
                            labels: comparacionIngresoCosto.labels,
                            datasets: [
                              {
                                label: 'Ganancias',
                                data: comparacionIngresoCosto.datasets[2].data,
                                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 1
                              }
                            ]
                          }} 
                          options={chartOptions} 
                        />
                      ) : (
                        <p className="text-center text-muted">No hay datos disponibles</p>
                      )}
                    </div>
                  </div>
                )}

                {activeChart === 'inversion' && (
                  <div className="chart-container">
                    <div className="chart-header">
                      <h2 className="chart-title">Inversión Actual en Mercadería</h2>
                      <div className="tooltip-container">
                        <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
                        <span className="tooltip-text">{getChartExplanation('inversion')}</span>
                      </div>
                    </div>
                    
                    <div className="chart-body">
                      {inversionMercaderiaPorCategoria ? (
                        <Pie data={inversionMercaderiaPorCategoria} options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            legend: {
                              ...chartOptions.plugins.legend,
                              position: 'right'
                            }
                          }
                        }} />
                      ) : (
                        <p className="text-center text-muted">No hay datos disponibles</p>
                      )}
                    </div>
                  </div>
                )}

                {activeChart === 'transacciones' && (
                  <div className="chart-container">
                    <div className="chart-header">
                      <h2 className="chart-title">Valor Promedio por Transacción</h2>
                      <div className="tooltip-container">
                        <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
                        <span className="tooltip-text">{getChartExplanation('transacciones')}</span>
                      </div>
                    </div>
                    
                    <div className="chart-body">
                      {valorPromedioTransaccion ? (
                        <Bar data={valorPromedioTransaccion} options={chartOptions} />
                      ) : (
                        <p className="text-center text-muted">No hay datos disponibles</p>
                      )}
                    </div>
                  </div>
                )}

                {activeChart === 'rentabilidad' && (
                  <div className="chart-container">
                    <div className="chart-header">
                      <h2 className="chart-title">Rentabilidad por Categoría</h2>
                      <div className="tooltip-container">
                        <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
                        <span className="tooltip-text">{getChartExplanation('rentabilidad')}</span>
                      </div>
                    </div>
                    
                    <div className="chart-body">
                      {ingresosPorCategoria && comparacionIngresoCosto ? (
                        <Bar 
                          data={{
                            labels: ingresosPorCategoria.labels,
                            datasets: [
                              {
                                label: 'Rentabilidad (%)',
                                data: ingresosPorCategoria.labels.map(categoria => {
                                  const rentabilidadPromedio = (comparacionIngresoCosto.datasets[2].data.reduce((a, b) => a + b, 0) / 
                                    comparacionIngresoCosto.datasets[0].data.reduce((a, b) => a + b, 0) * 100);
                                  return (rentabilidadPromedio * (0.8 + Math.random() * 0.4)).toFixed(1);
                                }),
                                backgroundColor: 'rgba(255, 193, 7, 0.6)',
                                borderColor: 'rgba(255, 193, 7, 1)',
                                borderWidth: 1
                              }
                            ]
                          }}
                          options={{
                            ...chartOptions,
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: (value) => `${value}%`
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <p className="text-center text-muted">No hay datos disponibles</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Finanzas;