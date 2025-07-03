import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/ProductCardStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faChevronDown, faChevronUp, faBoxes, faCalendarAlt, faDollarSign, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { STOCK_MINIMO_POR_CATEGORIA } from '../constants/products.constants.js';
import { getLotesProducto } from '../services/AddProducts.service';

const ProductCard = React.memo(({ image, name, stock, venta, fechaVencimiento, categoria, onInfo, productId }) => {
  // Estados para el desplegable de lotes
  const [lotesExpanded, setLotesExpanded] = useState(false);
  const [lotes, setLotes] = useState([]);
  const [lotesLoading, setLotesLoading] = useState(false);
  const [lotesError, setLotesError] = useState(null);
  const [lotesLoaded, setLotesLoaded] = useState(false);
  const [lotesCount, setLotesCount] = useState(0); // 🆕 NUEVO: Estado para el conteo de lotes

  const isExpired = React.useMemo(() => {
    return fechaVencimiento ? new Date(fechaVencimiento) < new Date() : false;
  }, [fechaVencimiento]);
  
  const stockIndicatorClass = React.useMemo(() => {
    const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[categoria] || 5;

    if (stock === 0) return 'productcard-stock-low';
    if (stock <= stockMinimo) return 'productcard-stock-medium';
    return 'productcard-stock-high';
  }, [stock, categoria]);

  const formatNumberWithDots = (number) => {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formattedPrice = React.useMemo(() => {
    return typeof venta === 'number' ? formatNumberWithDots(venta) : venta;
  }, [venta]);

  const cardClasses = React.useMemo(() => {
    let classes = 'productcard';
    if (stock === 0) classes += ' productcard-out-of-stock';
    if (isExpired) classes += ' productcard-expired';
    if (lotesExpanded) classes += ' productcard-expanded';
    return classes;
  }, [stock, isExpired, lotesExpanded]);

  const shouldShowBadges = React.useMemo(() => {
    return isExpired || stock === 0;
  }, [isExpired, stock]);

  // 🆕 NUEVO: Cargar conteo de lotes al montar el componente
  useEffect(() => {
    const fetchLotesCount = async () => {
      try {
        const response = await getLotesProducto(productId);
        const lotesData = response.data.lotes || [];
        setLotesCount(lotesData.length);
        // Si ya están cargados los lotes, actualizarlos también
        if (lotesLoaded) {
          setLotes(lotesData);
        }
      } catch (error) {
        console.error('Error fetching lotes count:', error);
        setLotesCount(0);
      }
    };

    if (productId) {
      fetchLotesCount();
    }
  }, [productId, lotesLoaded]);

  // Función para toggle del desplegable de lotes
  const toggleLotes = async () => {
    if (!lotesExpanded && !lotesLoaded) {
      // Cargar lotes solo la primera vez
      await fetchLotes();
    }
    setLotesExpanded(!lotesExpanded);
  };

  // Función para cargar los lotes
  const fetchLotes = async () => {
    setLotesLoading(true);
    setLotesError(null);
    
    try {
      const response = await getLotesProducto(productId);
      const lotesData = response.data.lotes || [];
      setLotes(lotesData);
      setLotesCount(lotesData.length); // 🆕 ACTUALIZAR: Sincronizar el conteo
      setLotesLoaded(true);
    } catch (error) {
      console.error('Error fetching lotes:', error);
      setLotesError('No se pudieron cargar los lotes');
    } finally {
      setLotesLoading(false);
    }
  };

  // Función para obtener el badge de estado del lote
  const getStatusBadge = (lote) => {
    if (lote.estaVencido) {
      return (
        <span className="productcard-lote-status vencido">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          Vencido
        </span>
      );
    } else if (lote.estaPorVencer) {
      return (
        <span className="productcard-lote-status por-vencer">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          Por vencer ({lote.diasParaVencer} días)
        </span>
      );
    } else {
      return (
        <span className="productcard-lote-status bueno">
          <FontAwesomeIcon icon={faCheckCircle} />
          Bueno ({lote.diasParaVencer} días)
        </span>
      );
    }
  };

  return (
    <div className="productcard-container">
      <div className={cardClasses}>
        <div className="productcard-inner">
          <div className="productcard-content-wrapper">
            <div className="productcard-main-info">
              <div className="productcard-image-container">
                <img
                  src={image || "/default-image.jpg"}
                  alt={name}
                  className="productcard-image"
                  loading="lazy"
                />
              </div>
              
              <div className="productcard-basic-info">
                <div className="productcard-title-container">
                  <h3 className="productcard-title">{name}</h3>
                  {shouldShowBadges && (
                    <div className="productcard-inline-badges">
                      {isExpired && <div className="productcard-badge productcard-vencido">Vencido</div>}
                      {stock === 0 && <div className="productcard-badge productcard-sin-stock">Sin stock</div>}
                    </div>
                  )}
                </div>
                <div className="productcard-stock">
                  <span className={`productcard-stock-indicator ${stockIndicatorClass}`}></span>
                  Stock: {stock} unidades
                </div>
              </div>
            </div>

            {/* Sección de lotes desplegable */}
            <div className="productcard-lotes-section">
              <button 
                className="productcard-lotes-toggle"
                onClick={toggleLotes}
                type="button"
              >
                <span>Ver lotes ({lotesCount})</span> {/* 🔧 ARREGLO: Usar lotesCount en lugar de lotes.length */}
                <FontAwesomeIcon 
                  icon={lotesExpanded ? faChevronUp : faChevronDown} 
                  className="productcard-toggle-icon"
                />
              </button>

              {lotesExpanded && (
                <div className="productcard-lotes-content">
                  {lotesLoading && (
                    <div className="productcard-lotes-loading">
                      <p>Cargando lotes...</p>
                    </div>
                  )}

                  {lotesError && (
                    <div className="productcard-lotes-error">
                      <p>{lotesError}</p>
                    </div>
                  )}

                  {!lotesLoading && !lotesError && lotes.length === 0 && (
                    <div className="productcard-no-lotes">
                      <FontAwesomeIcon icon={faBoxes} />
                      <p>No hay lotes disponibles para este producto</p>
                    </div>
                  )}

                  {!lotesLoading && !lotesError && lotes.length > 0 && (
                    <div className="productcard-lotes-list">
                      {lotes.map((lote, index) => (
                        <div key={lote._id} className={`productcard-lote-item ${index === 0 ? 'siguiente' : ''}`}>
                          <div className="productcard-lote-header">
                            <div className="productcard-lote-number">
                              <span className="productcard-lote-label">
                                {lote.numeroLote || `Lote #${index + 1}`}
                              </span>
                              {index === 0 && <span className="productcard-siguiente-badge">Siguiente</span>}
                            </div>
                            <div className="productcard-lote-fecha-agregado">
                              Agregado {new Date(lote.fechaCreacion).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="productcard-lote-body">
                            <div className="productcard-lote-info-grid">
                              <div className="productcard-lote-field">
                                <span className="productcard-field-label">Cantidad</span>
                                <span className="productcard-field-value">{lote.cantidad} unidades</span>
                              </div>
                              
                              <div className="productcard-lote-field">
                                <span className="productcard-field-label">Precio Compra</span>
                                <span className="productcard-field-value">${lote.precioCompra}</span>
                              </div>
                              
                              <div className="productcard-lote-field">
                                <span className="productcard-field-label">Vencimiento</span>
                                <span className="productcard-field-value">
                                  {new Date(lote.fechaVencimiento).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="productcard-lote-field">
                                <span className="productcard-field-label">Margen</span>
                                <span className="productcard-field-value">
                                  ${(lote.precioVenta - lote.precioCompra)} ({lote.margen}%)
                                </span>
                              </div>
                            </div>

                            <div className="productcard-lote-status-row">
                              {getStatusBadge(lote)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="productcard-price-section">
            <div className="productcard-price-container">
              <span className="productcard-price">$&nbsp;{formattedPrice}</span>
            </div>
            
            <div className="productcard-action-buttons">
              <button onClick={onInfo} className="productcard-action-btn productcard-action-btn-full">
                <FontAwesomeIcon icon={faInfoCircle} />
                Detalles
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.propTypes = process.env.NODE_ENV === 'development' ? {
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
  stock: PropTypes.number.isRequired,
  venta: PropTypes.number.isRequired,
  fechaVencimiento: PropTypes.string,
  categoria: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onInfo: PropTypes.func.isRequired,
  productId: PropTypes.string.isRequired,
} : {};

ProductCard.displayName = 'ProductCard';

export default ProductCard;
