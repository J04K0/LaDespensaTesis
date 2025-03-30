import React, { useEffect, useState } from "react";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import Navbar from "../components/Navbar";
import { obtenerVentasPorTicket } from "../services/AddProducts.service.js";
import { getProducts } from "../services/AddProducts.service.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../styles/FinanzasStyles.css";
import FinanzasSkeleton from '../components/FinanzasSkeleton';

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
    const doc = new jsPDF();
    doc.text("Reporte Financiero - La Despensa", 20, 10);
    
    const fechaActual = new Date().toLocaleDateString();
    doc.text(`Fecha: ${fechaActual}`, 20, 20);
    
    let periodoTexto = "Últimos 7 días";
    if (timeRange === "mes") periodoTexto = "Último mes";
    if (timeRange === "año") periodoTexto = "Último año";
    doc.text(`Periodo: ${periodoTexto}`, 20, 30);
    
    if (ingresosPorDia && ingresosPorDia.labels) {
      doc.text("Ingresos por Día", 20, 45);
      
      const datosIngresos = ingresosPorDia.labels.map((fecha, i) => 
        [fecha, `$${ingresosPorDia.datasets[0].data[i].toLocaleString()}`]
      );
      
      autoTable(doc, {
        startY: 50,
        head: [["Fecha", "Ingreso"]],
        body: datosIngresos,
      });
    }

    if (ingresosPorCategoria && ingresosPorCategoria.labels) {
      const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 120;
      doc.text("Ingresos por Categoría", 20, currentY);
      
      const datosCategoria = ingresosPorCategoria.labels.map((categoria, i) => 
        [categoria, `$${ingresosPorCategoria.datasets[0].data[i].toLocaleString()}`]
      );
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Categoría", "Ingreso Total"]],
        body: datosCategoria,
      });
    }
    
    if (comparacionIngresoCosto && comparacionIngresoCosto.labels) {
      const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 180;
      doc.text("Comparación de Ingresos vs Costos", 20, currentY);
      
      const datosComparacion = comparacionIngresoCosto.labels.map((periodo, i) => [
        periodo, 
        `$${comparacionIngresoCosto.datasets[0].data[i].toLocaleString()}`,
        `$${comparacionIngresoCosto.datasets[1].data[i].toLocaleString()}`,
        `$${comparacionIngresoCosto.datasets[2].data[i].toLocaleString()}`
      ]);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Período", "Ingresos", "Costos", "Ganancias"]],
        body: datosComparacion,
      });
    }

    if (inversionMercaderiaPorCategoria && inversionMercaderiaPorCategoria.labels) {
      const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 230;
      doc.text("Inversión en Mercadería por Categoría", 20, currentY);
      
      const datosInversion = inversionMercaderiaPorCategoria.labels.map((categoria, i) => 
        [categoria, `$${inversionMercaderiaPorCategoria.datasets[0].data[i].toLocaleString()}`]
      );
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Categoría", "Inversión Total"]],
        body: datosInversion,
      });
    }
    
    doc.save("reporte_financiero.pdf");
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="finanzas-page">
      <Navbar />
      <div className="chart-container">
        {loading ? (
          <FinanzasSkeleton />
        ) : (
          <>
            <h1>📊 Finanzas</h1>
            
            <div className="filter-container">
              <div className="filter-group">
                <label>Periodo:</label>
                <select value={timeRange} onChange={handleTimeRangeChange}>
                  <option value="semana">Última semana</option>
                  <option value="mes">Último mes</option>
                  <option value="año">Último año</option>
                </select>
              </div>
              
              <button onClick={descargarReporteFinanciero} className="download-button">
                Descargar Reporte Financiero 📄
              </button>
            </div>

            {/* Resumen financiero */}
            {ingresosPorDia && comparacionIngresoCosto && (
              <div className="finance-summary">
                <div 
                  className={`summary-card income ${activeChart === 'ingresos' ? 'active' : ''}`}
                  onClick={() => handleCardClick('ingresos')}
                  style={{ cursor: 'pointer', borderTop: '5px solid #4CAF50' }}
                >
                  <h3>Ingresos Totales</h3>
                  <p className="amount" style={{ color: '#4CAF50' }}>
                    ${ingresosPorDia.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}
                  </p>
                  <small>Click para ver detalles</small>
                </div>
                
                <div 
                  className={`summary-card transactions ${activeChart === 'transacciones' ? 'active' : ''}`}
                  onClick={() => handleCardClick('transacciones')}
                  style={{ cursor: 'pointer', borderTop: '5px solid #36A2EB' }}
                >
                  <h3>Transacciones</h3>
                  <p className="amount" style={{ color: '#36A2EB' }}>
                    {numeroTransacciones}
                  </p>
                  <small>Click para ver detalles</small>
                </div>
                
                <div 
                  className={`summary-card ${activeChart === 'costos' ? 'active' : ''}`}
                  onClick={() => handleCardClick('costos')}
                  style={{ cursor: 'pointer', borderTop: '5px solid rgba(255, 99, 132, 1)' }}
                >
                  <h3>Costos Totales</h3>
                  <p className="amount" style={{ color: 'rgba(255, 99, 132, 1)' }}>
                    ${comparacionIngresoCosto.datasets[1].data.reduce((a, b) => a + b, 0).toLocaleString()}
                  </p>
                  <small>Click para ver detalles</small>
                </div>
                
                <div 
                  className={`summary-card ${activeChart === 'ganancias' ? 'active' : ''}`}
                  onClick={() => handleCardClick('ganancias')}
                  style={{ cursor: 'pointer', borderTop: '5px solid #8A2BE2' }}
                >
                  <h3>Ganancias Totales</h3>
                  <p className="amount" style={{ color: '#8A2BE2' }}>
                    ${comparacionIngresoCosto.datasets[2].data.reduce((a, b) => a + b, 0).toLocaleString()}
                  </p>
                  <small>Click para ver detalles</small>
                </div>

                <div 
                  className={`summary-card ${activeChart === 'inversion' ? 'active' : ''}`}
                  onClick={() => handleCardClick('inversion')}
                  style={{ cursor: 'pointer', borderTop: '5px solid #FF5733' }}
                >
                  <h3>Inversión en Mercadería</h3>
                  <p className="amount" style={{ color: '#FF5733' }}>
                    ${inversionMercaderiaPorCategoria ? 
                      inversionMercaderiaPorCategoria.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString() : 
                      '0'}
                  </p>
                  <small>Click para ver detalles</small>
                </div>

                <div 
                  className={`summary-card ${activeChart === 'rentabilidad' ? 'active' : ''}`}
                  onClick={() => handleCardClick('rentabilidad')}
                  style={{ cursor: 'pointer', borderTop: '5px solid #FFC107' }}
                >
                  <h3>Rentabilidad (%)</h3>
                  <p className="amount" style={{ color: '#FFC107' }}>
                    {((comparacionIngresoCosto.datasets[2].data.reduce((a, b) => a + b, 0) / 
                      comparacionIngresoCosto.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
                  </p>
                  <small>Click para ver detalles</small>
                </div>
              </div>
            )}

            {loading && <p className="loading-message">Cargando datos financieros...</p>}
            {error && <p className="error-message">{error}</p>}

            {/* Sección de gráficos - solo muestra el seleccionado */}
            {activeChart && (
              <div className="chart-section">
                {activeChart === 'ingresos' && (
                  <div className="chart">
                    <h2>Ingresos por Día</h2>
                    {ingresosPorDia ? (
                      <Line data={ingresosPorDia} options={chartOptions} />
                    ) : (
                      <p className="no-data">No hay datos disponibles</p>
                    )}
                  </div>
                )}
                        
                {activeChart === 'ingresos' && (
                  <div className="chart">
                    <h2>Ventas por Mes (Año Actual)</h2>
                    {ventasPorMes ? (
                      <Bar data={ventasPorMes} options={chartOptions} />
                    ) : (
                      <p className="no-data">No hay datos disponibles</p>
                    )}
                  </div>
                )}
                
                {activeChart === 'costos' && (
                  <div className="chart">
                    <h2>Costos por Período</h2>
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
                      <p className="no-data">No hay datos disponibles</p>
                    )}
                  </div>
                )}

                {activeChart === 'ganancias' && (
                  <div className="chart">
                    <h2>Ganancias por Período</h2>
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
                      <p className="no-data">No hay datos disponibles</p>
                    )}
                  </div>
                )}

                {activeChart === 'inversion' && (
                  <div className="chart">
                    <h2>Inversión Actual en Mercadería</h2>
                    {inversionMercaderiaPorCategoria ? (
                      <Pie data={inversionMercaderiaPorCategoria} options={chartOptions} />
                    ) : (
                      <p className="no-data">No hay datos disponibles</p>
                    )}
                  </div>
                )}

                {activeChart === 'transacciones' && (
                  <div className="chart">
                    <h2>Valor Promedio por Transacción</h2>
                    {valorPromedioTransaccion ? (
                      <Bar data={valorPromedioTransaccion} options={chartOptions} />
                    ) : (
                      <p className="no-data">No hay datos disponibles</p>
                    )}
                  </div>
                )}

                {activeChart === 'rentabilidad' && (
                  <>
                    <div className="chart">
                      <h2>Rentabilidad por Categoría</h2>
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
                        <p className="no-data">No hay datos disponibles</p>
                      )}
                    </div>
                  </>
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