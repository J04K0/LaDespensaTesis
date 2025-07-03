import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import SmartPagination from '../components/SmartPagination';
import { obtenerVentasPorTicket, eliminarTicket, editarTicket, obtenerVentasAnuladas } from "../services/venta.service.js";
import { ExportService } from '../services/export.service.js';
import "../styles/HistorySaleStyles.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import HistorySaleSkeleton from '../components/Skeleton/HistorySaleSkeleton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faTimes, faSearch, faFilter, faFilePdf, faFileExcel, faPlus, faMinus, faMoneyBillAlt, faCreditCard, faEye, faUser } from '@fortawesome/free-solid-svg-icons';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert } from "../helpers/swaHelper";
import { useRole } from '../hooks/useRole';

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
  const [comentarioDevolucion, setComentarioDevolucion] = useState('');

  // Estado para mostrar u ocultar ventas anuladas
  const [showVentasAnuladas, setShowVentasAnuladas] = useState(false);

  // 🔧 Obtener el rol del usuario para restricciones
  const { userRole } = useRole();
  const isEmpleado = userRole === 'empleado';

  // 🔧 Mostrar mensaje informativo para empleados
  const showEmpleadoAlert = () => {
    showErrorAlert(
      "Acceso Restringido", 
      "Los empleados solo pueden consultar el historial de ventas. Las funciones de edición y eliminación están disponibles solo para administradores y jefes."
    );
  };

  useEffect(() => {
    fetchVentas();
  }, [showVentasAnuladas]);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar errores previos
      let response;
            
      if (showVentasAnuladas) {
        response = await obtenerVentasAnuladas();
      } else {
        response = await obtenerVentasPorTicket();
      }
      
      // 🔧 FIX: Acceder correctamente a los datos según el tipo de respuesta
      let ventasData = [];
      if (showVentasAnuladas) {
        // Para ventas anuladas: response.data.ventas
        ventasData = Array.isArray(response?.data?.ventas) ? response.data.ventas : [];
      } else {
        // Para ventas activas: response.data
        ventasData = Array.isArray(response?.data) ? response.data : [];
      }
      
      
      setVentas(ventasData);
      setFilteredVentas(ventasData);
      setCurrentPage(1); // Resetear página al cambiar tipo de ventas
      
      // Limpiar filtros cuando se cambia de tipo de vista
      setSearchQuery("");
      setSortOption("");
      setCategoryFilter("");
      setDateRange({ start: "", end: "" });
      setTotalRange({ min: "", max: "" });
      
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener el historial de ventas:", error);
      setError("Error al obtener el historial de ventas.");
      // Asegurar que tenemos arrays vacíos en caso de error
      setVentas([]);
      setFilteredVentas([]);
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
    // Usar SweetAlert2 directamente para tener más control sobre el input
    const Swal = (await import('sweetalert2')).default;
    
    const { value: motivo, dismiss } = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas anular esta venta? El registro se conservará para auditoría.',
      input: 'textarea',
      inputLabel: 'Motivo de anulación (requerido)',
      inputPlaceholder: 'Escribe el motivo de la anulación...',
      inputAttributes: {
        maxlength: 255,
        'aria-label': 'Motivo de anulación',
        required: 'true'
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, anular venta',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#718096',
      showLoaderOnConfirm: true,
      preConfirm: (value) => {
        // Validar que el motivo no esté vacío
        if (!value || value.trim() === '') {
          Swal.showValidationMessage('El motivo de anulación es obligatorio');
          return false;
        }
        if (value.trim().length < 3) {
          Swal.showValidationMessage('El motivo debe tener al menos 3 caracteres');
          return false;
        }
        if (value.trim().length > 255) {
          Swal.showValidationMessage('El motivo no puede exceder 255 caracteres');
          return false;
        }
        return value.trim();
      },
      allowOutsideClick: () => !Swal.isLoading()
    });

    // Si el usuario canceló, no hacer nada
    if (dismiss === Swal.DismissReason.cancel || dismiss === Swal.DismissReason.backdrop) {
      return;
    }

    // Si llegamos aquí, el motivo ya fue validado y no está vacío
    try {
      setLoading(true);
            
      await eliminarTicket(ticketId, motivo);
      showSuccessAlert("Éxito", "Venta anulada correctamente. El registro se ha conservado para auditoría.");
      // Refrescar la lista de ventas
      await fetchVentas();
    } catch (error) {
      console.error("Error al anular ticket:", error);
      
      // 🔧 MEJORAR: Manejo de errores más específico
      let errorMessage = "No se pudo anular la venta";
      
      if (error.message) {
        // Si es un error de validación, mostrar el mensaje específico
        if (error.message.includes('motivo') || error.message.includes('ticket')) {
          errorMessage = error.message;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 404) {
          errorMessage = "La venta no fue encontrada o ya fue anulada";
        } else if (error.response?.status === 403) {
          errorMessage = "No tienes permisos para anular esta venta";
        } else if (error.response?.status >= 500) {
          errorMessage = "Error del servidor. Por favor, intente nuevamente";
        }
      }
      
      showErrorAlert("Error", errorMessage);
      setLoading(false);
    }
  };

  // Función para manejar la edición de un ticket (devolución parcial)
  const handleEditTicket = (ticket) => {
    if (isEmpleado) {
      showEmpleadoAlert();
      return;
    }

    setSelectedTicket(ticket);
    // Clonar los productos para poder editarlos
    setEditedProducts([...ticket.ventas.map(item => ({...item}))]);
    setComentarioDevolucion(''); // Reiniciar comentario al editar
    setShowEditModal(true);
  };

  // Función para guardar los cambios en un ticket
  const handleSaveEdit = async () => {
    // 🆕 Validar que el comentario no esté vacío
    if (!comentarioDevolucion.trim()) {
      showErrorAlert("Comentario requerido", "Debe ingresar un comentario explicando el motivo de la devolución.");
      return;
    }
    
    if (comentarioDevolucion.trim().length < 5) {
      showErrorAlert("Comentario muy corto", "El comentario debe tener al menos 5 caracteres.");
      return;
    }
    
    try {
      setLoading(true);
      await editarTicket(selectedTicket._id, editedProducts, comentarioDevolucion);
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
  const handleCancelEdit = async () => {
    // Verificar si hay cambios sin guardar
    const hasChanges = JSON.stringify(editedProducts) !== JSON.stringify(selectedTicket.ventas);
    
    if (hasChanges) {
      const result = await showConfirmationAlert(
        "¿Estás seguro?",
        "¿Deseas cancelar la devolución? Los cambios no se guardarán.",
        "Sí, cancelar",
        "No, volver"
      );

      if (!result.isConfirmed) return;
    }

    setShowEditModal(false);
    setSelectedTicket(null);
    setEditedProducts([]);
    setComentarioDevolucion(''); // Reiniciar comentario al cerrar
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

  const sortedVentas = (Array.isArray(filteredVentas) ? [...filteredVentas] : []).sort((a, b) => {
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
    const dataToExport = sortedVentas.length > 0 ? sortedVentas : ventas;
    ExportService.generarReporteHistorialVentas(dataToExport);
  };

  const exportToExcel = () => {
    const dataToExport = sortedVentas.length > 0 ? sortedVentas : ventas;

    const ws = XLSX.utils.json_to_sheet(
      dataToExport.map((venta) => ({
        Ticket: venta._id,
        Fecha: new Date(venta.fecha).toLocaleDateString(),
        Usuario: venta.usuario ? venta.usuario.nombre || venta.usuario.username : "Usuario desconocido",
        "Método de Pago": venta.deudorId ? `Deudor: ${venta.deudor?.Nombre || 'Desconocido'}` : venta.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo',
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
      <div className="historysalecontainer">
        {loading ? (
          <HistorySaleSkeleton />
        ) : (
          <>
            <div className="historysalemaincontent">
              <div className="historysaleheader">
                <div className="title-container">
                  <h1 className="historysaletitle">
                    {showVentasAnuladas ? 'Historial de Ventas Anuladas' : 'Historial de Ventas'}
                  </h1>
                  <p className="historysale-subtitle">
                    {showVentasAnuladas 
                      ? 'Consulta el registro de todas las ventas anuladas para auditoría y control'
                      : 'Consulta, gestiona y analiza todas las transacciones realizadas en tu negocio'
                    }
                  </p>
                  {showVentasAnuladas && (
                    <div className="anuladas-warning">
                      ⚠️ Estas ventas han sido anuladas y se mantienen únicamente para auditoría
                    </div>
                  )}
                </div>
                <div className="historysaleexportbuttons">
                  {!isEmpleado && (
                    <button 
                      className="historysaleexportbtn anuladas" 
                      onClick={() => setShowVentasAnuladas(!showVentasAnuladas)}
                    >
                      <FontAwesomeIcon icon={faEye} /> 
                      {showVentasAnuladas ? 'Ver Ventas Activas' : 'Ver Ventas Anuladas'}
                    </button>
                  )}
                  <button className="historysaleexportbtn pdf" onClick={exportToPDF}>
                    <FontAwesomeIcon icon={faFilePdf} /> Descargar PDF
                  </button>
                </div>
              </div>
            
              <div className="historysalefilters">
                <div className="historysalesearchcontainer">
                  <FontAwesomeIcon icon={faSearch} className="historysalesearchicon" />
                  <input
                    type="text"
                    placeholder="Buscar por producto..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="historysalesearchbar"
                  />
                </div>
                
                <div className="historysaledropdowns">
                  <div className="historysalefiltergroup">
                    <select
                      onChange={handleSortChange}
                      value={sortOption}
                      className="historysaleselect"
                    >
                      <option value="">Ordenar por</option>
                      <option value="date-asc">Fecha (Ascendente)</option>
                      <option value="date-desc">Fecha (Descendente)</option>
                      <option value="total-asc">Precio Total (Ascendente)</option>
                      <option value="total-desc">Precio Total (Descendente)</option>
                    </select>
                  </div>
                  
                  <div className="historysalefiltergroup">
                    <select
                      onChange={handleFilterByCategory}
                      value={categoryFilter}
                      className="historysaleselect"
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
                </div>
                
                <div className="historysalefiltercontrols">
                  <div className="historysalefilterdates">
                    <div className="historysaledate">
                      <label>Desde:</label>
                      <input
                        type="date"
                        name="start"
                        value={dateRange.start}
                        onChange={handleDateRangeChange}
                        className="historysaledateinput"
                      />
                    </div>
                    <div className="historysaledate">
                      <label>Hasta:</label>
                      <input
                        type="date"
                        name="end"
                        value={dateRange.end}
                        onChange={handleDateRangeChange}
                        className="historysaledateinput"
                      />
                    </div>
                  </div>
                  
                  <div className="historysaletotals">
                    <div className="historysaleamount">
                      <label>Mínimo:</label>
                      <div className="historysaleinputwrapper">
                        <span className="historysalecurrencysymbol">$</span>
                        <input
                          type="number"
                          name="min"
                          value={totalRange.min}
                          onChange={handleTotalRangeChange}
                          className="historysaleamountinput"
                          placeholder=""
                        />
                      </div>
                    </div>
                    <div className="historysaleamount">
                      <label>Máximo:</label>
                      <div className="historysaleinputwrapper">
                        <span className="historysalecurrencysymbol">$</span>
                        <input
                          type="number"
                          name="max"
                          value={totalRange.max}
                          onChange={handleTotalRangeChange}
                          className="historysaleamountinput"
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleClearFilters}
                    className="historysaleclearfiltersbtn"
                  >
                    <FontAwesomeIcon icon={faFilter} /> Limpiar Filtros
                  </button>
                </div>
              </div>

              {error ? (
                <div className="alert alert-danger">{error}</div>
              ) : (
                <>
                  <div className="historysaletablecontainer">
                    <table className="historysaletable">
                      <thead>
                        <tr>
                          <th className="codigo-column">CÓDIGO</th>
                          <th className="fecha-column">FECHA</th>
                          <th className="usuario-column">USUARIO</th>
                          <th className="metodo-column">MÉTODO DE PAGO</th>
                          <th className="productos-column">DETALLE DE PRODUCTOS</th>
                          <th className="total-column">IMPORTE TOTAL</th>
                          {showVentasAnuladas ? (
                            <>
                              <th className="anulacion-column">FECHA ANULACIÓN</th>
                              <th className="anulado-por-column">ANULADO POR</th>
                              <th className="motivo-column">MOTIVO / COMENTARIO</th>
                            </>
                          ) : (
                            <th className="acciones-column">ACCIONES</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentVentas.length > 0 ? (
                          currentVentas.map((venta, index) => (
                            <tr key={index} className={showVentasAnuladas ? 'venta-anulada' : ''}>
                              <td className="codigo-cell">
                                <div className="ticket-code">
                                  {venta._id}
                                  {showVentasAnuladas && (
                                    <span className="estado-badge anulada">ANULADA</span>
                                  )}
                                </div>
                              </td>
                              <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                              <td>{venta.usuario ? venta.usuario.nombre || venta.usuario.username : "Usuario desconocido"}</td>
                              <td>
                                {venta.deudorId ? (
                                  <div className="historysalemetodopago deudor">
                                    <FontAwesomeIcon 
                                      icon={faUser} 
                                      className="metodo-icon"
                                    />
                                    <span>Deudor: {venta.deudor?.Nombre || 'Desconocido'}</span>
                                  </div>
                                ) : (
                                  <div className={`historysalemetodopago ${venta.metodoPago === 'tarjeta' ? 'tarjeta' : 'efectivo'}`}>
                                    <FontAwesomeIcon 
                                      icon={venta.metodoPago === 'tarjeta' ? faCreditCard : faMoneyBillAlt} 
                                      className="metodo-icon"
                                    />
                                    <span>{venta.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}</span>
                                  </div>
                                )}
                              </td>
                              <td className="productos-cell">
                                {venta.ventas.map((producto, i) => (
                                  <div key={i} className="producto-item">
                                    <div className="producto-nombre">
                                      {producto.nombre}
                                      {showVentasAnuladas && producto.cantidadOriginal && (
                                        <span className="cantidad-original">
                                          (Original: {producto.cantidadOriginal})
                                        </span>
                                      )}
                                    </div>
                                    <div className="producto-cantidad">
                                      <span className="cantidad-badge">{producto.cantidad}x</span>
                                      <span className="precio-producto">${producto.precioVenta.toLocaleString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </td>
                              <td className="importe-cell">
                                ${venta.ventas.reduce(
                                  (acc, producto) => acc + producto.cantidad * producto.precioVenta,
                                  0
                                ).toLocaleString()}
                              </td>
                              {showVentasAnuladas ? (
                                <>
                                  <td className="anulacion-cell">
                                    {venta.fechaAnulacion ? 
                                      new Date(venta.fechaAnulacion).toLocaleDateString() : 
                                      (venta.fechaDevolucion ? new Date(venta.fechaDevolucion).toLocaleDateString() : 'N/A')
                                    }
                                  </td>
                                  <td className="anulado-por-cell">
                                    {venta.usuarioAnulacion ? 
                                      (venta.usuarioAnulacion.nombre || venta.usuarioAnulacion.username) :
                                      (venta.usuarioDevolucion ? 
                                        (venta.usuarioDevolucion.nombre || venta.usuarioDevolucion.username) : 'N/A')
                                    }
                                  </td>
                                  <td className="motivo-cell">
                                    <div className="motivo-content">
                                      {/* Mostrar motivo de anulación o comentario de devolución según el tipo */}
                                      {venta.estado === 'anulada' ? (
                                        // Para ventas anuladas totalmente
                                        <div>
                                          <strong>Motivo de Anulación:</strong>
                                          <br />
                                          {venta.motivoAnulacion || 'Sin motivo especificado'}
                                        </div>
                                      ) : venta.estado === 'devuelta_parcial' ? (
                                        // Para devoluciones parciales
                                        <div>
                                          <strong>Devolución Parcial:</strong>
                                          <br />
                                          {venta.comentarioDevolucion || 'Sin comentario de devolución'}
                                        </div>
                                      ) : (
                                        // Fallback
                                        <div>
                                          {venta.motivoAnulacion || venta.comentarioDevolucion || 'Sin información disponible'}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <td className="acciones-cell">
                                  <div className="historysaleactionbuttons">
                                    {isEmpleado ? (
                                      // 🔧 Mensaje informativo para empleados
                                      <div className="employee-info-text">
                                        <span>Solo lectura</span>
                                      </div>
                                    ) : (
                                      // 🔧 Botones completos para admin y jefe
                                      <>
                                        <button 
                                          onClick={() => handleEditTicket(venta)} 
                                          className="devolver-btn"
                                          title="Devolver productos"
                                        >
                                          <FontAwesomeIcon icon={faEdit} /> Devolver
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteTicket(venta._id)} 
                                          className="anular-btn"
                                          title="Anular venta"
                                        >
                                          <FontAwesomeIcon icon={faTrash} /> Anular
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={showVentasAnuladas ? "9" : "7"} className="no-data-cell">
                              {showVentasAnuladas ? 'No hay ventas anuladas registradas' : 'No hay ventas registradas'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <SmartPagination
                    currentPage={currentPage}
                    totalPages={Math.ceil((Array.isArray(filteredVentas) ? filteredVentas.length : 0) / ventasPerPage)}
                    onPageChange={paginate}
                    className="historysalepagination"
                    buttonClassName="historysalepaginationbutton"
                    activeClassName="active"
                    maxVisiblePages={5}
                  />
                </>
              )}
            </div>
            
            {/* Modal para editar ticket / devolver productos */}
            {showEditModal && selectedTicket && (
              <div className="historysalemodaloverlay">
                <div className="historysalemodalcontent">
                  <div className="historysalemodalheader">
                    <h2 className="modal-title">Devolución de Productos - Ticket {selectedTicket._id}</h2>
                    <button 
                      className="historysalemodalclose" 
                      onClick={handleCancelEdit}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  
                  <div className="historysalemodalbody">
                    <div className="historysalemodalinstructions">
                      Modifique las cantidades para realizar devoluciones parciales o totales. Establezca 0 para devolver todo un producto.
                    </div>
                    
                    <div className="table-container">
                      <table className="historysalemodaltable">
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
                              <td>${producto.precioVenta.toLocaleString()}</td>
                              <td className="quantity-cell">
                                <div className="quantity-controls">
                                  <button 
                                    onClick={() => handleQuantityChange(index, producto.cantidad - 1)}
                                    disabled={producto.cantidad <= 0}
                                  >
                                    <FontAwesomeIcon icon={faMinus} />
                                  </button>
                                  <span>{producto.cantidad}</span>
                                  <button 
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
                    
                    <div className="comentario-devolucion-container">
                      <label className="comentario-devolucion-label">Comentario de Devolución (Requerido):</label>
                      <textarea
                        value={comentarioDevolucion}
                        onChange={(e) => setComentarioDevolucion(e.target.value)}
                        className="comentario-devolucion-textarea"
                        placeholder="Ingrese el motivo de la devolución (mínimo 5 caracteres)..."
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="historysalemodalfooter">
                    <button 
                      onClick={handleSaveEdit}
                      className="historysaleconfirmbutton"
                      disabled={JSON.stringify(editedProducts) === JSON.stringify(selectedTicket.ventas)}
                    >
                      Confirmar Devolución
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="historysalecancelbutton"
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