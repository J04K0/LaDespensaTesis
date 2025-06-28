import React, { useState, useEffect, forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { MARGENES_POR_CATEGORIA } from '../constants/products.constants.js';
import '../styles/ProductEditModal.css';

const ProductEditModal = forwardRef(({ 
  isOpen, 
  onClose, 
  productToEdit, 
  onProductChange, 
  onImageChange, 
  editImage, 
  onSubmit, 
  loading, 
  categories 
}, ref) => {
  // 🆕 NUEVOS ESTADOS para manejo de stock y motivo
  const [stockOriginal, setStockOriginal] = useState(0);
  const [showMotivoStock, setShowMotivoStock] = useState(false);
  const [motivoStock, setMotivoStock] = useState('');

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

  const usarPrecioRecomendado = () => {
    const margen = MARGENES_POR_CATEGORIA[productToEdit.Categoria] || 0.23;
    const precioRecomendado = productToEdit.PrecioCompra * (1 + margen);
    
    onProductChange({
      target: {
        name: 'PrecioVenta',
        value: precioRecomendado.toFixed(2)
      }
    });
  };

  // 🆕 NUEVO: Manejar cambio en el motivo del stock
  const handleMotivoStockChange = (e) => {
    setMotivoStock(e.target.value);
  };

  // 🆕 NUEVO: Validar antes de enviar
  const handleSubmit = async () => {
    // DEBUG: Agregar logs para depuración
    console.log('🔍 DEBUG - Stock original:', stockOriginal);
    console.log('🔍 DEBUG - Stock actual:', productToEdit.Stock);
    console.log('🔍 DEBUG - Tipos:', typeof stockOriginal, typeof productToEdit.Stock);
    
    // Primero, verificar si hay cambio de stock directamente
    const hayCambioStock = Number(productToEdit.Stock) !== Number(stockOriginal);
    
    console.log('🔍 DEBUG - ¿Hay cambio de stock?', hayCambioStock);
    console.log('🔍 DEBUG - Motivo actual:', motivoStock);
    
    // Si hay cambio de stock y no se ha proporcionado motivo, mostrar popup
    if (hayCambioStock && !motivoStock.trim()) {
      console.log('🚨 Mostrando popup de motivo');
      
      const { value: motivo } = await Swal.fire({
        title: 'Cambio de Stock Detectado',
        html: `
          <div style="text-align: left; margin-bottom: 15px;">
            <p><strong>Stock original:</strong> ${stockOriginal}</p>
            <p><strong>Nuevo stock:</strong> ${productToEdit.Stock}</p>
            <p style="color: #e74c3c; font-weight: bold;">Se requiere un motivo para este cambio:</p>
          </div>
        `,
        input: 'textarea',
        inputPlaceholder: 'Explique el motivo del cambio de stock (ej: producto dañado, corrección de inventario, etc.)',
        inputValidator: (value) => {
          if (!value || value.trim().length < 10) {
            return 'El motivo debe tener al menos 10 caracteres'
          }
        },
        showCancelButton: true,
        confirmButtonText: 'Guardar con motivo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        allowOutsideClick: false,
        allowEscapeKey: false
      });

      if (!motivo) {
        console.log('❌ Usuario canceló o no proporcionó motivo');
        return; // Usuario canceló
      }

      // Guardar el motivo y proceder
      setMotivoStock(motivo.trim());
      console.log('✅ Motivo capturado:', motivo.trim());
      
      // Proceder con el envío
      console.log('📤 Enviando datos con motivo:', { motivo: motivo.trim() });
      onSubmit({ motivo: motivo.trim() });
      return;
    }

    // Si no hay cambio de stock O ya se proporcionó motivo, proceder normalmente
    console.log('📝 Procediendo con la confirmación final');
    
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: hayCambioStock 
        ? `¿Deseas guardar los cambios realizados a este producto?\n\nCambio de stock: ${stockOriginal} → ${productToEdit.Stock}\nMotivo: ${motivoStock}`
        : "¿Deseas guardar los cambios realizados a este producto?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "No, cancelar"
    });

    if (result.isConfirmed) {
      // Incluir motivo si hay cambio de stock
      const submitData = hayCambioStock ? { motivo: motivoStock.trim() } : {};
      console.log('📤 Enviando datos:', submitData);
      onSubmit(submitData);
    }
  };

  // 🆕 NUEVO: Controlar cuando el stock cambia para mostrar campo de motivo
  useEffect(() => {
    if (isOpen && productToEdit) {
      console.log('🔄 Modal abierto, capturando stock original:', productToEdit.Stock);
      setStockOriginal(Number(productToEdit.Stock)); // Asegurar que sea número
      setMotivoStock('');
      setShowMotivoStock(false);
    }
  }, [isOpen, productToEdit._id]); // Usar _id como dependencia para detectar cuando cambia el producto

  // 🆕 NUEVO: Detectar cambios en el stock
  useEffect(() => {
    if (productToEdit && stockOriginal !== undefined) {
      const hayCambio = Number(productToEdit.Stock) !== Number(stockOriginal);
      console.log('📊 Detectando cambio de stock:', hayCambio, 'Original:', stockOriginal, 'Actual:', productToEdit.Stock);
      setShowMotivoStock(hayCambio);
      if (!hayCambio) {
        setMotivoStock(''); // Limpiar motivo si no hay cambio
      }
    }
  }, [productToEdit.Stock, stockOriginal]);

  const handleClose = () => {
    setMotivoStock('');
    setShowMotivoStock(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="product-edit-modal-overlay" onClick={handleClose}>
      <div className="product-edit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header del Modal */}
        <div className="product-edit-modal-header">
          <h2 className="product-edit-modal-title">
            <FontAwesomeIcon icon={faPen} /> Editar Producto
          </h2>
          <button 
            className="product-edit-modal-close"
            onClick={handleClose}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Body del Modal */}
        <div className="product-edit-modal-body">
          <div className="product-edit-form-grid">
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="Nombre">Nombre del producto</label>
              <input
                type="text"
                id="Nombre"
                name="Nombre"
                value={productToEdit.Nombre}
                onChange={onProductChange}
                required
                className="product-edit-form-control"
                disabled={loading}
              />
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="codigoBarras">Código de Barras</label>
              <input
                type="text"
                id="codigoBarras"
                name="codigoBarras"
                value={productToEdit.codigoBarras}
                onChange={onProductChange}
                required
                className="product-edit-form-control"
                disabled={loading}
              />
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="Marca">Marca</label>
              <input
                type="text"
                id="Marca"
                name="Marca"
                value={productToEdit.Marca}
                onChange={onProductChange}
                required
                className="product-edit-form-control"
                disabled={loading}
              />
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="Categoria">Categoría</label>
              <select
                id="Categoria"
                name="Categoria"
                value={productToEdit.Categoria}
                onChange={onProductChange}
                required
                className="product-edit-form-select"
                disabled={loading}
              >
                <option value="">Seleccione una categoría</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="Stock">Stock</label>
              <input
                type="number"
                id="Stock"
                name="Stock"
                value={productToEdit.Stock}
                onChange={onProductChange}
                required
                className="product-edit-form-control"
                min="0"
                disabled={loading}
              />
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="fechaVencimiento">Fecha de Vencimiento</label>
              <input
                type="date"
                id="fechaVencimiento"
                name="fechaVencimiento"
                value={productToEdit.fechaVencimiento}
                onChange={onProductChange}
                className="product-edit-form-control"
                disabled={loading}
              />
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="PrecioCompra">Precio de Compra</label>
              <div className="product-edit-input-with-icon">
                <span className="product-edit-input-prefix">$</span>
                <input
                  type="number"
                  id="PrecioCompra"
                  name="PrecioCompra"
                  value={productToEdit.PrecioCompra}
                  onChange={onProductChange}
                  required
                  className="product-edit-form-control"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="PrecioVenta">Precio de Venta Final</label>
              <div className="product-edit-precio-recomendado-container">
                <div className="product-edit-input-with-icon">
                  <span className="product-edit-input-prefix">$</span>
                  <input
                    type="number"
                    id="PrecioVenta"
                    name="PrecioVenta"
                    value={productToEdit.PrecioVenta}
                    onChange={onProductChange}
                    required
                    className="product-edit-form-control"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
                {productToEdit.PrecioCompra > 0 && productToEdit.Categoria && (
                  <button
                    type="button"
                    onClick={usarPrecioRecomendado}
                    className="product-edit-btn product-edit-btn-usar-recomendado"
                    disabled={loading}
                  >
                    Usar Precio Recomendado
                    <br />
                    <small>$
                      {(productToEdit.PrecioCompra * 
                        (1 + (MARGENES_POR_CATEGORIA[productToEdit.Categoria] || 0.23))
                      ).toFixed(2)}
                    </small>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 🆕 NUEVO: Campo de motivo cuando hay cambio de stock */}
          {showMotivoStock && (
            <div className="product-edit-form-group product-edit-form-group-full motivo-stock">
              <label className="product-edit-form-label" htmlFor="motivoStock">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning" />
                Motivo del cambio de stock *
              </label>
              <textarea
                id="motivoStock"
                name="motivoStock"
                value={motivoStock}
                onChange={handleMotivoStockChange}
                required
                className="product-edit-form-control product-edit-textarea"
                rows="3"
                placeholder="Explique el motivo del cambio de stock (ej: producto dañado, corrección de inventario, etc.)"
                disabled={loading}
              />
              <div className="stock-change-notice">
                <p className="stock-change-text">
                  Este comentario se guardará en el historial de cambios del producto
                </p>
              </div>
            </div>
          )}
                  
          <div className="product-edit-form-group-full">
            <label className="product-edit-form-label" htmlFor="image">Imagen del Producto</label>
            <input
              type="file"
              id="image"
              name="image"
              onChange={onImageChange}
              accept="image/*"
              className="product-edit-form-control product-edit-file-input"
              disabled={loading}
            />
            <small className="product-edit-form-text">Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB</small>
            
            {typeof editImage === 'string' && (
              <div className="product-edit-current-image">
                <p>Imagen actual:</p>
                <img src={editImage} alt="Imagen actual del producto" className="product-edit-preview-image" />
              </div>
            )}
          </div>
        </div>
        
        {/* Footer del Modal */}
        <div className="product-edit-modal-footer">
          <button 
            onClick={handleSubmit} 
            className="product-edit-btn product-edit-btn-primary"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPen} /> 
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button 
            onClick={handleClose} 
            className="product-edit-btn product-edit-btn-secondary"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
});

ProductEditModal.displayName = 'ProductEditModal';

export default ProductEditModal;