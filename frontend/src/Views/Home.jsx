import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/HomeStyles.css';
import { getDeudores } from '../services/deudores.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faArrowRight, faArrowLeft, faChartPie, faStar, faDownload, faFilePdf, faSpinner } from '@fortawesome/free-solid-svg-icons';
import axios from "../services/root.service.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import DeudoresTableSkeleton from '../components/DeudoresTableSkeleton';
import ChartSkeleton from '../components/ChartSkeleton';
import jspdf from "jspdf";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  DoughnutController,
  Title, 
  Tooltip, 
  Legend, 
  PointElement 
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  DoughnutController,
  PointElement,
  Title,
  Tooltip,
  Legend
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

  // Referencia al contenedor del gráfico
  const chartRef = useRef(null);

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
        
        // Calcular cuántos deudores sin deuda podemos mostrar
        const espacioDisponible = 10 - deudoresConDeudaOrdenados.length;
        
        // Crear la lista final limitada a 10 en total
        const deudoresFinales = [
          ...deudoresConDeudaOrdenados,
          ...(espacioDisponible > 0 ? deudoresSinDeudaOrdenados.slice(0, espacioDisponible) : [])
        ];
        
        setDeudores(deudoresFinales);
      } catch (error) {
        console.error('Error fetching deudores:', error);
      }
    };

    fetchDeudores();
    obtenerVentas();
  }, []);

  const obtenerVentas = async () => {
    try {
      const response = await axios.get("/ventas/ventas/obtener");
      const ventas = response.data.data;

      if (ventas && ventas.length > 0) {
        procesarDatos(ventas);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener las ventas:", error);
      setError("Error al obtener los datos de ventas.");
      setLoading(false);
    }
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
            return `${label}: ${value}`;
          }
        }
      }
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
      let yPos = 40;
      let currentPage = 1;
      
      // Función para añadir un gráfico y su tabla correspondiente
      const addChartDataToPdf = (title, data, colorHex) => {
        // Verificar si queda suficiente espacio en la página actual
        if (yPos > 220) {
          // Añadir pie de página a la página actual
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text(`La Despensa - Página ${currentPage}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
          
          // Crear nueva página
          doc.addPage();
          currentPage++;
          yPos = 20; // Reiniciar posición en Y
        }
        
        // Título del gráfico
        doc.setFontSize(16);
        doc.setTextColor(0, 110, 223); // Color primario
        doc.text(title, 20, yPos);
        yPos += 10;
        
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
            doc.rect(20, yPos, col1Width + col2Width, cellHeight, 'F');
            doc.setFontSize(12);
            doc.text("Item", 20 + cellPadding, yPos + cellHeight - cellPadding);
            doc.text("Cantidad", 20 + col1Width + cellPadding, yPos + cellHeight - cellPadding);
            yPos += cellHeight;
            
            // Dibujar filas de datos
            doc.setTextColor(50, 50, 50);
            tableData.forEach((row, i) => {
              // Alternar colores de fondo para las filas
              if (i % 2 === 0) {
                doc.setFillColor(245, 248, 250);
                doc.rect(20, yPos, col1Width + col2Width, cellHeight, 'F');
              } else {
                doc.setFillColor(255, 255, 255);
                doc.rect(20, yPos, col1Width + col2Width, cellHeight, 'F');
              }
              
              // Dibujar borde
              doc.setDrawColor(220, 220, 220);
              doc.rect(20, yPos, col1Width + col2Width, cellHeight);
              
              // Añadir texto
              doc.text(row[0], 20 + cellPadding, yPos + cellHeight - cellPadding);
              doc.text(row[1], 20 + col1Width + cellPadding, yPos + cellHeight - cellPadding);
              
              yPos += cellHeight;
            });
            
            // Espacio después de la tabla
            yPos += 20;
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

  // Obtener el título del gráfico actual
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
  
  // Obtener los datos del gráfico actual
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
          <div>
            <h2><FontAwesomeIcon icon={faStar} style={{marginRight: '10px'}}/> Top 5 Productos Más Vendidos</h2>
            <Doughnut data={topProductos} options={chartOptions} />
          </div>
        ) : (
          <p>No hay datos disponibles</p>
        );
      case 1:
        return ventasPorCategoria ? (
          <div>
            <h2><FontAwesomeIcon icon={faChartPie} style={{marginRight: '10px'}}/> Ventas por Categoría</h2>
            <Pie data={ventasPorCategoria} options={chartOptions} />
          </div>
        ) : (
          <p>No hay datos disponibles</p>
        );
      case 2:
        return productosPocoVendidos ? (
          <div>
            <h2><FontAwesomeIcon icon={faChartPie} style={{marginRight: '10px'}}/> Productos Menos Vendidos</h2>
            <Doughnut data={productosPocoVendidos} options={chartOptions} />
          </div>
        ) : (
          <p>No hay datos disponibles</p>
        );
      default:
        return <p>No hay datos disponibles</p>;
    }
  };

  return (
    <div className="home-container">
      <Navbar />
      <div className="home-content">
        <div className="home-deudores-container">
          {loading ? (
            <DeudoresTableSkeleton />
          ) : (
            <div className="home-deudores-card">
              <div className="home-deudores-header">
                <h3>Personas deudoras</h3>
                <button onClick={handleViewAllClick}>Ver todos</button>
              </div>
              <div className="home-deudores-table-container">
                <table className="home-deudores-table">
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
                          <td>${deudor.deudaTotal !== undefined ? deudor.deudaTotal.toLocaleString() : 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div className="home-stats-container">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="home-stats-card">
              <div className="home-stats-controls">
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
      </div>
    </div>
  );
};

export default Home;