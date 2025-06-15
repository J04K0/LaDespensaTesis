import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPen } from '@fortawesome/free-solid-svg-icons';
import { showConfirmationAlert } from '../helpers/swaHelper';
import '../styles/ProductEditModal.css';

const ProductEditModal = React.memo(({
  isOpen,
  onClose,
  productToEdit,
  onProductChange,
  onImageChange,
  onSubmit,
  editImage,
  loading = false
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Categorías disponibles
  const categories = [
    'Congelados', 'Carnes', 'Despensa', 'Panaderia y Pasteleria',
    'Quesos y Fiambres', 'Bebidas y Licores', 'Lacteos, Huevos y otros',
    'Desayuno y Dulces', 'Bebes y Niños', 'Cigarros y Tabacos',
    'Limpieza y Hogar', 'Cuidado Personal', 'Mascotas', 'Remedios', 'Otros'
  ];

  // Definir márgenes por categoría (mismos valores que en el backend)
  const margenesPorCategoria = {
    'Congelados': 0.25, // 25% (promedio de 20-30%)
    'Carnes': 0.20, // 20% (promedio de 15-25%)
    'Despensa': 0.20, // 20% (promedio de 15-25%)
    'Panaderia y Pasteleria': 0.25, // 25% (promedio de 20-30%)
    'Quesos y Fiambres': 0.25, // 25% (promedio de 20-30%)
    'Bebidas y Licores': 0.33, // 33% (promedio de 25-40%)
    'Lacteos, Huevos y otros': 0.20, // 20% (promedio de 15-25%)
    'Desayuno y Dulces': 0.30, // 30% (promedio de 25-35%)
    'Bebes y Niños': 0.28, // 28% (promedio de 20-35%)
    'Cigarros y Tabacos': 0.40, // 40% (promedio de 30-50%)
    'Cuidado Personal': 0.28, // 28% (promedio de 20-35%)
    'Limpieza y Hogar': 0.28, // 28% (promedio de 20-35%)
    'Mascotas': 0.28, // 28% (promedio de 20-35%)
    'Remedios': 0.15, // 15% (promedio de 10-20%)
    'Otros': 0.23  // 23% (promedio de 15-30%)
  };

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

  // Función para usar el precio recomendado
  const usarPrecioRecomendado = () => {
    const event = {
      target: {
        name: 'PrecioVenta',
        value: productToEdit.PrecioRecomendado.toFixed(2)
      }
    };
    onProductChange(event);
  };

  const handleClose = async () => {
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas cancelar la edición? Los cambios no se guardarán.",
      "Sí, cancelar",
      "No, volver"
    );

    if (result.isConfirmed) {
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        onClose();
      }, 200);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async () => {
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas guardar los cambios realizados a este producto?",
      "Sí, guardar",
      "No, cancelar"
    );

    if (result.isConfirmed) {
      onSubmit();
    }
  };

  if (!isOpen || !productToEdit) return null;

  return (
    <div 
      className={`product-edit-modal-overlay ${isClosing ? 'closing' : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className="product-edit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header del Modal */}
        <div className="product-edit-modal-header">
          <h2 className="product-edit-modal-title">Editar Producto</h2>
          <button className="product-edit-modal-close" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Contenido del Modal */}
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
              <label className="product-edit-form-label">Precio Recomendado (Según categoría)</label>
              <div className="product-edit-precio-recomendado-container">
                <div className="product-edit-input-with-icon">
                  <span className="product-edit-input-prefix">$</span>
                  <input
                    type="text"
                    value={productToEdit.PrecioRecomendado ? productToEdit.PrecioRecomendado.toFixed(2) : '0.00'}
                    className="product-edit-form-control"
                    disabled
                  />
                </div>
                <button 
                  type="button"
                  className="product-edit-btn product-edit-btn-usar-recomendado"
                  onClick={usarPrecioRecomendado}
                  disabled={loading || !productToEdit.PrecioRecomendado}
                >
                  Usar este precio
                </button>
              </div>
            </div>
            
            <div className="product-edit-form-group">
              <label className="product-edit-form-label" htmlFor="PrecioVenta">Precio de Venta Final</label>
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
            </div>
          </div>
                  
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