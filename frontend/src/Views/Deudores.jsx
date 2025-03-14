import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/DeudoresStyles.css';
import { getDeudores, deleteDeudor } from '../services/deudores.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

const DeudoresList = () => {
  const [allDeudores, setAllDeudores] = useState([]);
  const [filteredDeudores, setFilteredDeudores] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const deudoresPerPage = 6;
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortOption('');
    setFilteredDeudores(allDeudores);
    setTotalPages(Math.ceil(allDeudores.length / deudoresPerPage));
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchAllDeudores = async () => {
      try {
        const data = await getDeudores(1, Number.MAX_SAFE_INTEGER);
        setAllDeudores(data.deudores);
        setFilteredDeudores(data.deudores);
        setTotalPages(Math.ceil(data.deudores.length / deudoresPerPage));
      } catch (error) {
        console.error('Error fetching deudores:', error);
      }
    };

    fetchAllDeudores();
  }, []);

  useEffect(() => {
    const filtered = allDeudores.filter(deudor =>
      deudor.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDeudores(filtered);
    setTotalPages(Math.ceil(filtered.length / deudoresPerPage));
  }, [searchQuery, allDeudores]);

  useEffect(() => {
    const sortedDeudores = [...filteredDeudores].sort((a, b) => {
      if (sortOption === 'name-asc') return a.Nombre.localeCompare(b.Nombre);
      if (sortOption === 'name-desc') return b.Nombre.localeCompare(a.Nombre);
      if (sortOption === 'debt-asc') return a.deudaTotal - b.deudaTotal;
      if (sortOption === 'debt-desc') return b.deudaTotal - a.deudaTotal;
      if (sortOption === 'date-asc') return new Date(a.fechaPaga) - new Date(b.fechaPaga);
      if (sortOption === 'date-desc') return new Date(b.fechaPaga) - new Date(a.fechaPaga);
      return 0;
    });
    setFilteredDeudores(sortedDeudores);
  }, [sortOption]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeudor(id);
      const updatedDeudores = allDeudores.filter(deudor => deudor._id !== id);
      setAllDeudores(updatedDeudores);
      const filtered = updatedDeudores.filter(deudor =>
        deudor.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDeudores(filtered);
      setTotalPages(Math.ceil(filtered.length / deudoresPerPage));
      Swal.fire({
        icon: 'success',
        title: 'Deudor eliminado con éxito',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error deleting deudor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar el deudor',
        text: 'Ocurrió un error al intentar eliminar el deudor.',
      });
    }
  };

  const handleEdit = (deudors) => {
    navigate(`/editar-deudor`, { state: { deudors } });
  };

  const handleAddDeudor = () => {
    navigate('/agregar-deudor');
  };

  const displayedDeudores = filteredDeudores.slice(
    (currentPage - 1) * deudoresPerPage,
    currentPage * deudoresPerPage
  );

  return (
    <div className="deudores-list-container">
      <Navbar />
      <div className="main-content">
        <div className="section-title-deudores">
          Personas deudoras
          <button className="add-deudor-button" onClick={handleAddDeudor}>
            <FontAwesomeIcon icon={faPlus} /> Agregar Deudor
          </button>
        </div>
        <div className="search-sort-container">
          <div className="search-bar-deudores">
            <input
              id="search"
              type="text"
              className="input search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar deudores..."
            />
          </div>
          <div className="sort-bar">
            <select onChange={handleSortChange} value={sortOption} className="sort-select">
              <option value="">Ordenar por</option>
              <option value="name-asc">Nombre (A-Z)</option>
              <option value="name-desc">Nombre (Z-A)</option>
              <option value="debt-asc">Deuda (Ascendente)</option>
              <option value="debt-desc">Deuda (Descendente)</option>
              <option value="date-asc">Fecha a Pagar (Ascendente)</option>
              <option value="date-desc">Fecha a Pagar (Descendente)</option>
            </select>
          </div>
          <button onClick={handleClearFilters} className="clear-filters-button">
            Limpiar Filtros
          </button>
        </div>
        <table className="deudores-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Fecha a pagar</th>
              <th>Número de teléfono</th>
              <th>Deuda total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedDeudores.map((deudor, index) => (
              <tr key={index}>
                <td>{deudor.Nombre || 'Nombre desconocido'}</td>
                <td>{new Date(deudor.fechaPaga).toLocaleDateString() || 'Fecha desconocida'}</td>
                <td>{deudor.numeroTelefono || 'Teléfono desconocido'}</td>
                <td>${deudor.deudaTotal !== undefined ? deudor.deudaTotal.toLocaleString() : 'N/A'}</td>
                <td className="actions-cell">
                  <button onClick={() => handleEdit(deudor)} className="edit-button">
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button onClick={() => handleDelete(deudor._id)} className="delete-button">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          {[...Array(totalPages).keys()].map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page + 1)}
              className={page + 1 === currentPage ? 'active' : ''}
              disabled={page + 1 === currentPage}
            >
              {page + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeudoresList;