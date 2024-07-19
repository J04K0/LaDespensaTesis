import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import '../styles/AddProductStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { addProducts } from '../services/AddProducts.service.js';

const categories = [
  { label: 'Seleccione una categoría', value: null },
  { label: 'Congelados', value: 'Congelados' },
  { label: 'Carnes', value: 'Carnes' },
  { label: 'Despensa', value: 'Despensa' },
  { label: 'Panaderia y Pasteleria', value: 'Panaderia y Pasteleria' },
  { label: 'Quesos y Fiambres', value: 'Quesos y Fiambres' },
  { label: 'Bebidas y Licores', value: 'Bebidas y Licores' },
  { label: 'Lacteos, Huevos y Refrigerados', value: 'Lacteos, Huevos y Refrigerados' },
  { label: 'Desayuno y Dulces', value: 'Desayuno y Dulces' },
  { label: 'Bebes y Niños', value: 'Bebes y Niños' },
  { label: 'Cigarros', value: 'Cigarros' }
];

const AddProducts = () => {
  const [Nombre, setNombre] = useState('');
  const [Marca, setMarca] = useState('');
  const [Stock, setStock] = useState('');
  const [Categoria, setCategoria] = useState(null);
  const [PrecioCompra, setPrecioCompra] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [PrecioVenta, setPrecioVenta] = useState('');
  
  const [categoriaColor, setCategoriaColor] = useState('#b5b5b5');
  const [fechaColor, setFechaColor] = useState('#b5b5b5');

  const handleCategoriaChange = (e) => {
    const value = e.target.value;
    setCategoria(value);
    setCategoriaColor(value === null ? '#b5b5b5' : '#000000');
  };

  const handleFechaChange = (e) => {
    const value = e.target.value;
    setFechaVencimiento(value);
    setFechaColor(value === '' ? '#b5b5b5' : '#000000');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Categoria === null) {
      alert('Por favor, seleccione una categoría válida.');
      return;
    }

    const productData = {
      Nombre,
      Marca,
      Categoria,
      Stock,
      PrecioCompra,
      fechaVencimiento,
      PrecioVenta,
    };

    console.log('Enviando datos del producto:', productData);

    try {
      const response = await addProducts(productData);
      console.log('Respuesta del servidor:', response);
      // Aquí puedes añadir lógica para limpiar el formulario o mostrar un mensaje de éxito
    } catch (error) {
      console.error('Error al añadir el producto', error);
      if (error.response && error.response.data) {
        console.error('Detalles del error:', error.response.data);
      }
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
            <select
              value={Categoria}
              onChange={handleCategoriaChange}
              required
              style={{ color: categoriaColor }}
            >
              {categories.map((category, index) => (
                <option key={index} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <input
                type="number"
                placeholder="Precio de compra"
                value={PrecioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="date"
                placeholder="Fecha de vencimiento"
                value={fechaVencimiento}
                onChange={handleFechaChange}
                required
                style={{ color: fechaColor }}
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                placeholder="Precio de venta"
                value={PrecioVenta}
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
