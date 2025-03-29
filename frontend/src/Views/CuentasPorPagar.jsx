import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/CuentasPorPagarStyles.css';
import axios from "../services/root.service.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faMoneyBillWave, faCheckCircle, faSearch, faFilter, faEraser, faCheck, faTimes, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirmationAlert } from '../helpers/swaHelper';
import CuentasPorPagarSkeleton from '../components/CuentasPorPagarSkeleton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CuentasPorPagar = () => {
  const [cuentas, setCuentas] = useState([]);
  const [cuentasAgrupadas, setCuentasAgrupadas] = useState({});
  const [filteredCuentas, setFilteredCuentas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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

  const cuentasPorPagina = 25;
  const navigate = useNavigate();

  // Categorías disponibles
  const categorias = ['Luz', 'Agua','Servicios','Otros'];
  
  // Estados disponibles
  const estados = ['Pendiente', 'Pagado',];

  // Función para agrupar cuentas por nombre y categoría
  const agruparCuentas = (cuentasData) => {
    const agrupadas = {};
    
    cuentasData.forEach(cuenta => {
      const key = `${cuenta.Nombre}-${cuenta.Categoria}`;
      if (!agrupadas[key]) {
        agrupadas[key] = {
          id: key,
          nombre: cuenta.Nombre,
          numeroVerificador: cuenta.numeroVerificador,
          categoria: cuenta.Categoria,
          meses: {}
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
      }
    });
    
    return agrupadas;
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
        const agrupadas = agruparCuentas(cuentas);
        setCuentasAgrupadas(agrupadas);
        
        setTotalPages(Math.ceil(Object.keys(agrupadas).length / cuentasPorPagina));
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
    const agrupadas = agruparCuentas(filtered);
    setCuentasAgrupadas(agrupadas);
    
    setTotalPages(Math.ceil(Object.keys(agrupadas).length / cuentasPorPagina));
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
    const agrupadas = agruparCuentas(cuentas);
    setCuentasAgrupadas(agrupadas);
    setTotalPages(Math.ceil(Object.keys(agrupadas).length / cuentasPorPagina));
    setCurrentPage(1);
  };

  // Manejar paginación
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Mostrar proveedores/categorías según la página actual
  const displayedProveedores = Object.values(cuentasAgrupadas).slice(
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
  // Si ya está pagado, pedir confirmación para desmarcar
  if (estadoActual === 'Pagado') {
    const result = await showConfirmationAlert(
      '¿Desmarcar pago?',
      'Esta acción cambiará el estado de la cuenta de "Pagado" a "Pendiente"',
      'Sí, desmarcar',
      'Cancelar'
    );
    
    if (!result.isConfirmed) {
      return; // Si el usuario cancela, no hacer nada
    }
    
    try {
      // Llamar al endpoint para desmarcar como pagada
      const response = await axios.patch(`/cuentasPorPagar/desmarcar/${id}`);
      if (response.data.status === "success") {
        await fetchCuentas();
        showSuccessAlert('Cuenta desmarcada como pagada', '');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error unmarking as paid:', error);
      showErrorAlert('Error al desmarcar pago', 'Ocurrió un error al intentar desmarcar la cuenta como pagada.');
    }
  } else {
    // Comportamiento original: marcar como pagada
    try {
      const response = await axios.patch(`/cuentasPorPagar/pagar/${id}`);
      if (response.data.status === "success") {
        await fetchCuentas();
        showSuccessAlert('Cuenta marcada como pagada', '');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      showErrorAlert('Error al marcar como pagada', 'Ocurrió un error al intentar marcar la cuenta como pagada.');
    }
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
        showSuccessAlert(isEditing ? 'Cuenta actualizada con éxito' : 'Cuenta creada con éxito', '');
      } else {
        throw new Error(response.data.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error saving cuenta:', error);
      showErrorAlert(
        isEditing ? 'Error al actualizar la cuenta' : 'Error al crear la cuenta',
        'Ocurrió un error al intentar guardar la cuenta.'
      );
    }
  };
  
  // Generar años para el selector (5 años atrás y 5 años adelante)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

// Función para exportar a PDF
const exportarPDF = () => {
  const doc = new jsPDF({
    orientation: 'landscape', // Cambia la orientación a horizontal
    unit: 'mm',
    format: 'a4'
  });
  
  doc.text("Reporte de Cuentas por Pagar", 14, 16);
  doc.text(`Año: ${yearSelected}`, 14, 24);
  
  // Preparar datos para la tabla
  const headers = [
    'Proveedor', 
    'Identificador', 
    'Categoría',
    ...meses.map(mes => mes.nombre)
  ];
  
  const rows = Object.values(cuentasAgrupadas).map(proveedor => {
    const rowData = [
      proveedor.nombre,
      proveedor.numeroVerificador,
      proveedor.categoria
    ];
    
    // Agregar montos por mes
    meses.forEach(mes => {
      const cuentaMes = proveedor.meses[mes.id];
      if (cuentaMes) {
        rowData.push(`$${cuentaMes.monto.toLocaleString()} (${cuentaMes.estado})`);
      } else {
        rowData.push('-');
      }
    });
    
    return rowData;
  });
  
  // Generar tabla
  autoTable(doc, {
    head: [headers],
    body: rows,
    margin: { top: 30 },
    styles: { overflow: 'linebreak' },
    headStyles: { fillColor: [0, 38, 81] }, // Color #002651
    didDrawPage: (data) => {
      // Agregar pie de página con fecha
      const currentDate = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.text(`Fecha de emisión: ${currentDate}`, 14, doc.internal.pageSize.height - 10);
    }
  });
  
  // Guardar PDF
  doc.save(`Cuentas_por_Pagar_${yearSelected}.pdf`);
};

  return (
    <div className="cuentas-pagar-container">
      <Navbar />
      <div className="cuentas-pagar-content">
        {loading ? (
          <CuentasPorPagarSkeleton />
        ) : (
          <>
            <div className="section-title-cuentas">
              Cuentas por Pagar
              <div className="cuentas-buttons">
                <button className="export-pdf-button" onClick={exportarPDF}>
                  <FontAwesomeIcon icon={faFilePdf} /> Exportar PDF
                </button>
                <button className="add-cuenta-button" onClick={handleAddCuenta}>
                  <FontAwesomeIcon icon={faPlus} /> Agregar Cuenta
                </button>
              </div>
            </div>
            
            <div className="filters-container">
              <div className="search-bar-cuentas">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre o identificador..."
                />
              </div>
              
              <div className="filter-group">
                <select 
                  className="filter-select"
                  value={yearSelected}
                  onChange={handleYearChange}
                >
                  {generateYearOptions().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <select 
                  className="filter-select"
                  value={categoriaFilter}
                  onChange={handleCategoriaFilterChange}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select 
                  className="filter-select"
                  value={estadoFilter}
                  onChange={handleEstadoFilterChange}
                >
                  <option value="">Todos los estados</option>
                  {estados.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
                
                <button 
                  className="clear-filters-button"
                  onClick={handleClearFilters}
                >
                  <FontAwesomeIcon icon={faEraser} /> Limpiar Filtros
                </button>
              </div>
            </div>
            
            <div className="cuentas-anual-container">
              <table className="cuentas-anual-table">
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
                  {displayedProveedores.length > 0 ? (
                    displayedProveedores.map((proveedor) => (
                      <tr key={proveedor.id}>
                        <td className="proveedor-column">
                          <div className="proveedor-info">
                            <div className="proveedor-nombre">{proveedor.nombre}</div>
                            <div className="proveedor-id">{proveedor.numeroVerificador}</div>
                          </div>
                        </td>
                        <td className="categoria-column">{proveedor.categoria}</td>
                        
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
                                      className={`estado-checkbox ${cuentaMes.estado === 'Pagado' ? 'checked' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePaid(cuentaMes._id, cuentaMes.estado);
                                      }}
                                    >
                                      {cuentaMes.estado === 'Pagado' ? (
                                        <FontAwesomeIcon icon={faCheck} />
                                      ) : (
                                        <span className="checkbox-empty"></span>
                                      )}
                                    </button>
                                    <button 
                                      className="delete-mini-button"
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
                  ) : (
                    <tr>
                      <td colSpan={meses.length + 2} style={{ textAlign: 'center' }}>
                        No se encontraron cuentas que coincidan con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="pagination">
                {[...Array(totalPages).keys()].map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page + 1)}
                    className={page + 1 === currentPage ? 'active' : ''}
                    disabled={page + 1 === currentPage}
                  >
                    {page + 1}
                  </button>
                ))}
              </div>
            )}
            
            {/* Modal para agregar/editar cuenta */}
            {showModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>{isEditing ? 'Editar Cuenta' : 'Agregar Nueva Cuenta'}</h3>
                  
                  <div className="modal-form-group">
                    <label htmlFor="Nombre">Nombre:</label>
                    <input
                      type="text"
                      id="Nombre"
                      name="Nombre"
                      value={currentCuenta.Nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="modal-form-group">
                    <label htmlFor="numeroVerificador">Identificador/RUT:</label>
                    <input
                      type="text"
                      id="numeroVerificador"
                      name="numeroVerificador"
                      value={currentCuenta.numeroVerificador}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="modal-form-group">
                    <label htmlFor="Mes">Mes:</label>
                    <input
                      type="month"
                      id="Mes"
                      name="Mes"
                      value={currentCuenta.Mes}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="modal-form-group">
                    <label htmlFor="Monto">Monto:</label>
                    <input
                      type="number"
                      id="Monto"
                      name="Monto"
                      value={currentCuenta.Monto}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="modal-form-group">
                    <label htmlFor="Categoria">Categoría:</label>
                    <select
                      id="Categoria"
                      name="Categoria"
                      value={currentCuenta.Categoria}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccione una categoría</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  {isEditing && (
                    <div className="modal-form-group">
                      <label htmlFor="Estado">Estado:</label>
                      <select
                        id="Estado"
                        name="Estado"
                        value={currentCuenta.Estado}
                        onChange={handleInputChange}
                        required
                      >
                        {estados.map(estado => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="modal-buttons">
                    <button 
                      className="confirm-button"
                      onClick={handleSubmit}
                    >
                      {isEditing ? 'Guardar Cambios' : 'Agregar Cuenta'}
                    </button>
                    <button 
                      className="cancel-button"
                      onClick={() => setShowModal(false)}
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

export default CuentasPorPagar;