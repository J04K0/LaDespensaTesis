import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBoxes, faCalendarAlt, faDollarSign, faUser, faPercent, faExclamationTriangle, faCheckCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import { getLotesProducto } from '../services/AddProducts.service';
import EditLoteModal from './EditLoteModal';
import { useRole } from '../hooks/useRole';
import '../styles/ProductLotesModal.css';

const ProductLotesModal = ({ isOpen, onClose, productId, productName, onLoteUpdated }) => {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resumen, setResumen] = useState(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [loteToEdit, setLoteToEdit] = useState(null);
  
  const { permissions } = useRole();

  useEffect(() => {
    if (isOpen && productId) {
      fetchLotes();
    }
  }, [isOpen, productId]);

  const fetchLotes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getLotesProducto(productId);
      setLotes(response.data.lotes || []);
      setResumen(response.data.resumen || null);
    } catch (error) {
      console.error('Error fetching lotes:', error);
      setError('No se pudieron cargar los lotes del producto');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (lote) => {
    if (lote.estaVencido) {
      return (
        <span className="lote-status vencido">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          Vencido
        </span>
      );
    } else if (lote.estaPorVencer) {
      return (
        <span className="lote-status por-vencer">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          Por vencer ({lote.diasParaVencer} días)
        </span>
      );
    } else {
      return (
        <span className="lote-status bueno">
          <FontAwesomeIcon icon={faCheckCircle} />
          Bueno ({lote.diasParaVencer} días)
        </span>
      );
    }
  };

  const getProximoVencer = () => {
    if (lotes.length === 0) return null;
    
    const lotesConStock = lotes.filter(lote => lote.cantidad > 0);
    if (lotesConStock.length === 0) return null;
    
    return lotesConStock[0];
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEditLote = (lote) => {
    setLoteToEdit(lote);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setLoteToEdit(null);
  };

  const handleLoteUpdated = async () => {
    await fetchLotes();
    setShowEditModal(false);
    setLoteToEdit(null);
    
    if (onLoteUpdated) {
      onLoteUpdated();
    }
  };

  return (
    <div className="lotes-modal-overlay" onClick={handleOverlayClick}>
      <div className="lotes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lotes-modal-header">
          <div className="lotes-modal-title">
            <FontAwesomeIcon icon={faBoxes} />
            <div>
              <h2>{productName}</h2>
              <p>Ver lotes({lotes.length})</p>
            </div>
          </div>
          <button className="lotes-modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="lotes-modal-content">
          {loading && (
            <div className="lotes-loading">
              <p>Cargando lotes...</p>
            </div>
          )}

          {error && (
            <div className="lotes-error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Resumen superior */}
              {resumen && (
                <div className="lotes-summary">
                  <div className="summary-card">
                    <FontAwesomeIcon icon={faBoxes} />
                    <div>
                      <span className="summary-value">{resumen.stockTotal}</span>
                      <span className="summary-label">Stock: {resumen.stockTotal} unidades</span>
                    </div>
                  </div>
                  <div className="summary-card">
                    <span className="summary-value">{resumen.totalLotes}</span>
                    <span className="summary-label">{resumen.totalLotes} lotes</span>
                  </div>
                </div>
              )}

              {/* Lista de lotes */}
              <div className="lotes-section">
                <h3>Lotes ordenados por vencimiento:</h3>
                
                {lotes.length === 0 ? (
                  <div className="no-lotes">
                    <FontAwesomeIcon icon={faBoxes} size="2x" />
                    <p>No hay lotes disponibles para este producto</p>
                  </div>
                ) : (
                  <div className="lotes-list">
                    {lotes.map((lote, index) => (
                      <div key={lote._id} className={`lote-card ${index === 0 ? 'siguiente' : ''}`}>
                        <div className="lote-header">
                          <div className="lote-number">
                            <span className="lote-label">
                              {lote.numeroLote || `Lote #${101 + index}`}
                            </span>
                            {index === 0 && <span className="siguiente-badge">Siguiente</span>}
                          </div>
                          <div className="lote-actions">
                            {permissions.canEditProduct && (
                              <button 
                                className="lote-edit-btn"
                                onClick={() => handleEditLote(lote)}
                                title="Editar lote"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                            )}
                            <div className="lote-agregado">
                              Agregado {new Date(lote.fechaCreacion).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="lote-body">
                          <div className="lote-row">
                            <div className="lote-field">
                              <span className="field-label">Cantidad</span>
                              <span className="field-value">{lote.cantidad}</span>
                              <span className="field-unit">unidades</span>
                            </div>
                            
                            <div className="lote-field">
                              <span className="field-label">Precio Compra</span>
                              <span className="field-value">${lote.precioCompra}</span>
                            </div>
                            
                            <div className="lote-field">
                              <span className="field-label">Vencimiento</span>
                              <span className="field-value">
                                {new Date(lote.fechaVencimiento).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="lote-field">
                              <span className="field-label">Margen</span>
                              <span className="field-value">${(lote.precioVenta - lote.precioCompra)}</span>
                              <span className="field-unit">{lote.margen}%</span>
                            </div>
                          </div>

                          <div className="lote-status-row">
                            {getStatusBadge(lote)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showEditModal && loteToEdit && (
                <EditLoteModal 
                  isOpen={showEditModal} 
                  onClose={handleCloseEditModal} 
                  lote={loteToEdit}
                  productId={productId}
                  onLoteUpdated={handleLoteUpdated}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductLotesModal;