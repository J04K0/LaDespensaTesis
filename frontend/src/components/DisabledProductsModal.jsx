import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faEye, 
  faCalendarAlt, 
  faUser, 
  faComment,
  faExclamationTriangle,
  faSearch,
  faFilter,
  faSpinner,
  faEyeSlash,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { getDisabledProducts, restoreProduct, deleteProductPermanently } from '../services/AddProducts.service';
import { showConfirmationAlert, showSuccessAlert, showErrorAlert } from '../helpers/swaHelper';
import { CATEGORIAS } from '../constants/products.constants';
import SmartPagination from './SmartPagination';
import '../styles/DisabledProductsModalStyles.css';

const DisabledProductsModal = ({ isOpen, onClose, onProductReactivated }) => {
  const [disabledProducts, setDisabledProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [productToActivate, setProductToActivate] = useState(null);
  const [activateComment, setActivateComment] = useState('');
  
  const [skipNextFetch, setSkipNextFetch] = useState(false);

  useEffect(() => {
    if (isOpen && !skipNextFetch) {
      fetchDisabledProducts();
    }
    
    if (skipNextFetch) {
      setSkipNextFetch(false);
    }
  }, [isOpen, currentPage]);

  const fetchDisabledProducts = async () => {
    try {
      setLoading(true);
      const response = await getDisabledProducts(currentPage, 10);
      setDisabledProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching disabled products:', error);
      showErrorAlert('Error', 'No se pudieron cargar los productos desactivados');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = (product) => {
    setProductToActivate(product);
    setShowActivateModal(true);
  };

  const confirmActivate = async () => {
    if (!activateComment.trim()) {
      showErrorAlert('Campo requerido', 'Debe proporcionar un comentario para la habilitación');
      return;
    }

    try {
      setLoading(true);
      
      const response = await restoreProduct(productToActivate._id, {
        comentarioRestauracion: activateComment.trim()
      });
      
      const productIdToRemove = productToActivate._id;
      const productName = productToActivate.Nombre;
      
      setDisabledProducts(prevProducts => {
        const updatedProducts = prevProducts.filter(product => product._id !== productIdToRemove);
        
        const itemsPerPage = 10;
        const remainingItems = updatedProducts.length;
        const newTotalPages = Math.ceil(remainingItems / itemsPerPage) || 1;
        
        if (remainingItems === 0 && currentPage > 1) {
          setSkipNextFetch(true);
          setTimeout(() => {
            setCurrentPage(prev => prev - 1);
          }, 50);
        } else if (currentPage > newTotalPages) {
          setSkipNextFetch(true);
          setTimeout(() => {
            setCurrentPage(newTotalPages);
          }, 50);
        }
        
        setTotalPages(newTotalPages);
        return updatedProducts;
      });
      
      showSuccessAlert(
        'Producto habilitado exitosamente', 
        `"${productName}" ha sido habilitado y está disponible en el inventario principal.`
      );
      
      if (onProductReactivated) {
        onProductReactivated();
      }
      
      setShowActivateModal(false);
      setProductToActivate(null);
      setActivateComment('');
      
    } catch (error) {
      console.error('Error en habilitación:', error);
      showErrorAlert('Error', 'No se pudo habilitar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermanently = async (product) => {
    const result = await showConfirmationAlert(
      "¿Eliminar producto definitivamente?",
      `¿Está seguro que desea eliminar "${product.Nombre}" de manera PERMANENTE? Esta acción NO se puede deshacer y eliminará el producto completamente de la base de datos.`,
      "Sí, eliminar definitivamente",
      "Cancelar"
    );

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      
      await deleteProductPermanently(product._id);
      
      const productIdToRemove = product._id;
      const productName = product.Nombre;
      
      setDisabledProducts(prevProducts => {
        const updatedProducts = prevProducts.filter(p => p._id !== productIdToRemove);
        
        const itemsPerPage = 10;
        const remainingItems = updatedProducts.length;
        const newTotalPages = Math.ceil(remainingItems / itemsPerPage) || 1;
        
        if (remainingItems === 0 && currentPage > 1) {
          setSkipNextFetch(true);
          setTimeout(() => {
            setCurrentPage(prev => prev - 1);
          }, 50);
        } else if (currentPage > newTotalPages) {
          setSkipNextFetch(true);
          setTimeout(() => {
            setCurrentPage(newTotalPages);
          }, 50);
        }
        
        setTotalPages(newTotalPages);
        return updatedProducts;
      });
      
      showSuccessAlert(
        'Producto eliminado definitivamente', 
        `"${productName}" ha sido eliminado permanentemente de la base de datos.`
      );
      
    } catch (error) {
      console.error('Error deleting product permanently:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo eliminar el producto. Intente nuevamente.';
      showErrorAlert('Error al eliminar', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = disabledProducts.filter(product => {
    const matchesSearch = product.Nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.Marca.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || product.Categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getDeactivateReasonText = (reason) => {
    const reasons = {
      'sin_stock_permanente': 'Sin stock permanente',
      'producto_dañado': 'Producto dañado',
      'vencido': 'Producto vencido',
      'descontinuado': 'Descontinuado',
      'error_registro': 'Error de registro',
      'otro': 'Otro motivo'
    };
    return reasons[reason] || reason;
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="disabled-products-modal-overlay" onClick={handleOverlayClick}>
      <div className="disabled-products-modal" onClick={(e) => e.stopPropagation()}>
        <div className="disabled-products-modal-header">
          <h2>
            <FontAwesomeIcon icon={faEyeSlash} />
            Productos Desactivados
          </h2>
          <button 
            className="disabled-products-modal-close"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="disabled-products-modal-body">
          <div className="disabled-products-filters">
            <div className="disabled-products-search">
              <FontAwesomeIcon icon={faSearch} />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="disabled-products-category-filter">
              <FontAwesomeIcon icon={faFilter} />
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {CATEGORIAS.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="disabled-products-loading">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <p>Cargando productos desactivados...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="disabled-products-empty">
              <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
              <p>No hay productos desactivados</p>
            </div>
          ) : (
            <div className="disabled-products-list">
              {filteredProducts.map(product => (
                <div key={product._id} className="disabled-product-card">
                  <div className="disabled-product-info">
                    <h3>{product.Nombre}</h3>
                    <p><strong>Marca:</strong> {product.Marca}</p>
                    <p><strong>Categoría:</strong> {product.Categoria}</p>
                    <p><strong>Código:</strong> {product.codigoBarras}</p>
                  </div>
                  
                  <div className="disabled-product-details">
                    <div className="deletion-info">
                      <div className="deletion-date">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>Desactivado: {new Date(product.fechaEliminacion).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="deletion-user">
                        <FontAwesomeIcon icon={faUser} />
                        <span>Por: {product.usuarioEliminacion?.username || 'Sistema'}</span>
                      </div>
                      
                      <div className="deletion-reason">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>Motivo: {getDeactivateReasonText(product.motivoEliminacion)}</span>
                      </div>
                      
                      {product.comentarioEliminacion && (
                        <div className="deletion-comment">
                          <FontAwesomeIcon icon={faComment} />
                          <span>Comentario: {product.comentarioEliminacion}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 🆕 Contenedor de botones con ambas acciones */}
                    <div className="disabled-product-actions">
                      <button 
                        className="activate-button"
                        onClick={() => handleActivate(product)}
                        disabled={loading}
                      >
                        {loading ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faEye} />
                        )}
                        Habilitar
                      </button>
                      
                      <button 
                        className="delete-permanently-button"
                        onClick={() => handleDeletePermanently(product)}
                        disabled={loading}
                      >
                        {loading ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faTrash} />
                        )}
                        Eliminar Definitivamente
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="disabled-products-pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {showActivateModal && (
        <div className="activate-modal-overlay">
          <div className="activate-modal">
            <div className="activate-modal-header">
              <h3>Habilitar Producto</h3>
              <button onClick={() => setShowActivateModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="activate-modal-body">
              <p>¿Está seguro que desea habilitar el producto <strong>{productToActivate?.Nombre}</strong>?</p>
              <p>Este producto volverá a estar disponible en el inventario.</p>
              
              <div className="activate-comment-field">
                <label>Comentario de habilitación *</label>
                <textarea
                  value={activateComment}
                  onChange={(e) => setActivateComment(e.target.value)}
                  placeholder="Explique el motivo de la habilitación..."
                  rows="3"
                  required
                />
              </div>
            </div>
            
            <div className="activate-modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setShowActivateModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button"
                onClick={confirmActivate}
                disabled={!activateComment.trim() || loading}
              >
                <FontAwesomeIcon icon={faEye} />
                Habilitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisabledProductsModal;