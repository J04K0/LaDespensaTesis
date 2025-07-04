import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHistory, faUser, faCalendarAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import axios from '../services/root.service';
import '../styles/StockHistoryModal.css';

const StockHistoryModal = ({ isOpen, onClose, productId, productName }) => {
  const [historialStock, setHistorialStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tipoMovimientoLabels = {
    'ajuste_manual': 'Ajuste Manual',
    'venta': 'Venta',
    'devolucion': 'Devolución',
    'perdida': 'Pérdida',
    'entrada_inicial': 'Entrada Inicial',
    'correccion': 'Corrección'
  };

  const tipoMovimientoColors = {
    'ajuste_manual': '#007bff',
    'venta': '#28a745',
    'devolucion': '#ffc107',
    'perdida': '#dc3545',
    'entrada_inicial': '#17a2b8',
    'correccion': '#6f42c1'
  };

  useEffect(() => {
    if (isOpen && productId) {
      fetchStockHistory();
    }
  }, [isOpen, productId]);

  const fetchStockHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/products/historial-stock/${productId}`);
      setHistorialStock(response.data.data.historialStock || []);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      setError('No se pudo cargar el historial de stock');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementIcon = (tipo) => {
    switch (tipo) {
      case 'ajuste_manual': return '⚙️';
      case 'venta': return '💰';
      case 'devolucion': return '↩️';
      case 'perdida': return '❌';
      case 'entrada_inicial': return '📦';
      case 'correccion': return '🔧';
      default: return '📝';
    }
  };

  const isRestoreMovement = (motivo) => {
    return motivo && motivo.toLowerCase().includes('producto restaurado');
  };

  const extractRestoreComment = (motivo) => {
    if (isRestoreMovement(motivo)) {
      const match = motivo.match(/Producto restaurado: (.+)/);
      return match ? match[1] : motivo;
    }
    return motivo;
  };

  if (!isOpen) return null;

  // 🆕 Función para manejar clic en el overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="stock-history-modal-overlay" onClick={handleOverlayClick}>
      <div className="stock-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stock-history-modal-header">
          <div className="modal-title">
            <FontAwesomeIcon icon={faHistory} className="title-icon" />
            <h3>Historial de Stock</h3>
          </div>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="stock-history-modal-body">
          <div className="product-info-header">
            <h4>{productName}</h4>
            <p className="product-id">ID: {productId}</p>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando historial...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <FontAwesomeIcon icon={faInfoCircle} className="error-icon" />
              <p>{error}</p>
            </div>
          ) : historialStock.length === 0 ? (
            <div className="empty-history">
              <FontAwesomeIcon icon={faHistory} className="empty-icon" />
              <p>No hay cambios de stock registrados para este producto</p>
            </div>
          ) : (
            <div className="history-timeline">
              {historialStock.map((cambio, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker" style={{ 
                    backgroundColor: isRestoreMovement(cambio.motivo) 
                      ? '#28a745' // Verde para restauraciones
                      : tipoMovimientoColors[cambio.tipoMovimiento] 
                  }}>
                    <span className="movement-icon">
                      {isRestoreMovement(cambio.motivo) ? '🔄' : getMovementIcon(cambio.tipoMovimiento)}
                    </span>
                  </div>
                  
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="movement-type" style={{ 
                        color: isRestoreMovement(cambio.motivo) 
                          ? '#28a745' 
                          : tipoMovimientoColors[cambio.tipoMovimiento] 
                      }}>
                        {isRestoreMovement(cambio.motivo) 
                          ? 'Producto Restaurado' 
                          : (tipoMovimientoLabels[cambio.tipoMovimiento] || cambio.tipoMovimiento)
                        }
                      </span>
                      <span className="movement-date">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {formatDate(cambio.fecha)}
                      </span>
                    </div>
                    
                    <div className="stock-change">
                      <span className="stock-before">Stock anterior: {cambio.stockAnterior}</span>
                      <span className="arrow">→</span>
                      <span className="stock-after">Stock nuevo: {cambio.stockNuevo}</span>
                      <span className={`stock-difference ${cambio.stockNuevo > cambio.stockAnterior ? 'positive' : 'negative'}`}>
                        ({cambio.stockNuevo > cambio.stockAnterior ? '+' : ''}{cambio.stockNuevo - cambio.stockAnterior})
                      </span>
                    </div>
                    
                    <div className="movement-details">
                      <p className="movement-reason">
                        <strong>
                          {isRestoreMovement(cambio.motivo) ? 'Comentario de restauración:' : 'Motivo:'}
                        </strong> 
                        {isRestoreMovement(cambio.motivo) ? (
                          <span className="restore-comment">
                            {extractRestoreComment(cambio.motivo)}
                          </span>
                        ) : (
                          cambio.motivo
                        )}
                      </p>
                      {cambio.usuario && (
                        <p className="movement-user">
                          <FontAwesomeIcon icon={faUser} />
                          <strong>Usuario:</strong> {cambio.usuario.username || cambio.usuario.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stock-history-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;