import React, { useEffect, useState } from "react";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import Navbar from "../components/Navbar";
import axios from "../services/root.service.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

import "../styles/EstadisticasStyles.css";

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

const Estadisticas = () => {
  // Solo mantenemos los estados para los tres gráficos que queremos
  const [ventasPorProducto, setVentasPorProducto] = useState(null);
  const [ventasPorCategoria, setVentasPorCategoria] = useState(null);
  const [topProductos, setTopProductos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerVentas();
  }, []);

  const obtenerVentas = async () => {
    try {
      const response = await axios.get("/products/ventas/obtener");
      const ventas = response.data.data;

      console.log("📦 Ventas:", ventas);
      if (!ventas || ventas.length === 0) {
        console.warn("⚠️ No hay datos de ventas disponibles.");
        setLoading(false);
        return;
      }

      procesarDatos(ventas);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener las ventas:", error);
      setError("Error al obtener los datos de ventas.");
      setLoading(false);
    }
  };

  const procesarDatos = (ventas) => {
    // Procesamos solo los datos para los tres gráficos que queremos mantener
    
    // Ventas por producto
    const productos = {};
    ventas.forEach(({ nombre, cantidad }) => {
      productos[nombre] = (productos[nombre] || 0) + cantidad;
    });

    setVentasPorProducto({
      labels: Object.keys(productos),
      datasets: [
        {
          label: "Cantidad Vendida",
          data: Object.values(productos),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
          "#FF9F40", "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#FF9F40",
           "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#FF9F40"],
          borderColor: "#fff",
        },
      ],
    });

    // Ventas por categoría
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
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#FF9F40", "#FF6384", "#36A2EB"],
          borderColor: "#fff",
        },
      ],
    });

    // Top 5 productos más vendidos
    const topProductosOrdenados = Object.entries(productos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    setTopProductos({
      labels: topProductosOrdenados.map(([nombre]) => nombre),
      datasets: [
        {
          label: "Top Productos",
          data: topProductosOrdenados.map(([, cantidad]) => cantidad),
          backgroundColor: ["#FF5733", "#33FF57", "#5733FF", "#FF33A1", "#33FFF3"],
        },
      ],
    });
  };

  const descargarReporte = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Productos", 20, 10);
    
    // Información sobre los productos más vendidos
    if (ventasPorProducto && ventasPorProducto.labels) {
      doc.text("Productos Más Vendidos", 20, 30);
      const productoData = ventasPorProducto.labels.map((producto, i) => 
        [producto, ventasPorProducto.datasets[0].data[i]]
      ).sort((a, b) => b[1] - a[1]);
      
      autoTable(doc, {
        startY: 35,
        head: [["Producto", "Unidades Vendidas"]],
        body: productoData.slice(0, 10), // Top 10 productos
      });
    }
    
    // Top 5 productos
    if (topProductos && topProductos.labels) {
      const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 120;
      doc.text("Top 5 Productos Más Vendidos", 20, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Producto", "Unidades Vendidas"]],
        body: topProductos.labels.map((producto, i) => 
          [producto, topProductos.datasets[0].data[i]]
        ),
      });
    }
    
    // Ventas por categoría
    if (ventasPorCategoria && ventasPorCategoria.labels) {
      const currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 180;
      doc.text("Ventas por Categoría", 20, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Categoría", "Unidades Vendidas"]],
        body: ventasPorCategoria.labels.map((categoria, i) => 
          [categoria, ventasPorCategoria.datasets[0].data[i]]
        ),
      });
    }
    
    doc.save("reporte_productos.pdf");
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
    },
  };

  return (
    <div className="estadisticas-page">
      <Navbar />
      <div className="chart-container">
        <h1>📊 Estadísticas de Productos</h1>
        
        {/* Filtros y botón de descarga (como en Finanzas) */}
        <div className="filter-container">
          <div className="filter-group">
            {/* Este div está vacío pero mantiene la estructura para alinear el botón a la derecha */}
          </div>
          
          <button onClick={descargarReporte} className="download-button">
            Descargar Reporte de Productos 📄
          </button>
        </div>
  
        {loading && <p>Cargando datos...</p>}
        {error && <p className="error">{error}</p>}
  
        {/* 🔹 Ventas por Producto */}
        <div className="chart">
          <h2>Productos Más Vendidos</h2>
          {ventasPorProducto && <Bar data={ventasPorProducto} options={chartOptions} />}
        </div>
  
        {/* 🔹 Top 5 Productos */}
        <div className="chart">
          <h2>Top 5 Productos Más Vendidos</h2>
          {topProductos && <Doughnut data={topProductos} options={chartOptions} />}
        </div>
  
        {/* 🔹 Ventas por Categoría */}
        <div className="chart">
          <h2>Ventas por Categoría</h2>
          {ventasPorCategoria && <Pie data={ventasPorCategoria} options={chartOptions} />}
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;