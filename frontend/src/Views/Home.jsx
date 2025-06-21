import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getProducts } from '../services/AddProducts.service.js';
import { getDeudores } from '../services/deudores.service.js';
import { obtenerVentasPorTicket } from '../services/venta.service.js';
import axios from '../services/root.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxes, faUsers, faShoppingCart, faMoneyBillWave, faArrowRight, faArrowLeft, faPlus, faEye, faCalendarAlt, faChartLine, faExclamationTriangle, faUser, faStar, faChartPie, faSpinner, faFilePdf, faDownload, faFileExport } from '@fortawesome/free-solid-svg-icons';
import '../styles/HomeStyles.css';
import DeudoresTableSkeleton from '../components/Skeleton/DeudoresTableSkeleton';
import ChartSkeleton from '../components/Skeleton/ChartSkeleton';
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useVentas } from '../context/VentasContext';
import { ExportService } from '../services/export.service';
import { DataCollectionService } from '../services/dataCollection.service';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../helpers/swaHelper';
import { useRole } from '../hooks/useRole';

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  DoughnutController,
  PieController,
  Title, 
  Tooltip, 
  Legend, 
  PointElement 
} from "chart.js";

import { Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  DoughnutController,
  PieController,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const Home = () => {
  const [deudores, setDeudores] = useState([]);
  const navigate = useNavigate();
  
  const [ventasPorProducto, setVentasPorProducto] = useState(null);
  const [ventasPorCategoria, setVentasPorCategoria] = useState(null);
  const [topProductos, setTopProductos] = useState(null);
  const [productosPocoVendidos, setProductosPocoVendidos] = useState(null);
  const [currentChart, setCurrentChart] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingMassive, setIsDownloadingMassive] = useState(false);
  // Nuevo estado para el filtro temporal
  const [timeRange, setTimeRange] = useState("todo"); // Opciones: "semana", "mes", "año", "todo"

  // Referencia al contenedor del gráfico
  const chartRef = useRef(null);

  // 🧠 USAR CONTEXTO DE VENTAS CON USEMEMO PARA OPTIMIZAR ESTADÍSTICAS
  const { ventasGlobales, loading: ventasLoading, getVentasByDateRange } = useVentas();
  const { userRole: role } = useRole();

  // 🔍 DEBUGGING: Agregar logs para verificar el rol
  // console.log('🔍 Rol detectado en Home:', role);
  // console.log('🔍 ¿Es empleado?:', role === 'empleado');

  useEffect(() => {
    const fetchDeudores = async () => {
      try {
        // Obtener todos los deudores disponibles
        const data = await getDeudores(1, 1000); // Un número grande para traer todos los disponibles
        
        // Separar deudores con y sin deuda
        const deudoresConDeuda = data.deudores.filter(deudor => {
          const deudaValue = parseFloat(deudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
          return deudaValue > 0;
        });
        
        const deudoresSinDeuda = data.deudores.filter(deudor => {
          const deudaValue = parseFloat(deudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
          return deudaValue === 0;
        });
        
        // Ordenar cada grupo por nombre
        const deudoresConDeudaOrdenados = [...deudoresConDeuda].sort((a, b) => 
          a.Nombre.localeCompare(b.Nombre)
        );
        
        const deudoresSinDeudaOrdenados = [...deudoresSinDeuda].sort((a, b) => 
          a.Nombre.localeCompare(b.Nombre)
        );
        
        // Mostrar más deudores para que el panel sea más grande
        // Ahora mostraremos al menos 15 deudores en total o más si hay suficientes con deuda
        const minDeudoresTotales = 12;
        
        // Si hay suficientes deudores con deuda, mostrar todos ellos
        let deudoresFinales = [...deudoresConDeudaOrdenados];
        
        // Si necesitamos más deudores para llenar el panel, añadir deudores sin deuda
        if (deudoresFinales.length < minDeudoresTotales) {
          const espacioDisponible = minDeudoresTotales - deudoresFinales.length;
          deudoresFinales = [
            ...deudoresFinales,
            ...deudoresSinDeudaOrdenados.slice(0, espacioDisponible)
          ];
        }
        
        setDeudores(deudoresFinales);
      } catch (error) {
        console.error('Error fetching deudores:', error);
      }
    };

    fetchDeudores();
    obtenerVentas();
  }, []);

  // Efecto para recargar los datos cuando cambia el filtro de tiempo
  useEffect(() => {
    if (!loading) {
      obtenerVentas();
    }
  }, [timeRange]);

  const obtenerVentas = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/ventas/ventas/obtener");
      const todasLasVentas = response.data.data;

      if (todasLasVentas && todasLasVentas.length > 0) {
        // Filtrar las ventas según el período seleccionado
        const ventasFiltradas = filtrarVentasPorPeriodo(todasLasVentas);
        procesarDatos(ventasFiltradas);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener las ventas:", error);
      setError("Error al obtener los datos de ventas.");
      setLoading(false);
    }
  };

  // Función para filtrar ventas según el período seleccionado
  const filtrarVentasPorPeriodo = (ventas) => {
    if (timeRange === "todo") {
      return ventas; // Devolver todas las ventas sin filtrar
    }

    const fechaActual = new Date();
    const fechaInicio = new Date();
    
    // Configurar la fecha de inicio según el período seleccionado
    if (timeRange === "semana") {
      fechaInicio.setDate(fechaActual.getDate() - 7);
    } else if (timeRange === "mes") {
      fechaInicio.setMonth(fechaActual.getMonth() - 1);
    } else if (timeRange === "año") {
      fechaInicio.setFullYear(fechaActual.getFullYear() - 1);
    }

    // Filtrar ventas que estén dentro del rango de fechas
    return ventas.filter(venta => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= fechaInicio && fechaVenta <= fechaActual;
    });
  };

  const procesarDatos = (ventas) => {
    // Procesar ventas por categoría
    const categorias = {};
    ventas.forEach(({ categoria, cantidad }) => {
      categorias[categoria] = (categorias[categoria] || 0) + cantidad;
    });

    setVentasPorCategoria({
      labels: Object.keys(categorias),
      datasets: [
        {
          label: "Ventas por Categoría",
          data: Object.values(categorias),
          backgroundColor: [
            "#4F86C6", // Azul
            "#6A5ACD", // Slate blue
            "#20B2AA", // Verde azulado
            "#FF6B6B", // Coral
            "#FFD166", // Amarillo
            "#9A8C98", // Morado grisáceo
            "#06D6A0", // Turquesa
            "#EF476F", // Rosa
            "#118AB2", // Azul oscuro
            "#FF9F1C"  // Naranja
          ],
          borderColor: "#fff",
          borderWidth: 1
        },
      ],
    });

    // Procesar top 5 productos
    const productos = {};
    ventas.forEach(({ nombre, cantidad }) => {
      productos[nombre] = (productos[nombre] || 0) + cantidad;
    });

    const topProductosOrdenados = Object.entries(productos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    setTopProductos({
      labels: topProductosOrdenados.map(([nombre]) => nombre),
      datasets: [
        {
          label: "Top 5 Productos Más Vendidos",
          data: topProductosOrdenados.map(([, cantidad]) => cantidad),
          backgroundColor: [
            "#118AB2", // Azul
            "#06D6A0", // Turquesa
            "#FFD166", // Amarillo
            "#EF476F", // Rosa
            "#4F86C6"  // Azul claro
          ],
          borderColor: "#fff",
          borderWidth: 1
        },
      ],
    });

    // Procesar productos menos vendidos
    procesarProductosPocoVendidos(productos);
  };

  const procesarProductosPocoVendidos = (productos) => {
    // Filtrar productos con al menos una venta
    const productosConVentas = Object.entries(productos).filter(([_, cantidad]) => cantidad > 0);
    
    // Ordenar por cantidad ascendente y tomar los 5 con menos ventas
    const productosOrdenados = productosConVentas
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5);
    
    setProductosPocoVendidos({
      labels: productosOrdenados.map(([nombre]) => nombre),
      datasets: [
        {
          label: "Productos Menos Vendidos",
          data: productosOrdenados.map(([, cantidad]) => cantidad),
          backgroundColor: [
            "#9A8C98", // Morado grisáceo
            "#C9ADA7", // Beige rosado
            "#F4A261", // Naranja suave
            "#E9C46A", // Amarillo mostaza
            "#2A9D8F"  // Verde azulado
          ],
          borderColor: "#fff",
          borderWidth: 1
        },
      ],
    });
  };

  const nextChart = () => {
    setCurrentChart((prevChart) => (prevChart + 1) % 3);
  };

  const prevChart = () => {
    setCurrentChart((prevChart) => (prevChart - 1 + 3) % 3);
  };

  const handleViewAllClick = () => {
    navigate('/deudores');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.formattedValue;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: (value, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return percentage > 5 ? `${percentage}%` : '';
        }
      },
      // Mantener un tamaño consistente independientemente de la cantidad de datos
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20
        }
      },
      // Asegurar que el gráfico siempre ocupe todo el espacio disponible
      aspectRatio: 1
    },
  };

  // Función para descargar todos los gráficos como PDF
  const downloadAllChartsAsPDF = async () => {
    try {
      // Activar estado de descarga
      setIsDownloading(true);
      
      // Pequeña demora inicial para que el spinner se muestre
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Crear un nuevo documento PDF utilizando la importación correcta
      const doc = new jsPDF();
      
      // Título principal y fecha del reporte
      const currentDate = new Date().toLocaleDateString();
      
      doc.setFontSize(20);
      doc.setTextColor(0, 38, 81); // Color primario oscuro
      doc.text("La Despensa - Reporte Completo de Gráficos", 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(108, 117, 125); // Color gris
      doc.text(`Fecha de generación: ${currentDate}`, 20, 30);
      
      // Configuración común para todas las tablas
      const cellPadding = 5;
      const cellHeight = 12;
      const col1Width = 100;
      const col2Width = 40;
      
      // Variables para controlar la posición en el PDF
      let pdfYPosition = 40;
      let currentPage = 1;
      
      // Función para añadir un gráfico y su tabla correspondiente
      const addChartDataToPdf = (title, data, colorHex) => {
        // Verificar si queda suficiente espacio en la página actual
        if (pdfYPosition > 220) {
          // Añadir pie de página a la página actual
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text(`La Despensa - Página ${currentPage}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
          
          // Crear nueva página
          doc.addPage();
          currentPage++;
          pdfYPosition = 20; // Reiniciar posición en Y
        }
        
        // Título del gráfico
        doc.setFontSize(16);
        doc.setTextColor(0, 110, 223); // Color primario
        doc.text(title, 20, pdfYPosition);
        pdfYPosition += 10;
        
        if (data && data.labels && data.datasets) {
          const tableData = [];
          
          // Preparar los datos para la tabla
          data.labels.forEach((label, index) => {
            if (label && data.datasets[0] && data.datasets[0].data) {
              tableData.push([label, data.datasets[0].data[index].toString()]);
            }
          });
          
          if (tableData.length > 0) {
            // Dibujar encabezado de la tabla
            doc.setFillColor(0, 110, 223); // Convertir hex a RGB
            doc.setDrawColor(0, 110, 223);
            doc.setTextColor(255, 255, 255);
            doc.rect(20, pdfYPosition, col1Width + col2Width, cellHeight, 'F');
            doc.setFontSize(12);
            doc.text("Item", 20 + cellPadding, pdfYPosition + cellHeight - cellPadding);
            doc.text("Cantidad", 20 + col1Width + cellPadding, pdfYPosition + cellHeight - cellPadding);
            pdfYPosition += cellHeight;
            
            // Dibujar filas de datos
            doc.setTextColor(50, 50, 50);
            tableData.forEach((row, i) => {
              // Alternar colores de fondo para las filas
              if (i % 2 === 0) {
                doc.setFillColor(245, 248, 250);
                doc.rect(20, pdfYPosition, col1Width + col2Width, cellHeight, 'F');
              } else {
                doc.setFillColor(255, 255, 255);
                doc.rect(20, pdfYPosition, col1Width + col2Width, cellHeight, 'F');
              }
              
              // Dibujar borde
              doc.setDrawColor(220, 220, 220);
              doc.rect(20, pdfYPosition, col1Width + col2Width, cellHeight);
              
              // Añadir texto
              doc.text(row[0], 20 + cellPadding, pdfYPosition + cellHeight - cellPadding);
              doc.text(row[1], 20 + col1Width + cellPadding, pdfYPosition + cellHeight - cellPadding);
              
              pdfYPosition += cellHeight;
            });
            
            // Espacio después de la tabla
            pdfYPosition += 20;
          }
        }
      };
      
      // Añadir datos de los tres gráficos al PDF
      addChartDataToPdf("Top 5 Productos Más Vendidos", topProductos, "#118AB2");
      
      // Forzar actualización de renderizado para mostrar el spinner
      await new Promise(resolve => setTimeout(resolve, 300));
      
      addChartDataToPdf("Ventas por Categoría", ventasPorCategoria, "#4F86C6");
      
      // Forzar actualización de renderizado para mostrar el spinner
      await new Promise(resolve => setTimeout(resolve, 300));
      
      addChartDataToPdf("Productos Menos Vendidos", productosPocoVendidos, "#9A8C98");
      
      // Añadir pie de página a la última página
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`La Despensa - Página ${currentPage}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Forzar actualización de renderizado para mostrar el spinner
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Guardar el PDF
      const formattedDate = currentDate.replace(/\//g, '-');
      doc.save(`La_Despensa_Reporte_Completo_${formattedDate}.pdf`);
      
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert("No se pudo generar el PDF. Por favor, intenta nuevamente.");
    } finally {
      // Desactivar estado de descarga después de un pequeño retraso
      // para asegurar que el usuario vea el indicador de carga
      setTimeout(() => {
        setIsDownloading(false);
      }, 500);
    }
  };

  // Obtener el título del gráfico current
  const getCurrentChartTitle = () => {
    switch (currentChart) {
      case 0:
        return "Top 5 Productos Más Vendidos";
      case 1:
        return "Ventas por Categoría";
      case 2:
        return "Productos Menos Vendidos";
      default:
        return "Reporte de Gráfico";
    }
  };
  
  // Obtener los datos del gráfico current
  const getCurrentChartData = () => {
    switch (currentChart) {
      case 0:
        return topProductos;
      case 1:
        return ventasPorCategoria;
      case 2:
        return productosPocoVendidos;
      default:
        return null;
    }
  };

  const renderCurrentChart = () => {
    if (loading) return <p>Cargando datos...</p>;
    if (error) return <p className="error">{error}</p>;

    switch (currentChart) {
      case 0:
        return topProductos ? (
          <div className="chart-wrapper">
            <h2><FontAwesomeIcon icon={faStar} style={{marginRight: '10px'}}/> Top 5 Productos Más Vendidos</h2>
            
            <div className="chart-content-wrapper">
              <div className="chart-visual-container">
                {/* Leyenda del gráfico */}
                <div className="chart-legend">
                  {topProductos.labels.map((label, index) => (
                    <div key={index} className="legend-item">
                      <span className="color-indicator" style={{backgroundColor: topProductos.datasets[0].backgroundColor[index]}}></span>
                      <span className="legend-label">{label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Área del gráfico */}
                <div className="chart-area">
                  <Doughnut data={topProductos} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false
                      }
                    }
                  }} />
                </div>
              </div>
              
              {/* Tabla de datos */}
              <div className="chart-table-container">
                <h3>Detalles de Ventas</h3>
                <table className="chart-data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Unidades Vendidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProductos.labels.map((label, index) => (
                      <tr key={index}>
                        <td>{label}</td>
                        <td>{topProductos.datasets[0].data[index]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p>No hay datos disponibles</p>
        );
      case 1:
        return ventasPorCategoria ? (
          <div className="chart-wrapper">
            <h2><FontAwesomeIcon icon={faChartPie} style={{marginRight: '10px'}}/> Ventas por Categoría</h2>
            
            <div className="chart-content-wrapper">
              <div className="chart-visual-container">
                {/* Leyenda del gráfico */}
                <div className="chart-legend">
                  {ventasPorCategoria.labels.map((label, index) => (
                    <div key={index} className="legend-item">
                      <span className="color-indicator" style={{backgroundColor: ventasPorCategoria.datasets[0].backgroundColor[index]}}></span>
                      <span className="legend-label">{label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Área del gráfico */}
                <div className="chart-area">
                  <Pie data={ventasPorCategoria} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false
                      }
                    }
                  }} />
                </div>
              </div>
              
              {/* Tabla de datos */}
              <div className="chart-table-container">
                <h3>Detalles por Categoría</h3>
                <table className="chart-data-table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Unidades Vendidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasPorCategoria.labels.map((label, index) => (
                      <tr key={index}>
                        <td>{label}</td>
                        <td>{ventasPorCategoria.datasets[0].data[index]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p>No hay datos disponibles</p>
        );
      case 2:
        return productosPocoVendidos ? (
          <div className="chart-wrapper">
            <h2><FontAwesomeIcon icon={faChartPie} style={{marginRight: '10px'}}/> Productos Menos Vendidos</h2>
            
            <div className="chart-content-wrapper">
              <div className="chart-visual-container">
                {/* Leyenda del gráfico */}
                <div className="chart-legend">
                  {productosPocoVendidos.labels.map((label, index) => (
                    <div key={index} className="legend-item">
                      <span className="color-indicator" style={{backgroundColor: productosPocoVendidos.datasets[0].backgroundColor[index]}}></span>
                      <span className="legend-label">{label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Área del gráfico */}
                <div className="chart-area">
                  <Doughnut data={productosPocoVendidos} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false
                      }
                    }
                  }} />
                </div>
              </div>
              
              {/* Tabla de datos */}
              <div className="chart-table-container">
                <h3>Productos con Menor Rotación</h3>
                <table className="chart-data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Unidades Vendidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosPocoVendidos.labels.map((label, index) => (
                      <tr key={index}>
                        <td>{label}</td>
                        <td>{productosPocoVendidos.datasets[0].data[index]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p>No hay datos disponibles</p>
        );
      default:
        return <p>No hay datos disponibles</p>;
    }
  };

  // 🚀 OPTIMIZACIÓN: Usar useMemo para calcular estadísticas cuando ya están cargadas las ventas
  const datosEstadisticasOptimized = useMemo(() => {
    if (!ventasGlobales || ventasGlobales.length === 0) {
      return {
        ventasPorCategoria: null,
        topProductos: null,
        productosPocoVendidos: null
      };
    }

    // Filtrar ventas por rango de tiempo usando el cache global
    const ventasFiltradas = filtrarVentasPorPeriodo(ventasGlobales);
    
    // Procesar ventas por categoría
    const categorias = {};
    ventasFiltradas.forEach((venta) => {
      // Manejar tanto el formato de venta individual como array de productos
      if (venta.ventas && Array.isArray(venta.ventas)) {
        // Formato de ticket con múltiples productos
        venta.ventas.forEach(producto => {
          const categoria = producto.categoria || "Sin categoría";
          categorias[categoria] = (categorias[categoria] || 0) + producto.cantidad;
        });
      } else {
        // Formato de venta individual
        const categoria = venta.categoria || "Sin categoría";
        categorias[categoria] = (categorias[categoria] || 0) + venta.cantidad;
      }
    });

    const ventasPorCategoria = {
      labels: Object.keys(categorias),
      datasets: [
        {
          label: "Ventas por Categoría",
          data: Object.values(categorias),
          backgroundColor: [
            "#4F86C6", "#6A5ACD", "#20B2AA", "#FF6B6B", "#FFD166",
            "#9A8C98", "#06D6A0", "#EF476F", "#118AB2", "#FF9F1C"
          ],
          borderColor: "#fff",
          borderWidth: 1
        },
      ],
    };

    // Procesar top 5 productos
    const productos = {};
    ventasFiltradas.forEach((venta) => {
      if (venta.ventas && Array.isArray(venta.ventas)) {
        venta.ventas.forEach(producto => {
          const nombre = producto.nombre;
          productos[nombre] = (productos[nombre] || 0) + producto.cantidad;
        });
      } else {
        const nombre = venta.nombre;
        productos[nombre] = (productos[nombre] || 0) + venta.cantidad;
      }
    });

    const topProductosOrdenados = Object.entries(productos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topProductos = {
      labels: topProductosOrdenados.map(([nombre]) => nombre),
      datasets: [
        {
          label: "Top 5 Productos Más Vendidos",
          data: topProductosOrdenados.map(([, cantidad]) => cantidad),
          backgroundColor: [
            "#118AB2", "#06D6A0", "#FFD166", "#EF476F", "#4F86C6"
          ],
          borderColor: "#fff",
          borderWidth: 1
        },
      ],
    };

    // Procesar productos menos vendidos
    const productosConVentas = Object.entries(productos).filter(([_, cantidad]) => cantidad > 0);
    const productosOrdenados = productosConVentas
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5);
    
    const productosPocoVendidos = {
      labels: productosOrdenados.map(([nombre]) => nombre),
      datasets: [
        {
          label: "Productos Menos Vendidos",
          data: productosOrdenados.map(([, cantidad]) => cantidad),
          backgroundColor: [
            "#9A8C98", "#C9ADA7", "#F4A261", "#E9C46A", "#2A9D8F"
          ],
          borderColor: "#fff",
          borderWidth: 1
        },
      ],
    };

    return {
      ventasPorCategoria,
      topProductos,
      productosPocoVendidos
    };
  }, [ventasGlobales, timeRange]);

  // Actualizar estados cuando cambien las estadísticas optimizadas
  useEffect(() => {
    if (ventasGlobales && datosEstadisticasOptimized.ventasPorCategoria) {
      setVentasPorCategoria(datosEstadisticasOptimized.ventasPorCategoria);
      setTopProductos(datosEstadisticasOptimized.topProductos);
      setProductosPocoVendidos(datosEstadisticasOptimized.productosPocoVendidos);
      setLoading(false);
    }
  }, [datosEstadisticasOptimized, ventasGlobales]);

  // Función helper para formatear números con punto como separador de miles
  const formatNumberWithDots = (number) => {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <div className="home-container">
      <Navbar />
      <div className={role === 'empleado' ? 'home-content-employee' : 'home-content'}>
        <div className={role === 'empleado' ? 'home-deudores-container-centered' : 'home-deudores-container'}>
          {loading ? (
            <DeudoresTableSkeleton />
          ) : (
            <div className={role === 'empleado' ? 'home-deudores-card-centered' : 'home-deudores-card'}>
              <div className={role === 'empleado' ? 'home-deudores-header-centered' : 'home-deudores-header'}>
                <h3>Personas deudoras</h3>
                <button onClick={handleViewAllClick}>Ver todos</button>
              </div>
              <div className={role === 'empleado' ? 'home-deudores-table-container-centered' : 'home-deudores-table-container'}>
                <table className={role === 'empleado' ? 'home-deudores-table-centered' : 'home-deudores-table'}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Deuda total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deudores.map((deudor, index) => {
                      const deudaValue = parseFloat(deudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
                      const isZeroDebt = deudaValue === 0;
                      
                      return (
                        <tr key={index} className={isZeroDebt ? 'zero-debt-row' : ''}>
                          <td><FontAwesomeIcon icon={faUser} /> {deudor.Nombre || 'Nombre desconocido'}</td>
                          <td>{deudor.deudaTotal !== undefined ? deudor.deudaTotal : 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {role !== 'empleado' && (
          <div className="home-stats-container">
            {loading ? (
              <ChartSkeleton />
            ) : (
              <div className="home-stats-card">
                <div className="home-stats-controls">
                  <div className="time-filter-container">
                    <label htmlFor="timeRange">
                      <FontAwesomeIcon icon={faCalendarAlt} /> Período:
                    </label>
                    <select 
                      id="timeRange" 
                      value={timeRange} 
                      onChange={(e) => setTimeRange(e.target.value)}
                    >
                      <option value="todo">Todo el tiempo</option>
                      <option value="semana">Última semana</option>
                      <option value="mes">Último mes</option>
                      <option value="año">Último año</option>
                    </select>
                  </div>
                  <button onClick={prevChart} className="home-stats-nav-button"><FontAwesomeIcon icon={faArrowLeft} /></button>
                  <button onClick={nextChart} className="home-stats-nav-button"><FontAwesomeIcon icon={faArrowRight} /></button>
                  <button 
                    onClick={downloadAllChartsAsPDF} 
                    className="home-stats-download-button"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin /> Descargando...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faFilePdf} /> Descargar PDF
                      </>
                    )}
                  </button>
                </div>
                <div className="home-stats-content">
                  {renderCurrentChart()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;