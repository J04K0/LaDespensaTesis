import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/DeudoresStyles.css';
import { getDeudores, deleteDeudor, updateDeudor, getDeudorById } from '../services/deudores.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faMoneyBillWave, faHistory } from '@fortawesome/free-solid-svg-icons';
import { showSuccessAlert, showErrorAlert } from '../helpers/swaHelper';
import DeudoresListSkeleton from '../components/DeudoresListSkeleton';
import axios from '../services/root.service.js';

const DeudoresList = () => {
  const [allDeudores, setAllDeudores] = useState([]);
  const [filteredDeudores, setFilteredDeudores] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [loading, setLoading] = useState(true);
  const deudoresPerPage =10;
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedDeudor, setSelectedDeudor] = useState(null);
  const [amount, setAmount] = useState('');
  const [isPayment, setIsPayment] = useState(true);
  const [comment, setComment] = useState('');

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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
        setLoading(true); // Activar loading
        const data = await getDeudores(1, Number.MAX_SAFE_INTEGER);
        setAllDeudores(data.deudores);
        setFilteredDeudores(data.deudores);
        setTotalPages(Math.ceil(data.deudores.length / deudoresPerPage));
      } catch (error) {
        console.error('Error fetching deudores:', error);
      } finally {
        setLoading(false); // Desactivar loading
      }
    };

    fetchAllDeudores();
  }, []);

  useEffect(() => {
    const filtered = allDeudores.filter(deudor =>
      deudor.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDeudores(filtered);
    setTotalPages(Math.ceil(filtered.length / deudoresPerPage));
  }, [searchQuery, allDeudores]);

  useEffect(() => {
    // Primero separamos los deudores con deuda 0 de los demás
    const deudoresConDeuda = filteredDeudores.filter(deudor => {
      const deudaValue = parseFloat(deudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
      return deudaValue > 0;
    });
    
    const deudoresSinDeuda = filteredDeudores.filter(deudor => {
      const deudaValue = parseFloat(deudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
      return deudaValue === 0;
    });
    
    // Aplicamos el ordenamiento solo a los deudores con deuda
    let sortedDeudoresConDeuda = [...deudoresConDeuda].sort((a, b) => {
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
    
    // Ordenamos también los deudores sin deuda
    let sortedDeudoresSinDeuda = [...deudoresSinDeuda].sort((a, b) => {
      if (sortOption === 'name-asc') return a.Nombre.localeCompare(b.Nombre);
      if (sortOption === 'name-desc') return b.Nombre.localeCompare(a.Nombre);
      if (sortOption === 'date-asc') return new Date(a.fechaPaga) - new Date(b.fechaPaga);
      if (sortOption === 'date-desc') return new Date(b.fechaPaga) - new Date(a.fechaPaga);
      return 0;
    });
    
    // Combinamos los resultados: primero los que tienen deuda, luego los sin deuda
    const combinedDeudores = [...sortedDeudoresConDeuda, ...sortedDeudoresSinDeuda];
    
    setFilteredDeudores(combinedDeudores);
  }, [sortOption, allDeudores, searchQuery]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDelete = async (id) => {
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
      console.error('Error deleting deudor:', error);
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
  // Función para validar el formulario de deuda antes de enviar
const validateDebtForm = () => {
  // Validar monto
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    showErrorAlert('Monto inválido', 'Por favor ingrese un monto válido mayor a cero.');
    return false;
  }

  // Validar que el comentario no sea demasiado largo
  if (comment && comment.length > 500) {
    showErrorAlert('Comentario demasiado largo', 'El comentario no puede exceder los 500 caracteres.');
    return false;
  }

  // Validar que si es un pago, no exceda la deuda actual
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

// Modificar la función handleDebtUpdate para usar la validación
const handleDebtUpdate = async () => {
  if (!validateDebtForm()) {
    return;
  }

  try {
    const currentDebt = parseFloat(selectedDeudor.deudaTotal.replace(/\$|\./g, '').replace(',', '.'));
    const parsedAmount = parseFloat(amount);
    
    let newDebt = isPayment ? currentDebt - parsedAmount : currentDebt + parsedAmount;
    
    // Crear nuevo registro para el historial de pagos
    const nuevoPago = {
      fecha: new Date(),
      monto: parsedAmount,
      tipo: isPayment ? 'pago' : 'deuda',
      comentario: comment.trim() || ''
    };
    
    // Obtener historial actual (es necesario obtener el deudor actualizado primero)
    const deudorActual = await getDeudorById(selectedDeudor._id);
    const historialActual = deudorActual.historialPagos || [];
    
    // Usar la ruta existente de actualización
    const response = await axios.patch(`/deudores/actualizar/${selectedDeudor._id}`, {
      deudaTotal: newDebt,
      // Mantener los demás datos igual y solo actualizar deuda e historial
      Nombre: selectedDeudor.Nombre,
      fechaPaga: selectedDeudor.fechaPaga,
      numeroTelefono: selectedDeudor.numeroTelefono,
      historialPagos: [...historialActual, nuevoPago]
    });
    
    setComment('');
    setAmount('');
    setShowModal(false);
    const fetchDeudores = async () => {
      const data = await getDeudores(1, Number.MAX_SAFE_INTEGER);
      setAllDeudores(data.deudores);
      setFilteredDeudores(data.deudores);
    };
    await fetchDeudores();
    
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
    try {
      await updateDeudor(deudorToEdit._id, {
        Nombre: deudorToEdit.Nombre,
        fechaPaga: deudorToEdit.fechaPaga,
        numeroTelefono: deudorToEdit.numeroTelefono.toString(),
        deudaTotal: parseFloat(deudorToEdit.deudaTotal)
      });
      
      const updatedDeudores = await getDeudores(1, Number.MAX_SAFE_INTEGER);
      setAllDeudores(updatedDeudores.deudores);
      setFilteredDeudores(updatedDeudores.deudores.filter(deudor =>
        deudor.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      
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
      
      // Obtener la versión más actualizada del deudor directamente del backend
      const deudorActualizado = await getDeudorById(deudor._id);

      if (deudorActualizado) {
        // Asegurarse de que historialPagos sea un array válido
        deudorActualizado.historialPagos = Array.isArray(deudorActualizado.historialPagos) 
          ? deudorActualizado.historialPagos 
          : [];
          
        setSelectedHistoryDeudor(deudorActualizado);
      } else {
        // Si no se encuentra, usar los datos disponibles pero con array vacío
        deudor.historialPagos = [];
        setSelectedHistoryDeudor(deudor);
      }
      
      setShowHistoryModal(true);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener historial actualizado:', error);
      // Si hay error, usar los datos disponibles con array vacío
      deudor.historialPagos = [];
      setSelectedHistoryDeudor(deudor);
      setShowHistoryModal(true);
      setLoading(false);
    }
  };

  // Agregar esta función para sanitizar los inputs numéricos
  const sanitizeNumber = (value) => {
    if (typeof value === 'string') {
      // Elimina todos los caracteres no numéricos excepto el punto decimal
      return value.replace(/[^\d.]/g, '');
    }
    return value;
  };

  return (
    <div className="deudores-list-container">
      <Navbar />
      <div className="main-content">
        {loading ? (
          <DeudoresListSkeleton />
        ) : (
          <>
            <div className="section-title-deudores">
              Personas deudoras
              <button className="add-deudor-button" onClick={handleAddDeudor}>
                <FontAwesomeIcon icon={faPlus} /> Agregar Deudor
              </button>
            </div>
            <div className="search-sort-container">
              <div className="search-bar-deudores">
                <input
                  id="search"
                  type="text"
                  className="input search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Buscar deudores..."
                />
              </div>
              <div className="sort-bar">
                <select onChange={handleSortChange} value={sortOption} className="sort-select">
                  <option value="">Ordenar por</option>
                  <option value="name-asc">Nombre (A-Z)</option>
                  <option value="name-desc">Nombre (Z-A)</option>
                  <option value="debt-asc">Deuda (Ascendente)</option>
                  <option value="debt-desc">Deuda (Descendente)</option>
                  <option value="date-asc">Fecha a Pagar (Ascendente)</option>
                  <option value="date-desc">Fecha a Pagar (Descendente)</option>
                </select>
              </div>
              <button onClick={handleClearFilters} className="clear-filters-button">
                Limpiar Filtros
              </button>
            </div>
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
                    <tr key={index} className={isZeroDebt ? 'zero-debt-row' : ''}>
                      <td>{deudor.Nombre || 'Nombre desconocido'}</td>
                      <td>{new Date(deudor.fechaPaga).toLocaleDateString() || 'Fecha desconocida'}</td>
                      <td>{deudor.numeroTelefono || 'Teléfono desconocido'}</td>
                      <td>${deudor.deudaTotal !== undefined ? deudor.deudaTotal.toLocaleString() : 'N/A'}</td>
                      <td className="actions-cell">
                        <button onClick={() => handleUpdateDebt(deudor)} className="update-debt-button">
                          <FontAwesomeIcon icon={faMoneyBillWave} />
                        </button>
                        <button onClick={() => handleViewHistory(deudor)} className="view-history-button">
                          <FontAwesomeIcon icon={faHistory} />
                        </button>
                        <button onClick={() => handleEdit(deudor)} className="edit-button">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button onClick={() => handleDelete(deudor._id)} className="delete-button">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            
            {/* Modal para actualizar deuda */}
            {showModal && selectedDeudor && (
              <div className="deudores-modal-overlay" onClick={() => setShowModal(false)}>
                <div className="deudores-modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>{isPayment ? 'Registrar Pago' : 'Añadir a la Deuda'}</h3>
                  <p><strong>Deudor:</strong> {selectedDeudor.Nombre}</p>
                  <p><strong>Deuda actual:</strong> ${selectedDeudor.deudaTotal}</p>
                  
                  <div className="deudores-modal-form-group">
                    <label htmlFor="amount">Monto:</label>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(sanitizeNumber(e.target.value))}
                      placeholder="Ingrese el monto"
                      min="0"
                      required
                    />
                  </div>
                  
                  {/* Nuevo campo para comentarios */}
                  <div className="deudores-modal-form-group">
                    <label htmlFor="comment">Comentario (opcional):</label>
                    <textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Añada un comentario opcional"
                      rows="3"
                    />
                  </div>
                  
                  <div className="deudores-modal-form-group payment-type">
                    <label>
                      <input
                        type="radio"
                        name="paymentType"
                        checked={isPayment}
                        onChange={() => setIsPayment(true)}
                      />
                      Registrar pago (restar de la deuda)
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="paymentType"
                        checked={!isPayment}
                        onChange={() => setIsPayment(false)}
                      />
                      Añadir a la deuda
                    </label>
                  </div>
                  
                  <div className="deudores-modal-buttons">
                    <button onClick={handleDebtUpdate} className="deudores-confirm-button">
                      Confirmar
                    </button>
                    <button onClick={() => setShowModal(false)} className="deudores-cancel-button">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Modal para editar deudor */}
            {showEditModal && (
              <div className="deudores-modal-overlay" onClick={() => setShowEditModal(false)}>
                <div className="deudores-modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Editar Deudor</h3>
                  
                  <div className="deudores-modal-form-group">
                    <label htmlFor="editNombre">Nombre:</label>
                    <input
                      type="text"
                      id="editNombre"
                      name="Nombre"
                      value={deudorToEdit.Nombre}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  
                  <div className="deudores-modal-form-group">
                    <label htmlFor="editFechaPaga">Fecha a Pagar:</label>
                    <input
                      type="date"
                      id="editFechaPaga"
                      name="fechaPaga"
                      value={deudorToEdit.fechaPaga}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  
                  <div className="deudores-modal-form-group">
                    <label htmlFor="editNumeroTelefono">Número de Teléfono:</label>
                    <input
                      type="text"
                      id="editNumeroTelefono"
                      name="numeroTelefono"
                      value={deudorToEdit.numeroTelefono}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  
                  <div className="deudores-modal-form-group">
                    <label htmlFor="editDeudaTotal">Deuda Total:</label>
                    <input
                      type="number"
                      id="editDeudaTotal"
                      name="deudaTotal"
                      value={deudorToEdit.deudaTotal}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  
                  {/* Historial de Pagos */}
                  <div className="deudores-payment-history">
                    <h4>Historial de Pagos</h4>
                    {deudorToEdit.historialPagos && deudorToEdit.historialPagos.length > 0 ? (
                      <div className="deudores-payment-history-table-container">
                        <table className="deudores-payment-history-table">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Monto</th>
                              <th>Tipo</th>
                              <th>Comentario</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deudorToEdit.historialPagos.map((pago, idx) => (
                              <tr key={idx} className={pago.tipo === 'pago' ? 'payment-row' : 'debt-row'}>
                                <td>{new Date(pago.fecha).toLocaleDateString()}</td>
                                <td>${pago.monto.toLocaleString()}</td>
                                <td>{pago.tipo === 'pago' ? 'Pago' : 'Deuda'}</td>
                                <td className="comment-cell">
                                  {pago.comentario ? 
                                    <>
                                      {pago.comentario.length > 20 ? pago.comentario.substring(0, 20) + '...' : pago.comentario}
                                      {pago.comentario.length > 20 && 
                                        <div className="comment-tooltip">{pago.comentario}</div>
                                      }
                                    </> 
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="no-payment-history">No hay historial de pagos registrado</p>
                    )}
                  </div>
                  
                  <div className="deudores-modal-buttons">
                    <button onClick={handleEditSubmit} className="deudores-confirm-button">
                      Guardar Cambios
                    </button>
                    <button onClick={() => setShowEditModal(false)} className="deudores-cancel-button">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Modal para ver historial de pagos */}
            {showHistoryModal && selectedHistoryDeudor && (
              <div className="deudores-modal-overlay" onClick={() => setShowHistoryModal(false)}>
                <div className="deudores-modal-content history-modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Historial de Transacciones - {selectedHistoryDeudor.Nombre}</h3>
                  <p><strong>Deuda actual:</strong> ${typeof selectedHistoryDeudor.deudaTotal === 'number' ? 
                    selectedHistoryDeudor.deudaTotal.toLocaleString() : 
                    selectedHistoryDeudor.deudaTotal}</p>
                  
                  <div className="deudores-payment-history">
                    {selectedHistoryDeudor.historialPagos && 
                     Array.isArray(selectedHistoryDeudor.historialPagos) && 
                     selectedHistoryDeudor.historialPagos.length > 0 ? (
                      <div className="deudores-payment-history-table-container">
                        <table className="deudores-payment-history-table">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>Monto</th>
                              <th>Tipo</th>
                              <th>Comentario</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedHistoryDeudor.historialPagos.map((pago, idx) => (
                              <tr key={idx} className={pago.tipo === 'pago' ? 'payment-row' : 'debt-row'}>
                                <td>{new Date(pago.fecha).toLocaleDateString()}</td>
                                <td>${pago.monto.toLocaleString()}</td>
                                <td>{pago.tipo === 'pago' ? 'Pago' : 'Deuda'}</td>
                                <td>{pago.comentario || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="no-payment-history">No hay historial de pagos registrado</p>
                    )}
                  </div>
                  
                  <div className="deudores-modal-buttons">
                    <button onClick={() => setShowHistoryModal(false)} className="deudores-cancel-button">
                      Cerrar
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