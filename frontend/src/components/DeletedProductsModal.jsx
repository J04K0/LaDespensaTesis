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
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { getDeletedProducts, restoreProduct } from '../services/AddProducts.service';
import { showConfirmationAlert, showSuccessAlert, showErrorAlert } from '../helpers/swaHelper';
import { CATEGORIAS } from '../constants/products.constants';
import SmartPagination from './SmartPagination';
import '../styles/DeletedProductsModalStyles.css';

const DeletedProductsModal = ({ isOpen, onClose }) => {
  const [deletedProducts, setDeletedProducts] = useState([]);
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
      fetchDeletedProducts();
    }
    
    if (skipNextFetch) {
      setSkipNextFetch(false);
    }
  }, [isOpen, currentPage]);

  const fetchDeletedProducts = async () => {
    try {
      setLoading(true);
      const response = await getDeletedProducts(currentPage, 10);
      setDeletedProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching deleted products:', error);
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
      setDeletedProducts(prevProducts => {
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
        'El producto ha sido habilitado y está disponible en el inventario principal.',
        {
          showConfirmButton: true,
          confirmButtonText: 'Ver en inventario',
          showCancelButton: true,
          cancelButtonText: 'Continuar aquí',
          confirmButtonColor: '#17a2b8'
        }
      ).then((result) => {
        if (result.isConfirmed) {
          onClose();
          window.location.href = '/products?fromDeleted=true';
        }
      });
      
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

  const filteredProducts = deletedProducts.filter(product => {
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
    <div className="deleted-products-modal-overlay" onClick={handleOverlayClick}>
      <div className="deleted-products-modal" onClick={(e) => e.stopPropagation()}>
        <div className="deleted-products-modal-header">
          <h2>
            <FontAwesomeIcon icon={faEyeSlash} />
            Productos Desactivados
          </h2>
          <button 
            className="deleted-products-modal-close"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="deleted-products-modal-body">
          <div className="deleted-products-filters">
            <div className="deleted-products-search">
              <FontAwesomeIcon icon={faSearch} />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="deleted-products-category-filter">
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
            <div className="deleted-products-loading">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <p>Cargando productos desactivados...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="deleted-products-empty">
              <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
              <p>No hay productos desactivados</p>
            </div>
          ) : (
            <div className="deleted-products-list">
              {filteredProducts.map(product => (
                <div key={product._id} className="deleted-product-card">
                  <div className="deleted-product-info">
                    <h3>{product.Nombre}</h3>
                    <p><strong>Marca:</strong> {product.Marca}</p>
                    <p><strong>Categoría:</strong> {product.Categoria}</p>
                    <p><strong>Código:</strong> {product.codigoBarras}</p>
                  </div>
                  
                  <div className="deleted-product-details">
                    <div className="deletion-info">
                      <div className="deletion-date">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>Desactivado: {new Date(product.fechaEliminacion).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="deletion-user">
                        <FontAwesomeIcon icon={faUser} />
                        <span>Por: {product.usuarioEliminacion?.username || 'Usuario desconocido'}</span>
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
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="deleted-products-pagination">
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

export default DeletedProductsModal;