import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { obtenerVentasPorTicket, eliminarTicket, editarTicket } from "../services/venta.service.js";
import "../styles/HistorySaleStyles.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import HistorySaleSkeleton from '../components/HistorySaleSkeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faTimes, faSearch, faFilter, faFilePdf, faFileExcel, faPlus, faMinus, faMoneyBillAlt, faCreditCard } from '@fortawesome/free-solid-svg-icons';
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
      head: [["Ticket", "Fecha", "Usuario", "Método de Pago", "Productos", "Total"]],
      body: dataToExport.map((venta) => [
        venta._id,
        new Date(venta.fecha).toLocaleDateString(),
        venta.usuario ? venta.usuario.nombre || venta.usuario.username : "Usuario desconocido",
        venta.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo',
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
        Usuario: venta.usuario ? venta.usuario.nombre || venta.usuario.username : "Usuario desconocido",
        "Método de Pago": venta.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo',
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
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        {loading ? (
          <HistorySaleSkeleton />
        ) : (
          <>
            <div className="page-header">
              <h1 className="page-title">Historial de Ventas</h1>
              <div className="d-flex gap-sm">
                <button className="btn btn-secondary" onClick={exportToPDF}>
                  <FontAwesomeIcon icon={faFilePdf} /> Exportar PDF
                </button>
                <button className="btn btn-secondary" onClick={exportToExcel}>
                  <FontAwesomeIcon icon={faFileExcel} /> Exportar Excel
                </button>
              </div>
            </div>
            
            <div className="filters-container">
              <div className="search-container">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por producto..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="search-input"
                />
              </div>
              
              <div className="filter-group">
                <select
                  onChange={handleSortChange}
                  value={sortOption}
                  className="form-select"
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
                  className="form-select"
                >
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
                  <option value="Cigarros">Cigarros</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              
              <div className="filter-dates">
                <div className="date-filter">
                  <label className="form-label">Desde:</label>
                  <input
                    type="date"
                    name="start"
                    value={dateRange.start}
                    onChange={handleDateRangeChange}
                    className="form-control"
                  />
                </div>
                <div className="date-filter">
                  <label className="form-label">Hasta:</label>
                  <input
                    type="date"
                    name="end"
                    value={dateRange.end}
                    onChange={handleDateRangeChange}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="filter-prices">
                <div className="price-filter">
                  <label className="form-label">Mínimo:</label>
                  <input
                    type="number"
                    name="min"
                    value={totalRange.min}
                    onChange={handleTotalRangeChange}
                    className="form-control"
                    placeholder="$"
                  />
                </div>
                <div className="price-filter">
                  <label className="form-label">Máximo:</label>
                  <input
                    type="number"
                    name="max"
                    value={totalRange.max}
                    onChange={handleTotalRangeChange}
                    className="form-control"
                    placeholder="$"
                  />
                </div>
              </div>
              
              <button
                onClick={handleClearFilters}
                className="btn btn-secondary"
              >
                <FontAwesomeIcon icon={faFilter} /> Limpiar Filtros
              </button>
            </div>

            {error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{width: "15%"}}>Código</th>
                        <th style={{width: "10%"}}>Fecha</th>
                        <th style={{width: "10%"}}>Usuario</th>
                        <th style={{width: "10%"}}>Método de Pago</th>
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
                            <td className={`metodo-pago ${venta.metodoPago}`}>
                              <span className={`metodo-badge ${venta.metodoPago === 'tarjeta' ? 'tarjeta' : 'efectivo'}`}>
                                <FontAwesomeIcon icon={venta.metodoPago === 'tarjeta' ? faCreditCard : faMoneyBillAlt} />
                                {venta.metodoPago === 'tarjeta' ? ' Tarjeta' : ' Efectivo'}
                              </span>
                            </td>
                            <td>
                              <ul className="product-list">
                                {venta.ventas.map((producto, i) => (
                                  <li key={i} className="product-item">
                                    <div className="product-details">
                                      <strong>{producto.nombre}</strong>
                                      <div className="product-meta">
                                        <span className="state-badge">{producto.cantidad}x</span>
                                        <span>${(producto.cantidad * producto.precioVenta).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="text-success fw-bold">
                              ${venta.ventas.reduce(
                                (acc, producto) =>
                                  acc + producto.cantidad * producto.precioVenta,
                                0
                              ).toLocaleString()}
                            </td>
                            <td className="d-flex gap-sm">
                              <button 
                                onClick={() => handleEditTicket(venta)} 
                                className="btn btn-warning" 
                                title="Editar venta / Devolver productos"
                              >
                                <FontAwesomeIcon icon={faEdit} /> Devolver
                              </button>
                              <button 
                                onClick={() => handleDeleteTicket(venta._id)} 
                                className="btn btn-danger" 
                                title="Anular venta"
                              >
                                <FontAwesomeIcon icon={faTrash} /> Anular
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">No hay ventas registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="pagination">
                  {Array.from(
                    { length: Math.ceil(filteredVentas.length / ventasPerPage) },
                    (_, index) => (
                      <button
                        key={index}
                        className={`pagination-button ${
                          index + 1 === currentPage ? "active" : ""
                        }`}
                        onClick={() => paginate(index + 1)}
                      >
                        {index + 1}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
            
            {/* Modal para editar ticket / devolver productos */}
            {showEditModal && selectedTicket && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2 className="modal-title">Devolución de Productos - Ticket {selectedTicket._id}</h2>
                    <button 
                      className="btn-icon btn-close" 
                      onClick={handleCancelEdit}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="alert alert-info">
                      Modifique las cantidades para realizar devoluciones parciales o totales. Establezca 0 para devolver todo un producto.
                    </div>
                    
                    <div className="table-container">
                      <table className="data-table">
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
                              <td>
                                <div className="quantity-control">
                                  <button 
                                    className="btn-icon btn-outline-danger"
                                    onClick={() => handleQuantityChange(index, producto.cantidad - 1)}
                                    disabled={producto.cantidad <= 0}
                                  >
                                    <FontAwesomeIcon icon={faMinus} />
                                  </button>
                                  <span className="quantity">{producto.cantidad}</span>
                                  <button 
                                    className="btn-icon btn-outline-success"
                                    onClick={() => handleQuantityChange(index, producto.cantidad + 1)}
                                    disabled={producto.cantidad >= selectedTicket.ventas[index].cantidad}
                                  >
                                    <FontAwesomeIcon icon={faPlus} />
                                  </button>
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
                              <strong className="text-danger">
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
                  </div>
                  
                  <div className="modal-footer">
                    <button 
                      onClick={handleSaveEdit}
                      className="btn btn-success"
                      disabled={JSON.stringify(editedProducts) === JSON.stringify(selectedTicket.ventas)}
                    >
                      Confirmar Devolución
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="btn btn-danger"
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