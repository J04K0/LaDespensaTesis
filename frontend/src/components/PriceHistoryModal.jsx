import React, { useState, useEffect } from 'react';
import { getProductPriceHistory } from '../services/AddProducts.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../styles/PriceHistoryModal.css';

const PriceHistoryModal = ({ isOpen, onClose, productId, embedded = false }) => {
  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && !embedded) {
      document.body.classList.add('modal-open');
    } else if (!embedded) {
      document.body.classList.remove('modal-open');
    }

    const fetchHistorial = async () => {
      if (isOpen && productId) {
        try {
          setLoading(true);
          setError(null);
          const data = await getProductPriceHistory(productId);
          if (data && data.data) {
            setHistorial(data.data);
          } else {
            throw new Error('No se recibieron datos válidos del servidor');
          }
        } catch (err) {
          console.error('Error en fetchHistorial:', err);
          setError(err.message || 'Error al cargar el historial');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchHistorial();

    return () => {
      if (!embedded) {
        document.body.classList.remove('modal-open');
      }
    };
  }, [isOpen, productId, embedded]);

  if (!isOpen) return null;

  const renderPriceChange = (oldPrice, newPrice) => {
    if (!oldPrice || !newPrice) return null;
    const change = ((newPrice - oldPrice) / oldPrice) * 100;
    const isIncrease = change > 0;
    
    return (
      <span className={`price-change ${isIncrease ? 'increase' : 'decrease'}`}>
        {isIncrease ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (embedded) {
    return (
      <div className="price-history-content embedded">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">
            <p className="error-title">Error</p>
            <p className="error-text">{error}</p>
          </div>
        ) : historial ? (
          <>
            <div className="current-prices-section">
              <h3>Precios Actuales</h3>
              <div className="prices-grid">
                <div className="price-card">
                  <p className="price-label">Precio de Venta</p>
                  <div className="price-value-container">
                    <p className="price-value">
                      ${historial.productoActual?.precioVentaActual?.toFixed(2) || 'N/A'}
                    </p>
                    {renderPriceChange(
                      historial.historialPrecios?.[1]?.precioVenta,
                      historial.productoActual?.precioVentaActual
                    )}
                  </div>
                </div>
                <div className="price-card">
                  <p className="price-label">Precio de Compra</p>
                  <div className="price-value-container">
                    <p className="price-value">
                      ${historial.productoActual?.precioCompraActual?.toFixed(2) || 'N/A'}
                    </p>
                    {renderPriceChange(
                      historial.historialPrecios?.[1]?.precioCompra,
                      historial.productoActual?.precioCompraActual
                    )}
                  </div>
                </div>
              </div>
              <p className="last-update">
                Última actualización: {historial.productoActual?.ultimaActualizacion 
                  ? format(new Date(historial.productoActual.ultimaActualizacion), 'dd/MM/yyyy HH:mm', { locale: es })
                  : 'N/A'}
              </p>
            </div>

            <div className="history-table-section">
              <h3>Historial de Cambios</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Precio de Venta</th>
                      <th>Precio de Compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.historialPrecios && historial.historialPrecios.length > 0 ? (
                      historial.historialPrecios.map((precio, index) => (
                        <tr key={index}>
                          <td>
                            {format(new Date(precio.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </td>
                          <td className="price-sale">
                            ${precio.precioVenta?.toFixed(2) || 'N/A'}
                          </td>
                          <td className="price-purchase">
                            ${precio.precioCompra?.toFixed(2) || 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="no-data">
                          No hay historial de precios disponible
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="no-data">
            No se encontró información del historial
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="price-history-modal-overlay" onClick={handleOverlayClick}>
      <div className="price-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="price-history-header">
          <h2>Historial de Precios</h2>
          <button
            onClick={onClose}
            className="close-button"
          >
            <svg className="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="price-history-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : error ? (
            <div className="error-message">
              <p className="error-title">Error</p>
              <p className="error-text">{error}</p>
            </div>
          ) : historial ? (
            <>
              <div className="current-prices-section">
                <h3>Precios Actuales</h3>
                <div className="prices-grid">
                  <div className="price-card">
                    <p className="price-label">Precio de Venta</p>
                    <div className="price-value-container">
                      <p className="price-value">
                        ${historial.productoActual?.precioVentaActual?.toFixed(2) || 'N/A'}
                      </p>
                      {renderPriceChange(
                        historial.historialPrecios?.[1]?.precioVenta,
                        historial.productoActual?.precioVentaActual
                      )}
                    </div>
                  </div>
                  <div className="price-card">
                    <p className="price-label">Precio de Compra</p>
                    <div className="price-value-container">
                      <p className="price-value">
                        ${historial.productoActual?.precioCompraActual?.toFixed(2) || 'N/A'}
                      </p>
                      {renderPriceChange(
                        historial.historialPrecios?.[1]?.precioCompra,
                        historial.productoActual?.precioCompraActual
                      )}
                    </div>
                  </div>
                </div>
                <p className="last-update">
                  Última actualización: {historial.productoActual?.ultimaActualizacion 
                    ? format(new Date(historial.productoActual.ultimaActualizacion), 'dd/MM/yyyy HH:mm', { locale: es })
                    : 'N/A'}
                </p>
              </div>

              <div className="history-table-section">
                <h3>Historial de Cambios</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Precio de Venta</th>
                        <th>Precio de Compra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.historialPrecios && historial.historialPrecios.length > 0 ? (
                        historial.historialPrecios.map((precio, index) => (
                          <tr key={index}>
                            <td>
                              {format(new Date(precio.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </td>
                            <td className="price-sale">
                              ${precio.precioVenta?.toFixed(2) || 'N/A'}
                            </td>
                            <td className="price-purchase">
                              ${precio.precioCompra?.toFixed(2) || 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="no-data">
                            No hay historial de precios disponible
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="no-data">
              No se encontró información del historial
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceHistoryModal;