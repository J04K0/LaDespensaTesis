import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrashRestore, 
  faSearch, 
  faFilter, 
  faCalendarAlt, 
  faUser, 
  faFileAlt,
  faArrowLeft,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { getDeletedProducts, restoreProduct } from '../services/AddProducts.service';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert } from '../helpers/swaHelper';
import SmartPagination from '../components/SmartPagination';
import Swal from 'sweetalert2';
import '../styles/DeletedProductsStyles.css';

const DeletedProducts = () => {
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [motivoFilter, setMotivoFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // 🆕 NUEVO: Flag para evitar fetch automático después de restaurar
  const [skipNextFetch, setSkipNextFetch] = useState(false);
  
  const navigate = useNavigate();
  const productsPerPage = 15;

  // Opciones de motivos de eliminación
  const motivosEliminacion = [
    { value: '', label: 'Todos los motivos' },
    { value: 'sin_stock_permanente', label: 'Sin stock permanente' },
    { value: 'producto_dañado', label: 'Producto dañado' },
    { value: 'vencido', label: 'Vencido' },
    { value: 'descontinuado', label: 'Descontinuado' },
    { value: 'error_registro', label: 'Error de registro' },
    { value: 'otro', label: 'Otro' }
  ];

  // Cargar productos eliminados
  const fetchDeletedProducts = useCallback(async () => {
    if (skipNextFetch) {
      setSkipNextFetch(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await getDeletedProducts(currentPage, productsPerPage);
      setDeletedProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching deleted products:', error);
      showErrorAlert('Error', 'No se pudieron cargar los productos eliminados');
      setDeletedProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, productsPerPage, skipNextFetch]);

  useEffect(() => {
    fetchDeletedProducts();
  }, [fetchDeletedProducts]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = deletedProducts;

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.Nombre.toLowerCase().includes(query) ||
        product.Marca.toLowerCase().includes(query) ||
        product.codigoBarras.includes(query)
      );
    }

    // Filtro por motivo
    if (motivoFilter) {
      filtered = filtered.filter(product => product.motivoEliminacion === motivoFilter);
    }

    // Filtro por fecha
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      filtered = filtered.filter(product => {
        const productDate = new Date(product.fechaEliminacion).toDateString();
        return productDate === filterDate;
      });
    }

    setFilteredProducts(filtered);
  }, [deletedProducts, searchQuery, motivoFilter, dateFilter]);

  // Restaurar producto
  const handleRestoreProduct = async (product) => {
    const result = await showConfirmationAlert(
      '¿Restaurar producto?',
      `¿Está seguro de que desea restaurar "${product.Nombre}"? El producto volverá a estar disponible en el inventario.`,
      'Sí, restaurar',
      'Cancelar'
    );

    if (!result.isConfirmed) {
      return;
    }

    // Pedir comentario de restauración
    const { value: comentario } = await Swal.fire({
      title: 'Comentario de restauración',
      input: 'textarea',
      inputLabel: 'Motivo de la restauración',
      inputPlaceholder: 'Explique por qué se restaura este producto...',
      inputAttributes: {
        'aria-label': 'Motivo de la restauración'
      },
      showCancelButton: true,
      confirmButtonText: 'Restaurar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.trim().length < 10) {
          return 'Debe proporcionar un motivo de al menos 10 caracteres';
        }
      }
    });

    if (!comentario) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await restoreProduct(product._id, { 
        comentarioRestauracion: comentario.trim() 
      });
      
      // Actualizar estado local inmediatamente
      const productIdToRemove = product._id;
      setDeletedProducts(prevProducts => {
        const updatedProducts = prevProducts.filter(p => p._id !== productIdToRemove);
        
        // Calcular nueva página si es necesario
        const remainingItems = updatedProducts.length;
        const newTotalPages = Math.ceil(remainingItems / productsPerPage) || 1;
        
        // Si la página actual queda vacía y no es la primera página
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
      
      // Mostrar mensaje de éxito con opción de navegar
      showSuccessAlert(
        'Producto restaurado exitosamente', 
        'El producto ha sido restaurado y está disponible en el inventario principal.',
        {
          showConfirmButton: true,
          confirmButtonText: 'Ver en inventario',
          showCancelButton: true,
          cancelButtonText: 'Continuar aquí',
          confirmButtonColor: '#28a745'
        }
      ).then((result) => {
        if (result.isConfirmed) {
          navigate('/products?fromDeleted=true');
        }
      });
      
    } catch (error) {
      console.error('Error restoring product:', error);
      showErrorAlert('Error', 'No se pudo restaurar el producto');
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setMotivoFilter('');
    setDateFilter('');
    setCurrentPage(1);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        <div className="deleted-products-header">
          <div className="deleted-products-title-container">
            <button 
              className="back-button"
              onClick={() => navigate('/products')}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div>
              <h1 className="deleted-products-title">Productos Eliminados</h1>
              <p className="deleted-products-subtitle">
                Gestión y auditoría de productos eliminados del inventario
              </p>
            </div>
          </div>
          <div className="deleted-products-stats">
            <div className="stat-card">
              <span className="stat-number">{deletedProducts.length}</span>
              <span className="stat-label">Productos eliminados</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="deleted-products-filters">
          <div className="filter-group">
            <FontAwesomeIcon icon={faSearch} className="filter-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            <select
              value={motivoFilter}
              onChange={(e) => setMotivoFilter(e.target.value)}
              className="filter-select"
            >
              {motivosEliminacion.map((motivo) => (
                <option key={motivo.value} value={motivo.value}>
                  {motivo.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <FontAwesomeIcon icon={faCalendarAlt} className="filter-icon" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-input"
            />
          </div>

          <button
            onClick={handleClearFilters}
            className="clear-filters-btn"
          >
            Limpiar filtros
          </button>
        </div>

        {/* Lista de productos eliminados */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando productos eliminados...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="deleted-products-table">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Motivo</th>
                    <th>Fecha eliminación</th>
                    <th>Usuario</th>
                    <th>Comentario</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-info">
                          {product.image && (
                            <img 
                              src={product.image} 
                              alt={product.Nombre}
                              className="product-thumbnail"
                            />
                          )}
                          <div>
                            <strong>{product.Nombre}</strong>
                            <div className="product-details">
                              <span>{product.Marca}</span>
                              <span>•</span>
                              <span>{product.codigoBarras}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`motivo-badge motivo-${product.motivoEliminacion}`}>
                          {motivosEliminacion.find(m => m.value === product.motivoEliminacion)?.label || product.motivoEliminacion}
                        </span>
                      </td>
                      <td>{formatDate(product.fechaEliminacion)}</td>
                      <td>
                        <div className="user-info">
                          <FontAwesomeIcon icon={faUser} />
                          {product.usuarioEliminacion?.username || 'Usuario desconocido'}
                        </div>
                      </td>
                      <td>
                        <div className="comment-cell">
                          <FontAwesomeIcon icon={faFileAlt} />
                          <span title={product.comentarioEliminacion}>
                            {product.comentarioEliminacion?.length > 50 
                              ? `${product.comentarioEliminacion.substring(0, 50)}...`
                              : product.comentarioEliminacion
                            }
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleRestoreProduct(product)}
                          className="restore-btn"
                          title="Restaurar producto"
                        >
                          <FontAwesomeIcon icon={faTrashRestore} />
                          Restaurar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SmartPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              maxVisiblePages={5}
            />
          </>
        ) : (
          <div className="no-deleted-products">
            <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
            <h3>No hay productos eliminados</h3>
            <p>No se encontraron productos eliminados con los filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeletedProducts;