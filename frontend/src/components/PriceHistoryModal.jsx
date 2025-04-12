import React, { useState, useEffect } from 'react';
import { getProductPriceHistory } from '../services/AddProducts.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PriceHistoryModal = ({ isOpen, onClose, productId }) => {
  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, [isOpen, productId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="price-history-modal w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="modal-content p-6 flex flex-col h-full">
          <div className="modal-header">
            <div className="flex justify-between items-center">
              <h2>Historial de Precios</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-1">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="loading-spinner"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-4 bg-red-50 rounded-lg">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : historial ? (
              <div className="space-y-6">
                <div className="current-prices">
                  <h3>Precios Actuales</h3>
                  <div className="price-grid">
                    <div className="price-item">
                      <p className="price-label">Producto</p>
                      <p className="price-value">{historial.productoActual?.nombre || 'N/A'}</p>
                    </div>
                    <div className="price-item">
                      <p className="price-label">Última actualización</p>
                      <p className="price-value">
                        {historial.productoActual?.ultimaActualizacion 
                          ? format(new Date(historial.productoActual.ultimaActualizacion), 'dd/MM/yyyy HH:mm', { locale: es })
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="price-item">
                      <p className="price-label">Precio de Venta</p>
                      <p className="price-value sale">
                        ${historial.productoActual?.precioVentaActual?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                    <div className="price-item">
                      <p className="price-label">Precio de Compra</p>
                      <p className="price-value purchase">
                        ${historial.productoActual?.precioCompraActual?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="history-table">
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
                            <td className="text-green-600">
                              ${precio.precioVenta?.toFixed(2) || 'N/A'}
                            </td>
                            <td className="text-blue-600">
                              ${precio.precioCompra?.toFixed(2) || 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-gray-500">
                            No hay historial de precios disponible
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No se encontró información del historial
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceHistoryModal; 