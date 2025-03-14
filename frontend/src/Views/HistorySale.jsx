import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { obtenerVentas } from "../services/AddProducts.service.js";
import "../styles/HistorySaleStyles.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
  const ventasPerPage = 10; // Número de ventas por página

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    try {
      const response = await obtenerVentas();
      console.log("📦 Datos de ventas:", response.data); // Debug
      const ventasData = Array.isArray(response.data) ? response.data : [];
      setVentas(ventasData);
      setFilteredVentas(ventasData); // 🔹 También inicializamos las ventas filtradas
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener el historial de ventas:", error);
      setError("Error al obtener el historial de ventas.");
      setLoading(false);
    }
  };

  // Filtrar ventas por nombre o código de barras
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchQuery(value);

    const filtered = ventas.filter(
      (venta) =>
        venta.nombre.toLowerCase().includes(value) ||
        venta.codigoBarras?.includes(value)
    );
    setFilteredVentas(filtered);
    setCurrentPage(1);
  };

  // Manejar el cambio de ordenamiento
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchQuery("");
    setSortOption("");
    setCategoryFilter("");
    setDateRange({ start: "", end: "" });
    setTotalRange({ min: "", max: "" });
    setFilteredVentas(ventas);
    setCurrentPage(1);
  };

  // Filtrar por categoría
  const handleFilterByCategory = (e) => {
    const category = e.target.value;
    setCategoryFilter(category);
    const filtered = category
      ? ventas.filter((venta) => venta.categoria === category)
      : ventas;
    setFilteredVentas(filtered);
    setCurrentPage(1);
  };

  // Filtrar por rango de fechas
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  // Filtrar por rango de total
  const handleTotalRangeChange = (e) => {
    const { name, value } = e.target;
    setTotalRange((prev) => ({ ...prev, [name]: value }));
  };

  // Aplicar filtros adicionales
  useEffect(() => {
    let filtered = ventas;

    if (categoryFilter) {
      filtered = filtered.filter((venta) => venta.categoria === categoryFilter);
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(
        (venta) =>
          new Date(venta.fecha) >= new Date(dateRange.start) &&
          new Date(venta.fecha) <= new Date(dateRange.end)
      );
    }

    if (totalRange.min && totalRange.max) {
      filtered = filtered.filter(
        (venta) =>
          (venta.cantidad * venta.precioVenta) >= parseFloat(totalRange.min) &&
          (venta.cantidad * venta.precioVenta) <= parseFloat(totalRange.max)
      );
    }

    setFilteredVentas(filtered);
  }, [categoryFilter, dateRange, totalRange, ventas]);

  // Ordenar las ventas según la opción seleccionada
  const sortedVentas = [...filteredVentas].sort((a, b) => {
    if (sortOption === "name-asc") return a.nombre.localeCompare(b.nombre);
    if (sortOption === "name-desc") return b.nombre.localeCompare(a.nombre);
    if (sortOption === "date-asc") return new Date(a.fecha) - new Date(b.fecha);
    if (sortOption === "date-desc") return new Date(b.fecha) - new Date(a.fecha);
    if (sortOption === "total-asc") return (a.cantidad * a.precioVenta) - (b.cantidad * b.precioVenta);
    if (sortOption === "total-desc") return (b.cantidad * b.precioVenta) - (a.cantidad * a.precioVenta);
    return 0;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Historial de Ventas", 20, 10);

    const dataToExport = sortedVentas.length > 0 ? sortedVentas : ventas; // 🔹 Si no hay filtro, exportamos todas las ventas

    autoTable(doc, {
      head: [["Producto", "Cantidad", "Categoría", "Precio Venta", "Precio Compra", "Fecha", "Total"]],
      body: dataToExport.map((venta) => [
        venta.nombre,
        venta.cantidad,
        venta.categoria,
        venta.precioVenta,
        venta.precioCompra,
        new Date(venta.fecha).toLocaleDateString(),
        (venta.cantidad * venta.precioVenta).toFixed(2), // Calcula el total
      ]),
    });

    doc.save("historial_ventas.pdf");
  };

  const exportToExcel = () => {
    const dataToExport = sortedVentas.length > 0 ? sortedVentas : ventas; // 🔹 Exporta todo si no hay filtro

    const ws = XLSX.utils.json_to_sheet(
      dataToExport.map((venta) => ({
        Producto: venta.nombre,
        Cantidad: venta.cantidad,
        Categoría: venta.categoria,
        "Precio Venta": venta.precioVenta,
        "Precio Compra": venta.precioCompra,
        Fecha: new Date(venta.fecha).toLocaleDateString(),
        Total: (venta.cantidad * venta.precioVenta).toFixed(2), // Calcula el total
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial de Ventas");
    XLSX.writeFile(wb, "historial_ventas.xlsx");
  };

  // Paginación
  const indexOfLastVenta = currentPage * ventasPerPage;
  const indexOfFirstVenta = indexOfLastVenta - ventasPerPage;
  const currentVentas = sortedVentas.slice(indexOfFirstVenta, indexOfLastVenta);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="history-sale-container">
      <Navbar />
      <div className="history-sale-main-content">
        <h1>Historial de Ventas</h1>

        <div className="history-sale-search-sort-container">
          {/* Buscador */}
          <input
            type="text"
            placeholder="Buscar por producto."
            value={searchQuery}
            onChange={handleSearch}
            className="history-sale-search-bar"
          />

          {/* Filtro de ordenamiento */}
          <select onChange={handleSortChange} value={sortOption} className="history-sale-sort-select">
            <option value="">Ordenar por</option>
            <option value="name-asc">Nombre (A-Z)</option>
            <option value="name-desc">Nombre (Z-A)</option>
            <option value="date-asc">Fecha (Ascendente)</option>
            <option value="date-desc">Fecha (Descendente)</option>
            <option value="total-asc">Precio Total (Ascendente)</option>
            <option value="total-desc">Precio Total (Descendente)</option>
          </select>

          {/* Filtro de categoría */}
          <select onChange={handleFilterByCategory} value={categoryFilter} className="history-sale-category-select">
            <option value="">Todas las categorías</option>
            <option value="Congelados">Congelados</option>
            <option value="Carnes">Carnes</option>
            <option value="Despensa">Despensa</option>
            <option value="Panaderia y Pasteleria">Panaderia y Pasteleria</option>
            <option value="Quesos y Fiambres">Quesos y Fiambres</option>
            <option value="Bebidas y Licores">Bebidas y Licores</option>
            <option value="Lacteos, Huevos y Refrigerados">Lacteos, Huevos y Refrigerados</option>
            <option value="Desayuno y Dulces">Desayuno y Dulces</option>
            <option value="Bebes y Niños">Bebes y Niños</option>
            <option value="Mascotas">Mascotas</option>
            <option value="Cuidado Personal">Cuidado Personal</option>
            <option value="Limpieza y Hogar">Limpieza y Hogar</option>
            <option value="Remedios">Remedios</option>
            <option value="Otros">Otros</option>
            <option value="Cigarros">Cigarros</option>
          </select>

          {/* Filtro por rango de fechas */}
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

          {/* Filtro por rango de total */}
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

          {/* Botón Limpiar Filtros */}
          <button onClick={handleClearFilters} className="history-sale-clear-filters-button">
            Limpiar Filtros
          </button>
        </div>

        {/* Tabla */}
        {loading ? (
          <p>Cargando historial de ventas...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <>
            <div className="history-sale-table-container">
              <table className="history-sale-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cantidad</th>
                    <th>Categoría</th>
                    <th>Precio de Venta</th>
                    <th>Precio de Compra</th>
                    <th>Fecha</th>
                    <th>Precio Total</th> {/* Nueva columna para el total */}
                  </tr>
                </thead>
                <tbody>
                  {currentVentas.length > 0 ? (
                    currentVentas.map((venta, index) => (
                      <tr key={index}>
                        <td>{venta.nombre || "Sin nombre"}</td>
                        <td>{venta.cantidad || 0}</td>
                        <td>{venta.categoria || "Sin categoría"}</td>
                        <td>${venta.precioVenta || 0}</td>
                        <td>${venta.precioCompra || 0}</td>
                        <td>{venta.fecha ? new Date(venta.fecha).toLocaleDateString() : "Sin fecha"}</td>
                        <td>${(venta.cantidad * venta.precioVenta)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">No hay ventas registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="history-sale-pagination">
              {Array.from({ length: Math.ceil(filteredVentas.length / ventasPerPage) }, (_, index) => (
                <button
                  key={index}
                  className={`history-sale-pagination-button ${index + 1 === currentPage ? "active" : ""}`}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {/* Botones de exportación */}
            <div className="history-sale-export-buttons">
              <button onClick={exportToPDF}>📄 Exportar a PDF</button>
              <button onClick={exportToExcel}>📊 Exportar a Excel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistorySale;