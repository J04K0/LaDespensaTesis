import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/CuentasPorPagarStyles.css';
import axios from "../services/root.service.js";
import { ExportService } from '../services/export.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faMoneyBillWave, faCheckCircle, faSearch, faFilter, faEraser, faCheck, faTimes, faFilePdf, faCalendarAlt, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirmationAlert } from '../helpers/swaHelper';
import CuentasPorPagarSkeleton from '../components/CuentasPorPagarSkeleton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CuentasPorPagar = () => {
  const [cuentas, setCuentas] = useState([]);
  const [filteredCuentas, setFilteredCuentas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cuentasAgrupadas, setCuentasAgrupadas] = useState({});
  const [ordenProveedores, setOrdenProveedores] = useState([]); // Movido aquí arriba
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [totalPagado, setTotalPagado] = useState(0);
  const [totalPendiente, setTotalPendiente] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCuenta, setCurrentCuenta] = useState({
    Nombre: '',
    numeroVerificador: '',
    Mes: '',
    Monto: '',
    Estado: 'Pendiente',
    Categoria: ''
  });
  // Estado para almacenar los resúmenes mensuales
  const [resumenMensual, setResumenMensual] = useState({});
  const [mesesConDatos, setMesesConDatos] = useState(0);

  // Meses del año para la tabla
  const meses = [
    {id: '01', nombre: 'Enero'},
    {id: '02', nombre: 'Febrero'},
    {id: '03', nombre: 'Marzo'},
    {id: '04', nombre: 'Abril'},
    {id: '05', nombre: 'Mayo'},
    {id: '06', nombre: 'Junio'},
    {id: '07', nombre: 'Julio'},
    {id: '08', nombre: 'Agosto'},
    {id: '09', nombre: 'Septiembre'},
    {id: '10', nombre: 'Octubre'},
    {id: '11', nombre: 'Noviembre'},
    {id: '12', nombre: 'Diciembre'}
  ];
  
  // Año actual para la tabla
  const [yearSelected, setYearSelected] = useState(new Date().getFullYear().toString());

  const cuentasPorPagina = 5; // Modificado de 25 a 5 para mostrar menos elementos por página
  const navigate = useNavigate();

  // Categorías disponibles
  const categorias = ['Luz', 'Agua','Servicios','Otros'];
  
  // Estados disponibles
  const estados = ['Pendiente', 'Pagado',];

  // Función para agrupar cuentas por nombre y categoría
  const agruparCuentas = (cuentasData) => {
    const agrupadas = {};
    const orden = []; // Array para mantener el orden de agregación

    cuentasData.forEach(cuenta => {
      const key = `${cuenta.Nombre}-${cuenta.Categoria}`;
      
      // Si es la primera vez que vemos este proveedor, lo guardamos en el array de orden
      if (!agrupadas[key]) {
        orden.push(key);
        agrupadas[key] = {
          id: key,
          nombre: cuenta.Nombre,
          numeroVerificador: cuenta.numeroVerificador,
          categoria: cuenta.Categoria,
          meses: {},
          cantidadCuentas: 0, // Contador para la cantidad de cuentas por proveedor
          createdAt: cuenta.createdAt || new Date() // Guardamos la fecha de creación para ordenar
        };
      }
      
      // Extraer año y mes de la fecha
      const [year, month] = cuenta.Mes.split('-');
      
      // Agrupar por año y mes
      if (year === yearSelected) {
        agrupadas[key].meses[month] = {
          _id: cuenta._id,
          monto: cuenta.Monto,
          estado: cuenta.Estado
        };
        // Incrementar el contador de cuentas
        agrupadas[key].cantidadCuentas++;
      }
    });
    
    // Ordenar el array 'orden' basado en la cantidad de cuentas que tiene cada proveedor
    orden.sort((a, b) => {
      return agrupadas[b].cantidadCuentas - agrupadas[a].cantidadCuentas;
    });
    
    // Retornamos un objeto con los datos agrupados y el orden
    return { agrupadas, orden };
  };

  // Función fetchCuentas mejorada con manejo de respuestas consistente
  const fetchCuentas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/cuentasPorPagar', {
        params: {
          page: 1,
          limit: 1000,
          categoria: categoriaFilter,
          estado: estadoFilter,
          year: yearSelected // Agregar el año como parámetro de filtro
        }
      });
      
      if (response.data.status === "success") {
        const { cuentas } = response.data.data;
        setCuentas(cuentas);
        setFilteredCuentas(cuentas);
        
        // Agrupar cuentas por nombre y categoría
        const { agrupadas, orden } = agruparCuentas(cuentas);
        setCuentasAgrupadas(agrupadas);
        setOrdenProveedores(orden);
        
        setTotalPages(Math.ceil(orden.length / cuentasPorPagina));
      } else {
        throw new Error(response.data.message || 'Error al obtener las cuentas');
      }
    } catch (error) {
      console.error('Error fetching cuentas:', error);
      
      if (error.response) {
        if (error.response.status === 404) {
          setCuentas([]);
          setFilteredCuentas([]);
          setCuentasAgrupadas({});
          setOrdenProveedores([]);
          setTotalPages(1);
        } else {
          showErrorAlert('Error al cargar las cuentas', error.response.data?.message || 'Error en el servidor');
        }
      } else {
        showErrorAlert('Error de conexión', 'No se pudo conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuentas();
  }, [categoriaFilter, estadoFilter, yearSelected]);

  // Filtrar cuentas por búsqueda
  useEffect(() => {
    if (!cuentas.length) return;
    
    const filtered = cuentas.filter(cuenta => 
      cuenta.Nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cuenta.numeroVerificador.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredCuentas(filtered);
    
    // Agrupar cuentas filtradas
    const { agrupadas, orden } = agruparCuentas(filtered);
    setCuentasAgrupadas(agrupadas);
    setOrdenProveedores(orden);
    
    setTotalPages(Math.ceil(orden.length / cuentasPorPagina));
    setCurrentPage(1);
  }, [searchQuery, cuentas, yearSelected]);

  // Funciones para manejar cambios en los filtros
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoriaFilterChange = (e) => {
    setCategoriaFilter(e.target.value);
  };

  const handleEstadoFilterChange = (e) => {
    setEstadoFilter(e.target.value);
  };

  const handleYearChange = (e) => {
    setYearSelected(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoriaFilter('');
    setEstadoFilter('');
    setYearSelected(new Date().getFullYear().toString());
    setFilteredCuentas(cuentas);
    const { agrupadas } = agruparCuentas(cuentas);
    setCuentasAgrupadas(agrupadas);
    setTotalPages(Math.ceil(Object.keys(agrupadas).length / cuentasPorPagina));
    setCurrentPage(1);
  };

  // Manejar paginación
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Desplazar la ventana hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mostrar proveedores/categorías según la página actual y orden de agregación
  const displayedProveedores = ordenProveedores
    .map(key => cuentasAgrupadas[key])
    .filter(Boolean)
    .slice(
      (currentPage - 1) * cuentasPorPagina,
      currentPage * cuentasPorPagina
    );

  // Agregar nueva cuenta
  const handleAddCuenta = () => {
    setCurrentCuenta({
      Nombre: '',
      numeroVerificador: '',
      Mes: `${yearSelected}-01`,
      Monto: '',
      Estado: 'Pendiente',
      Categoria: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  // Agregar o editar cuenta para un mes específico
  const handleEditMes = (proveedor, mes) => {
    const cuentaExistente = proveedor.meses[mes];
    
    if (cuentaExistente) {
      // Editar cuenta existente
      setCurrentCuenta({
        _id: cuentaExistente._id,
        Nombre: proveedor.nombre,
        numeroVerificador: proveedor.numeroVerificador,
        Mes: `${yearSelected}-${mes}`,
        Monto: cuentaExistente.monto,
        Estado: cuentaExistente.estado,
        Categoria: proveedor.categoria
      });
      setIsEditing(true);
    } else {
      // Crear nueva cuenta para este mes
      setCurrentCuenta({
        Nombre: proveedor.nombre,
        numeroVerificador: proveedor.numeroVerificador,
        Mes: `${yearSelected}-${mes}`,
        Monto: '',
        Estado: 'Pendiente',
        Categoria: proveedor.categoria
      });
      setIsEditing(false);
    }
    
    setShowModal(true);
  };

  // Eliminar cuenta
  const handleDelete = async (id) => {
    const result = await showConfirmationAlert(
      '¿Estás seguro?',
      'Esta acción no se puede revertir',
      'Sí, eliminar',
      'Cancelar'
    );

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`/cuentasPorPagar/eliminar/${id}`);
        if (response.data.status === "success") {
          await fetchCuentas();
          showSuccessAlert('Cuenta eliminada con éxito', '');
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error('Error deleting cuenta:', error);
        showErrorAlert('Error al eliminar la cuenta', 'Ocurrió un error al intentar eliminar la cuenta.');
      }
    }
  };

  // Marcar/desmarcar como pagada
const handleTogglePaid = async (id, estadoActual) => {
  // Mostrar confirmación antes de marcar/desmarcar como pagada
  const result = await showConfirmationAlert(
    estadoActual === 'Pagado'
      ? '¿Desmarcar como pagada?'
      : '¿Marcar como pagada?',
    estadoActual === 'Pagado'
      ? 'Esta acción cambiará el estado de la cuenta a "Pendiente".'
      : 'Esta acción marcará la cuenta como "Pagada".',
    estadoActual === 'Pagado' ? 'Sí, desmarcar' : 'Sí, marcar',
    'No, cancelar'
  );

  if (!result.isConfirmed) return; // Si el usuario cancela, no se realiza la acción

  try {
    const endpoint =
      estadoActual === 'Pagado'
        ? `/cuentasPorPagar/desmarcar/${id}`
        : `/cuentasPorPagar/pagar/${id}`;
    const response = await axios.patch(endpoint);

    if (response.data.status === 'success') {
      await fetchCuentas();
      showSuccessAlert(
        estadoActual === 'Pagado'
          ? 'Cuenta desmarcada como pagada'
          : 'Cuenta marcada como pagada',
        ''
      );
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error(
      estadoActual === 'Pagado'
        ? 'Error al desmarcar como pagada:'
        : 'Error al marcar como pagada:',
      error
    );
    showErrorAlert(
      estadoActual === 'Pagado'
        ? 'Error al desmarcar como pagada'
        : 'Error al marcar como pagada',
      'Ocurrió un error al intentar cambiar el estado de la cuenta.'
    );
  }
};

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCuenta(prev => ({
      ...prev,
      [name]: name === 'Monto' ? parseFloat(value) : value
    }));
  };

  // Enviar formulario
const handleSubmit = async () => {
  // Mostrar confirmación antes de añadir la cuenta
  const result = await showConfirmationAlert(
    "¿Estás seguro?",
    isEditing
      ? "¿Deseas guardar los cambios realizados a esta cuenta?"
      : "¿Deseas añadir esta nueva cuenta?",
    isEditing ? "Sí, guardar" : "Sí, añadir",
    "No, cancelar"
  );

  if (!result.isConfirmed) return; // Si el usuario cancela, no se realiza la acción

  try {
    if (!currentCuenta.Nombre || !currentCuenta.numeroVerificador || !currentCuenta.Mes || 
        !currentCuenta.Monto || !currentCuenta.Estado || !currentCuenta.Categoria) {
      showErrorAlert('Campos incompletos', 'Por favor complete todos los campos requeridos.');
      return;
    }

    let response;
    if (isEditing) {
      const { _id, ...cuentaData } = currentCuenta;
      response = await axios.patch(`/cuentasPorPagar/actualizar/${_id}`, cuentaData);
    } else {
      response = await axios.post('/cuentasPorPagar/agregar', currentCuenta);
    }

    if (response.data.status === "success") {
      await fetchCuentas();
      setShowModal(false);
      showSuccessAlert(
        isEditing ? 'Cuenta actualizada con éxito' : 'Cuenta creada con éxito',
        ''
      );
    } else {
      throw new Error(response.data.message || 'Error desconocido');
    }
  } catch (error) {
    console.error('Error al guardar la cuenta:', error);
    showErrorAlert(
      isEditing ? 'Error al actualizar la cuenta' : 'Error al crear la cuenta',
      'Ocurrió un error al intentar guardar la cuenta.'
    );
  }
};
  
  // Generar años para el selector (10 años atrás y 5 años adelante)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

// Función para exportar a PDF
const exportarPDF = () => {
  ExportService.generarReporteCuentasPorPagar(cuentasAgrupadas, meses, yearSelected);
};

const handleCancel = async () => {
  // Mostrar confirmación antes de cancelar
  const result = await showConfirmationAlert(
    "¿Estás seguro?",
    "¿Deseas cancelar esta acción? Los cambios no se guardarán.",
    "Sí, cancelar",
    "No, volver"
  );

  if (result.isConfirmed) {
    setShowModal(false); // Cerrar el modal si el usuario confirma
  }
};

  // Calcular totales mensuales para el resumen anual
  const calcularTotalesMensuales = (cuentasData) => {
    const resumen = {};
    
    cuentasData.forEach(cuenta => {
      // Extraer año y mes de la fecha
      const [year, month] = cuenta.Mes.split('-');
      
      if (year === yearSelected) {
        if (!resumen[month]) {
          resumen[month] = {
            total: 0,
            pagado: 0,
            pendiente: 0
          };
        }
        
        resumen[month].total += cuenta.Monto;
        if (cuenta.Estado === 'Pagado') {
          resumen[month].pagado += cuenta.Monto;
        } else {
          resumen[month].pendiente += cuenta.Monto;
        }
      }
    });
    
    setResumenMensual(resumen);
    
    // Calcular totales generales
    const totalGen = cuentasData.reduce((sum, cuenta) => sum + cuenta.Monto, 0);
    const totalPag = cuentasData.filter(cuenta => cuenta.Estado === 'Pagado').reduce((sum, cuenta) => sum + cuenta.Monto, 0);
    const totalPen = cuentasData.filter(cuenta => cuenta.Estado === 'Pendiente').reduce((sum, cuenta) => sum + cuenta.Monto, 0);
    
    // Calcular el número de meses con datos
    const mesesConDatos = Object.keys(resumen).length;
    
    setTotalGeneral(totalGen);
    setTotalPagado(totalPag);
    setTotalPendiente(totalPen);
    
    // Almacenar el número de meses con datos para usarlo en el cálculo del promedio
    return { mesesConDatos };
  };

  useEffect(() => {
    const { mesesConDatos } = calcularTotalesMensuales(cuentas);
    setMesesConDatos(mesesConDatos);
  }, [cuentas, yearSelected]);

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        {loading ? (
          <CuentasPorPagarSkeleton />
        ) : (
          <>
            <div className="page-header">
              <h1 className="page-title">Cuentas por Pagar</h1>
              <div className="d-flex gap-sm">
                <button className="btn-export-pdf" onClick={exportarPDF}>
                  <FontAwesomeIcon icon={faFilePdf} /> Descargar PDF
                </button>
                <button className="btn btn-primary" onClick={handleAddCuenta}>
                  <FontAwesomeIcon icon={faPlus} /> Agregar Cuenta
                </button>
              </div>
            </div>
            
            {/* Cuadros de resumen */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-icon total">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                </div>
                <div className="summary-info">
                  <h3>Promedio Mensual</h3>
                  <p className="summary-value">${(mesesConDatos > 0 ? totalGeneral / mesesConDatos : 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                  <span className="summary-label">Facturas a Pagar: {cuentas.length} | Meses activos: {mesesConDatos}</span>
                </div>
                <div className="summary-trend">
                  <span className="trend-percentage">{cuentas.length > 0 ? '+' + (totalGeneral/cuentas.length).toFixed(0) : '0'}</span>
                  <span className="trend-label">Promedio por factura</span>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon paid">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </div>
                <div className="summary-info">
                  <h3>Total Pagado</h3>
                  <p className="summary-value">${totalPagado.toLocaleString()}</p>
                  <span className="summary-label">Facturas Pagadas: {cuentas.filter(c => c.Estado === 'Pagado').length}</span>
                </div>
                <div className="summary-trend positive">
                  <span className="trend-percentage">{totalGeneral > 0 ? ((totalPagado/totalGeneral)*100).toFixed(1)+'%' : '0%'}</span>
                  <span className="trend-label">del total facturado</span>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon pending">
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                </div>
                <div className="summary-info">
                  <h3>Total Pendiente</h3>
                  <p className="summary-value">${totalPendiente.toLocaleString()}</p>
                  <span className="summary-label">Facturas Pendientes: {cuentas.filter(c => c.Estado === 'Pendiente').length}</span>
                </div>
                <div className="summary-trend negative">
                  <span className="trend-percentage">{totalGeneral > 0 ? ((totalPendiente/totalGeneral)*100).toFixed(1)+'%' : '0%'}</span>
                  <span className="trend-label">del total facturado</span>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon analytics">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="summary-info">
                  <h3>Análisis Anual</h3>
                  <div className="progress-circle-container">
                    <div 
                      className="progress-circle"
                      style={{
                        '--progress': `${totalGeneral ? ((totalPagado/totalGeneral)*100) : 0}%`
                      }}
                    >
                      <div className="progress-circle-value">{totalGeneral ? ((totalPagado/totalGeneral)*100).toFixed(1) : 0}%</div>
                    </div>
                  </div>
                  <span className="summary-label">
                    Periodo: {yearSelected} | Facturas pagadas: {cuentas.filter(c => c.Estado === 'Pagado').length}/{cuentas.length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="filters-container">
              <h2><FontAwesomeIcon icon={faFilter} /> Búsqueda y Filtros</h2>
              
              <div className="filters-vertical">
                <div className="filter-item">
                  <div className="search-container">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Buscar proveedor..."
                    />
                  </div>
                </div>
                
                <div className="filter-item">
                  <select 
                    className="form-select"
                    value={yearSelected}
                    onChange={handleYearChange}
                  >
                    {generateYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-item">
                  <select 
                    className="form-select"
                    value={categoriaFilter}
                    onChange={handleCategoriaFilterChange}
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-item">
                  <select 
                    className="form-select"
                    value={estadoFilter}
                    onChange={handleEstadoFilterChange}
                  >
                    <option value="">Todos los estados</option>
                    {estados.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-item">
                  <button 
                    className="btn btn-secondary"
                    onClick={handleClearFilters}
                  >
                    <FontAwesomeIcon icon={faEraser} /> Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
            
            <div className="table-container cuentas-anual-container">
              <table className="data-table cuentas-anual-table">
                <thead>
                  <tr>
                    <th className="proveedor-column">Proveedor</th>
                    <th className="categoria-column">Categoría</th>
                    {meses.map(mes => (
                      <th key={mes.id} className="mes-column">{mes.nombre}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedProveedores.length > 0 
                    ? displayedProveedores.map((proveedor) => (
                      <tr key={proveedor.id}>
                        <td className="proveedor-column">
                          <div className="proveedor-info">
                            <div className="proveedor-nombre">{proveedor.nombre}</div>
                            <div className="proveedor-id text-secondary">{proveedor.numeroVerificador}</div>
                          </div>
                        </td>
                        <td className="categoria-column">
                          <span className="state-badge">{proveedor.categoria}</span>
                        </td>
                        
                        {meses.map(mes => {
                          const cuentaMes = proveedor.meses[mes.id];
                          return (
                            <td 
                              key={mes.id} 
                              className={`mes-cell ${cuentaMes ? `estado-${cuentaMes.estado.toLowerCase()}` : ''}`}
                              onClick={() => handleEditMes(proveedor, mes.id)}
                            >
                              {cuentaMes ? (
                                <div className="cuenta-mes-info">
                                  <div className="cuenta-monto">
                                    ${cuentaMes.monto.toLocaleString()}
                                  </div>
                                  <div className="cuenta-actions">
                                    <button 
                                      className={`btn-icon ${cuentaMes.estado === 'Pagado' ? 'btn-success' : 'btn-outline-success'}`}
                                      title={cuentaMes.estado === 'Pagado' ? 'Desmarcar como pagada' : 'Marcar como pagada'}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePaid(cuentaMes._id, cuentaMes.estado);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faCheck} />
                                    </button>
                                    <button 
                                      className="btn-icon btn-danger"
                                      title="Eliminar"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(cuentaMes._id);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="add-cuenta-placeholder">
                                  <span>+</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                    : (
                      <tr>
                        <td colSpan={meses.length + 2} className="text-center">
                          No se encontraron cuentas que coincidan con los filtros.
                        </td>
                      </tr>
                    )
                  }
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(1)}
                  className="pagination-button"
                  disabled={currentPage === 1}
                >
                  « Primera
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="pagination-button"
                  disabled={currentPage === 1}
                >
                  ‹ Anterior
                </button>
                
                {[...Array(totalPages).keys()].map(page => {
                  const pageNum = page + 1;
                  // Solo mostrar el número actual y algunos números cercanos para no sobrecargar la UI
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(pageNum)}
                        className={`pagination-button ${pageNum === currentPage ? 'active' : ''}`}
                        disabled={pageNum === currentPage}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    (pageNum === currentPage - 3 && currentPage > 4) || 
                    (pageNum === currentPage + 3 && currentPage < totalPages - 3)
                  ) {
                    // Mostrar puntos suspensivos para indicar páginas omitidas
                    return <span key={page} className="pagination-ellipsis">...</span>;
                  }
                  return null;
                })}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="pagination-button"
                  disabled={currentPage === totalPages}
                >
                  Siguiente ›
                </button>
                <button 
                  onClick={() => handlePageChange(totalPages)}
                  className="pagination-button"
                  disabled={currentPage === totalPages}
                >
                  Última »
                </button>
              </div>
            )}
            
            {/* Modal para agregar/editar cuenta */}
            {showModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Editar Cuenta' : 'Agregar Nueva Cuenta'}</h2>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="Nombre">Nombre:</label>
                    <input
                      type="text"
                      id="Nombre"
                      name="Nombre"
                      value={currentCuenta.Nombre}
                      onChange={handleInputChange}
                      required
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="numeroVerificador">Identificador/RUT:</label>
                    <input
                      type="text"
                      id="numeroVerificador"
                      name="numeroVerificador"
                      value={currentCuenta.numeroVerificador}
                      onChange={handleInputChange}
                      required
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="Mes">Mes:</label>
                    <input
                      type="month"
                      id="Mes"
                      name="Mes"
                      value={currentCuenta.Mes}
                      onChange={handleInputChange}
                      required
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="Monto">Monto:</label>
                    <input
                      type="number"
                      id="Monto"
                      name="Monto"
                      value={currentCuenta.Monto}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="Categoria">Categoría:</label>
                    <select
                      id="Categoria"
                      name="Categoria"
                      value={currentCuenta.Categoria}
                      onChange={handleInputChange}
                      required
                      className="form-select"
                    >
                      <option value="">Seleccione una categoría</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  {isEditing && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="Estado">Estado:</label>
                      <select
                        id="Estado"
                        name="Estado"
                        value={currentCuenta.Estado}
                        onChange={handleInputChange}
                        required
                        className="form-select"
                      >
                        {estados.map(estado => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="modal-footer">
                    <button 
                      className="btn btn-success"
                      onClick={handleSubmit}
                    >
                      {isEditing ? 'Guardar Cambios' : 'Agregar Cuenta'}
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={handleCancel}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Resumen anual */}
            <div className="resumen-anual-container">
              <div className="resumen-header">
                <h2>Resumen Anual</h2>
              </div>
              
              <div className="summary-cards">
                {Object.entries(resumenMensual).length > 0 ? (
                  Object.entries(resumenMensual).map(([mes, datos]) => (
                    <div key={mes} className="summary-card">
                      <div className={`summary-icon ${datos.pendiente > 0 ? 'pending' : 'paid'}`}>
                        <FontAwesomeIcon icon={datos.pendiente > 0 ? faMoneyBillWave : faCheckCircle} />
                      </div>
                      <div className="summary-info">
                        <h3>{meses.find(m => m.id === mes)?.nombre}</h3>
                        <p className="summary-value">${datos.total.toLocaleString()}</p>
                        <span className="summary-label">
                          Pagado: ${datos.pagado.toLocaleString()} | Pendiente: ${datos.pendiente.toLocaleString()}
                        </span>
                      </div>
                      <div className={`summary-trend ${datos.pendiente > 0 ? 'negative' : 'positive'}`}>
                        <span className="trend-percentage">
                          {datos.total > 0 ? ((datos.pagado/datos.total)*100).toFixed(1)+'%' : '0%'}
                        </span>
                        <span className="trend-label">pagado</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="summary-card">
                    <div className="summary-info">
                      <h3>Sin datos</h3>
                      <p className="summary-value">No hay datos disponibles</p>
                    </div>
                  </div>
                )}
                
                {/* Tarjeta de totales generales */}
                <div className="summary-card">
                  <div className="summary-icon total">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                  <div className="summary-info">
                    <h3>Total Anual</h3>
                    <p className="summary-value">${totalGeneral.toLocaleString()}</p>
                    <span className="summary-label">
                      Pagado: ${totalPagado.toLocaleString()} | Pendiente: ${totalPendiente.toLocaleString()}
                    </span>
                  </div>
                  <div className="progress-circle-container">
                    <div 
                      className="progress-circle"
                      style={{
                        '--progress': `${totalGeneral ? ((totalPagado/totalGeneral)*100) : 0}%`
                      }}
                    >
                      <div className="progress-circle-value">{totalGeneral ? ((totalPagado/totalGeneral)*100).toFixed(1) : 0}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CuentasPorPagar;