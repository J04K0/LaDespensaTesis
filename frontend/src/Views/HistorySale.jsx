import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { obtenerVentasPorTicket } from "../services/AddProducts.service.js";
import "../styles/HistorySaleStyles.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import HistorySaleSkeleton from '../components/HistorySaleSkeleton';

const HistorySale = () => {
  const [ventas, setVentas] = useState([]);
  const [filteredVentas, setFilteredVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [totalRange, setTotalRange] = useState({ min: "", max: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const ventasPerPage = 10;

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      const response = await obtenerVentasPorTicket();
      
      const ventasData = response.data || [];
      setVentas(ventasData);
      setFilteredVentas(ventasData);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener el historial de ventas:", error);
      setError("Error al obtener el historial de ventas.");
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchQuery(value);

    const filtered = ventas.filter((venta) =>
      venta.ventas.some(
        (producto) =>
          producto.nombre.toLowerCase().includes(value) ||
          producto.codigoBarras?.includes(value)
      )
    );
    setFilteredVentas(filtered);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSortOption("");
    setCategoryFilter("");
    setDateRange({ start: "", end: "" });
    setTotalRange({ min: "", max: "" });
    setFilteredVentas(ventas);
    setCurrentPage(1);
  };

  const handleFilterByCategory = (e) => {
    const category = e.target.value;
    setCategoryFilter(category);
    const filtered = category
      ? ventas.filter((venta) =>
          venta.ventas.some((producto) => producto.categoria === category)
        )
      : ventas;
    setFilteredVentas(filtered);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const handleTotalRangeChange = (e) => {
    const { name, value } = e.target;
    setTotalRange((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    let filtered = ventas;

    if (categoryFilter) {
      filtered = filtered.filter((venta) =>
        venta.ventas.some((producto) => producto.categoria === categoryFilter)
      );
    }

    // Filtro de fecha de inicio independiente
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      startDate.setUTCHours(0, 0, 0, 0);

      filtered = filtered.filter((venta) => {
        const ventaFecha = new Date(venta.fecha);
        return ventaFecha >= startDate;
      });
    }

    // Filtro de fecha de fin independiente
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setUTCHours(23, 59, 59, 999);

      filtered = filtered.filter((venta) => {
        const ventaFecha = new Date(venta.fecha);
        return ventaFecha <= endDate;
      });
    }

    // Aplicar filtro de monto mínimo independientemente del máximo
    if (totalRange.min) {
      filtered = filtered.filter(
        (venta) =>
          venta.ventas.reduce(
            (acc, producto) => acc + producto.cantidad * producto.precioVenta,
            0
          ) >= parseFloat(totalRange.min)
      );
    }

    // Aplicar filtro de monto máximo independientemente del mínimo
    if (totalRange.max) {
      filtered = filtered.filter(
        (venta) =>
          venta.ventas.reduce(
            (acc, producto) => acc + producto.cantidad * producto.precioVenta,
            0
          ) <= parseFloat(totalRange.max)
      );
    }

    setFilteredVentas(filtered);
  }, [categoryFilter, dateRange, totalRange, ventas]);

  const sortedVentas = [...filteredVentas].sort((a, b) => {
    if (sortOption === "date-asc") return new Date(a.fecha) - new Date(b.fecha);
    if (sortOption === "date-desc")
      return new Date(b.fecha) - new Date(a.fecha);
    if (sortOption === "total-asc")
      return (
        a.ventas.reduce(
          (acc, producto) => acc + producto.cantidad * producto.precioVenta,
          0
        ) -
        b.ventas.reduce(
          (acc, producto) => acc + producto.cantidad * producto.precioVenta,
          0
        )
      );
    if (sortOption === "total-desc")
      return (
        b.ventas.reduce(
          (acc, producto) => acc + producto.cantidad * producto.precioVenta,
          0
        ) -
        a.ventas.reduce(
          (acc, producto) => acc + producto.cantidad * producto.precioVenta,
          0
        )
      );
    return 0;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Historial de Ventas", 20, 10);

    const dataToExport = sortedVentas.length > 0 ? sortedVentas : ventas;

    autoTable(doc, {
      head: [["Ticket", "Fecha", "Productos", "Total"]],
      body: dataToExport.map((venta) => [
        venta._id,
        new Date(venta.fecha).toLocaleDateString(),
        venta.ventas
          .map(
            (producto) =>
              `${producto.nombre} - ${producto.cantidad}x $${producto.precioVenta}`
          )
          .join("\n"),
        venta.ventas.reduce(
          (acc, producto) => acc + producto.cantidad * producto.precioVenta,
          0
        ),
      ]),
    });

    doc.save("historial_ventas.pdf");
  };

  const exportToExcel = () => {
    const dataToExport = sortedVentas.length > 0 ? sortedVentas : ventas;

    const ws = XLSX.utils.json_to_sheet(
      dataToExport.map((venta) => ({
        Ticket: venta._id,
        Fecha: new Date(venta.fecha).toLocaleDateString(),
        Productos: venta.ventas
          .map(
            (producto) =>
              `${producto.nombre} - ${producto.cantidad}x $${producto.precioVenta}`
          )
          .join("\n"),
        Total: venta.ventas.reduce(
          (acc, producto) => acc + producto.cantidad * producto.precioVenta,
          0
        ),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial de Ventas");
    XLSX.writeFile(wb, "historial_ventas.xlsx");
  };

  const indexOfLastVenta = currentPage * ventasPerPage;
  const indexOfFirstVenta = indexOfLastVenta - ventasPerPage;
  const currentVentas = sortedVentas.slice(indexOfFirstVenta, indexOfLastVenta);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="history-sale-container">
      <Navbar />
      <div className="history-sale-main-content">
        {loading ? (
          <HistorySaleSkeleton />
        ) : (
          <>
            <h1>Historial de Ventas</h1>       
            <div className="history-sale-search-sort-container">
              <input
                type="text"
                placeholder="Buscar por producto."
                value={searchQuery}
                onChange={handleSearch}
                className="history-sale-search-bar"
              />
              <select
                onChange={handleSortChange}
                value={sortOption}
                className="history-sale-sort-select"
              >
                <option value="">Ordenar por</option>
                <option value="date-asc">Fecha (Ascendente)</option>
                <option value="date-desc">Fecha (Descendente)</option>
                <option value="total-asc">Precio Total (Ascendente)</option>
                <option value="total-desc">Precio Total (Descendente)</option>
              </select>
              <select
                onChange={handleFilterByCategory}
                value={categoryFilter}
                className="history-sale-category-select"
              >
                <option value="">Todas las categorías</option>
                <option value="Congelados">Congelados</option>
                <option value="Carnes">Carnes</option>
                <option value="Despensa">Despensa</option>
                <option value="Panaderia y Pasteleria">Panaderia y Pasteleria</option>
                <option value="Quesos y Fiambres">Quesos y Fiambres</option>
                <option value="Bebidas y Licores">Bebidas y Licores</option>
                <option value="Lacteos, Huevos y Refrigerados">
                  Lacteos, Huevos y Refrigerados
                </option>
                <option value="Desayuno y Dulces">Desayuno y Dulces</option>
                <option value="Bebes y Niños">Bebes y Niños</option>
                <option value="Mascotas">Mascotas</option>
                <option value="Cuidado Personal">Cuidado Personal</option>
                <option value="Limpieza y Hogar">Limpieza y Hogar</option>
                <option value="Remedios">Remedios</option>
                <option value="Cigarros">Cigarros</option>
                <option value="Otros">Otros</option>
              </select>
              <div className="history-sale-date-range">
                <label>Desde:</label>
                <input
                  type="date"
                  name="start"
                  value={dateRange.start}
                  onChange={handleDateRangeChange}
                />
                <label>Hasta:</label>
                <input
                  type="date"
                  name="end"
                  value={dateRange.end}
                  onChange={handleDateRangeChange}
                />
              </div>
              <div className="history-sale-total-range">
                <label>Precio Total Mín:</label>
                <input
                  type="number"
                  name="min"
                  value={totalRange.min}
                  onChange={handleTotalRangeChange}
                />
                <label>Precio Total Máx:</label>
                <input
                  type="number"
                  name="max"
                  value={totalRange.max}
                  onChange={handleTotalRangeChange}
                />
              </div>
              <button
                onClick={handleClearFilters}
                className="history-sale-clear-filters-button"
              >
                Limpiar Filtros
              </button>
            </div>

            {error ? (
              <p className="error">{error}</p>
            ) : (
              <>
                <div className="history-sale-table-container">
                  <table className="history-sale-table">
                    <thead>
                      <tr>
                        <th style={{width: "15%"}}>Código</th>
                        <th style={{width: "15%"}}>Fecha</th>
                        <th style={{width: "55%"}}>Detalle de Productos</th>
                        <th style={{width: "15%"}}>Importe Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentVentas.length > 0 ? (
                        currentVentas.map((venta, index) => (
                          <tr key={index}>
                            <td>{venta._id}</td>
                            <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                            <td>
                              <ul>
                                {venta.ventas.map((producto, i) => (
                                  <li key={i}>
                                    <div>
                                      <strong>{producto.nombre}</strong>
                                      <div className="quantity-total-container">
                                        <span className="quantity-badge">{producto.cantidad}x</span>
                                        <span className="line-total">(${(producto.cantidad * producto.precioVenta).toLocaleString()})</span>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td>
                              ${venta.ventas.reduce(
                                (acc, producto) =>
                                  acc + producto.cantidad * producto.precioVenta,
                                0
                              ).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="no-data">No hay ventas registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="history-sale-pagination">
                  {Array.from(
                    { length: Math.ceil(filteredVentas.length / ventasPerPage) },
                    (_, index) => (
                      <button
                        key={index}
                        className={`history-sale-pagination-button ${
                          index + 1 === currentPage ? "active" : ""
                        }`}
                        onClick={() => paginate(index + 1)}
                      >
                        {index + 1}
                      </button>
                    )
                  )}
                </div>
                <div className="history-sale-export-buttons">
                  <button onClick={exportToPDF}>📄 Exportar a PDF</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistorySale;