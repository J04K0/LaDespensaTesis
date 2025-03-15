import React from 'react';
import PropTypes from 'prop-types';
import '../styles/ProductCardStyles.css';

const ProductCard = ({ image, name, marca, stock, venta, fechaVencimiento, onDelete, onEdit }) => {
  return (
    <div className={`product-card ${stock === 0 ? 'out-of-stock' : ''}`}>
      <div className="product-info">
      <img src={image ? `${image}` : "/default-image.jpg"} alt={name} className="product-image" />
        <h3>{name}</h3>
        <p>{marca}</p>
        <p>Stock: {stock}</p>
        <p>Precio: ${venta}</p>
        {fechaVencimiento && <p>Caducidad: {new Date(fechaVencimiento).toLocaleDateString()}</p>}
        <div className="button-group">
          <button className="delete-button" onClick={onDelete}>Eliminar</button>
          <button className="edit-button" onClick={onEdit}>Editar</button>
        </div>
      </div>
    </div>
  );
};
console.log(ProductCard);
ProductCard.propTypes = {
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  marca: PropTypes.string.isRequired,
  stock: PropTypes.number.isRequired,
  venta: PropTypes.number.isRequired,
  fechaVencimiento: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default ProductCard;
