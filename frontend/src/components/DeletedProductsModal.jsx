import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faTrashRestore, 
  faCalendarAlt, 
  faUser, 
  faComment,
  faExclamationTriangle,
  faSearch,
  faFilter,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { getDeletedProducts, restoreProduct } from '../services/AddProducts.service';
import { showConfirmationAlert, showSuccessAlert, showErrorAlert } from '../helpers/swaHelper';
import SmartPagination from './SmartPagination';
import '../styles/DeletedProductsModalStyles.css';

const DeletedProductsModal = ({ isOpen, onClose }) => {
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Estados para restauración
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [productToRestore, setProductToRestore] = useState(null);
  const [restoreComment, setRestoreComment] = useState('');

  const categories = [
    'Congelados', 'Carnes', 'Despensa', 'Panaderia y Pasteleria',
    'Quesos y Fiambres', 'Bebidas y Licores', 'Lacteos, Huevos y otros',
    'Desayuno y Dulces', 'Bebes y Niños', 'Cigarros y Tabacos',
    'Limpieza y Hogar', 'Cuidado Personal', 'Mascotas', 'Remedios', 'Otros'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchDeletedProducts();
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
      showErrorAlert('Error', 'No se pudieron cargar los productos eliminados');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (product) => {
    setProductToRestore(product);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!restoreComment.trim()) {
      showErrorAlert('Campo requerido', 'Debe proporcionar un comentario para la restauración');
      return;
    }

    try {
      setLoading(true);
      await restoreProduct(productToRestore._id, {
        comentarioRestauracion: restoreComment.trim()
      });
      
      showSuccessAlert('Producto restaurado', 'El producto ha sido restaurado exitosamente');
      setShowRestoreModal(false);
      setProductToRestore(null);
      setRestoreComment('');
      fetchDeletedProducts();
    } catch (error) {
      console.error('Error restoring product:', error);
      showErrorAlert('Error', 'No se pudo restaurar el producto');
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

  const getDeleteReasonText = (reason) => {
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

  return (
    <div className="deleted-products-modal-overlay">
      <div className="deleted-products-modal">
        <div className="deleted-products-modal-header">
          <h2>
            <FontAwesomeIcon icon={faTrashRestore} />
            Productos Eliminados
          </h2>
          <button 
            className="deleted-products-modal-close"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="deleted-products-modal-body">
          {/* Filtros */}
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
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="deleted-products-loading">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <p>Cargando productos eliminados...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="deleted-products-empty">
              <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
              <p>No hay productos eliminados</p>
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
                        <span>Eliminado: {new Date(product.fechaEliminacion).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="deletion-user">
                        <FontAwesomeIcon icon={faUser} />
                        <span>Por: {product.usuarioEliminacion?.username || 'Usuario desconocido'}</span>
                      </div>
                      
                      <div className="deletion-reason">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>Motivo: {getDeleteReasonText(product.motivoEliminacion)}</span>
                      </div>
                      
                      {product.comentarioEliminacion && (
                        <div className="deletion-comment">
                          <FontAwesomeIcon icon={faComment} />
                          <span>Comentario: {product.comentarioEliminacion}</span>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className="restore-button"
                      onClick={() => handleRestore(product)}
                      disabled={loading}
                    >
                      {loading ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        <FontAwesomeIcon icon={faTrashRestore} />
                      )}
                      Restaurar
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

      {/* Modal de confirmación de restauración */}
      {showRestoreModal && (
        <div className="restore-modal-overlay">
          <div className="restore-modal">
            <div className="restore-modal-header">
              <h3>Restaurar Producto</h3>
              <button onClick={() => setShowRestoreModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="restore-modal-body">
              <p>¿Está seguro que desea restaurar el producto <strong>{productToRestore?.Nombre}</strong>?</p>
              <p>Este producto volverá a estar disponible en el inventario.</p>
              
              <div className="restore-comment-field">
                <label>Comentario de restauración *</label>
                <textarea
                  value={restoreComment}
                  onChange={(e) => setRestoreComment(e.target.value)}
                  placeholder="Explique el motivo de la restauración..."
                  rows="3"
                  required
                />
              </div>
            </div>
            
            <div className="restore-modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setShowRestoreModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button"
                onClick={confirmRestore}
                disabled={!restoreComment.trim() || loading}
              >
                <FontAwesomeIcon icon={faTrashRestore} />
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedProductsModal;