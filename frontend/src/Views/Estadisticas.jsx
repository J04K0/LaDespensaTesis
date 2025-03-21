import React, { useEffect, useState } from "react";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import Navbar from "../components/Navbar";
import axios from "../services/root.service.js"; // ✅ API Backend
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
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
  LineElement,
  ArcElement,
  DoughnutController,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Estadisticas = () => {
  const [ventasPorProducto, setVentasPorProducto] = useState(null);
  const [ventasPorFecha, setVentasPorFecha] = useState(null);
  const [ventasPorCategoria, setVentasPorCategoria] = useState(null);
  const [ingresosPorFecha, setIngresosPorFecha] = useState(null);
  const [topProductos, setTopProductos] = useState(null);
  const [stockBajo, setStockBajo] = useState(null);
  const [ventasPorMes, setVentasPorMes] = useState(null);
  const [ticketPromedio, setTicketPromedio] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalCostos, setTotalCostos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState("12M");

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
    let totalVentasMonto = 0;
    let totalCostosMonto = 0;
    let totalTransacciones = ventas.length;
    
    
    const meses = {};
    console.log("📊 Ventas por mes:", meses);
    ventas.forEach(({ fecha, cantidad, precioVenta, precioCompra }) => {  // ✅ Cambio aquí
      if (!cantidad || precioVenta === undefined || precioCompra === undefined) {
        console.warn("⚠️ Datos inválidos en venta:", { fecha, cantidad, precioVenta, precioCompra });
        return; // Saltar este dato
      }
    
      const mes = new Date(fecha).toLocaleString("es-ES", { month: "short", year: "numeric" });
    
      if (!meses[mes]) meses[mes] = { ventas: 0, costos: 0 };
    
      meses[mes].ventas += cantidad * precioVenta;
      meses[mes].costos += cantidad * precioCompra;
      totalVentasMonto += cantidad * precioVenta;
      totalCostosMonto += cantidad * precioCompra;
    });
    
    console.log("📊 Ventas por mes (después de procesar):", meses);

    const productos = {};
    const ingresos = {};
    ventas.forEach(({ nombre, cantidad, precioVenta, fecha }) => {
      productos[nombre] = (productos[nombre] || 0) + cantidad;

      const fechaFormateada = new Date(fecha).toLocaleDateString();
      ingresos[fechaFormateada] = (ingresos[fechaFormateada] || 0) + (precioVenta * cantidad);
    });

    setVentasPorMes({
      labels: Object.keys(meses),
      datasets: [
        {
          label: "Ventas",
          data: Object.values(meses).map((m) => m.ventas),
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          borderWidth: 2,
        },
        {
          label: "Costos",
          data: Object.values(meses).map((m) => m.costos),
          borderColor: "#FF5733",
          backgroundColor: "rgba(255, 87, 51, 0.2)",
          borderWidth: 2,
        },
      ],
    });

    // 🔹 Ticket Promedio
    setTicketPromedio(totalVentasMonto / (totalTransacciones || 1));
    setTotalVentas(totalVentasMonto);
    setTotalCostos(totalCostosMonto);

    setVentasPorProducto({
      labels: Object.keys(productos),
      datasets: [
        {
          label: "Cantidad Vendida",
          data: Object.values(productos),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
          "#FF9F40", "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#FF9F40"
           , "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#FF9F40"],
          borderColor: "#fff",
        },
      ],
    });
    
    // 🔹 Ventas por fecha
    const fechas = {};
    ventas.forEach(({ fecha, cantidad }) => {
      const fechaFormateada = new Date(fecha).toLocaleDateString();
      fechas[fechaFormateada] = (fechas[fechaFormateada] || 0) + cantidad;
    });

    setVentasPorFecha({
      labels: Object.keys(fechas),
      datasets: [
        {
          label: "Ventas Diarias",
          data: Object.values(fechas),
          borderColor: "#4BC0C0",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderWidth: 2,
        },
      ],
    });

    // 🔹 Ingresos por fecha
    setIngresosPorFecha({
      labels: Object.keys(ingresos),
      datasets: [
        {
          label: "Ingresos Generados",
          data: Object.values(ingresos),
          borderColor: "#FFA500",
          backgroundColor: "rgba(255, 165, 0, 0.2)",
          borderWidth: 2,
        },
      ],
    });

    // 🔹 Ventas por categoría
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

    // 🔹 Top 5 productos más vendidos
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

    // 🔹 Productos con stock bajo (menos de 5 unidades)
    const stockBajoProductos = ventas.filter(({ stock }) => stock < 5);
    setStockBajo(stockBajoProductos);
  };

  const descargarReporte = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Ventas", 20, 10);
    autoTable(doc, {
      head: [["Métricas", "Valor"]],
      body: [
        ["Total Ventas", `$${totalVentas.toFixed(2)}`],
        ["Total Costos", `$${totalCostos.toFixed(2)}`],
        ["Ticket Promedio", `$${ticketPromedio.toFixed(2)}`],
      ],
    });
    doc.save("reporte_ventas.pdf");
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
        <h1>📊 Estadísticas de Ventas</h1>
  
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
  
        {/* 🔹 Ventas por Fecha */}
        <div className="chart">
          <h2>Ventas Diarias</h2>
          {ventasPorFecha && <Line data={ventasPorFecha} options={chartOptions} />}
        </div>
  
        {/* 🔹 Ingresos por Fecha */}
        <div className="chart">
          <h2>Ingresos Generados por Día</h2>
          {ingresosPorFecha && <Line data={ingresosPorFecha} options={chartOptions} />}
        </div>
  
        {/* 🔹 Productos con Stock Bajo */}
        <div className="chart">
          <h2>Productos con Bajo Stock</h2>
          {stockBajo && stockBajo.length > 0 ? (
            <ul>
              {stockBajo.map((producto, index) => (
                <li key={index}>
                  <strong>{producto.nombre}</strong> - Stock: {producto.stock}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay productos con bajo stock.</p>
          )}
          <div className="stats-summary">
            <div className="stat-card">Total Ventas: <b>${totalVentas}</b></div>
            <div className="stat-card">Total Costos: <b>${totalCostos}</b></div>
            <div className="stat-card">Ticket Promedio: <b>${ticketPromedio.toFixed(2)}</b></div>
          </div>
        </div>
  
        {/* 🔹 Filtros de Fecha */}
        <div className="filter-buttons">
          <button onClick={() => setFiltroFecha("1M")}>1M</button>
          <button onClick={() => setFiltroFecha("3M")}>3M</button>
          <button onClick={() => setFiltroFecha("12M")} className="active">12M</button>
        </div>
  
        {/* 🔹 Ventas y Costos Últimos 12 Meses */}
        <div className="chart">
          <h2>Ventas y Costos Últimos 12 Meses</h2>
          {ventasPorMes && <Bar data={ventasPorMes} options={chartOptions} />}
        </div>
  
        {/* 🔹 Botón de descarga */}
        <button onClick={descargarReporte} className="download-button">Descargar Reporte 📄</button>
      </div>
    </div>
  );
}  

export default Estadisticas;
