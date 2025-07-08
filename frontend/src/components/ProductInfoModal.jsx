import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faInfo, faEye, faEyeSlash, faPen, faHistory, faTrash, faBoxes 
} from '@fortawesome/free-solid-svg-icons';
import { showConfirmationAlert } from '../helpers/swaHelper';
import { useRole } from '../hooks/useRole';
import { STOCK_MINIMO_POR_CATEGORIA } from '../constants/products.constants.js';
import { getProximoLoteProducto } from '../services/AddProducts.service'; // 🆕 Importar nueva función
import '../styles/ProductInfoModal.css';

const ProductInfoModal = React.memo(({ 
  isOpen, 
  onClose, 
  productInfo, 
  productStats, 
  onEdit, 
  onDelete, 
  onShowPriceHistory,
  onShowStockHistory,
  onDeletePermanently // 🆕 Nueva prop para eliminar definitivamente
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const { permissions } = useRole();

  const formatNumber = (number) => {
    if (!number && number !== 0) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.pageYOffset;
      document.body.style.cssText = `
        position: fixed;
        top: -${scrollY}px;
        width: 100%;
        overflow-y: scroll;
      `;
      document.body.dataset.scrollY = scrollY;
      
      // 🔧 Resetear el estado de cierre cuando se abre el modal
      setIsClosing(false);
    } else {
      const scrollY = document.body.dataset.scrollY;
      document.body.style.cssText = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
      delete document.body.dataset.scrollY;
    }

    return () => {
      const scrollY = document.body.dataset.scrollY;
      document.body.style.cssText = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
      delete document.body.dataset.scrollY;
    };
  }, [isOpen]);

  const getStockColorClass = useMemo(() => {
    if (!productInfo) return '';
    
    const stockMinimo = STOCK_MINIMO_POR_CATEGORIA[productInfo.Categoria] || 5;

    if (productInfo.Stock === 0) return 'modern-stock-value-red';
    if (productInfo.Stock <= stockMinimo) return 'modern-stock-value-yellow';
    return 'modern-stock-value-green';
  }, [productInfo]);

  // 🆕 NUEVO: Estados y lógica para información de lotes
  const [proximoLote, setProximoLote] = useState(null);
  const [loadingLote, setLoadingLote] = useState(false);

  // 🆕 NUEVO: Cargar información del próximo lote cuando se abre el modal
  useEffect(() => {
    if (isOpen && productInfo && productInfo._id) {
      const fetchProximoLote = async () => {
        try {
          setLoadingLote(true);
          const response = await getProximoLoteProducto(productInfo._id);
          setProximoLote(response.data);
        } catch (error) {
          console.error('Error al cargar información del próximo lote:', error);
          setProximoLote(null);
        } finally {
          setLoadingLote(false);
        }
      };

      fetchProximoLote();
    }
  }, [isOpen, productInfo]);

  // 🆕 NUEVO: Información mejorada con datos de lotes
  const enhancedProductInfo = useMemo(() => {
    if (!productInfo || !proximoLote) return productInfo;

    // Si tiene múltiples lotes y hay un lote principal
    if (proximoLote.tieneMultiplesLotes && proximoLote.lotePrincipal) {
      const lote = proximoLote.lotePrincipal;
      
      return {
        ...productInfo,
        // Usar precio de compra del lote FIFO
        PrecioCompra: lote.precioCompra || productInfo.PrecioCompra,
        // Usar fecha de vencimiento del lote FIFO
        fechaVencimiento: lote.fechaVencimiento || productInfo.fechaVencimiento,
        // Información adicional del lote
        _loteInfo: {
          tieneMultiplesLotes: true,
          totalLotes: proximoLote.totalLotes,
          numeroLote: lote.numeroLote,
          diasParaVencer: lote.diasParaVencer,
          estaVencido: lote.estaVencido,
          estaPorVencer: lote.estaPorVencer,
          origen: lote.origen
        }
      };
    }

    // Si no tiene lotes múltiples, usar datos del producto principal
    return {
      ...productInfo,
      _loteInfo: {
        tieneMultiplesLotes: false,
        origen: 'producto_principal'
      }
    };
  }, [productInfo, proximoLote]);

  const formattedDates = useMemo(() => {
    if (!enhancedProductInfo) return {};
    
    return {
      expiration: enhancedProductInfo.fechaVencimiento 
        ? new Date(enhancedProductInfo.fechaVencimiento).toLocaleDateString()
        : 'No especificada',
      created: enhancedProductInfo.createdAt 
        ? new Date(enhancedProductInfo.createdAt).toLocaleDateString()
        : 'No disponible'
    };
  }, [enhancedProductInfo]);

  const commercialInfo = useMemo(() => {
    if (!enhancedProductInfo) return {};
    
    const margin = enhancedProductInfo.PrecioVenta && enhancedProductInfo.PrecioCompra 
      ? ((enhancedProductInfo.PrecioVenta - enhancedProductInfo.PrecioCompra) / enhancedProductInfo.PrecioCompra * 100).toFixed(1)
      : '0';
    
    const inventoryValue = enhancedProductInfo.PrecioCompra && enhancedProductInfo.Stock
      ? formatNumber(enhancedProductInfo.PrecioCompra * enhancedProductInfo.Stock)
      : '0';

    return { margin, inventoryValue };
  }, [enhancedProductInfo]);

  const handleClose = () => {
    // 🔧 SIMPLIFICADO: Cierre directo sin animación de delay para evitar parpadeo
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleDelete = async () => {
    onDelete(productInfo);
  };

  const handleDeletePermanently = () => {
    onDeletePermanently(productInfo);
    handleClose();
  };

  const handleStockHistory = () => {
    onShowStockHistory(productInfo);
  };

  const handleEdit = () => {
    onEdit(productInfo._id);
  };

  const handlePriceHistory = () => {
    onShowPriceHistory(productInfo._id);
  };

  if (!isOpen || !productInfo) return null;

  return (
    <div 
      className={`product-info-modal-overlay ${isClosing ? 'closing' : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className="modern-product-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modern-modal-header">
          <div className="modern-modal-close" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </div>
        </div>

        <div className="modern-modal-content">
          <div className="modern-product-hero">
            <div className="modern-product-image-container">
              <div className="modern-product-image-frame">
                <img 
                  src={productInfo.image || "/default-image.jpg"} 
                  alt={productInfo.Nombre} 
                  loading="lazy" 
                  decoding="async"
                  className="modern-product-image" 
                />
              </div>
              <div className="modern-product-badges">
                {productInfo.Stock > 0 ? (
                  <span className="modern-badge modern-badge-success">
                    <FontAwesomeIcon icon={faEye} /> En Stock
                  </span>
                ) : (
                  <span className="modern-badge modern-badge-danger">
                    <FontAwesomeIcon icon={faEyeSlash} /> Sin Stock
                  </span>
                )}
                {new Date(productInfo.fechaVencimiento) < new Date() && (
                  <span className="modern-badge modern-badge-warning">
                    Vencido
                  </span>
                )}
              </div>
            </div>

            <div className="modern-product-main-info">
              <div className="modern-product-header-text">
                <h1 className="modern-product-title">{productInfo.Nombre}</h1>
                <div className="modern-product-subtitle">
                  <span className="modern-product-brand">{productInfo.Marca}</span>
                  <span className="modern-product-category">{productInfo.Categoria}</span>
                </div>
              </div>

              <div className="modern-product-price-section">
                <div className="modern-price-display">
                  <span className="modern-price-label">Precio de Venta</span>
                  <span className="modern-price-value">${formatNumber(productInfo.PrecioVenta)}</span>
                </div>
                <div className="modern-stock-display">
                  <span className="modern-stock-label">Stock Disponible</span>
                  <span className={`modern-stock-value ${getStockColorClass}`}>
                    {productInfo.Stock} unidades
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 🆕 NUEVA SECCIÓN: Información específica de lotes */}
          {enhancedProductInfo && enhancedProductInfo._loteInfo && (
            <div className="modern-lote-info-section">
              <h3 className="modern-section-title">
                <FontAwesomeIcon icon={faBoxes} />
                Información de Inventario
              </h3>
              
              {loadingLote ? (
                <div className="modern-loading-lote">
                  <p>Cargando información de lotes...</p>
                </div>
              ) : (
                <div className="modern-lote-details">
                  <div className="modern-lote-alert">
                    <FontAwesomeIcon icon={faBoxes} />
                    <div>
                      <strong>Sistema de Lotes Activo</strong>
                      <p>
                        {enhancedProductInfo._loteInfo.tieneMultiplesLotes 
                          ? "Los datos mostrados corresponden al lote que se usará primero (FIFO)"
                          : "Los datos mostrados corresponden al lote principal del producto"
                        }
                      </p>
                    </div>
                  </div>
                  
                  {enhancedProductInfo._loteInfo.tieneMultiplesLotes ? (
                    <div className="modern-lote-grid">
                      <div className="modern-lote-item">
                        <span className="modern-lote-label">Lote Actual:</span>
                        <span className="modern-lote-value">{enhancedProductInfo._loteInfo.numeroLote}</span>
                      </div>
                      <div className="modern-lote-item">
                        <span className="modern-lote-label">Total de Lotes:</span>
                        <span className="modern-lote-value">{enhancedProductInfo._loteInfo.totalLotes}</span>
                      </div>
                      <div className="modern-lote-item">
                        <span className="modern-lote-label">Días para Vencer:</span>
                        <span className={`modern-lote-value ${
                          enhancedProductInfo._loteInfo.estaVencido ? 'vencido' : 
                          enhancedProductInfo._loteInfo.estaPorVencer ? 'por-vencer' : 'bueno'
                        }`}>
                          {enhancedProductInfo._loteInfo.estaVencido ? 'VENCIDO' : 
                           `${enhancedProductInfo._loteInfo.diasParaVencer} días`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="modern-lote-grid">
                      <div className="modern-lote-item">
                        <span className="modern-lote-label">Tipo de Gestión:</span>
                        <span className="modern-lote-value">Lote Principal</span>
                      </div>
                      <div className="modern-lote-item">
                        <span className="modern-lote-label">Origen de Datos:</span>
                        <span className="modern-lote-value">Producto Base</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="modern-specifications-section">
            <h3 className="modern-section-title">
              <FontAwesomeIcon icon={faInfo} />
              Información del Producto
            </h3>
            
            <div className="modern-specs-grid-two-columns">
              <div className="modern-specs-column">
                <div className="modern-spec-item">
                  <div className="modern-spec-icon modern-spec-icon-blue">
                    <FontAwesomeIcon icon={faInfo} />
                  </div>
                  <div className="modern-spec-content">
                    <span className="modern-spec-label">Marca</span>
                    <span className="modern-spec-value">{productInfo.Marca}</span>
                  </div>
                </div>

                <div className="modern-spec-item">
                  <div className="modern-spec-icon modern-spec-icon-blue">
                    <FontAwesomeIcon icon={faInfo} />
                  </div>
                  <div className="modern-spec-content">
                    <span className="modern-spec-label">Categoría</span>
                    <span className="modern-spec-value">{productInfo.Categoria}</span>
                  </div>
                </div>

                <div className="modern-spec-item">
                  <div className="modern-spec-icon modern-spec-icon-blue">
                    <FontAwesomeIcon icon={faInfo} />
                  </div>
                  <div className="modern-spec-content">
                    <span className="modern-spec-label">Código de Barras</span>
                    <span className="modern-spec-value">{productInfo.codigoBarras}</span>
                  </div>
                </div>
              </div>

              <div className="modern-specs-column">
                <div className="modern-spec-item">
                  <div className="modern-spec-icon modern-spec-icon-blue">
                    <FontAwesomeIcon icon={faInfo} />
                  </div>
                  <div className="modern-spec-content">
                    <span className="modern-spec-label">
                      Precio de Compra
                      {enhancedProductInfo && enhancedProductInfo._loteInfo?.tieneMultiplesLotes && (
                        <span className="modern-data-source"> (Lote FIFO)</span>
                      )}
                    </span>
                    <span className="modern-spec-value">${formatNumber(enhancedProductInfo?.PrecioCompra || productInfo.PrecioCompra)}</span>
                  </div>
                </div>

                <div className="modern-spec-item">
                  <div className="modern-spec-icon modern-spec-icon-blue">
                    <FontAwesomeIcon icon={faInfo} />
                  </div>
                  <div className="modern-spec-content">
                    <span className="modern-spec-label">
                      Fecha de Vencimiento
                      {enhancedProductInfo && enhancedProductInfo._loteInfo?.tieneMultiplesLotes && (
                        <span className="modern-data-source"> (Próximo a vencer)</span>
                      )}
                    </span>
                    <span className="modern-spec-value">{formattedDates.expiration}</span>
                  </div>
                </div>

                <div className="modern-spec-item">
                  <div className="modern-spec-icon modern-spec-icon-blue">
                    <FontAwesomeIcon icon={faInfo} />
                  </div>
                  <div className="modern-spec-content">
                    <span className="modern-spec-label">Fecha de Registro</span>
                    <span className="modern-spec-value">{formattedDates.created}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modern-additional-info">
            <div className="modern-info-cards">
              <div className="modern-info-card">
                <h4 className="modern-info-card-title">Información Comercial</h4>
                <div className="modern-info-card-content">
                  <div className="modern-info-row">
                    <span className="modern-info-label">
                      Precio de Compra:
                      {enhancedProductInfo && enhancedProductInfo._loteInfo?.tieneMultiplesLotes && (
                        <span className="modern-data-source-small"> (Lote FIFO)</span>
                      )}
                    </span>
                    <span className="modern-info-value">${formatNumber(enhancedProductInfo?.PrecioCompra || productInfo.PrecioCompra)}</span>
                  </div>
                  <div className="modern-info-row">
                    <span className="modern-info-label">Precio de Venta:</span>
                    <span className="modern-info-value">${formatNumber(productInfo.PrecioVenta)}</span>
                  </div>
                  <div className="modern-info-row">
                    <span className="modern-info-label">Margen de Ganancia:</span>
                    <span className="modern-info-value">{commercialInfo.margin}%</span>
                  </div>
                  <div className="modern-info-row">
                    <span className="modern-info-label">Valor del Inventario:</span>
                    <span className="modern-info-value">${commercialInfo.inventoryValue}</span>
                  </div>
                </div>
              </div>

              <div className="modern-info-card">
                <h4 className="modern-info-card-title">Estadísticas de Venta</h4>
                <div className="modern-info-card-content">
                  <div className="modern-info-row">
                    <span className="modern-info-label">Total Vendido:</span>
                    <span className="modern-info-value">{productStats.totalVentas} unidades</span>
                  </div>
                  <div className="modern-info-row">
                    <span className="modern-info-label">Ingresos Totales:</span>
                    <span className="modern-info-value">${formatNumber(productStats.ingresos)}</span>
                  </div>
                  {productStats.ultimaVenta && (
                    <div className="modern-info-row">
                      <span className="modern-info-label">Última Venta:</span>
                      <span className="modern-info-value">
                        {productStats.ultimaVenta.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {productStats.totalVentas === 0 && (
                    <div className="modern-info-row">
                      <span className="modern-info-label">Estado:</span>
                      <span className="modern-info-value" style={{color: '#dc3545'}}>Sin ventas registradas</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modern-action-buttons">
            {permissions.canEditProduct && (
              <button 
                onClick={handleEdit} 
                className="modern-btn modern-btn-primary"
              >
                <FontAwesomeIcon icon={faPen} /> Editar Producto
              </button>
            )}
            <button 
              onClick={handlePriceHistory} 
              className="modern-btn modern-btn-secondary"
            >
              <FontAwesomeIcon icon={faHistory} /> Historial de Precios
            </button>
            <button 
              onClick={handleStockHistory} 
              className="modern-btn modern-btn-info"
            >
              <FontAwesomeIcon icon={faHistory} /> Historial de Stock
            </button>
            {permissions.canEditProduct && (
              <button 
                onClick={handleDelete} 
                className="modern-btn modern-btn-warning"
              >
                <FontAwesomeIcon icon={faEyeSlash} /> Desactivar
              </button>
            )}
            {permissions.canEditProduct && (
              <button 
                onClick={handleDeletePermanently} // 🆕 Botón para eliminar definitivamente
                className="modern-btn modern-btn-danger"
              >
                <FontAwesomeIcon icon={faTrash} /> Eliminar Definitivamente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ProductInfoModal.displayName = 'ProductInfoModal';

export default ProductInfoModal;