import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBoxes, faCalendarAlt, faDollarSign, faUser, faPercent, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { getLotesProducto } from '../services/AddProducts.service';
import '../styles/ProductLotesModal.css';

const ProductLotesModal = ({ isOpen, onClose, productId, productName }) => {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resumen, setResumen] = useState(null);

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
    
    // El primer lote (ya están ordenados por fecha de vencimiento)
    return lotesConStock[0];
  };

  if (!isOpen) return null;

  // 🆕 Función para manejar clic en el overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
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

              {/* Próximo a vencer */}
              {getProximoVencer() && (
                <div className="proximo-vencer">
                  <div className="proximo-header">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>Próximo a vencer:</span>
                  </div>
                  <div className="proximo-info">
                    <span className="proximo-dias">{getProximoVencer().diasParaVencer} días</span>
                    <span className="proximo-text">
                      Al vender, se usará automáticamente el lote que vence primero (FEFO)
                    </span>
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
                              {index === 0 ? 'Lote #101' : `Lote #${101 + index}`}
                            </span>
                            {index === 0 && <span className="siguiente-badge">Siguiente</span>}
                          </div>
                          <div className="lote-agregado">
                            Agregado {new Date(lote.fechaCreacion).toLocaleDateString()}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductLotesModal;