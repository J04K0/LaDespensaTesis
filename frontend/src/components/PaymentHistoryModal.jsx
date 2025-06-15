import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const PaymentHistoryModal = ({ 
  show, 
  onClose, 
  selectedDeudor, 
  expandedComments, 
  onToggleComment 
}) => {
  if (!show || !selectedDeudor) return null;

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
            onToggleComment(commentId);
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

  return (
    <div className="deudores-modal-overlay" onClick={onClose}>
      <div className="deudores-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="deudores-modal-header">
          <h2 className="deudores-modal-title">
            Historial de Pagos - {selectedDeudor.Nombre}
          </h2>
        </div>
        
        <div className="deudores-modal-body">
          {selectedDeudor.historialPagos.length === 0 ? (
            <p className="deudores-no-history">
              No hay historial de pagos disponible para este deudor.
            </p>
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
                {selectedDeudor.historialPagos.map((pago, idx) => (
                  <tr 
                    key={idx} 
                    className={pago.tipo === 'pago' ? 'deudores-payment-row' : 'deudores-debt-row'}
                  >
                    <td>{new Date(pago.fecha).toLocaleDateString()}</td>
                    <td>${pago.monto.toLocaleString('es-ES')}</td>
                    <td>
                      <span 
                        className={`deudores-state-badge ${
                          pago.tipo === 'pago' ? 'deudores-state-badge-success' : 'deudores-state-badge-danger'
                        }`}
                      >
                        {pago.tipo === 'pago' ? 'Pago' : 'Deuda'}
                      </span>
                    </td>
                    <td>
                      {pago.tipo === 'pago' ? (
                        <span 
                          className={`deudores-payment-method ${
                            pago.metodoPago === 'efectivo' ? 'efectivo' : 'tarjeta'
                          }`}
                        >
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
          <button className="deudores-btn deudores-btn-secondary" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} /> Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryModal;