import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import SmartPagination from '../components/SmartPagination.jsx';
import { getCuentasPorPagar, deleteCuentaPorPagar, updateCuentaPorPagar, cambiarEstadoCuenta } from '../services/cuentasPorPagar.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faTimes, faSave, faMoneyBillWave, faCalendarAlt, faExclamationTriangle, faCheck, faFilePdf, faCheckCircle, faChartLine, faFilter, faEraser, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert, showEmpleadoAccessDeniedAlert } from '../helpers/swaHelper.js';
import { useRole } from '../hooks/useRole.js';
import CuentasPorPagarSkeleton from '../components/Skeleton/CuentasPorPagarSkeleton.jsx';
import '../styles/CuentasPorPagarStyles.css';
import '../styles/SmartPagination.css';
import axios from "../services/root.service.js";
import { ExportService } from '../services/export.service.js';
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
  const [estadoCuentasFilter, setEstadoCuentasFilter] = useState('activas'); // Nuevo filtro para activas/inactivas
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
      
      // Filtrar cuentas según el estado activo/inactivo
      let cuentasFiltradas = [];
      
      if (estadoCuentasFilter === 'inactivas') {
        // Obtener todas las cuentas y filtrar las inactivas
        const responseAll = await axios.get('/cuentasPorPagar', {
          params: {
            page: 1,
            limit: 10000,
            categoria: categoriaFilter,
            estado: estadoFilter,
            year: yearSelected
          }
        });
        
        if (responseAll.data.status === "success") {
          const todasLasCuentas = responseAll.data.data.cuentas;
          // Filtrar solo las cuentas que están marcadas como inactivas
          cuentasFiltradas = todasLasCuentas.filter(cuenta => cuenta.Activo === false);
        }
      } else {
        // Obtener solo las cuentas activas (comportamiento normal)
        const response = await axios.get('/cuentasPorPagar', {
          params: {
            page: 1,
            limit: 1000,
            categoria: categoriaFilter,
            estado: estadoFilter,
            year: yearSelected
          }
        });
        
        if (response.data.status === "success") {
          const { cuentas } = response.data.data;
          // Filtrar solo las cuentas activas (Activo !== false)
          cuentasFiltradas = cuentas.filter(cuenta => cuenta.Activo !== false);
        }
      }
      
      setCuentas(cuentasFiltradas);
      setFilteredCuentas(cuentasFiltradas);
      
      // Agrupar cuentas por nombre y categoría
      const { agrupadas, orden } = agruparCuentas(cuentasFiltradas);
      setCuentasAgrupadas(agrupadas);
      setOrdenProveedores(orden);
      
      setTotalPages(Math.ceil(orden.length / cuentasPorPagina));
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
  }, [categoriaFilter, estadoFilter, yearSelected, estadoCuentasFilter]);

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

  // Efectos para manejar el rendimiento del modal
  useEffect(() => {
    // Bloquear el scroll del body cuando el modal está abierto
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Limpieza al desmontar el componente
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showModal]);

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

  const handleEstadoCuentasFilterChange = (e) => {
    setEstadoCuentasFilter(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoriaFilter('');
    setEstadoFilter('');
    setYearSelected(new Date().getFullYear().toString());
    setEstadoCuentasFilter('activas');
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

// 🆕 Función para manejar clic en el overlay del modal
const handleModalOverlayClick = async (e) => {
  if (e.target === e.currentTarget) {
    await handleCancel();
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

  // Función helper para formatear números con punto como separador de miles
const formatNumberWithDots = (number) => {
  if (typeof number !== 'number' || isNaN(number)) return '0';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// 🔧 Obtener el rol del usuario para restricciones
const { userRole } = useRole();
const isEmpleado = userRole === 'empleado';

// 🔧 Función para mostrar alerta de empleado
const showEmpleadoAlert = () => {
  showEmpleadoAccessDeniedAlert("la gestión de cuentas por pagar", "Las cuentas pueden ser consultadas pero solo administradores y jefes pueden crear, editar o eliminar.");
};

// 🆕 Función para manejar clic en "Agregar Cuenta" con verificación de permisos
const handleAddCuentaClick = () => {
  if (isEmpleado) {
    showEmpleadoAlert();
    return;
  }
  handleAddCuenta();
};

// 🆕 Función para manejar edición con verificación de permisos
const handleEditMesClick = (proveedor, mes) => {
  if (isEmpleado) {
    showEmpleadoAlert();
    return;
  }
  handleEditMes(proveedor, mes);
};

// 🆕 Función para manejar eliminación con verificación de permisos
const handleDeleteClick = async (id) => {
  if (isEmpleado) {
    showEmpleadoAlert();
    return;
  }
  await handleDelete(id);
};

// 🆕 Función para manejar toggle de pago con verificación de permisos
const handleTogglePaidClick = async (id, estadoActual) => {
  if (isEmpleado) {
    showEmpleadoAlert();
    return;
  }
  await handleTogglePaid(id, estadoActual);
};

// 🆕 Función para manejar cambio de estado de cuenta (activo/inactivo)
const handleCambiarEstadoCuenta = async (proveedor, activo) => {
  if (isEmpleado) {
    showEmpleadoAlert();
    return;
  }

  const mensaje = activo 
    ? '¿Deseas activar todas las cuentas de este proveedor?' 
    : '¿Deseas desactivar todas las cuentas de este proveedor?';
  
  const confirmText = activo ? 'Sí, activar' : 'Sí, desactivar';
  
  const result = await showConfirmationAlert(
    '¿Estás seguro?',
    mensaje,
    confirmText,
    'Cancelar'
  );

  if (result.isConfirmed) {
    try {
      // Obtener todas las cuentas de este proveedor
      const cuentasProveedor = cuentas.filter(cuenta => 
        cuenta.Nombre === proveedor.nombre && cuenta.Categoria === proveedor.categoria
      );

      // Cambiar estado de todas las cuentas del proveedor
      for (const cuenta of cuentasProveedor) {
        await cambiarEstadoCuenta(cuenta._id, activo);
      }

      await fetchCuentas();
      
      const successMessage = activo 
        ? 'Las cuentas del proveedor han sido activadas.' 
        : 'Las cuentas del proveedor han sido desactivadas.';
      
      showSuccessAlert(
        activo ? 'Activado' : 'Desactivado', 
        successMessage
      );
    } catch (error) {
      console.error('Error al cambiar estado de las cuentas:', error);
      showErrorAlert('Error', 'No se pudo cambiar el estado de las cuentas del proveedor');
    }
  }
};

// 🆕 Función para manejar eliminación permanente de cuenta
const handleDeleteCuentaPermanente = async (proveedor) => {
  if (isEmpleado) {
    showEmpleadoAlert();
    return;
  }

  const result = await showConfirmationAlert(
    '¿Estás seguro?',
    `¿Deseas eliminar permanentemente todas las cuentas de "${proveedor.nombre}"? Esta acción no se puede deshacer.`,
    'Sí, eliminar permanentemente',
    'Cancelar'
  );

  if (result.isConfirmed) {
    try {
      // Obtener todas las cuentas de este proveedor
      const cuentasProveedor = cuentas.filter(cuenta => 
        cuenta.Nombre === proveedor.nombre && cuenta.Categoria === proveedor.categoria
      );

      // Eliminar todas las cuentas del proveedor
      for (const cuenta of cuentasProveedor) {
        await axios.delete(`/cuentasPorPagar/eliminar/${cuenta._id}`);
      }

      await fetchCuentas();
      
      showSuccessAlert(
        'Eliminado', 
        'Todas las cuentas del proveedor han sido eliminadas permanentemente.'
      );
    } catch (error) {
      console.error('Error al eliminar las cuentas:', error);
      showErrorAlert('Error', 'No se pudieron eliminar las cuentas del proveedor');
    }
  }
};

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        {loading ? (
          <CuentasPorPagarSkeleton />
        ) : (
          <>
            <div className="page-header">
              <div className="title-container">
                <h1 className="page-title">Cuentas por Pagar</h1>
                <p className="page-subtitle">Controla y gestiona tus pagos mensuales a proveedores y servicios</p>
              </div>
              <div className="header-buttons">
                <button className="btn btn-primary add-btn" onClick={handleAddCuentaClick}>
                  <FontAwesomeIcon icon={faPlus} /> Agregar Cuenta
                </button>
                <button className="btn-export-pdf download-btn" onClick={exportarPDF}>
                  <FontAwesomeIcon icon={faFilePdf} /> Descargar PDF
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
                  <p className="summary-value">${formatNumberWithDots(Math.round(mesesConDatos > 0 ? totalGeneral / mesesConDatos : 0))}</p>
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
                  <p className="summary-value">${formatNumberWithDots(totalPagado)}</p>
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
                  <p className="summary-value">${formatNumberWithDots(totalPendiente)}</p>
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
                  <select 
                    className="form-select"
                    value={estadoCuentasFilter}
                    onChange={handleEstadoCuentasFilterChange}
                  >
                    <option value="activas">Cuentas Activas</option>
                    <option value="inactivas">Cuentas Inactivas</option>
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
                            {/* Botones de control */}
                            <div className="proveedor-estado-controls">
                              {/* Determinar si el proveedor está activo basado en sus cuentas */}
                              {(() => {
                                const cuentasProveedor = cuentas.filter(cuenta => 
                                  cuenta.Nombre === proveedor.nombre && cuenta.Categoria === proveedor.categoria
                                );
                                const todasActivas = cuentasProveedor.length > 0 && cuentasProveedor.every(cuenta => cuenta.Activo !== false);
                                
                                return (
                                  <>
                                    {/* Botón de estado (activar/desactivar) */}
                                    {todasActivas ? (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCambiarEstadoCuenta(proveedor, false);
                                        }}
                                        className="btn-icon btn-warning btn-estado-cuenta"
                                        title="Desactivar proveedor"
                                      >
                                        <FontAwesomeIcon icon={faEyeSlash} />
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCambiarEstadoCuenta(proveedor, true);
                                        }}
                                        className="btn-icon btn-info btn-estado-cuenta"
                                        title="Activar proveedor"
                                      >
                                        <FontAwesomeIcon icon={faEye} />
                                      </button>
                                    )}
                                    
                                    {/* Botón de eliminar permanentemente */}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCuentaPermanente(proveedor);
                                      }}
                                      className="btn-icon btn-danger btn-estado-cuenta"
                                      title="Eliminar proveedor permanentemente"
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
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
                                    ${formatNumberWithDots(cuentaMes.monto)}
                                  </div>
                                  <div className="cuenta-actions">
                                    <button 
                                      className={`btn-icon ${cuentaMes.estado === 'Pagado' ? 'btn-success' : 'btn-outline-success'}`}
                                      title={cuentaMes.estado === 'Pagado' ? 'Desmarcar como pagada' : 'Marcar como pagada'}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePaidClick(cuentaMes._id, cuentaMes.estado);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faCheck} />
                                    </button>
                                    <button 
                                      className="btn-icon btn-danger"
                                      title="Eliminar"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(cuentaMes._id);
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
            
            <SmartPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              maxVisiblePages={5}
            />
            
            {/* Modal para agregar/editar cuenta */}
            {showModal && (
              <div className="modal-overlay" onClick={handleModalOverlayClick}>
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
                        <p className="summary-value">${formatNumberWithDots(datos.total)}</p>
                        <span className="summary-label">
                          Pagado: ${formatNumberWithDots(datos.pagado)} | Pendiente: ${formatNumberWithDots(datos.pendiente)}
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
                    <p className="summary-value">${formatNumberWithDots(totalGeneral)}</p>
                    <span className="summary-label">
                      Pagado: ${formatNumberWithDots(totalPagado)} | Pendiente: ${formatNumberWithDots(totalPendiente)}
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