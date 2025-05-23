import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faFilter, faLink, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import '../styles/ProveedoresStyles.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { 
  getProveedores, 
  getProveedorById, 
  createProveedor, 
  updateProveedor, 
  deleteProveedor,
  getProductosProveedor,
  vincularProductos
} from '../services/proveedores.service.js';
import { getProducts } from '../services/AddProducts.service.js';
import { showSuccessAlert, showErrorAlert, showWarningAlert, showConfirmationAlert } from '../helpers/swaHelper';
import ProveedoresSkeleton from '../components/ProveedoresSkeleton';

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
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
  
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [proveedorProductos, setProveedorProductos] = useState([]);
  const [showProductsModal, setShowProductsModal] = useState(false);
  
  const [viewingProveedor, setViewingProveedor] = useState(null);
  const [showViewProductsModal, setShowViewProductsModal] = useState(false);

  const proveedoresPorPagina = 10;
  const categorias = [
    'Congelados', 'Carnes', 'Despensa', 'Panaderia y Pasteleria',
    'Quesos y Fiambres', 'Bebidas y Licores', 'Lacteos, Huevos y otros',
    'Desayuno y Dulces', 'Bebes y Niños', 'Cigarros y Tabacos',
    'Limpieza y Hogar', 'Cuidado Personal', 'Mascotas', 'Remedios', 'Otros'
  ];
  useEffect(() => {
    const inicializarDatos = async () => {
      await fetchProveedores();
      await fetchAllProducts();
    };
    
    inicializarDatos();
  }, []);
  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const data = await getProveedores(1, 10000);
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
      setLoading(true);
      const response = await getProducts(1, 1000);
      setAllProducts(response.products || response.data?.products || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchProveedorProductos = async (proveedorId) => {
    try {
      setLoading(true);
      const productos = await getProductosProveedor(proveedorId);
      setProveedorProductos(productos);
      setSelectedProducts(productos.map(p => p._id));
    } catch (error) {
      console.error('Error al obtener productos del proveedor:', error);
      setProveedorProductos([]);
      setSelectedProducts([]);
    } finally {
      setLoading(false);
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

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortOption('');
    setCategoryFilter('');
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
    setProveedorProductos([]);
    setSelectedProducts([]);
    setIsEditing(false);
    
    if (allProducts.length === 0) {
      try {
        await fetchAllProducts();
      } catch (error) {
        console.error('Error al cargar productos:', error);
      }
    }
    
    setShowModal(true);
  };

  const handleEditProveedor = async (id) => {
    try {
      setLoading(true);
      const proveedor = await getProveedorById(id);
      setCurrentProveedor(proveedor);
      setIsEditing(true);
      setShowModal(true);
      
      await fetchProveedorProductos(id);
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
      'No podrás revertir esta acción',
      'Sí, eliminar',
      'Cancelar'
    );

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await deleteProveedor(id);
        fetchProveedores();
        showSuccessAlert('Eliminado', 'El proveedor ha sido eliminado.');
      } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        showErrorAlert('Error', 'No se pudo eliminar el proveedor');
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

      if (isEditing) {
        const { _id, ...proveedorData } = currentProveedor;
        await updateProveedor(_id, proveedorData);
        if (selectedProducts.length > 0) {
          await vincularProductos(_id, selectedProducts);
        }
        showSuccessAlert('Actualizado', 'Proveedor actualizado con éxito');
      } else {
        const nuevoProveedorData = { 
          ...currentProveedor, 
          productos: selectedProducts 
        };
        await createProveedor(nuevoProveedorData);
        showSuccessAlert('Agregado', 'Proveedor agregado con éxito');
      }

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

  const handleLinkProducts = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (allProducts.length === 0) {
      try {
        await fetchAllProducts();
      } catch (error) {
        console.error('Error al cargar productos:', error);
        showErrorAlert('Error', 'No se pudieron cargar los productos');
        return;
      }
    }
    
    setShowProductsModal(true);
  };

  const handleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };
  
  const handleProductsSubmit = async () => {
    try {
      setLoading(true);
      
      if (!currentProveedor._id) {
        setShowProductsModal(false);
        return;
      }
      
      await vincularProductos(currentProveedor._id, selectedProducts);
      await fetchProveedorProductos(currentProveedor._id);
      
      showSuccessAlert('Éxito', 'Productos vinculados correctamente al proveedor');
      
      setShowProductsModal(false);
    } catch (error) {
      console.error('Error al vincular productos:', error);
      showErrorAlert('Error', 'No se pudieron vincular los productos al proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProveedorProductos = async (proveedorId) => {
    try {
      setLoading(true);
      const productos = await getProductosProveedor(proveedorId);
      const proveedor = proveedores.find(p => p._id === proveedorId);
      
      if (proveedor) {
        setViewingProveedor({
          ...proveedor,
          productosDetalle: productos
        });
        setShowViewProductsModal(true);
      }
    } catch (error) {
      console.error('Error al cargar productos del proveedor:', error);
      showErrorAlert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.text("Listado de Proveedores", 14, 15);
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Fecha: ${currentDate}`, 14, 22);
    
    const headers = [
      'Nombre', 
      'Teléfono', 
      'Email',
      'Contacto Principal',
      'Dirección',
      'Categorías',
      'Notas'
    ];
    
    const rows = filteredProveedores.map(proveedor => [
      proveedor.nombre,
      proveedor.telefono,
      proveedor.email,
      proveedor.contactoPrincipal || '—',
      proveedor.direccion || '—',
      proveedor.categorias.join(', '),
      proveedor.notas || '—'
    ]);
    
    // Generar tabla
    autoTable(doc, {
      head: [headers],
      body: rows,
      margin: { top: 30 },
      styles: { overflow: 'linebreak' },
      headStyles: { fillColor: [0, 38, 81] }, // Color #002651
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.text(`La Despensa - Listado de Proveedores - ${currentDate}`, 14, doc.internal.pageSize.height - 10);
      }
    });
    
    // Guardar PDF
    doc.save("Proveedores.pdf");
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
      setShowModal(false); // Cerrar el modal si el usuario confirma
    }
  };

  const indexOfLastProveedor = currentPage * proveedoresPorPagina;
  const indexOfFirstProveedor = indexOfLastProveedor - proveedoresPorPagina;
  const currentProveedores = filteredProveedores.slice(indexOfFirstProveedor, indexOfLastProveedor);

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        {loading ? (
          <ProveedoresSkeleton />
        ) : (
          <>
            <div className="page-header">
              <h1 className="page-title">Gestión de Proveedores</h1>
              <div className="d-flex gap-sm">
                <button onClick={exportarPDF} className="btn btn-secondary">
                  <FontAwesomeIcon icon={faFilePdf} /> Exportar PDF
                </button>
                <button className="btn btn-primary" onClick={handleAddProveedor}>
                  <FontAwesomeIcon icon={faPlus} /> Agregar Proveedor
                </button>
              </div>
            </div>
            
            <div className="filters-container">
              <div className="search-container">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar proveedores..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
              
              <div className="filter-group">
                <select 
                  value={sortOption} 
                  onChange={handleSortChange}
                  className="form-select"
                >
                  <option value="">Ordenar por</option>
                  <option value="nombre-asc">Nombre (A-Z)</option>
                  <option value="nombre-desc">Nombre (Z-A)</option>
                </select>
              </div>
              
              <div className="filter-group">
                <select 
                  value={categoryFilter} 
                  onChange={handleCategoryFilterChange}
                  className="form-select"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <button onClick={handleClearFilters} className="btn btn-secondary">
                <FontAwesomeIcon icon={faFilter} /> Limpiar Filtros
              </button>
            </div>
            
            {loading ? (
              <p className="text-center">Cargando proveedores...</p>
            ) : error ? (
              <p className="text-center text-danger">{error}</p>
            ) : (
              <>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Contacto Principal</th>
                        <th>Dirección</th>
                        <th>Categorías</th>
                        <th>Productos</th>
                        <th>Notas</th>
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
                            <td>{proveedor.categorias.join(', ')}</td>
                            <td>
                              <div className="producto-preview-container">
                                {proveedor.productos && proveedor.productos.length > 0 ? (
                                  <>
                                    <div className="producto-thumbnails">
                                      {proveedor.productos.slice(0, 3).map((productoId, idx) => {
                                        const producto = allProducts.find(p => p._id === productoId);
                                        return producto ? (
                                          <img 
                                            key={idx} 
                                            src={producto.image} 
                                            alt={producto.Nombre} 
                                            className="producto-mini-thumb"
                                            onError={(e) => {
                                              e.target.onerror = null;
                                              e.target.src = 'https://via.placeholder.com/30?text=N/A';
                                            }}
                                          />
                                        ) : (
                                          <div key={idx} className="producto-mini-thumb-placeholder"></div>
                                        );
                                      })}
                                      {proveedor.productos.length > 3 && (
                                        <span className="state-badge state-badge-info">+{proveedor.productos.length - 3}</span>
                                      )}
                                    </div>
                                    <button 
                                      className="btn btn-secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewProveedorProductos(proveedor._id);
                                      }}
                                    >
                                      Ver todos
                                    </button>
                                  </>
                                ) : (
                                  <span className="state-badge">Sin productos</span>
                                )}
                              </div>
                            </td>
                            <td>{proveedor.notas}</td>
                            <td className="d-flex gap-sm">
                              <button 
                                onClick={() => handleEditProveedor(proveedor._id)}
                                className="btn-icon btn-primary"
                                title="Editar proveedor"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProveedor(proveedor._id)}
                                className="btn-icon btn-danger"
                                title="Eliminar proveedor"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="no-data">No hay proveedores disponibles</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="pagination">
                    {[...Array(totalPages).keys()].map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page + 1)}
                        className={`pagination-button ${page + 1 === currentPage ? 'active' : ''}`}
                      >
                        {page + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modal de creación/edición de proveedores */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Editar Proveedor' : 'Agregar Proveedor'}</h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="nombre">Nombre:</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={currentProveedor.nombre}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="telefono">Teléfono:</label>
                <input
                  type="text"
                  id="telefono"
                  name="telefono"
                  value={currentProveedor.telefono}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={currentProveedor.email}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="direccion">Dirección:</label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={currentProveedor.direccion}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Categorías:</label>
                <div className="proveedores-categories-selector">
                  {categorias.map((cat, index) => (
                    <div key={index} className="category-checkbox-item">
                      <input
                        type="checkbox"
                        id={`cat-${index}`}
                        name={cat}
                        checked={currentProveedor.categorias.includes(cat)}
                        onChange={handleCategoriaCheckboxChange}
                      />
                      <label htmlFor={`cat-${index}`}>{cat}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="contactoPrincipal">Persona de Contacto:</label>
                <input
                  type="text"
                  id="contactoPrincipal"
                  name="contactoPrincipal"
                  value={currentProveedor.contactoPrincipal || ''}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sitioWeb">Sitio Web:</label>
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
                <label className="form-label" htmlFor="notas">Notas adicionales:</label>
                <textarea
                  id="notas"
                  name="notas"
                  value={currentProveedor.notas}
                  onChange={handleInputChange}
                  rows="3"
                  className="form-control"
                ></textarea>
              </div>

              <div className="card">
                <h3>Productos que provee</h3>
                <div className="proveedores-productos-list">
                  {isEditing ? (
                    proveedorProductos.length > 0 ? (
                      proveedorProductos.map(producto => (
                        <div key={producto._id} className="proveedores-producto-item">
                          <img src={producto.image} alt={producto.nombre} />
                          <span>{producto.nombre}</span>
                          <span>{producto.marca}</span>
                        </div>
                      ))
                    ) : (
                      <p>No hay productos registrados de este proveedor</p>
                    )
                  ) : (
                    selectedProducts.length > 0 ? (
                      allProducts
                        .filter(product => selectedProducts.includes(product._id))
                        .map(producto => (
                          <div key={producto._id} className="proveedores-producto-item">
                            <img src={producto.image} alt={producto.Nombre} />
                            <span>{producto.Nombre}</span>
                            <span>{producto.Marca}</span>
                          </div>
                        ))
                    ) : (
                      <p>No hay productos seleccionados</p>
                    )
                  )}
                </div>
                <button 
                  type="button"
                  onClick={(e) => handleLinkProducts(e)}
                  className="btn btn-secondary"
                >
                  <FontAwesomeIcon icon={faLink} /> Vincular Productos
                </button>
              </div>
              
              <div className="modal-footer">
                <button type="submit" className="btn btn-success">
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de selección de productos */}
      {showProductsModal && (
        <div className="modal-overlay" onClick={() => setShowProductsModal(false)}>
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{maxWidth: '800px'}}
          >
            <div className="modal-header">
              <h2 className="modal-title">Vincular Productos</h2>
            </div>
            
            <div className="search-container">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar productos..." 
                className="search-input"
              />
            </div>
            
            <div className="products-list">
              {allProducts.map(product => (
                <div 
                  key={product._id} 
                  className={`product-item ${selectedProducts.includes(product._id) ? 'selected' : ''}`}
                  onClick={() => handleProductSelection(product._id)}
                >
                  <div className="product-image">
                    <img src={product.image} alt={product.Nombre} />
                  </div>
                  <div className="product-info">
                    <h4>{product.Nombre}</h4>
                    <p>Marca: {product.Marca}</p>
                    <p>Categoría: {product.Categoria}</p>
                  </div>
                  <div className="product-check">
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.includes(product._id)} 
                      readOnly
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-success"
                onClick={handleProductsSubmit}
              >
                Guardar
              </button>
              <button 
                className="btn btn-danger"
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
        <div className="modal-overlay" onClick={() => setShowViewProductsModal(false)}>
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{maxWidth: '900px', maxHeight: '85vh'}}
          >
            <div className="modal-header">
              <h2 className="modal-title">Productos de {viewingProveedor.nombre}</h2>
            </div>
            
            <div className="provider-products-grid">
              {viewingProveedor.productosDetalle && viewingProveedor.productosDetalle.length > 0 ? (
                viewingProveedor.productosDetalle.map(producto => (
                  <div key={producto._id} className="card">
                    <div className="provider-product-image">
                      <img src={producto.image} alt={producto.Nombre || producto.nombre} />
                    </div>
                    <div className="provider-product-info">
                      <h4>{producto.Nombre || producto.nombre}</h4>
                      <p>Marca: {producto.Marca || producto.marca}</p>
                      <p>Categoría: {producto.Categoria || producto.categoria}</p>
                      <p>Stock: {producto.Stock || producto.stock || '—'}</p>
                      <p>Precio: ${producto.PrecioVenta || producto.precioVenta || '—'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center">Este proveedor no tiene productos asociados</p>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
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