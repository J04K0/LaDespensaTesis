import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import '../styles/ProveedoresStyles.css';

// Importar los servicios necesarios
import { 
  getProveedores, 
  getProveedorById, 
  createProveedor, 
  updateProveedor, 
  deleteProveedor 
} from '../services/proveedores.service.js';

const Proveedores = () => {
  // Estados existentes...
  const [proveedores, setProveedores] = useState([]);
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estados para el modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProveedor, setCurrentProveedor] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    categorias: [],
    notas: ''
  });

  const proveedoresPorPagina = 8;
  const categorias = [
    'Congelados', 'Carnes', 'Despensa', 'Panaderia y Pasteleria',
    'Quesos y Fiambres', 'Bebidas y Licores', 'Lacteos, Huevos y otros',
    'Desayuno y Dulces', 'Bebes y Niños', 'Cigarros y Tabacos',
    'Limpieza y Hogar', 'Cuidado Personal', 'Mascotas', 'Remedios', 'Otros'
  ];

  // Cargar proveedores al montar el componente
  useEffect(() => {
    fetchProveedores();
  }, []);

  // Función para obtener proveedores (ahora usa la API real)
  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const data = await getProveedores(); // Llamada real a la API
      
      // Verificar estructura de la respuesta
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

  // Las funciones de filtrado se mantienen igual
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    filterProveedores(e.target.value, sortOption);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    filterProveedores(searchQuery, e.target.value);
  };

  const filterProveedores = (query, sortOpt) => {
    let filtered = [...proveedores];
    
    // Aplicar filtro de búsqueda
    if (query) {
      filtered = filtered.filter(proveedor => 
        proveedor.nombre.toLowerCase().includes(query.toLowerCase()) ||
        proveedor.email.toLowerCase().includes(query.toLowerCase()) ||
        proveedor.categorias.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Aplicar ordenamiento
    if (sortOpt) {
      filtered.sort((a, b) => {
        switch (sortOpt) {
          case 'nombre-asc':
            return a.nombre.localeCompare(b.nombre);
          case 'nombre-desc':
            return b.nombre.localeCompare(a.nombre);
          default:
            return 0;
        }
      });
    }
    
    setFilteredProveedores(filtered);
    setTotalPages(Math.ceil(filtered.length / proveedoresPorPagina));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortOption('');
    setFilteredProveedores(proveedores);
    setTotalPages(Math.ceil(proveedores.length / proveedoresPorPagina));
    setCurrentPage(1);
  };

  // Funciones para gestionar proveedores
  const handleAddProveedor = () => {
    setCurrentProveedor({
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      categorias: [],
      notas: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditProveedor = async (id) => {
    try {
      setLoading(true);
      const proveedor = await getProveedorById(id); // Obtener proveedor por ID
      setCurrentProveedor(proveedor);
      setIsEditing(true);
      setShowModal(true);
    } catch (error) {
      console.error('Error al obtener proveedor para editar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la información del proveedor',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProveedor = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await deleteProveedor(id); // Llamada real a la API
          
          // Actualizar estado local
          fetchProveedores(); // Recargar todos los proveedores
          
          Swal.fire(
            'Eliminado',
            'El proveedor ha sido eliminado.',
            'success'
          );
        } catch (error) {
          console.error('Error al eliminar proveedor:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el proveedor',
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Funciones de manejo de formulario se mantienen igual
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProveedor({
      ...currentProveedor,
      [name]: value
    });
  };

  const handleCategoriaChange = (e) => {
    const { options } = e.target;
    const selectedCategorias = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedCategorias.push(options[i].value);
      }
    }
    setCurrentProveedor({
      ...currentProveedor,
      categorias: selectedCategorias
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!currentProveedor.nombre || !currentProveedor.telefono) {
      Swal.fire('Error', 'El nombre y teléfono son obligatorios', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      if (isEditing) {
        // Actualizar proveedor existente
        const { _id, ...proveedorData } = currentProveedor;
        await updateProveedor(_id, proveedorData);
        Swal.fire('Actualizado', 'Proveedor actualizado con éxito', 'success');
      } else {
        // Crear nuevo proveedor
        await createProveedor(currentProveedor);
        Swal.fire('Agregado', 'Proveedor agregado con éxito', 'success');
      }
      
      // Recargar lista actualizada
      fetchProveedores();
      
      // Cerrar modal
      setShowModal(false);
    } catch (error) {
      console.error(isEditing ? 'Error al actualizar proveedor:' : 'Error al crear proveedor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: isEditing 
          ? 'No se pudo actualizar el proveedor' 
          : 'No se pudo crear el proveedor'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular proveedores para la página actual
  const indexOfLastProveedor = currentPage * proveedoresPorPagina;
  const indexOfFirstProveedor = indexOfLastProveedor - proveedoresPorPagina;
  const currentProveedores = filteredProveedores.slice(indexOfFirstProveedor, indexOfLastProveedor);

  return (
    <div className="proveedores-container">
      <Navbar />
      <div className="proveedores-content">
        <div className="proveedores-header">
          <h1>Gestión de Proveedores</h1>
          <button className="proveedores-btn-add" onClick={handleAddProveedor}>
            <FontAwesomeIcon icon={faPlus} /> Agregar Proveedor
          </button>
        </div>
        
        <div className="proveedores-controls">
          <div className="proveedores-search-bar">
            <FontAwesomeIcon icon={faSearch} className="proveedores-search-icon" />
            <input
              type="text"
              placeholder="Buscar proveedores..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="proveedores-sort-filter">
            <select value={sortOption} onChange={handleSortChange}>
              <option value="">Ordenar por</option>
              <option value="nombre-asc">Nombre (A-Z)</option>
              <option value="nombre-desc">Nombre (Z-A)</option>
            </select>
            
            <button onClick={handleClearFilters} className="proveedores-btn-clear-filters">
              <FontAwesomeIcon icon={faFilter} /> Limpiar Filtros
            </button>
          </div>
        </div>

        {loading ? (
          <p className="proveedores-loading-message">Cargando proveedores...</p>
        ) : error ? (
          <p className="proveedores-error-message">{error}</p>
        ) : (
          <>
            <div className="proveedores-table-container">
              <table className="proveedores-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Dirección</th>
                    <th>Categorías</th>
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
                        <td>{proveedor.direccion}</td>
                        <td>{proveedor.categorias.join(', ')}</td>
                        <td>{proveedor.notas}</td>
                        <td className="proveedores-actions-cell">
                          <button 
                            onClick={() => handleEditProveedor(proveedor._id)}
                            className="proveedores-btn-edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProveedor(proveedor._id)}
                            className="proveedores-btn-delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="proveedores-no-data">No hay proveedores disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="proveedores-pagination">
                {[...Array(totalPages).keys()].map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page + 1)}
                    className={page + 1 === currentPage ? 'active' : ''}
                  >
                    {page + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para agregar/editar proveedor */}
      {showModal && (
        <div 
          className="proveedores-modal-overlay" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="proveedores-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{isEditing ? 'Editar Proveedor' : 'Agregar Proveedor'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="proveedores-form-group">
                <label htmlFor="nombre">Nombre:</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={currentProveedor.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="proveedores-form-group">
                <label htmlFor="telefono">Teléfono:</label>
                <input
                  type="text"
                  id="telefono"
                  name="telefono"
                  value={currentProveedor.telefono}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="proveedores-form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={currentProveedor.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="proveedores-form-group">
                <label htmlFor="direccion">Dirección:</label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={currentProveedor.direccion}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="proveedores-form-group">
                <label htmlFor="categorias">Categorías:</label>
                <select
                  id="categorias"
                  name="categorias"
                  multiple
                  value={currentProveedor.categorias}
                  onChange={handleCategoriaChange}
                  className="proveedores-multi-select"
                >
                  {categorias.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
                <small>Mantén presionado Ctrl (o Cmd en Mac) para seleccionar múltiples categorías</small>
              </div>
              
              <div className="proveedores-form-group">
                <label htmlFor="notas">Notas adicionales:</label>
                <textarea
                  id="notas"
                  name="notas"
                  value={currentProveedor.notas}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="proveedores-modal-buttons">
                <button type="submit" className="proveedores-btn-save">
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </button>
                <button 
                  type="button" 
                  className="proveedores-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;