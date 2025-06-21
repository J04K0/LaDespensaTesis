import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PaymentModal from '../components/PaymentModal';
import PaymentHistoryModal from '../components/PaymentHistoryModal';
import EditDeudorModal from '../components/EditDeudorModal';
import '../styles/DeudoresStyles.css';
import '../styles/SmartPagination.css';
import { getDeudores, deleteDeudor, updateDeudor, getDeudorById } from '../services/deudores.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faMoneyBillWave, faHistory, faChevronDown, faChevronUp, faSearch, faTimes, faSave, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert } from '../helpers/swaHelper';
import DeudoresListSkeleton from '../components/Skeleton/DeudoresListSkeleton';
import axios from '../services/root.service.js';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import SmartPagination from '../components/SmartPagination';

// Función para controlar el scroll del body - Optimizada para reducir lag
const controlBodyScroll = (disable) => {
  // Uso de requestAnimationFrame para desacoplar del flujo principal y mejorar rendimiento
  requestAnimationFrame(() => {
    if (disable) {
      // Guardar la posición actual del scroll antes de bloquear
      const scrollY = window.scrollY;
      
      // Usar técnica más directa para bloquear el scroll (mejor rendimiento)
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.overflowY = 'scroll';
      document.body.dataset.scrollPosition = scrollY;
    } else {
      // Restaurar el scroll de manera más eficiente
      const scrollY = parseInt(document.body.dataset.scrollPosition || '0');
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overflowY = '';
      
      // Restaurar la posición del scroll de manera más suave
      window.scrollTo({
        top: scrollY,
        behavior: 'instant' // Evitar la animación para mejor rendimiento
      });
      
      delete document.body.dataset.scrollPosition;
    }
  });
};

const DeudoresList = () => {
  const [allDeudores, setAllDeudores] = useState([]);
  const [filteredDeudores, setFilteredDeudores] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [loading, setLoading] = useState(true);
  const deudoresPerPage = 10;
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [selectedDeudor, setSelectedDeudor] = useState(null);
  const [amount, setAmount] = useState('');
  const [isPayment, setIsPayment] = useState(true);
  const [comment, setComment] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');

  const [showEditModal, setShowEditModal] = useState(false);
  const [deudorToEdit, setDeudorToEdit] = useState({
    Nombre: '',
    fechaPaga: '',
    numeroTelefono: '',
    deudaTotal: '',
    historialPagos: []
  });
  const [originalDeudor, setOriginalDeudor] = useState(null); // Para comparar cambios

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryDeudor, setSelectedHistoryDeudor] = useState(null);

  // Estados para comentarios del modal de historial
  const [expandedComments, setExpandedComments] = useState({});

  const toggleCommentExpansion = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const resetExpandedComments = () => {
    setExpandedComments({});
  };

  // Función para determinar el estado de pago
  const getPaymentStatus = (fechaPaga, deudaTotal) => {
    const deudaValue = parseFloat(deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
    
    // Si no tiene deuda, está al día
    if (deudaValue === 0) {
      return {
        status: 'al-dia',
        label: 'Al día',
        className: 'deudores-status-al-dia'
      };
    }
    
    const fechaPago = new Date(fechaPaga);
    const hoy = new Date();
    
    // Resetear las horas para comparar solo fechas
    fechaPago.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaPago < hoy) {
      return {
        status: 'vencido',
        label: 'Vencido',
        className: 'deudores-status-vencido'
      };
    } else if (fechaPago.getTime() === hoy.getTime()) {
      return {
        status: 'hoy',
        label: 'Vence hoy',
        className: 'deudores-status-hoy'
      };
    } else {
      return {
        status: 'pendiente',
        label: 'Pendiente',
        className: 'deudores-status-pendiente'
      };
    }
  };

  // Función para calcular estadísticas de deudores
  const calculateStats = () => {
    const totalDeudores = allDeudores.length;
    let totalDeuda = 0;
    let deudoresConDeuda = 0;
    let deudoresAlDia = 0;
    let deudoresPendientes = 0;
    let deudoresVencidos = 0;
    let deudoresVencenHoy = 0;
    let deudaPromedio = 0;
    let mayorDeuda = 0;
    let nombreMayorDeudor = '';

    allDeudores.forEach(deudor => {
      const deudaValue = parseFloat(deudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
      const status = getPaymentStatus(deudor.fechaPaga, deudor.deudaTotal);
      
      totalDeuda += deudaValue;
      
      if (deudaValue > 0) {
        deudoresConDeuda++;
        if (deudaValue > mayorDeuda) {
          mayorDeuda = deudaValue;
          nombreMayorDeudor = deudor.Nombre;
        }
      }
      
      switch (status.status) {
        case 'al-dia':
          deudoresAlDia++;
          break;
        case 'pendiente':
          deudoresPendientes++;
          break;
        case 'vencido':
          deudoresVencidos++;
          break;
        case 'hoy':
          deudoresVencenHoy++;
          break;
      }
    });

    deudaPromedio = deudoresConDeuda > 0 ? totalDeuda / deudoresConDeuda : 0;

    return {
      totalDeudores,
      totalDeuda,
      deudoresConDeuda,
      deudoresAlDia,
      deudoresPendientes,
      deudoresVencidos,
      deudoresVencenHoy,
      deudaPromedio,
      mayorDeuda,
      nombreMayorDeudor
    };
  };

  const stats = calculateStats();

  const handleCloseHistoryModal = () => {
    // Restaurar el scroll
    controlBodyScroll(false);

    setShowHistoryModal(false);
    resetExpandedComments();
  };

  const handleCloseEditModal = () => {
    const result = showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas cancelar la edición? Los cambios no guardados se perderán.",
      "Sí, cancelar",
      "No, volver"
    ).then(result => {
      if (result.isConfirmed) {
        // Restaurar el scroll
        controlBodyScroll(false);

        setShowEditModal(false);
        resetExpandedComments();
      }
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === '') {
      setFilteredDeudores(allDeudores);
    } else {
      const searchTermLower = value.toLowerCase().trim();
      const results = allDeudores.filter(deudor => {
        const nameMatch = deudor.Nombre && deudor.Nombre.toLowerCase().includes(searchTermLower);
        const phoneMatch = deudor.numeroTelefono && deudor.numeroTelefono.toString().includes(searchTermLower);
        return nameMatch || phoneMatch;
      });
      setFilteredDeudores(results);
    }

    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortOption('');
    setFilteredDeudores(allDeudores);
    setTotalPages(Math.ceil(allDeudores.length / deudoresPerPage));
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchAllDeudores = async () => {
      try {
        setLoading(true);
        const data = await getDeudores(1, Number.MAX_SAFE_INTEGER);

        // Siempre ordenamos para asegurar que los deudores con deuda aparezcan primero
        const sortedDeudores = [...data.deudores].sort((a, b) => {
          const deudaA = parseFloat(a.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
          const deudaB = parseFloat(b.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
          // Si ambos tienen deuda cero o ambos tienen deuda, mantener orden alfabético
          if ((deudaA === 0 && deudaB === 0) || (deudaA > 0 && deudaB > 0)) {
            return a.Nombre.localeCompare(b.Nombre);
          }
          // Los que tienen deuda cero van al final
          if (deudaA === 0) return 1;
          if (deudaB === 0) return -1;
          return 0;
        });

        setAllDeudores(sortedDeudores);
        setFilteredDeudores(sortedDeudores);
        setTotalPages(Math.ceil(sortedDeudores.length / deudoresPerPage));
      } catch (error) {
        console.error('Error fetching deudores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDeudores();
  }, []);

  useEffect(() => {
    if (!sortOption) {
      const filtered = [...filteredDeudores].sort((a, b) => {
        const deudaA = parseFloat(a.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
        const deudaB = parseFloat(b.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
        if (deudaA === 0 && deudaB !== 0) return 1;
        if (deudaB === 0 && deudaA !== 0) return -1;
        return 0;
      });
      setFilteredDeudores(filtered);
      return;
    }

    let sortedDeudores = [...filteredDeudores].sort((a, b) => {
      if (sortOption === 'name-asc') return a.Nombre.localeCompare(b.Nombre);
      if (sortOption === 'name-desc') return b.Nombre.localeCompare(a.Nombre);
      if (sortOption === 'debt-asc') {
        const aValue = parseFloat(a.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
        const bValue = parseFloat(b.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
        return aValue - bValue;
      }
      if (sortOption === 'debt-desc') {
        const aValue = parseFloat(a.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
        const bValue = parseFloat(b.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
        return bValue - aValue;
      }
      if (sortOption === 'date-asc') return new Date(a.fechaPaga) - new Date(b.fechaPaga);
      if (sortOption === 'date-desc') return new Date(b.fechaPaga) - new Date(a.fechaPaga);
      if (sortOption === 'status-asc') {
        const statusA = getPaymentStatus(a.fechaPaga, a.deudaTotal).status;
        const statusB = getPaymentStatus(b.fechaPaga, b.deudaTotal).status;
        return statusA.localeCompare(statusB);
      }
      if (sortOption === 'status-desc') {
        const statusA = getPaymentStatus(a.fechaPaga, a.deudaTotal).status;
        const statusB = getPaymentStatus(b.fechaPaga, b.deudaTotal).status;
        return statusB.localeCompare(statusA);
      }
      return 0;
    });

    setFilteredDeudores(sortedDeudores);
  }, [sortOption]);

  useEffect(() => {
    if (showModal || showEditModal || showHistoryModal) {
      // Usar la función controlBodyScroll para bloquear el scroll
      controlBodyScroll(true);
    } else {
      // Restaurar el scroll
      controlBodyScroll(false);
    }

    // Limpiar el efecto cuando se desmonta el componente
    return () => {
      controlBodyScroll(false);
    };
  }, [showModal, showEditModal, showHistoryModal]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Desplazar la ventana hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "Esta acción no se puede deshacer. ¿Deseas eliminar este deudor?",
      "Sí, eliminar",
      "No, cancelar"
    );

    if (!result.isConfirmed) return;

    try {
      await deleteDeudor(id);
      const updatedDeudores = allDeudores.filter(deudor => deudor._id !== id);
      setAllDeudores(updatedDeudores);
      const filtered = updatedDeudores.filter(deudor =>
        deudor.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDeudores(filtered);
      setTotalPages(Math.ceil(filtered.length / deudoresPerPage));
      showSuccessAlert('Deudor eliminado con éxito', '');
    } catch (error) {
      console.error('Error eliminando deudor:', error);
      showErrorAlert('Error al eliminar el deudor', 'Ocurrió un error al intentar eliminar el deudor.');
    }
  };

  const handleEdit = (deudor) => {
    const fechaFormateada = new Date(deudor.fechaPaga).toISOString().split('T')[0];

    setDeudorToEdit({
      _id: deudor._id,
      Nombre: deudor.Nombre,
      fechaPaga: fechaFormateada,
      numeroTelefono: deudor.numeroTelefono,
      deudaTotal: parseFloat(deudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.')),
      historialPagos: deudor.historialPagos || []
    });
    setOriginalDeudor(deudor); // Guardar deudor original para comparación
    setShowEditModal(true);
  };

  const handleAddDeudor = () => {
    navigate('/agregar-deudor');
  };

  const displayedDeudores = filteredDeudores.slice(
    (currentPage - 1) * deudoresPerPage,
    currentPage * deudoresPerPage
  );
  const handleUpdateDebt = (deudor) => {
    setSelectedDeudor(deudor);
    setAmount('');
    setIsPayment(true);
    setShowModal(true);
  };

  const validateDebtForm = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showErrorAlert('Monto inválido', 'Por favor ingrese un monto válido mayor a cero.');
      return false;
    }

    if (comment && comment.length > 100) {
      showErrorAlert('Comentario demasiado largo', 'El comentario no puede exceder los 100 caracteres.');
      return false;
    }

    if (isPayment) {
      const currentDebt = parseFloat(selectedDeudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
      const parsedAmount = parseFloat(amount);

      if (parsedAmount > currentDebt) {
        showErrorAlert(
          'Monto excesivo',
          `El monto de pago (${parsedAmount}) no puede ser mayor que la deuda actual (${currentDebt}).`
        );
        return false;
      }
    }

    return true;
  };

  const handleDebtUpdate = async () => {
    if (!validateDebtForm()) {
      return;
    }

    try {
      const currentDebt = parseFloat(selectedDeudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
      const parsedAmount = parseFloat(amount);

      let newDebt = isPayment ? currentDebt - parsedAmount : currentDebt + parsedAmount;

      const nuevoPago = {
        fecha: new Date(),
        monto: parsedAmount,
        tipo: isPayment ? 'pago' : 'deuda',
        metodoPago: isPayment ? metodoPago : 'efectivo', // Solo usamos el método de pago para pagos
        comentario: comment.trim() || ''
      };

      const deudorActual = await getDeudorById(selectedDeudor._id);
      const historialActual = deudorActual.historialPagos || [];

      const response = await axios.patch(`/deudores/actualizar/${selectedDeudor._id}`, {
        deudaTotal: newDebt,
        Nombre: selectedDeudor.Nombre,
        fechaPaga: selectedDeudor.fechaPaga,
        numeroTelefono: selectedDeudor.numeroTelefono,
        historialPagos: [...historialActual, nuevoPago]
      });

      setComment('');
      setAmount('');
      setMetodoPago('efectivo'); // Resetear el método de pago
      setShowModal(false);
      
      // Restaurar el scroll
      controlBodyScroll(false);
      
      // Obtener la lista actualizada de deudores
      const data = await getDeudores(1, Number.MAX_SAFE_INTEGER);
      
      // Ordenar para mantener los deudores con deuda cero al final
      const sortedDeudores = [...data.deudores].sort((a, b) => {
        const deudaA = parseFloat(a.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
        const deudaB = parseFloat(b.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
        // Si ambos tienen deuda cero o ambos tienen deuda, mantener orden alfabético
        if ((deudaA === 0 && deudaB === 0) || (deudaA > 0 && deudaB > 0)) {
          return a.Nombre.localeCompare(b.Nombre);
        }
        // Los que tienen deuda cero van al final
        if (deudaA === 0) return 1;
        if (deudaB === 0) return -1;
        return 0;
      });
      
      setAllDeudores(sortedDeudores);
      setFilteredDeudores(sortedDeudores);

      showSuccessAlert(
        isPayment ? 'Pago registrado' : 'Deuda actualizada',
        isPayment
          ? `Se ha registrado el pago de $${parsedAmount} correctamente.`
          : `Se ha añadido $${parsedAmount} a la deuda correctamente.`
      );
    } catch (error) {
      console.error("Error al actualizar deuda:", error);
      showErrorAlert(
        'Error al actualizar',
        error.response?.data?.message || 'Ha ocurrido un error al procesar la operación.'
      );
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setDeudorToEdit(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async () => {
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas guardar los cambios realizados a este deudor?",
      "Sí, guardar",
      "No, cancelar"
    );

    if (!result.isConfirmed) return;

    try {
      await updateDeudor(deudorToEdit._id, {
        Nombre: deudorToEdit.Nombre,
        fechaPaga: deudorToEdit.fechaPaga,
        numeroTelefono: deudorToEdit.numeroTelefono.toString(),
        deudaTotal: parseFloat(deudorToEdit.deudaTotal)
      });

      // Obtener la lista actualizada de deudores
      const data = await getDeudores(1, Number.MAX_SAFE_INTEGER);
      
      // Ordenar para mantener los deudores con deuda cero al final
      const sortedDeudores = [...data.deudores].sort((a, b) => {
        const deudaA = parseFloat(a.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
        const deudaB = parseFloat(b.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
        // Si ambos tienen deuda cero o ambos tienen deuda, mantener orden alfabético
        if ((deudaA === 0 && deudaB === 0) || (deudaA > 0 && deudaB > 0)) {
          return a.Nombre.localeCompare(b.Nombre);
        }
        // Los que tienen deuda cero van al final
        if (deudaA === 0) return 1;
        if (deudaB === 0) return -1;
        return 0;
      });
      
      // Aplicar el ordenamiento
      setAllDeudores(sortedDeudores);
      
      // Si hay una búsqueda activa, filtrar por ella
      if (searchQuery.trim() !== '') {
        const searchResults = sortedDeudores.filter(deudor =>
          deudor.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredDeudores(searchResults);
      } else {
        setFilteredDeudores(sortedDeudores);
      }

      // Restaurar el scroll
      controlBodyScroll(false);

      setShowEditModal(false);
      showSuccessAlert('Deudor actualizado con éxito', '');
    } catch (error) {
      console.error('Error updating deudor:', error);
      showErrorAlert('Error al actualizar el deudor', 'Ocurrió un error al intentar actualizar el deudor.');
    }
  };

  const handleViewHistory = async (deudor) => {
    try {
      setLoading(true);

      const deudorActualizado = await getDeudorById(deudor._id);

      if (deudorActualizado) {
        deudorActualizado.historialPagos = Array.isArray(deudorActualizado.historialPagos)
          ? deudorActualizado.historialPagos
          : [];

        setSelectedHistoryDeudor(deudorActualizado);
      } else {
        deudor.historialPagos = [];
        setSelectedHistoryDeudor(deudor);
      }

      setShowHistoryModal(true);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener historial actualizado:', error);
      deudor.historialPagos = [];
      setSelectedHistoryDeudor(deudor);
      setShowHistoryModal(true);
      setLoading(false);
    }
  };

  const sanitizeNumber = (value) => {
    if (typeof value === 'string') {
      return value.replace(/[^\d.]/g, '');
    }
    return value;
  };

  // Función helper para formatear números con punto como separador de miles
  const formatNumberWithDots = (number) => {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Nombre", "Fecha a Pagar", "Número de Teléfono", "Deuda Total"];
    const tableRows = [];

    filteredDeudores.forEach(deudor => {
      const deudaValue = parseFloat(deudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
      const isZeroDebt = deudaValue === 0;

      tableRows.push([
        deudor.Nombre || 'Nombre desconocido',
        new Date(deudor.fechaPaga).toLocaleDateString() || 'Fecha desconocida',
        deudor.numeroTelefono || 'Teléfono desconocido',
        isZeroDebt ? { content: `$${formatNumberWithDots(deudaValue)}`, styles: { textColor: [0, 128, 0] } } : { content: `$${formatNumberWithDots(deudaValue)}`, styles: { textColor: [255, 0, 0] } }
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'striped',
      headStyles: { fillColor: [0, 38, 81] }, // Color primario oscuro
      didDrawPage: (data) => {
        // Agregar título y fecha
        doc.setFontSize(18);
        doc.text("La Despensa - Listado de Deudores", 14, 15);
        
        // Agregar pie de página
        const currentDate = new Date().toLocaleDateString();
        doc.setFontSize(10);
        doc.text(`Fecha de emisión: ${currentDate}`, 14, doc.internal.pageSize.height - 10);
      }
    });
    
    doc.save(`deudores_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="deudores-container">
      <Navbar />
      <div className="deudores-content">
        {loading ? (
          <DeudoresListSkeleton />
        ) : (
          <>
            <div className="deudores-page-header">
              <div className="deudores-title-container">
                <h1 className="deudores-page-title">Personas deudoras</h1>
                <p className="deudores-page-subtitle">Administra tus clientes con crédito y su historial de pagos</p>
              </div>
              <div className="deudores-actions">
                <button className="deudores-btn deudores-btn-primary" onClick={handleAddDeudor}>
                  <FontAwesomeIcon icon={faPlus} /> Agregar Deudor
                </button>
                <button className="deudores-btn-export-pdf" onClick={handleExportPDF}>
                  <FontAwesomeIcon icon={faFilePdf} /> Exportar PDF
                </button>
              </div>
            </div>
            
            <div className="deudores-filters-container">
              <div className="deudores-search-container">
                <FontAwesomeIcon icon={faSearch} className="deudores-search-icon" />
                <input
                  id="search"
                  type="text"
                  className="deudores-search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Buscar deudores..."
                />
              </div>
              
              <div className="deudores-filter-group">
                <select 
                  onChange={handleSortChange} 
                  value={sortOption} 
                  className="deudores-form-select"
                >
                  <option value="">Ordenar por</option>
                  <option value="name-asc">Nombre (A-Z)</option>
                  <option value="name-desc">Nombre (Z-A)</option>
                  <option value="debt-asc">Deuda (Ascendente)</option>
                  <option value="debt-desc">Deuda (Descendente)</option>
                  <option value="date-asc">Fecha a Pagar (Ascendente)</option>
                  <option value="date-desc">Fecha a Pagar (Descendente)</option>
                  <option value="status-asc">Estado (Vencido → Al día)</option>
                  <option value="status-desc">Estado (Al día → Vencido)</option>
                </select>
              </div>
              
              <button onClick={handleClearFilters} className="deudores-btn deudores-btn-secondary">
                Limpiar Filtros
              </button>
            </div>
            
            <div className="deudores-table-container">
              <table className="deudores-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Fecha a pagar</th>
                    <th>Número de teléfono</th>
                    <th>Deuda total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDeudores.map((deudor, index) => {
                    const deudaValue = parseFloat(deudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
                    const isZeroDebt = deudaValue === 0;
                    const paymentStatus = getPaymentStatus(deudor.fechaPaga, deudor.deudaTotal);

                    return (
                      <tr key={index} className={isZeroDebt ? 'deudores-zero-debt-row' : ''}>
                        <td>{deudor.Nombre || 'Nombre desconocido'}</td>
                        <td>{new Date(deudor.fechaPaga).toLocaleDateString() || 'Fecha desconocida'}</td>
                        <td>{deudor.numeroTelefono || 'Teléfono desconocido'}</td>
                        <td className={isZeroDebt ? 'deudores-text-success' : 'deudores-text-danger'}>
                          ${deudor.deudaTotal !== undefined ? deudor.deudaTotal.toLocaleString('es-ES') : 'N/A'}
                        </td>
                        <td>
                          <span className={`deudores-status-badge ${paymentStatus.className}`}>
                            {paymentStatus.label}
                          </span>
                        </td>
                        <td className="deudores-d-flex deudores-gap-sm">
                          <button onClick={() => handleUpdateDebt(deudor)} className="deudores-btn-icon deudores-btn-success" title="Actualizar deuda">
                            <FontAwesomeIcon icon={faMoneyBillWave} />
                          </button>
                          <button onClick={() => handleViewHistory(deudor)} className="deudores-btn-icon deudores-btn-secondary" title="Ver historial">
                            <FontAwesomeIcon icon={faHistory} />
                          </button>
                          <button onClick={() => handleEdit(deudor)} className="deudores-btn-icon deudores-btn-primary" title="Editar deudor">
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button onClick={() => handleDelete(deudor._id)} className="deudores-btn-icon deudores-btn-danger" title="Eliminar deudor">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <SmartPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            {/* Cards informativas con estadísticas */}
            <div className="deudores-stats-container">
              <h2 className="deudores-stats-title">Estadísticas de Deudores</h2>
              
              <div className="deudores-stats-grid">
                {/* Card de Total de Deuda */}
                <div className="deudores-stat-card deudores-stat-card-primary">
                  <div className="deudores-stat-icon">
                    <FontAwesomeIcon icon={faMoneyBillWave} />
                  </div>
                  <div className="deudores-stat-content">
                    <h3 className="deudores-stat-value">${stats.totalDeuda.toLocaleString('es-ES')}</h3>
                    <p className="deudores-stat-label">Total de Deuda</p>
                  </div>
                </div>

                {/* Card de Total de Deudores */}
                <div className="deudores-stat-card deudores-stat-card-info">
                  <div className="deudores-stat-icon">
                    <FontAwesomeIcon icon={faPlus} />
                  </div>
                  <div className="deudores-stat-content">
                    <h3 className="deudores-stat-value">{stats.totalDeudores}</h3>
                    <p className="deudores-stat-label">Total de Deudores</p>
                  </div>
                </div>

                {/* Card de Deudores con Deuda */}
                <div className="deudores-stat-card deudores-stat-card-warning">
                  <div className="deudores-stat-icon">
                    <FontAwesomeIcon icon={faMoneyBillWave} />
                  </div>
                  <div className="deudores-stat-content">
                    <h3 className="deudores-stat-value">{stats.deudoresConDeuda}</h3>
                    <p className="deudores-stat-label">Con Deuda Activa</p>
                  </div>
                </div>

                {/* Card de Deudores Al Día */}
                <div className="deudores-stat-card deudores-stat-card-success">
                  <div className="deudores-stat-icon">
                    <FontAwesomeIcon icon={faEdit} />
                  </div>
                  <div className="deudores-stat-content">
                    <h3 className="deudores-stat-value">{stats.deudoresAlDia}</h3>
                    <p className="deudores-stat-label">Al Día</p>
                  </div>
                </div>

                {/* Card de Deudores Vencidos */}
                <div className="deudores-stat-card deudores-stat-card-danger">
                  <div className="deudores-stat-icon">
                    <FontAwesomeIcon icon={faHistory} />
                  </div>
                  <div className="deudores-stat-content">
                    <h3 className="deudores-stat-value">{stats.deudoresVencidos}</h3>
                    <p className="deudores-stat-label">Vencidos</p>
                  </div>
                </div>

                {/* Card de Deudores Pendientes */}
                <div className="deudores-stat-card deudores-stat-card-secondary">
                  <div className="deudores-stat-icon">
                    <FontAwesomeIcon icon={faSearch} />
                  </div>
                  <div className="deudores-stat-content">
                    <h3 className="deudores-stat-value">{stats.deudoresPendientes}</h3>
                    <p className="deudores-stat-label">Pendientes</p>
                  </div>
                </div>

                {/* Card de Vencen Hoy */}
                {stats.deudoresVencenHoy > 0 && (
                  <div className="deudores-stat-card deudores-stat-card-urgent">
                    <div className="deudores-stat-icon">
                      <FontAwesomeIcon icon={faTimes} />
                    </div>
                    <div className="deudores-stat-content">
                      <h3 className="deudores-stat-value">{stats.deudoresVencenHoy}</h3>
                      <p className="deudores-stat-label">Vencen Hoy</p>
                    </div>
                  </div>
                )}

                {/* Card de Deuda Promedio */}
                <div className="deudores-stat-card deudores-stat-card-light">
                  <div className="deudores-stat-icon">
                    <FontAwesomeIcon icon={faFilePdf} />
                  </div>
                  <div className="deudores-stat-content">
                    <h3 className="deudores-stat-value">${stats.deudaPromedio.toLocaleString('es-ES')}</h3>
                    <p className="deudores-stat-label">Deuda Promedio</p>
                  </div>
                </div>
              </div>

              {/* Card especial para el mayor deudor */}
              {stats.mayorDeuda > 0 && (
                <div className="deudores-highlight-card">
                  <div className="deudores-highlight-icon">
                    <FontAwesomeIcon icon={faTrash} />
                  </div>
                  <div className="deudores-highlight-content">
                    <h3 className="deudores-highlight-title">Mayor Deudor</h3>
                    <p className="deudores-highlight-name">{stats.nombreMayorDeudor}</p>
                    <p className="deudores-highlight-amount">${stats.mayorDeuda.toLocaleString('es-ES')}</p>
                  </div>
                </div>
              )}
            </div>

            {showModal && selectedDeudor && (
              // Usar el componente PaymentModal
              <PaymentModal
                show={showModal}
                onClose={() => {
                  setComment('');
                  setAmount('');
                  setShowModal(false);
                }}
                selectedDeudor={selectedDeudor}
                amount={amount}
                setAmount={setAmount}
                isPayment={isPayment}
                setIsPayment={setIsPayment}
                comment={comment}
                setComment={setComment}
                metodoPago={metodoPago}
                setMetodoPago={setMetodoPago}
                onSubmit={handleDebtUpdate}
                sanitizeNumber={sanitizeNumber}
              />
            )}

            {/* Usar el componente EditDeudorModal */}
            {showEditModal && (
              <EditDeudorModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                deudorToEdit={deudorToEdit}
                originalDeudor={originalDeudor}
                onInputChange={handleEditChange}
                onSubmit={handleEditSubmit}
              />
            )}

            {/* Modal de Historial */}
            {showHistoryModal && selectedHistoryDeudor && (
              // Usar el componente PaymentHistoryModal
              <PaymentHistoryModal
                show={showHistoryModal}
                onClose={handleCloseHistoryModal}
                selectedDeudor={selectedHistoryDeudor}
                expandedComments={expandedComments}
                onToggleComment={toggleCommentExpansion}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeudoresList;
