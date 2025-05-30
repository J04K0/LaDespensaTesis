import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/DeudoresStyles.css';
import { getDeudores, deleteDeudor, updateDeudor, getDeudorById } from '../services/deudores.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faMoneyBillWave, faHistory, faChevronDown, faChevronUp, faSearch, faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert } from '../helpers/swaHelper';
import DeudoresListSkeleton from '../components/DeudoresListSkeleton';
import axios from '../services/root.service.js';

// Función para controlar el scroll del body
const controlBodyScroll = (disable) => {
  if (disable) {
    // Guardar la posición actual del scroll antes de bloquear
    const scrollY = window.scrollY;
    
    // Aplicar clase modal-open que bloquea el scroll
    document.body.classList.add('modal-open');
    
    // Guardar la posición para poder restaurarla después
    document.body.style.top = `-${scrollY}px`;
    document.body.setAttribute('data-scroll-position', scrollY);
  } else {
    // Eliminar la clase que bloquea el scroll
    document.body.classList.remove('modal-open');
    
    // Restaurar la posición del scroll
    const scrollY = document.body.getAttribute('data-scroll-position') || 0;
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY));
    document.body.removeAttribute('data-scroll-position');
  }
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

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryDeudor, setSelectedHistoryDeudor] = useState(null);

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

  const renderComment = (comment, commentId) => {
    if (!comment) return '-';

    if (comment.length <= 20) {
      return comment;
    }

    const isExpanded = expandedComments[commentId] || false;

    return (
      <div className="comment-container">
        <div className="comment-text">
          {isExpanded ? comment : `${comment.substring(0, 20)}...`}
        </div>
        <button
          className="expand-comment-button"
          onClick={(e) => {
            e.stopPropagation();
            toggleCommentExpansion(commentId);
          }}
        >
          {isExpanded ? (
            <>
              <span>Mostrar menos</span>
              <FontAwesomeIcon icon={faChevronUp} />
            </>
          ) : (
            <>
              <span>Mostrar más</span>
              <FontAwesomeIcon icon={faChevronDown} />
            </>
          )}
        </button>
      </div>
    );
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

  const handleCancelEdit = async () => {
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas cancelar la edición? Los cambios no guardados se perderán.",
      "Sí, cancelar",
      "No, volver"
    );

    if (result.isConfirmed) {
      // Restaurar el scroll
      controlBodyScroll(false);

      setShowEditModal(false);
    }
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
              <h1 className="deudores-page-title">Personas deudoras</h1>
              <button className="deudores-btn deudores-btn-primary" onClick={handleAddDeudor}>
                <FontAwesomeIcon icon={faPlus} /> Agregar Deudor
              </button>
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
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDeudores.map((deudor, index) => {
                    const deudaValue = parseFloat(deudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
                    const isZeroDebt = deudaValue === 0;

                    return (
                      <tr key={index} className={isZeroDebt ? 'deudores-zero-debt-row' : ''}>
                        <td>{deudor.Nombre || 'Nombre desconocido'}</td>
                        <td>{new Date(deudor.fechaPaga).toLocaleDateString() || 'Fecha desconocida'}</td>
                        <td>{deudor.numeroTelefono || 'Teléfono desconocido'}</td>
                        <td className={isZeroDebt ? 'deudores-text-success' : 'deudores-text-danger'}>
                          ${deudor.deudaTotal !== undefined ? deudor.deudaTotal.toLocaleString() : 'N/A'}
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
            
            <div className="deudores-pagination">
              {[...Array(totalPages).keys()].map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page + 1)}
                  className={`deudores-pagination-button ${page + 1 === currentPage ? 'deudores-active' : ''}`}
                  disabled={page + 1 === currentPage}
                >
                  {page + 1}
                </button>
              ))}
            </div>

            {showModal && selectedDeudor && (
              <div className="deudores-modal-overlay" onClick={() => {
                controlBodyScroll(false);
                setShowModal(false);
                setComment('');
                setAmount('');
              }}>
                <div className="deudores-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="deudores-modal-header">
                    <h2 className="deudores-modal-title">{isPayment ? 'Registrar Pago' : 'Añadir a la Deuda'}</h2>
                  </div>
                  
                  <div className="deudores-modal-body">
                    <div className="deudores-modal-info">
                      <p><strong>Deudor:</strong> {selectedDeudor.Nombre}</p>
                      <span className="deuda-actual">
                        Deuda actual: ${selectedDeudor.deudaTotal}
                      </span>
                    </div>

                    <div className="deudores-form-group">
                      <label className="deudores-form-label" htmlFor="amount">Monto:</label>
                      <div className="input-with-icon">
                        <input
                          type="number"
                          id="amount"
                          value={amount}
                          onChange={(e) => setAmount(sanitizeNumber(e.target.value))}
                          placeholder="Ingrese el monto"
                          min="0"
                          required
                          className="deudores-form-control"
                        />
                      </div>
                    </div>

                    {isPayment && (
                      <div className="deudores-form-group">
                        <label className="deudores-form-label">Método de Pago:</label>
                        <div className="deudores-payment-method-select">
                          <label className="deudores-radio-group">
                            <input
                              type="radio"
                              name="metodoPago"
                              value="efectivo"
                              checked={metodoPago === 'efectivo'}
                              onChange={() => setMetodoPago('efectivo')}
                            />
                            <span className="deudores-radio-checkmark"></span>
                            Efectivo
                          </label>
                          <label className="deudores-radio-group">
                            <input
                              type="radio"
                              name="metodoPago"
                              value="tarjeta"
                              checked={metodoPago === 'tarjeta'}
                              onChange={() => setMetodoPago('tarjeta')}
                            />
                            <span className="deudores-radio-checkmark"></span>
                            Tarjeta
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="deudores-form-group">
                      <label className="deudores-form-label" htmlFor="comment">Comentario (opcional):</label>
                      <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Ingrese un comentario (opcional)"
                        className="deudores-form-control"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="deudores-modal-footer">
                    <button className="deudores-btn deudores-btn-secondary" onClick={() => setShowModal(false)}>
                      <FontAwesomeIcon icon={faTimes} /> Cancelar
                    </button>
                    <button className="deudores-btn deudores-btn-primary" onClick={handleDebtUpdate}>
                      <FontAwesomeIcon icon={faSave} /> {isPayment ? 'Registrar Pago' : 'Añadir a la Deuda'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showEditModal && (
              <div className="deudores-modal-overlay" onClick={() => setShowEditModal(false)}>
                <div className="deudores-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="deudores-modal-header">
                    <h2 className="deudores-modal-title">Editar Deudor</h2>
                  </div>
                  
                  <div className="deudores-modal-body">
                    <div className="deudores-form-group">
                      <label className="deudores-form-label" htmlFor="Nombre">Nombre:</label>
                      <input
                        type="text"
                        id="Nombre"
                        name="Nombre"
                        value={deudorToEdit.Nombre}
                        onChange={handleEditChange}
                        placeholder="Ingrese el nombre"
                        required
                        className="deudores-form-control"
                      />
                    </div>

                    <div className="deudores-form-group">
                      <label className="deudores-form-label" htmlFor="fechaPaga">Fecha a Pagar:</label>
                      <input
                        type="date"
                        id="fechaPaga"
                        name="fechaPaga"
                        value={deudorToEdit.fechaPaga}
                        onChange={handleEditChange}
                        className="deudores-form-control"
                      />
                    </div>

                    <div className="deudores-form-group">
                      <label className="deudores-form-label" htmlFor="numeroTelefono">Número de Teléfono:</label>
                      <input
                        type="text"
                        id="numeroTelefono"
                        name="numeroTelefono"
                        value={deudorToEdit.numeroTelefono}
                        onChange={handleEditChange}
                        placeholder="Ingrese el número de teléfono"
                        className="deudores-form-control"
                      />
                    </div>

                    <div className="deudores-form-group">
                      <label className="deudores-form-label" htmlFor="deudaTotal">Deuda Total:</label>
                      <input
                        type="text"
                        id="deudaTotal"
                        name="deudaTotal"
                        value={deudorToEdit.deudaTotal}
                        onChange={handleEditChange}
                        placeholder="Ingrese la deuda total"
                        className="deudores-form-control"
                      />
                    </div>
                  </div>
                  
                  <div className="deudores-modal-footer">
                    <button className="deudores-btn deudores-btn-secondary" onClick={() => setShowEditModal(false)}>
                      <FontAwesomeIcon icon={faTimes} /> Cancelar
                    </button>
                    <button className="deudores-btn deudores-btn-primary" onClick={handleEditSubmit}>
                      <FontAwesomeIcon icon={faSave} /> Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showHistoryModal && selectedHistoryDeudor && (
              <div className="deudores-modal-overlay" onClick={handleCloseHistoryModal}>
                <div className="deudores-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="deudores-modal-header">
                    <h2 className="deudores-modal-title">Historial de Pagos - {selectedHistoryDeudor.Nombre}</h2>
                  </div>
                  
                  <div className="deudores-modal-body">
                    {selectedHistoryDeudor.historialPagos.length === 0 ? (
                      <p className="deudores-no-history">No hay historial de pagos disponible para este deudor.</p>
                    ) : (
                      <table className="deudores-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Monto</th>
                            <th>Tipo</th>
                            <th>Método de Pago</th>
                            <th>Comentario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedHistoryDeudor.historialPagos.map((pago, idx) => (
                            <tr key={idx} className={pago.tipo === 'pago' ? 'deudores-payment-row' : 'deudores-debt-row'}>
                              <td>{new Date(pago.fecha).toLocaleDateString()}</td>
                              <td>${pago.monto.toLocaleString()}</td>
                              <td>
                                <span className={`deudores-state-badge ${pago.tipo === 'pago' ? 'deudores-state-badge-success' : 'deudores-state-badge-danger'}`}>
                                  {pago.tipo === 'pago' ? 'Pago' : 'Deuda'}
                                </span>
                              </td>
                              <td>
                                {pago.tipo === 'pago' ? (
                                  <span className={`deudores-payment-method ${pago.metodoPago === 'efectivo' ? 'efectivo' : 'tarjeta'}`}>
                                    {pago.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="deudores-comment-cell">
                                {renderComment(pago.comentario, `history-${idx}`)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  <div className="deudores-modal-footer">
                    <button className="deudores-btn deudores-btn-secondary" onClick={handleCloseHistoryModal}>
                      <FontAwesomeIcon icon={faTimes} /> Cerrar
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

export default DeudoresList;
