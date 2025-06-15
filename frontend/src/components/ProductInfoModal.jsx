import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faInfo, faEye, faEyeSlash, faPen, faHistory, faTrash 
} from '@fortawesome/free-solid-svg-icons';
import { showConfirmationAlert } from '../helpers/swaHelper';
import '../styles/ProductInfoModal.css';

const ProductInfoModal = React.memo(({ 
  isOpen, 
  onClose, 
  productInfo, 
  productStats, 
  onEdit, 
  onDelete, 
  onShowPriceHistory 
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Optimizar control de scroll del body
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

  // Memoizar cálculo de color de stock
  const getStockColorClass = useMemo(() => {
    if (!productInfo) return '';
    
    const stockMinimoPorCategoria = {
      'Congelados': 10,
      'Carnes': 5,
      'Despensa': 8,
      'Panaderia y Pasteleria': 10,
      'Quesos y Fiambres': 5,
      'Bebidas y Licores': 5,
      'Lacteos, Huevos y otros': 10,
      'Desayuno y Dulces': 10,
      'Bebes y Niños': 10,
      'Cigarros y Tabacos': 5,
      'Cuidado Personal': 8,
      'Remedios': 3,
      'Limpieza y Hogar': 5,
      'Mascotas': 5,
      'Otros': 5
    };

    const stockMinimo = stockMinimoPorCategoria[productInfo.Categoria] || 5;

    if (productInfo.Stock === 0) return 'modern-stock-value-red';
    if (productInfo.Stock <= stockMinimo) return 'modern-stock-value-yellow';
    return 'modern-stock-value-green';
  }, [productInfo]);

  // Memoizar fechas
  const formattedDates = useMemo(() => {
    if (!productInfo) return {};
    
    return {
      expiration: productInfo.fechaVencimiento 
        ? new Date(productInfo.fechaVencimiento).toLocaleDateString()
        : 'No especificada',
      created: productInfo.createdAt 
        ? new Date(productInfo.createdAt).toLocaleDateString()
        : 'No disponible'
    };
  }, [productInfo]);

  // Memoizar cálculos comerciales
  const commercialInfo = useMemo(() => {
    if (!productInfo) return {};
    
    const margin = productInfo.PrecioVenta && productInfo.PrecioCompra 
      ? ((productInfo.PrecioVenta - productInfo.PrecioCompra) / productInfo.PrecioCompra * 100).toFixed(1)
      : '0';
    
    const inventoryValue = productInfo.PrecioCompra && productInfo.Stock
      ? (productInfo.PrecioCompra * productInfo.Stock).toLocaleString()
      : '0';

    return { margin, inventoryValue };
  }, [productInfo]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleDelete = async () => {
    const result = await showConfirmationAlert(
      '¿Estás seguro?',
      'Esta acción no se puede deshacer',
      'Sí, eliminar',
      'Cancelar'
    );
    if (result.isConfirmed) {
      onDelete(productInfo._id);
      handleClose();
    }
  };

  const handleEdit = () => {
    onEdit(productInfo._id);
    handleClose();
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
        {/* Header del Modal */}
        <div className="modern-modal-header">
          <div className="modern-modal-close" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="modern-modal-content">
          {/* Sección Superior - Imagen y Info Principal */}
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
              {/* Badges de Estado */}
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
                  <span className="modern-price-value">${productInfo.PrecioVenta.toLocaleString()}</span>
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

          {/* Especificaciones Técnicas */}
          <div className="modern-specifications-section">
            <h3 className="modern-section-title">
              <FontAwesomeIcon icon={faInfo} />
              Información del Producto
            </h3>
            
            <div className="modern-specs-grid-two-columns">
              {/* Columna Izquierda */}
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

              {/* Columna Derecha */}
              <div className="modern-specs-column">
                <div className="modern-spec-item">
                  <div className="modern-spec-icon modern-spec-icon-blue">
                    <FontAwesomeIcon icon={faInfo} />
                  </div>
                  <div className="modern-spec-content">
                    <span className="modern-spec-label">Precio de Compra</span>
                    <span className="modern-spec-value">${productInfo.PrecioCompra.toLocaleString()}</span>
                  </div>
                </div>

                <div className="modern-spec-item">
                  <div className="modern-spec-icon modern-spec-icon-blue">
                    <FontAwesomeIcon icon={faInfo} />
                  </div>
                  <div className="modern-spec-content">
                    <span className="modern-spec-label">Fecha de Vencimiento</span>
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

          {/* Información Adicional */}
          <div className="modern-additional-info">
            <div className="modern-info-cards">
              <div className="modern-info-card">
                <h4 className="modern-info-card-title">Información Comercial</h4>
                <div className="modern-info-card-content">
                  <div className="modern-info-row">
                    <span className="modern-info-label">Precio de Compra:</span>
                    <span className="modern-info-value">${productInfo.PrecioCompra.toLocaleString()}</span>
                  </div>
                  <div className="modern-info-row">
                    <span className="modern-info-label">Precio de Venta:</span>
                    <span className="modern-info-value">${productInfo.PrecioVenta.toLocaleString()}</span>
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
                    <span className="modern-info-value">${productStats.ingresos.toLocaleString()}</span>
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

          {/* Botones de Acción */}
          <div className="modern-action-buttons">
            <button 
              onClick={handleEdit} 
              className="modern-btn modern-btn-primary"
            >
              <FontAwesomeIcon icon={faPen} /> Editar Producto
            </button>
            <button 
              onClick={handlePriceHistory} 
              className="modern-btn modern-btn-secondary"
            >
              <FontAwesomeIcon icon={faHistory} /> Historial de Precios
            </button>
            <button 
              onClick={handleDelete} 
              className="modern-btn modern-btn-danger"
            >
              <FontAwesomeIcon icon={faTrash} /> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductInfoModal.displayName = 'ProductInfoModal';

export default ProductInfoModal;