// src/Views/Deudores.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/DeudoresStyles.css';
import { getDeudores, deleteDeudor } from '../services/deudores.service.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const DeudoresList = () => {
  const [deudores, setDeudores] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeudores = async () => {
      try {
        const data = await getDeudores(currentPage);
        setDeudores(data.deudores);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Error fetching deudores:', error);
      }
    };

    fetchDeudores();
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeudor(id);
      setDeudores(deudores.filter(deudor => deudor._id !== id));
    } catch (error) {
      console.error('Error deleting deudor:', error);
    }
  };

  const handleEdit = (deudors) => {
    navigate(`/editar-deudor`, { state: { deudors } });
  };

  return (
    <div className="deudores-list-container">
      <Navbar />
      <div className="main-content">
        <div className="section-title-deudores">Personas deudoras</div>
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
            {deudores.map((deudor, index) => (
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
