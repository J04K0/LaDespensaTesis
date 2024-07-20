// src/components/DeudorCard.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import '../styles/DeudorCardStyles.css';

const DeudorCard = ({ deudor, onEdit, onDelete }) => {
  return (
    <div className="deudor-card">
      <div className="deudor-info">
        <span>{deudor.Nombre || 'Nombre desconocido'}</span>
        <span>{new Date(deudor.fechaPaga).toLocaleDateString() || 'Fecha desconocida'}</span>
        <span>{deudor.numeroTelefono || 'Teléfono desconocido'}</span>
        <span>${deudor.deudaTotal !== undefined ? deudor.deudaTotal.toLocaleString() : 'N/A'}</span>
      </div>
      <div className="deudor-actions">
        <button onClick={onEdit} className="edit-button">
          <FontAwesomeIcon icon={faEdit} />
        </button>
        <button onClick={onDelete} className="delete-button">
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
};

export default DeudorCard;
