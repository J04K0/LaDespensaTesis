import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { obtenerVentasPorTicket, eliminarTicket, editarTicket } from "../services/venta.service.js";
import "../styles/HistorySaleStyles.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import HistorySaleSkeleton from '../components/HistorySaleSkeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert } from "../helpers/swaHelper";

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
  
  // Estado para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editedProducts, setEditedProducts] = useState([]);

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

  // Función para manejar la eliminación de un ticket
  const handleDeleteTicket = async (ticketId) => {
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas anular esta venta? Esta acción no se puede deshacer.",
      "Sí, anular venta",
      "Cancelar"
    );

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await eliminarTicket(ticketId);
        showSuccessAlert("Éxito", "Venta anulada correctamente");
        // Refrescar la lista de ventas
        await fetchVentas();
      } catch (error) {
        console.error("Error al eliminar ticket:", error);
        showErrorAlert("Error", "No se pudo anular la venta");
        setLoading(false);
      }
    }
  };

  // Función para manejar la edición de un ticket (devolución parcial)
  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    // Clonar los productos para poder editarlos
    setEditedProducts([...ticket.ventas.map(item => ({...item}))]);
    setShowEditModal(true);
  };

  // Función para guardar los cambios en un ticket
  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await editarTicket(selectedTicket._id, editedProducts);
      setShowEditModal(false);
      showSuccessAlert("Éxito", "Venta actualizada correctamente");
      // Refrescar la lista de ventas
      await fetchVentas();
    } catch (error) {
      console.error("Error al editar ticket:", error);
      showErrorAlert("Error", "No se pudo actualizar la venta");
      setLoading(false);
    }
  };

  // Función para cerrar el modal sin guardar cambios
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedTicket(null);
    setEditedProducts([]);
  };

  // Función para modificar la cantidad de un producto
  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity >= 0) {
      const updatedProducts = [...editedProducts];
      updatedProducts[index].cantidad = newQuantity;
      setEditedProducts(updatedProducts);
    }
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
                        <th style={{width: "10%"}}>Fecha</th>
                        <th style={{width: "10%"}}>Usuario</th>
                        <th style={{width: "35%"}}>Detalle de Productos</th>
                        <th style={{width: "15%"}}>Importe Total</th>
                        <th style={{width: "15%"}}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentVentas.length > 0 ? (
                        currentVentas.map((venta, index) => (
                          <tr key={index}>
                            <td>{venta._id}</td>
                            <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                            <td>{venta.usuario ? venta.usuario.nombre || venta.usuario.username : "Usuario desconocido"}</td>
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
                            <td className="history-sale-actions">
                              <button 
                                onClick={() => handleEditTicket(venta)} 
                                className="history-sale-edit-btn" 
                                title="Editar venta / Devolver productos"
                              >
                                <FontAwesomeIcon icon={faEdit} /> Devolver
                              </button>
                              <button 
                                onClick={() => handleDeleteTicket(venta._id)} 
                                className="history-sale-delete-btn" 
                                title="Anular venta"
                              >
                                <FontAwesomeIcon icon={faTrash} /> Anular
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="no-data">No hay ventas registradas.</td>
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
            
            {/* Modal para editar ticket / devolver productos */}
            {showEditModal && selectedTicket && (
              <div className="history-sale-modal-overlay">
                <div className="history-sale-modal-content">
                  <div className="history-sale-modal-header">
                    <h3>Devolución de Productos - Ticket {selectedTicket._id}</h3>
                    <button 
                      className="history-sale-modal-close" 
                      onClick={handleCancelEdit}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  <div className="history-sale-modal-body">
                    <p className="history-sale-modal-instructions">
                      Modifique las cantidades para realizar devoluciones parciales o totales. Establezca 0 para devolver todo un producto.
                    </p>
                    <table className="history-sale-modal-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Precio Unitario</th>
                          <th>Cantidad</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editedProducts.map((producto, index) => (
                          <tr key={index}>
                            <td>{producto.nombre}</td>
                            <td>${producto.precioVenta}</td>
                            <td className="quantity-cell">
                              <div className="quantity-controls">
                                <button 
                                  onClick={() => handleQuantityChange(index, producto.cantidad - 1)}
                                  disabled={producto.cantidad <= 0}
                                >-</button>
                                <span>{producto.cantidad}</span>
                                <button 
                                  onClick={() => handleQuantityChange(index, producto.cantidad + 1)}
                                  disabled={producto.cantidad >= selectedTicket.ventas[index].cantidad}
                                >+</button>
                              </div>
                            </td>
                            <td>${(producto.cantidad * producto.precioVenta).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3"><strong>Total:</strong></td>
                          <td>
                            <strong>
                              ${editedProducts.reduce(
                                (sum, p) => sum + p.cantidad * p.precioVenta, 
                                0
                              ).toLocaleString()}
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3"><strong>Total a devolver:</strong></td>
                          <td>
                            <strong className="refund-amount">
                              ${(
                                selectedTicket.ventas.reduce((sum, p) => sum + p.cantidad * p.precioVenta, 0) - 
                                editedProducts.reduce((sum, p) => sum + p.cantidad * p.precioVenta, 0)
                              ).toLocaleString()}
                            </strong>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="history-sale-modal-footer">
                    <button 
                      onClick={handleSaveEdit}
                      className="history-sale-confirm-button"
                      disabled={JSON.stringify(editedProducts) === JSON.stringify(selectedTicket.ventas)}
                    >
                      Confirmar Devolución
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="history-sale-cancel-button"
                    >
                      Cancelar
                    </button>
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

export default HistorySale;