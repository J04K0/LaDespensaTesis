import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/HomeStyles.css';
import { getDeudores, deleteDeudor } from '../services/deudores.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faChartLine, faChartPie, faChartBar, faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from "../services/root.service.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";

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
  const [showProductOptions, setShowProductOptions] = useState(false);
  const [deudores, setDeudores] = useState([]);
  const navigate = useNavigate();
  
  // Estados para los gráficos
  const [ventasPorProducto, setVentasPorProducto] = useState(null);
  const [ventasPorCategoria, setVentasPorCategoria] = useState(null);
  const [topProductos, setTopProductos] = useState(null);
  const [currentChart, setCurrentChart] = useState(0); // 0: top productos, 1: ventas por producto, 2: ventas por categoría
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeudores = async () => {
      try {
        const data = await getDeudores(1, 8);
        setDeudores(data.deudores);
      } catch (error) {
        console.error('Error fetching deudores:', error);
      }
    };

    fetchDeudores();
    obtenerVentas();
  }, []);

  const obtenerVentas = async () => {
    try {
      const response = await axios.get("/products/ventas/obtener");
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
          "#FF9F40", "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#FF9F40"],
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
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#FF9F40"],
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

  // Cambiar al gráfico siguiente
  const nextChart = () => {
    setCurrentChart((prevChart) => (prevChart + 1) % 3);
  };

  // Cambiar al gráfico anterior
  const prevChart = () => {
    setCurrentChart((prevChart) => (prevChart - 1 + 3) % 3);
  };

  const toggleProductOptions = () => {
    setShowProductOptions(!showProductOptions);
  };

  const handleViewAllClick = () => {
    navigate('/deudores');
  };

  const handleViewOutOfStock = () => {
    navigate('/products?filter=unavailable');
  };

  const handleViewExpiringProducts = () => {
    navigate('/products?filter=expiring');
  };

  const handleViewExpiredProducts = () => {
    navigate('/products?filter=expired');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
    },
  };

  // Renderizar el gráfico actual
  const renderCurrentChart = () => {
    if (loading) return <p>Cargando datos...</p>;
    if (error) return <p className="error">{error}</p>;

    switch (currentChart) {
      case 0:
        return topProductos ? (
          <div>
            <h2>Top 5 Productos Más Vendidos</h2>
            <Doughnut data={topProductos} options={chartOptions} />
          </div>
        ) : (
          <p>No hay datos disponibles</p>
        );
      case 1:
        return ventasPorProducto ? (
          <div>
            <h2>Productos Más Vendidos</h2>
            <Bar data={ventasPorProducto} options={chartOptions} />
          </div>
        ) : (
          <p>No hay datos disponibles</p>
        );
      case 2:
        return ventasPorCategoria ? (
          <div>
            <h2>Ventas por Categoría</h2>
            <Pie data={ventasPorCategoria} options={chartOptions} />
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
          <div className="home-deudores-card">
            <div className="home-deudores-header">
              <h3>Personas deudoras</h3>
              <button onClick={handleViewAllClick}>Ver todos</button>
            </div>
            <table className="home-deudores-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Deuda total</th>
                </tr>
              </thead>
              <tbody>
                {deudores.map((deudor, index) => (
                  <tr key={index}>
                    <td><FontAwesomeIcon icon={faUser} /> {deudor.Nombre || 'Nombre desconocido'}</td>
                    <td>${deudor.deudaTotal !== undefined ? deudor.deudaTotal.toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="home-stats-container">
          <div className="home-stats-card">
            <div className="home-stats-controls">
              <button onClick={prevChart} className="home-stats-nav-button"><FontAwesomeIcon icon={faArrowLeft} /></button>
              <button onClick={nextChart} className="home-stats-nav-button"><FontAwesomeIcon icon={faArrowRight} /></button>
            </div>
            <div className="home-stats-content">
              {renderCurrentChart()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;