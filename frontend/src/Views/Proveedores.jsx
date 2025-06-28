import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faSearch, faSort, faFilter, faCheck, faTimes, faExclamationTriangle, faShoppingCart, faBox, faLink, faSave, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';
import SmartPagination from '../components/SmartPagination';
import ProveedoresSkeleton from '../components/Skeleton/ProveedoresSkeleton';
import { getProveedores, updateProveedor, createProveedor, cambiarEstadoProveedor, getProductosProveedor, vincularProductosAProveedor, getProveedorById } from '../services/proveedores.service';
import { getProducts } from '../services/AddProducts.service';
import { showSuccessAlert, showErrorAlert, showConfirmationAlert, showWarningAlert, showEmpleadoAccessDeniedAlert } from '../helpers/swaHelper';
import { ExportService } from '../services/export.service';
import { useRole } from '../hooks/useRole';
import '../styles/ProveedoresStyles.css';
import '../styles/SmartPagination.css';

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('activos');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para el manejo de productos
  const [allProducts, setAllProducts] = useState([]);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [proveedorProductos, setProveedorProductos] = useState([]);
  const [showViewProductsModal, setShowViewProductsModal] = useState(false);
  const [viewingProveedor, setViewingProveedor] = useState(null);
  
  const [currentProveedor, setCurrentProveedor] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    categorias: [],
    notas: '',
    contactoPrincipal: '',
    sitioWeb: ''
  });
  
  const proveedoresPorPagina = 5;
  const categorias = [
    'Congelados', 'Carnes', 'Despensa', 'Panaderia y Pasteleria',
    'Quesos y Fiambres', 'Bebidas y Licores', 'Lacteos, Huevos y otros',
    'Desayuno y Dulces', 'Bebes y Niños', 'Cigarros y Tabacos',
    'Limpieza y Hogar', 'Cuidado Personal', 'Mascotas', 'Remedios', 'Otros'
  ];
  
  // 🔧 Obtener el rol del usuario para restricciones
  const { userRole } = useRole();
  const isEmpleado = userRole === 'empleado';

  useEffect(() => {
    const inicializarDatos = async () => {
      await fetchProveedores();
      await fetchAllProducts();
    };
    
    inicializarDatos();
  }, []);
  const fetchProveedores = async (incluirInactivos = null) => {
    try {
      setLoading(true);
      // Determinar qué proveedores cargar basado en el filtro de estado
      let parametroIncluirInactivos = incluirInactivos;
      if (parametroIncluirInactivos === null) {
        parametroIncluirInactivos = estadoFilter === 'inactivos' ? true : false;
      }
      
      const data = await getProveedores(1, 10000, parametroIncluirInactivos);
      const proveedoresArray = data.proveedores || data;
      
      setProveedores(proveedoresArray);
      setFilteredProveedores(proveedoresArray);
      setTotalPages(Math.ceil(proveedoresArray.length / proveedoresPorPagina));
      setError(null);
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      setError('No se pudieron cargar los proveedores. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const data = await getProducts(1, Number.MAX_SAFE_INTEGER);
      // Extraer el array de productos de la estructura de respuesta
      const productsArray = Array.isArray(data.products) 
        ? data.products 
        : (data.data && Array.isArray(data.data.products) 
          ? data.data.products 
          : []);
      
      setAllProducts(productsArray);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setAllProducts([]); // Asegurar que sea un array vacío en caso de error
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    filterProveedores(e.target.value, sortOption, categoryFilter);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    filterProveedores(searchQuery, e.target.value, categoryFilter);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    filterProveedores(searchQuery, sortOption, e.target.value);
  };

  const handleEstadoFilterChange = async (e) => {
    const nuevoEstado = e.target.value;
    setEstadoFilter(nuevoEstado);
    
    // Recargar proveedores según el nuevo filtro de estado
    const incluirInactivos = nuevoEstado === 'inactivos';
    await fetchProveedores(incluirInactivos);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortOption('');
    setCategoryFilter('');
    setEstadoFilter('activos');
    setFilteredProveedores(proveedores);
    setTotalPages(Math.ceil(proveedores.length / proveedoresPorPagina));
    setCurrentPage(1);
  };

  const filterProveedores = (query, sortOpt, category) => {
    let filtered = [...proveedores];
    if (query) {
      filtered = filtered.filter(proveedor => 
        proveedor.nombre.toLowerCase().includes(query.toLowerCase()) ||
        proveedor.email.toLowerCase().includes(query.toLowerCase()) ||
        proveedor.categorias.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
      );
    }
  
    if (category) {
      filtered = filtered.filter(proveedor => 
        proveedor.categorias.includes(category)
      );
    }
  
    if (sortOpt) {
      filtered.sort((a, b) => {
        switch (sortOpt) {
          case 'nombre-asc': return a.nombre.localeCompare(b.nombre);
          case 'nombre-desc': return b.nombre.localeCompare(a.nombre);
          default: return 0;
        }
      });
    }
    
    setFilteredProveedores(filtered);
    setTotalPages(Math.ceil(filtered.length / proveedoresPorPagina));
    setCurrentPage(1);
  };
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Desplazar la ventana hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleAddProveedor = async () => {
    setCurrentProveedor({
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      categorias: [],
      notas: '',
      contactoPrincipal: '',
      sitioWeb: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditProveedor = async (id) => {
    try {
      setLoading(true);
      const proveedor = await getProveedorById(id);
      setCurrentProveedor(proveedor);
      
      // Cargar los productos actuales del proveedor para mostrarlos en el modal
      try {
        const productosActuales = await getProductosProveedor(id);
        setProveedorProductos(productosActuales);
        // También establecer los IDs como selectedProducts por si quiere modificarlos
        setSelectedProducts(proveedor.productos || []);
        console.log('🔄 Productos cargados del proveedor:', productosActuales);
      } catch (error) {
        console.warn('⚠️ No se pudieron cargar los productos del proveedor:', error);
        setProveedorProductos([]);
        setSelectedProducts([]);
      }
      
      setIsEditing(true);
      setShowModal(true);
    } catch (error) {
      console.error('Error al obtener proveedor para editar:', error);
      showErrorAlert('Error', 'No se pudo cargar la información del proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProveedor = async (id) => {
    const result = await showConfirmationAlert(
      '¿Estás seguro?',
      'El proveedor será marcado como inactivo y no aparecerá en la lista principal',
      'Sí, desactivar',
      'Cancelar'
    );

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await deleteProveedor(id);
        fetchProveedores();
        showSuccessAlert('Desactivado', 'El proveedor ha sido marcado como inactivo.');
      } catch (error) {
        console.error('Error al desactivar proveedor:', error);
        showErrorAlert('Error', 'No se pudo desactivar el proveedor');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleCambiarEstadoProveedor = async (id, activo) => {
    const mensaje = activo 
      ? '¿Deseas activar este proveedor?' 
      : '¿Deseas desactivar este proveedor?';
    
    const confirmText = activo ? 'Sí, activar' : 'Sí, desactivar';
    
    const result = await showConfirmationAlert(
      '¿Estás seguro?',
      mensaje,
      confirmText,
      'Cancelar'
    );

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await cambiarEstadoProveedor(id, activo);
        fetchProveedores();
        
        const successMessage = activo 
          ? 'El proveedor ha sido activado.' 
          : 'El proveedor ha sido desactivado.';
        
        showSuccessAlert(
          activo ? 'Activado' : 'Desactivado', 
          successMessage
        );
      } catch (error) {
        console.error('Error al cambiar estado del proveedor:', error);
        showErrorAlert('Error', 'No se pudo cambiar el estado del proveedor');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProveedor({
      ...currentProveedor,
      [name]: value
    });
  };

  const handleCategoriaCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    setCurrentProveedor(prevState => {
      if (checked) {
        return {
          ...prevState,
          categorias: [...prevState.categorias, name]
        };
      } else {
        return {
          ...prevState,
          categorias: prevState.categorias.filter(cat => cat !== name)
        };
      }
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mostrar confirmación antes de añadir el proveedor
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      isEditing
        ? "¿Deseas actualizar este proveedor?"
        : "¿Deseas añadir este proveedor?",
      isEditing ? "Sí, actualizar" : "Sí, añadir",
      "No, cancelar"
    );

    if (!result.isConfirmed) return; // Si el usuario cancela, no se realiza la acción

    if (!currentProveedor.nombre || !currentProveedor.telefono) {
      showWarningAlert('Error', 'El nombre y teléfono son obligatorios');
      return;
    }

    try {
      setLoading(true);
      let proveedorCreado;

      if (isEditing) {
        const { _id, ...proveedorData } = currentProveedor;
        proveedorCreado = await updateProveedor(_id, proveedorData);
        
        // Si hay productos seleccionados y estamos editando, vincularlos
        if (selectedProducts.length > 0) {
          await vincularProductosAProveedor(_id, selectedProducts);
        }
        
        showSuccessAlert('Actualizado', 'Proveedor actualizado con éxito');
      } else {
        // Crear el proveedor
        proveedorCreado = await createProveedor(currentProveedor);
        
        // Si hay productos seleccionados, vincularlos automáticamente
        if (selectedProducts.length > 0 && proveedorCreado._id) {
          try {
            await vincularProductosAProveedor(proveedorCreado._id, selectedProducts);
            showSuccessAlert('Agregado', 'Proveedor agregado con éxito y productos vinculados');
          } catch (error) {
            console.error('Error al vincular productos:', error);
            showSuccessAlert('Agregado', 'Proveedor agregado con éxito, pero hubo un error al vincular algunos productos');
          }
        } else {
          showSuccessAlert('Agregado', 'Proveedor agregado con éxito');
        }
      }

      // Limpiar estado
      setSelectedProducts([]);
      setProveedorProductos([]);
      fetchProveedores();
      setShowModal(false);
    } catch (error) {
      console.error(isEditing ? 'Error al actualizar proveedor:' : 'Error al crear proveedor:', error);
      showErrorAlert(
        'Error',
        isEditing ? 'No se pudo actualizar el proveedor' : 'No se pudo crear el proveedor'
      );
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    ExportService.generarReporteProveedores(filteredProveedores);
  };

  const handleCancel = async () => {
    // Mostrar confirmación antes de cancelar
    const result = await showConfirmationAlert(
      "¿Estás seguro?",
      "¿Deseas cancelar esta acción? Los cambios no se guardarán.",
      "Sí, cancelar",
      "No, volver"
    );
  
    if (result.isConfirmed) {
      // Limpiar estados relacionados con productos
      setSelectedProducts([]);
      setProveedorProductos([]);
      setShowModal(false);
    }
  };

  const handleLinkProducts = (e) => {
    e.preventDefault();
    
    // Ya no verificamos si es un nuevo proveedor - permitimos siempre seleccionar productos
    setShowProductsModal(true);
  };

  const handleProductSelection = (productId) => {
    setSelectedProducts(prevSelected => {
      if (prevSelected.includes(productId)) {
        return prevSelected.filter(id => id !== productId);
      } else {
        return [...prevSelected, productId];
      }
    });
  };

  const handleProductsSubmit = async () => {
    if (selectedProducts.length === 0) {
      return showWarningAlert('Advertencia', 'Debes seleccionar al menos un producto');
    }

    // Si estamos creando un nuevo proveedor (no hay ID), solo cerramos el modal
    // Los productos se guardarán después de crear el proveedor
    if (!isEditing || !currentProveedor._id) {
      setShowProductsModal(false);
      showSuccessAlert('Productos seleccionados', 'Los productos se vincularán al guardar el proveedor');
      return;
    }

    // Solo vinculamos inmediatamente si estamos editando un proveedor existente
    console.log('🔍 Datos para vincular productos:', {
      proveedorId: currentProveedor._id,
      productosSeleccionados: selectedProducts,
      isEditing: isEditing
    });

    try {
      setLoading(true);
      
      console.log('🚀 Enviando solicitud de vinculación...');
      const resultado = await vincularProductosAProveedor(currentProveedor._id, selectedProducts);
      console.log('✅ Respuesta del servidor:', resultado);

      showSuccessAlert('Productos vinculados', 'Los productos se han vinculado correctamente al proveedor');
      setShowProductsModal(false);
      
      try {
        console.log('🔄 Recargando productos del proveedor en el modal...');
        const productosActualizados = await getProductosProveedor(currentProveedor._id);
        setProveedorProductos(productosActualizados);
        console.log('✅ Productos actualizados en el modal:', productosActualizados);
        
        // También actualizar el currentProveedor con los nuevos IDs de productos
        setCurrentProveedor(prev => ({
          ...prev,
          productos: selectedProducts
        }));
        
      } catch (error) {
        console.warn('⚠️ Error al recargar productos del proveedor:', error);
      }
      
      // Limpiar selección para la próxima vez
      setSelectedProducts([]);
      
      // Recargar proveedores para mostrar los productos actualizados en la tabla principal
      console.log('🔄 Recargando lista de proveedores...');
      await fetchProveedores(); 
      
    } catch (error) {
      console.error('❌ Error detallado al vincular productos:', error);
      console.error('📊 Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      showErrorAlert('Error', 'Ocurrió un error al vincular los productos. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProveedorProductos = async (id) => {
    try {
      setLoading(true);
      
      // Obtener el proveedor completo
      const proveedor = proveedores.find(prov => prov._id === id);
      if (!proveedor) {
        showErrorAlert('Error', 'Proveedor no encontrado');
        return;
      }
      
      // Obtener los productos detallados del proveedor
      const productosDetalle = await getProductosProveedor(id);
      
      // Actualizar el proveedor con los productos detallados
      const proveedorConProductos = {
        ...proveedor,
        productosDetalle: productosDetalle
      };
      
      setViewingProveedor(proveedorConProductos);
      setShowViewProductsModal(true);
    } catch (error) {
      console.error('Error al cargar productos del proveedor:', error);
      showErrorAlert('Error', 'No se pudieron cargar los productos del proveedor');
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastProveedor = currentPage * proveedoresPorPagina;
  const indexOfFirstProveedor = indexOfLastProveedor - proveedoresPorPagina;
  const currentProveedores = filteredProveedores.slice(indexOfFirstProveedor, indexOfLastProveedor);

  // 🔧 Función para mostrar alerta de empleado
  const showEmpleadoAlert = () => {
    showEmpleadoAccessDeniedAlert("la gestión de proveedores", "Los proveedores pueden ser consultados pero solo administradores y jefes pueden crear, editar o eliminar.");
  };

  // 🆕 Función para manejar clic en "Agregar Proveedor" con verificación de permisos
  const handleAddProveedorClick = () => {
    if (isEmpleado) {
      showEmpleadoAlert();
      return;
    }
    handleAddProveedor();
  };

  // 🆕 Función para manejar edición con verificación de permisos
  const handleEditProveedorClick = async (id) => {
    if (isEmpleado) {
      showEmpleadoAlert();
      return;
    }
    await handleEditProveedor(id);
  };

  // 🆕 Función para manejar eliminación con verificación de permisos
  const handleDeleteProveedorClick = async (id) => {
    if (isEmpleado) {
      showEmpleadoAlert();
      return;
    }
    await handleDeleteProveedor(id);
  };

  // 🆕 Función para manejar cambio de estado con verificación de permisos
  const handleCambiarEstadoProveedorClick = async (id, activo) => {
    if (isEmpleado) {
      showEmpleadoAlert();
      return;
    }
    await handleCambiarEstadoProveedor(id, activo);
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        {loading ? (
          <ProveedoresSkeleton />
        ) : (
          <>
            <div className="page-header">
              <div className="proveedores-title-container">
                <h1 className="page-title">Gestión de Proveedores</h1>
                <p className="proveedores-page-subtitle">Administra tus proveedores y vincula productos a cada uno de ellos</p>
              </div>
              <div className="header-buttons">
                <button className="btn btn-primary add-btn" onClick={handleAddProveedorClick}>
                  <FontAwesomeIcon icon={faPlus} /> Agregar Proveedor
                </button>
                <button className="btn-export-pdf download-btn" onClick={exportarPDF}>
                  <FontAwesomeIcon icon={faFilePdf} /> Descargar PDF
                </button>
              </div>
            </div>
            
            <div className="proveedores-filters-container">
              <div className="proveedores-filters-row">
                <div className="proveedores-search-container">
                  <FontAwesomeIcon icon={faSearch} className="proveedores-search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar proveedores..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="proveedores-search-input"
                  />
                </div>
                
                <div className="proveedores-filter-group">
                  <select 
                    value={sortOption} 
                    onChange={handleSortChange}
                    className="proveedores-form-select"
                  >
                    <option value="">Ordenar por</option>
                    <option value="nombre-asc">Nombre (A-Z)</option>
                    <option value="nombre-desc">Nombre (Z-A)</option>
                  </select>
                </div>
                
                <div className="proveedores-filter-group">
                  <select 
                    value={categoryFilter} 
                    onChange={handleCategoryFilterChange}
                    className="proveedores-form-select"
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map((cat, index) => (
                      <option key={index} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="proveedores-filter-group">
                  <select 
                    value={estadoFilter} 
                    onChange={handleEstadoFilterChange}
                    className="proveedores-form-select"
                  >
                    <option value="activos">Proveedores Activos</option>
                    <option value="inactivos">Proveedores Inactivos</option>
                  </select>
                </div>
                
                <button onClick={handleClearFilters} className="proveedores-clear-filters-button">
                  <FontAwesomeIcon icon={faFilter} /> Limpiar Filtros
                </button>
              </div>
            </div>
            
            {loading ? (
              <p className="text-center">Cargando proveedores...</p>
            ) : error ? (
              <p className="text-center text-danger">{error}</p>
            ) : (
              <>
                <div className="proveedores-table-container">
                  <table className="proveedores-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Contacto Principal</th>
                        <th>Dirección</th>
                        <th>Categorías</th>
                        <th>Productos</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProveedores.length > 0 ? (
                        currentProveedores.map(proveedor => (
                          <tr key={proveedor._id}>
                            <td>{proveedor.nombre}</td>
                            <td>{proveedor.telefono}</td>
                            <td>{proveedor.email}</td>
                            <td>{proveedor.contactoPrincipal || '—'}</td>
                            <td>{proveedor.direccion}</td>
                            <td>
                              <div className="proveedores-categories-badges">
                                {proveedor.categorias.map((cat, idx) => (
                                  <span key={idx} className="proveedores-category-badge">{cat}</span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className="proveedores-productos-preview">
                                {proveedor.productos && proveedor.productos.length > 0 ? (
                                  <>
                                    <div className="proveedores-productos-thumbnails">
                                      {proveedor.productos.slice(0, 3).map((productoId, idx) => {
                                        const producto = allProducts.find(p => p._id === productoId);
                                        return producto ? (
                                          <img 
                                            key={idx} 
                                            src={producto.image} 
                                            alt={producto.Nombre} 
                                            className="proveedores-producto-thumbnail"
                                            onError={(e) => {
                                              e.target.onerror = null;
                                              e.target.src = 'https://via.placeholder.com/30?text=N/A';
                                            }}
                                          />
                                        ) : (
                                          <div key={idx} className="proveedores-producto-placeholder"></div>
                                        );
                                      })}
                                      {proveedor.productos.length > 3 && (
                                        <span className="proveedores-badge proveedores-badge-info">+{proveedor.productos.length - 3}</span>
                                      )}
                                    </div>
                                    <button 
                                      className="proveedores-btn-ver-productos"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewProveedorProductos(proveedor._id);
                                      }}
                                    >
                                      Ver todos
                                    </button>
                                  </>
                                ) : (
                                  <span className="proveedores-badge proveedores-badge-empty">Sin productos</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`proveedores-badge ${proveedor.activo ? 'proveedores-badge-success' : 'proveedores-badge-danger'}`}>
                                {proveedor.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="proveedores-d-flex proveedores-gap-sm">
                              <button 
                                onClick={() => handleEditProveedorClick(proveedor._id)}
                                className="proveedores-btn-icon proveedores-btn-primary"
                                title="Editar proveedor"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              
                              {proveedor.activo ? (
                                <button 
                                  onClick={() => handleCambiarEstadoProveedorClick(proveedor._id, false)}
                                  className="proveedores-btn-icon proveedores-btn-danger"
                                  title="Desactivar proveedor"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleCambiarEstadoProveedorClick(proveedor._id, true)}
                                  className="proveedores-btn-icon proveedores-btn-success"
                                  title="Activar proveedor"
                                >
                                  <FontAwesomeIcon icon={faCheck} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="proveedores-no-data">No hay proveedores disponibles</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <SmartPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  maxVisiblePages={5}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Modal de creación/edición de proveedores - EXACTAMENTE IGUAL A CUENTAS POR PAGAR */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {isEditing ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
              </h2>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="nombre">
                Nombre del Proveedor:
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={currentProveedor.nombre}
                onChange={handleInputChange}
                required
                className="form-control"
                placeholder="Ingrese el nombre del proveedor"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefono">
                Teléfono:
              </label>
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={currentProveedor.telefono}
                onChange={handleInputChange}
                required
                className="form-control"
                placeholder="Ej: 912345678"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={currentProveedor.email}
                onChange={handleInputChange}
                required
                className="form-control"
                placeholder="proveedor@empresa.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contactoPrincipal">
                Persona de Contacto:
              </label>
              <input
                type="text"
                id="contactoPrincipal"
                name="contactoPrincipal"
                value={currentProveedor.contactoPrincipal || ''}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Nombre del contacto principal"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="sitioWeb">
                Sitio Web:
              </label>
              <input
                type="url"
                id="sitioWeb"
                name="sitioWeb"
                value={currentProveedor.sitioWeb || ''}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="direccion">
                Dirección:
              </label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={currentProveedor.direccion}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Dirección completa del proveedor"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categorías de Productos:</label>
              <div className="categories-grid">
                {categorias.map((cat, index) => (
                  <div key={index} className="category-item">
                    <input
                      type="checkbox"
                      id={`cat-${index}`}
                      name={cat}
                      checked={currentProveedor.categorias.includes(cat)}
                      onChange={handleCategoriaCheckboxChange}
                      className="category-checkbox"
                    />
                    <label htmlFor={`cat-${index}`} className="category-label">
                      {cat}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Productos que Provee:</label>
              <div className="productos-info">
                {isEditing ? (
                  proveedorProductos.length > 0 ? (
                    <div className="productos-list">
                      <p className="productos-count">
                        {proveedorProductos.length} producto{proveedorProductos.length !== 1 ? 's' : ''} registrado{proveedorProductos.length !== 1 ? 's' : ''}
                      </p>
                      <div className="productos-preview-mini">
                        {proveedorProductos.slice(0, 3).map(producto => (
                          <span key={producto._id} className="producto-tag">
                            {producto.nombre}
                          </span>
                        ))}
                        {proveedorProductos.length > 3 && (
                          <span className="productos-more-tag">
                            +{proveedorProductos.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="no-productos">No hay productos registrados para este proveedor</p>
                  )
                ) : (
                  selectedProducts.length > 0 ? (
                    <div className="productos-list">
                      <p className="productos-count">
                        {selectedProducts.length} producto{selectedProducts.length !== 1 ? 's' : ''} seleccionado{selectedProducts.length !== 1 ? 's' : ''}
                      </p>
                      <div className="productos-preview-mini">
                        {allProducts
                          .filter(product => selectedProducts.includes(product._id))
                          .slice(0, 3)
                          .map(producto => (
                            <span key={producto._id} className="producto-tag">
                              {producto.Nombre}
                            </span>
                          ))}
                        {selectedProducts.length > 3 && (
                          <span className="productos-more-tag">
                            +{selectedProducts.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="no-productos">No hay productos seleccionados</p>
                  )
                )}
                
                <button 
                  type="button"
                  onClick={(e) => handleLinkProducts(e)}
                  className="btn-link-productos"
                >
                  <FontAwesomeIcon icon={faLink} />
                  {selectedProducts.length > 0 || proveedorProductos.length > 0 
                    ? 'Modificar Productos Vinculados' 
                    : 'Vincular Productos'
                  }
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notas">
                Notas y Observaciones:
              </label>
              <textarea
                id="notas"
                name="notas"
                value={currentProveedor.notas}
                onChange={handleInputChange}
                rows="3"
                className="form-control"
                placeholder="Información adicional sobre el proveedor..."
              ></textarea>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-success"
                onClick={handleSubmit}
              >
                <FontAwesomeIcon icon={faSave} />
                {isEditing ? 'Guardar Cambios' : 'Agregar Proveedor'}
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleCancel}
              >
                <FontAwesomeIcon icon={faTimes} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de selección de productos */}
      {showProductsModal && (
        <div className="proveedores-modal-overlay" onClick={() => setShowProductsModal(false)}>
          <div 
            className="proveedores-modal-content proveedores-products-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="proveedores-modal-header">
              <h2 className="proveedores-modal-title">Vincular Productos</h2>
            </div>
            
            <div className="proveedores-products-search">
              <FontAwesomeIcon icon={faSearch} className="proveedores-products-search-icon" />
              <input 
                type="text" 
                placeholder="Buscar productos..." 
                className="proveedores-products-search-input"
              />
            </div>
            
            <div className="proveedores-products-list">
              {allProducts.map(product => (
                <div 
                  key={product._id} 
                  className={`proveedores-product-item ${selectedProducts.includes(product._id) ? 'selected' : ''}`}
                  onClick={() => handleProductSelection(product._id)}
                >
                  <div className="proveedores-product-image">
                    <img src={product.image} alt={product.Nombre} />
                  </div>
                  <div className="proveedores-product-info">
                    <h4>{product.Nombre}</h4>
                    <p>Marca: {product.Marca}</p>
                    <p>Categoría: {product.Categoria}</p>
                  </div>
                  <div className="proveedores-product-check">
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.includes(product._id)} 
                      readOnly
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="proveedores-modal-footer">
              <button 
                className="proveedores-btn proveedores-btn-success"
                onClick={handleProductsSubmit}
              >
                Guardar
              </button>
              <button 
                className="proveedores-btn proveedores-btn-danger"
                onClick={() => setShowProductsModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualización de productos */}
      {showViewProductsModal && viewingProveedor && (
        <div className="proveedores-modal-overlay" onClick={() => setShowViewProductsModal(false)}>
          <div 
            className="proveedores-modal-content proveedores-view-products-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="proveedores-modal-header">
              <h2 className="proveedores-modal-title">Productos de {viewingProveedor.nombre}</h2>
            </div>
            
            <div className="proveedores-view-products-grid">
              {viewingProveedor.productosDetalle && viewingProveedor.productosDetalle.length > 0 ? (
                viewingProveedor.productosDetalle.map(producto => (
                  <div key={producto._id} className="proveedores-product-card">
                    <div className="proveedores-product-card-image">
                      <img src={producto.image} alt={producto.Nombre || producto.nombre} />
                    </div>
                    <div className="proveedores-product-card-info">
                      <h4>{producto.Nombre || producto.nombre}</h4>
                      <p>Marca: {producto.Marca || producto.marca}</p>
                      <p>Categoría: {producto.Categoria || producto.categoria}</p>
                      <p>Stock: {producto.Stock || producto.stock || '—'}</p>
                      <p>Precio: ${producto.PrecioVenta || producto.precioVenta || '—'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="proveedores-no-productos">Este proveedor no tiene productos asociados</p>
              )}
            </div>
            
            <div className="proveedores-modal-footer">
              <button 
                className="proveedores-btn proveedores-btn-secondary"
                onClick={() => setShowViewProductsModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;