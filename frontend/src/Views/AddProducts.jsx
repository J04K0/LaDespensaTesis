import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import '../styles/AddProductStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { addProducts } from '../services/AddProducts.service.js';

const AddProducts = () => {
  const [Nombre, setNombre] = useState('');
  const [Marca, setMarca] = useState('');
  const [Stock, setStock] = useState('');
  const [Categoria, setCategoria] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      Nombre,
      Marca,
      Stock,
      Categoria,
      precioCompra,
      fechaVencimiento,
      precioVenta,
    };
    console.log(productData)
    try {
      const response = await addProducts(productData);
      console.log("Response aqui: ",response);
      // Aquí puedes añadir lógica para limpiar el formulario o mostrar un mensaje de éxito
    } catch (error) {
      console.error('Error al añadir el producto', error);
      // Aquí puedes añadir lógica para manejar el error
    }
  };

  return (
    <div className="add-product-page">
      <Navbar />
      <div className="add-product-container">
        <h2>Añadir producto</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Nombre del producto"
              value={Nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Marca del producto"
              value={Marca}
              onChange={(e) => setMarca(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="number"
              placeholder="Stock"
              value={Stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Categoría del producto"
              value={Categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
            />
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <input
                type="number"
                placeholder="Precio de compra"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="date"
                placeholder="Fecha de vencimiento"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                placeholder="Precio de venta"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-buttons">
            <button type="submit" className="add-button">
              Añadir producto <FontAwesomeIcon icon={faPlusCircle} />
            </button>
            <button type="button" className="cancel-button">
              Cancelar <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProducts;
