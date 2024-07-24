import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/DeudoresStyles.css';
import { getDeudores, deleteDeudor } from '../services/deudores.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

const DeudoresList = () => {
  const [allDeudores, setAllDeudores] = useState([]);
  const [filteredDeudores, setFilteredDeudores] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const deudoresPerPage = 6;
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchAllDeudores = async () => {
      try {
        const data = await getDeudores(1, Number.MAX_SAFE_INTEGER); // Obtener todos los deudores
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
    } catch (error) {
      console.error('Error deleting deudor:', error);
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
        <div className="search-bar">
          <input
            id="search"
            type="text"
            className="input search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar deudores..."
          />
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
